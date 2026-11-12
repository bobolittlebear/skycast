import type { Lang } from '../../../i18n/language';
import { reverseGeocodeWithBigDataCloud } from './bigdatacloud';
import { reverseGeocodeWithNominatim } from './nominatim';

export type ReverseGeocodeProvider = 'bigdatacloud' | 'nominatim';

export interface ReverseGeocodeResult {
  name: string;
  admin1: string | null;
  country: string | null;
  provider: ReverseGeocodeProvider;
}

/**
 * 串行降级：BigDataCloud -> Nominatim -> null。
 * 两个 provider 内部都会把自身异常转成 null，因此这里不需要再吞异常。
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  lang: Lang
): Promise<ReverseGeocodeResult | null> {
  const fromBigDataCloud = await reverseGeocodeWithBigDataCloud(lat, lon, lang);
  if (fromBigDataCloud !== null) {
    return fromBigDataCloud;
  }

  return reverseGeocodeWithNominatim(lat, lon, lang);
}
