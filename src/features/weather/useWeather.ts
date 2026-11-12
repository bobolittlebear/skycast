import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { toAppError, type AppError } from "../../services/api/errors";
import { fetchAirQuality } from "../../services/api/openMeteo/airQuality";
import { fetchForecast } from "../../services/api/openMeteo/forecast";
import type { AirQualityBundle, WeatherBundle } from "../../types/weather";

/** query key 只使用 4 位小数，避免浮点抖动导致缓存碎片 */
function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export interface UseWeatherResult {
  weather: WeatherBundle | undefined;
  air: AirQualityBundle | undefined;
  isLoading: boolean;
  weatherError: AppError | null;
  airError: AppError | null;
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

  return {
    weather: weatherQuery.data,
    air: airQuery.data,
    isLoading: weatherQuery.isLoading || airQuery.isLoading,
    weatherError: weatherQuery.error ? toAppError(weatherQuery.error) : null,
    airError: airQuery.error ? toAppError(airQuery.error) : null,
    refetch,
  };
}
