import { useCallback, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import {
  LOCATION_SERVICES_DISABLED_MESSAGE,
  LOCATION_TIMEOUT_MS,
  withTimeout,
} from '../../lib/geo';
import { AppError, toAppError } from '../../services/api/errors';

export type DeviceLocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export interface DeviceCoords {
  /** 纬度，范围 -90 ~ 90 */
  lat: number;
  /** 经度，范围 -180 ~ 180 */
  lon: number;
}

export interface UseDeviceLocationResult {
  /** 当前定位阶段；request 结束前通常是 requesting */
  status: DeviceLocationStatus;
  /** 成功定位后的坐标；其余状态为 null */
  coords: DeviceCoords | null;
  /** 用户拒绝后是否还能再次弹出系统权限框 */
  canAskAgain: boolean;
  /** 归一化后的定位错误；成功或未开始时为 null */
  error: AppError | null;
  /** 主动申请权限并定位；所有失败都落在 status/error 上 */
  request: () => Promise<void>;
}

/**
 * 设备定位 hook：负责权限申请、定位与状态归一化。
 * 权限被拒进入 denied；服务关闭、超时等失败统一进入 unavailable 并附带 AppError。
 */
export function useDeviceLocation(): UseDeviceLocationResult {
  const [status, setStatus] = useState<DeviceLocationStatus>('idle');
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const request = useCallback(async () => {
    setStatus('requesting');
    setError(null);

    try {
      const permission =
        await ExpoLocation.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);

      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }

      const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus('unavailable');
        setError(new AppError('unknown', LOCATION_SERVICES_DISABLED_MESSAGE));
        return;
      }

      const position = await withTimeout(
        ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        }),
        LOCATION_TIMEOUT_MS
      );
      setCoords({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setStatus('granted');
    } catch (caught) {
      setError(toAppError(caught));
      setStatus('unavailable');
    }
  }, []);

  return { status, coords, canAskAgain, error, request };
}
