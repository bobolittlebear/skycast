import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Lang } from '../../i18n/language';
import {
  reverseGeocode,
  type ReverseGeocodeResult,
} from '../../services/api/reverseGeocode';

function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * 坐标反查是幂等操作（同样坐标 + 同样语言永远得到同样结果），
 * 所以 staleTime 设为 Infinity；是否启用由调用方决定。
 */
export function useReverseGeocode(
  lat: number,
  lon: number,
  lang: Lang,
  enabled = true
): UseQueryResult<ReverseGeocodeResult | null, Error> {
  const coordinatesValid = Number.isFinite(lat) && Number.isFinite(lon);
  const latKey = coordinatesValid ? roundCoordinate(lat) : null;
  const lonKey = coordinatesValid ? roundCoordinate(lon) : null;

  return useQuery({
    queryKey: ['reverse', latKey, lonKey, lang],
    queryFn: () => reverseGeocode(lat, lon, lang),
    staleTime: Infinity,
    enabled: coordinatesValid && enabled,
  });
}
