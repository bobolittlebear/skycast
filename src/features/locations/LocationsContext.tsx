import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { getCurrentCoords, roundCoordinate } from '../../lib/geo';
import { fetchLocationById } from '../../services/api/openMeteo/geocoding';
import type {
  AddLocationResult,
  LocalizedLocationText,
  Location,
  LocationText,
  LocationsContextValue,
} from '../../types/location';
import { useSettings } from '../settings/SettingsContext';
import {
  GPS_LOCATION_ID,
  loadPersistedLocations,
  persistLocations,
} from './locationsStorage';
import type { DeviceCoords } from './useDeviceLocation';
import { useReverseGeocode } from './useReverseGeocode';

/** 用户可保存的地点上限，不含 GPS 项 */
export const MAX_LOCATIONS = 20;

/** 判断地点主名称是否为中文；用于决定还需要补哪一种语言 */
const CJK_PATTERN = /[\u4e00-\u9fa5]/;

/** 该地点是否还缺少某一种语言的文本 */
function needsNameEnrichment(item: Location): boolean {
  if (item.source !== 'search') {
    return false;
  }
  return item.names?.zh === undefined || item.names?.en === undefined;
}

/**
 * 为单个地点补全中英两份文本。
 *
 * 搜索接口只返回当前语言的名称，且 name 索引按语言隔离（中文关键词查 en 得到空结果），
 * 所以只有 id 能跨语言取到同一个地点：缺的那一种语言按 id 请求 /v1/get。
 * 补不全（网络失败）时返回 null，调用方保留原文本，下次启动再试。
 */
async function enrichLocationNames(
  item: Location
): Promise<LocalizedLocationText | null> {
  const baseLang: 'zh' | 'en' = CJK_PATTERN.test(item.name) ? 'zh' : 'en';
  const otherLang: 'zh' | 'en' = baseLang === 'zh' ? 'en' : 'zh';

  const baseText: LocationText = {
    name: item.name,
    admin1: item.admin1,
    country: item.country,
  };
  // 主名称所在的语言直接复用，不必再请求
  const resolvedBase = item.names?.[baseLang] ?? baseText;
  const resolvedOther = item.names?.[otherLang];

  if (resolvedOther !== undefined) {
    return baseLang === 'zh'
      ? { zh: resolvedBase, en: resolvedOther }
      : { zh: resolvedOther, en: resolvedBase };
  }

  const fetched = await fetchLocationById(
    item.id,
    otherLang === 'zh' ? 'zh-Hans' : 'en'
  );
  if (fetched === null) {
    return null;
  }

  return baseLang === 'zh'
    ? { zh: resolvedBase, en: fetched }
    : { zh: fetched, en: resolvedBase };
}

export type { AddLocationResult, LocationsContextValue } from '../../types/location';

/** 坐标按四位小数比较，避免浮点抖动把同一地点判成两个 */
function isSameCoordinate(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number
): boolean {
  return (
    roundCoordinate(latA) === roundCoordinate(latB) &&
    roundCoordinate(lonA) === roundCoordinate(lonB)
  );
}

export interface LocationsProviderProps {
  /** 需要读取地点状态的子树 */
  children: ReactNode;
}

const LocationsContext = createContext<LocationsContextValue | undefined>(
  undefined
);

/**
 * 地点状态 Provider：恢复本地列表与选中项，合并 GPS 项并持久化用户地点。
 * GPS 项固定位于列表首位且不写入存储；启动时只在已授权的情况下静默定位，
 * 不会主动弹权限框。必须在 SettingsProvider 内使用，因为反查依赖当前语言。
 */
