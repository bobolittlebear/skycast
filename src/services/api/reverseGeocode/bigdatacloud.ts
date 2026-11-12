import type { Lang } from '../../../i18n/language';
import { fetchJson } from '../http';
import { bigDataCloudReverseSchema } from '../openMeteo/schemas';
import type { ReverseGeocodeResult } from './index';

const BIG_DATA_CLOUD_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * BigDataCloud 反查（首选）。
 * 失败时返回 null 而不是抛出：反查只影响地点名展示，
 * 上层可以继续降级到 Nominatim 或直接显示“当前位置”。
 */
export async function reverseGeocodeWithBigDataCloud(
  lat: number,
  lon: number,
  lang: Lang
): Promise<ReverseGeocodeResult | null> {
  try {
    const localityLanguage = lang === 'en' ? 'en' : 'zh';
    const url =
      `${BIG_DATA_CLOUD_URL}?latitude=${lat}&longitude=${lon}` +
      `&localityLanguage=${localityLanguage}`;

    const raw = await fetchJson(url);
    const parsed = bigDataCloudReverseSchema.safeParse(raw);
    if (!parsed.success) {
      return null;
    }

    const city = clean(parsed.data.city);
    const locality = clean(parsed.data.locality);
    const subdivision = clean(parsed.data.principalSubdivision);

    // city 优先；locality / principalSubdivision 与 city 重复时跳过
    const name =
      city ??
      [locality, subdivision].find(
        (candidate) => candidate !== null && candidate !== city
      ) ??
      null;

    if (name === null) {
      return null;
    }

    return {
      name,
      admin1: subdivision,
      country: clean(parsed.data.countryName),
      provider: 'bigdatacloud',
    };
  } catch {
    // 反查失败可降级到 Nominatim，最终返回 null 也不会影响天气主流程
    return null;
  }
}
