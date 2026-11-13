import {
  STORAGE_KEYS,
  getJson,
  setJson,
} from '../../services/storage/storage';
import type { Location } from '../../types/location';

/**
 * 地点持久化：只保存用户主动添加的地点。
 * GPS 项由当前坐标实时推导，不能落盘，否则下次启动会把旧定位当成本地地点。
 */

/** GPS 项使用固定 id，便于与用户保存的地点区分 */
export const GPS_LOCATION_ID = 'gps';

/** 运行时校验持久化数据，防止 localStorage 里的脏数据进入状态 */
export function isStoredLocation(value: unknown): value is Location {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.lat === 'number' &&
    Number.isFinite(item.lat) &&
    typeof item.lon === 'number' &&
    Number.isFinite(item.lon) &&
    (item.source === 'search' || item.source === 'gps')
  );
}

export interface PersistedLocations {
  /** 过滤掉 GPS 项后的用户地点 */
  stored: Location[];
  /** 仍然有效的选中 id；未选中或数据已失效时为 null */
  resolvedActiveId: string | null;
}

/**
 * 读取并修正本地地点数据：过滤 GPS 项，选中项失效时回退到第一项。
 * 空字符串是「上次选中的是 GPS」的持久化形式，因此恢复为未选中。
 */
export async function loadPersistedLocations(): Promise<PersistedLocations> {
  const [rawLocations, rawActiveId] = await Promise.all([
    getJson<unknown>(STORAGE_KEYS.locations),
    getJson<unknown>(STORAGE_KEYS.activeLocationId),
  ]);

  const stored = Array.isArray(rawLocations)
    ? rawLocations
        .filter(isStoredLocation)
        .filter((item) => item.source !== 'gps')
    : [];

  const resolvedActiveId =
    typeof rawActiveId === 'string' && rawActiveId !== ''
      ? (stored.find((item) => item.id === rawActiveId)?.id ??
        stored[0]?.id ??
        null)
      : null;

  return { stored, resolvedActiveId };
}

/**
 * GPS 项不持久化；选中 GPS 时写入空字符串，下次启动重新定位。
 */
export async function persistLocations(
  storedLocations: readonly Location[],
  activeId: string | null
): Promise<void> {
  await setJson(STORAGE_KEYS.locations, storedLocations);
  await setJson(
    STORAGE_KEYS.activeLocationId,
    activeId === GPS_LOCATION_ID ? '' : (activeId ?? '')
  );
}