export function LocationsProvider({
  children,
}: LocationsProviderProps): JSX.Element {
  const { lang } = useSettings();
  const [storedLocations, setStoredLocations] = useState<Location[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<DeviceCoords | null>(null);
  const [ready, setReady] = useState(false);
  // 只用于在补全失败后推进队列，本身不代表任何业务状态
  const [enrichTick, setEnrichTick] = useState(0);
  // 记录已发起过补全的 id，避免失败后无限重试
  const enrichingIds = useRef(new Set<string>());

  // 反查结果只用于推导 GPS 项名称，不写入持久化数据
  const reverseQuery = useReverseGeocode(
    gpsCoords?.lat ?? Number.NaN,
    gpsCoords?.lon ?? Number.NaN,
    lang,
    gpsCoords !== null
  );

  const locations = useMemo<readonly Location[]>(() => {
    if (gpsCoords === null) {
      return storedLocations;
    }

    const reverse = reverseQuery.data;
    const gpsLocation: Location = {
      id: GPS_LOCATION_ID,
      // 反查失败时保持空字符串，由展示层兜底为「当前位置」
      name: reverse?.name ?? '',
      admin1: reverse?.admin1 ?? undefined,
      country: reverse?.country ?? undefined,
      lat: gpsCoords.lat,
      lon: gpsCoords.lon,
      source: 'gps',
      isCurrent: true,
    };

    return [gpsLocation, ...storedLocations];
  }, [gpsCoords, reverseQuery.data, storedLocations]);

  const activeLocation = useMemo(
    () => locations.find((item) => item.id === activeId) ?? null,
    [locations, activeId]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      const persisted = await loadPersistedLocations();
      if (cancelled) {
        return;
      }

      setStoredLocations(persisted.stored);
      setActiveIdState(persisted.resolvedActiveId);
      setReady(true);

      // getCurrentCoords 只在已授权时成功，不会弹权限框；
      // 未授权或定位失败时明确降级为没有 GPS 项，不阻塞首屏
      const coords = await getCurrentCoords().catch(() => null);
      if (coords !== null && !cancelled) {
        setGpsCoords(coords);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // 等 hydrate 完成后再写回，避免用初始空状态覆盖本地数据
  useEffect(() => {
    if (!ready) {
      return;
    }
    void persistLocations(storedLocations, activeId);
  }, [ready, storedLocations, activeId]);

  // 后台补全双语名称：一次只处理一条，写回 state 后由下一轮 effect 继续，
  // 避免启动时对所有地点并发请求。补全失败时递增 enrichTick 跳过该条，
  // 否则 state 不变会让队列停在失败的项上。
  useEffect(() => {
    if (!ready) {
      return;
    }

    const target = storedLocations.find(
      (item) => needsNameEnrichment(item) && !enrichingIds.current.has(item.id)
    );
    if (target === undefined) {
      return;
    }

    enrichingIds.current.add(target.id);
    let cancelled = false;

    void (async () => {
      const names = await enrichLocationNames(target);
      if (cancelled) {
        return;
      }

      if (names === null) {
        setEnrichTick((tick) => tick + 1);
        return;
      }

      setStoredLocations((prev) =>
        prev.map((item) => (item.id === target.id ? { ...item, names } : item))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, storedLocations, enrichTick]);

  const addLocation = useCallback(
    (location: Location): AddLocationResult => {
      const duplicate = locations.find(
        (item) =>
          item.id === location.id ||
          isSameCoordinate(item.lat, item.lon, location.lat, location.lon)
      );

      if (duplicate !== undefined) {
        setActiveIdState(duplicate.id);
        return 'exists';
      }

      if (storedLocations.length >= MAX_LOCATIONS) {
        return 'limit';
      }

      setStoredLocations([...storedLocations, location]);
      setActiveIdState(location.id);
      return 'added';
    },
    [locations, storedLocations]
  );

  const removeLocation = useCallback(
    (id: string) => {
      // GPS 项由系统维护，删除它会让当前位置失去入口
      if (id === GPS_LOCATION_ID) {
        return;
      }

      const index = storedLocations.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }

      const next = storedLocations.filter((item) => item.id !== id);
      setStoredLocations(next);

      setActiveIdState((current) => {
        if (current !== id) {
          return current;
        }
        // 优先切到前一项，列表头部被删时再退到后一项
        const previous = storedLocations[index - 1];
        const following = storedLocations[index + 1];
        return previous?.id ?? following?.id ?? null;
      });
    },
    [storedLocations]
  );

  const setActiveId = useCallback(
    (id: string) => {
      if (!locations.some((item) => item.id === id)) {
        return;
      }
      setActiveIdState(id);
    },
    [locations]
  );

  const updateGps = useCallback((lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }
    setGpsCoords({ lat, lon });
  }, []);

  const value = useMemo<LocationsContextValue>(
    () => ({
      locations,
      activeId,
      activeLocation,
      ready,
      addLocation,
      removeLocation,
      setActiveId,
      updateGps,
    }),
    [locations, activeId, activeLocation, ready, addLocation, removeLocation, setActiveId, updateGps]
  );

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
}

/**
 * 读取地点列表、选中项与增删选方法。
 * 在 Provider 外调用时抛错，尽早暴露挂载顺序问题。
 */
export function useLocations(): LocationsContextValue {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations 必须在 LocationsProvider 内使用');
  }
  return context;
}
