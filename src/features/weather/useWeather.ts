import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { toAppError, type AppError } from "../../services/api/errors";
import { fetchAirQuality } from "../../services/api/openMeteo/airQuality";
import { fetchForecast } from "../../services/api/openMeteo/forecast";
import { roundCoordinate } from "../../lib/geo";
import type { AirQualityBundle, WeatherBundle } from "../../types/weather";

export interface UseWeatherResult {
  weather: WeatherBundle | undefined;
  air: AirQualityBundle | undefined;
  isLoading: boolean;
  weatherError: AppError | null;
  airError: AppError | null;
  /** 两个 query 中较新的成功抓取时间；无数据时为 0 */
  weatherUpdatedAt: number;
  /** 任一 query 正在后台刷新；首次加载不算 */
  isRefetching: boolean;
  refetch: () => void;
}

/**
 * 天气与空气质量拆成两个独立 query：
 * 空气质量失败只影响 air/airError，不会阻断天气数据。
 */
export function useWeather(lat: number, lon: number): UseWeatherResult {
  const coordinatesValid = Number.isFinite(lat) && Number.isFinite(lon);
  const latKey = coordinatesValid ? roundCoordinate(lat) : null;
  const lonKey = coordinatesValid ? roundCoordinate(lon) : null;

  const weatherQuery = useQuery({
    queryKey: ["weather", latKey, lonKey],
    queryFn: () => fetchForecast(lat, lon),
    enabled: coordinatesValid,
  });

  const airQuery = useQuery({
    queryKey: ["air", latKey, lonKey],
    queryFn: () => fetchAirQuality(lat, lon),
    enabled: coordinatesValid,
  });

  const refetchWeather = weatherQuery.refetch;
  const refetchAir = airQuery.refetch;

  const refetch = useCallback(() => {
    void refetchWeather();
    void refetchAir();
  }, [refetchWeather, refetchAir]);

  // 缓存恢复后 dataUpdatedAt 仍是上次成功时间，正好用于展示数据时效
  const weatherUpdatedAt = Math.max(
    weatherQuery.dataUpdatedAt,
    airQuery.dataUpdatedAt
  );
  const isRefetching = weatherQuery.isRefetching || airQuery.isRefetching;

  return {
    weather: weatherQuery.data,
    air: airQuery.data,
    isLoading: weatherQuery.isLoading || airQuery.isLoading,
    weatherError: weatherQuery.error ? toAppError(weatherQuery.error) : null,
    airError: airQuery.error ? toAppError(airQuery.error) : null,
    weatherUpdatedAt,
    isRefetching,
    refetch,
  };
}
