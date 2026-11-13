import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { getCurrentCoords, roundCoordinate } from '../../lib/geo';
import type { AddLocationResult, Location, LocationsContextValue } from '../../types/location';
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
