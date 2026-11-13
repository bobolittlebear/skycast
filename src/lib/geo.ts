import * as ExpoLocation from 'expo-location';
import { AppError } from '../services/api/errors';

/**
 * 坐标与定位公共工具。
 *
 * 坐标统一保留四位小数（约 11 米精度）：天气展示不需要更高精度，
 * 同时能避免浮点抖动导致 query key、地点去重与缓存命中不一致。
 */

/** 定位超时时间；与网络请求保持一致，避免状态永远停在 requesting */
export const LOCATION_TIMEOUT_MS = 8000;

/** 系统定位服务未开启时的技术错误文案，主动定位与静默定位共用 */
export const LOCATION_SERVICES_DISABLED_MESSAGE = 'location services disabled';

/** 按四位小数取整坐标；非有限值原样返回，由调用方先做有效性判断 */
export function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * 给 Promise 加超时：超时以 AppError('timeout') 拒绝，
 * 避免系统定位悬挂时调用方一直等待。
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError('timeout', `location timeout after ${ms}ms`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * 读取当前坐标：先确认前台权限已授权、系统定位服务可用，再以 Balanced 精度定位。
 * 不会主动弹权限框；任一步失败都抛出 AppError，由调用方决定展示或静默降级。
 */
export async function getCurrentCoords(): Promise<{
  lat: number;
  lon: number;
}> {
  const permission = await ExpoLocation.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new AppError('unknown', 'location permission not granted');
  }

  const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new AppError('unknown', LOCATION_SERVICES_DISABLED_MESSAGE);
  }

  const position = await withTimeout(
    ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    }),
    LOCATION_TIMEOUT_MS
  );

  return {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };
}
