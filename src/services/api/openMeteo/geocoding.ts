import type { Lang } from '../../../i18n/language';
import type { Location } from '../../../types/location';
import { toAppError } from '../errors';
import { fetchJson } from '../http';
import { geocodingSchema } from './schemas';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** 中文简体与繁体都使用 Open-Meteo 的 zh，英文使用 en */
function toApiLanguage(lang: Lang): 'zh' | 'en' {
  return lang === 'en' ? 'en' : 'zh';
}

/** 去重 key：name + admin1 + country；忽略大小写和首尾空格 */
function locationKey(location: Location): string {
  const name = location.name.trim().toLowerCase();
  const admin1 = location.admin1?.trim().toLowerCase() ?? '';
  const country = location.country?.trim().toLowerCase() ?? '';
  return `${name}|${admin1}|${country}`;
}

/**
 * 搜索结果的去重纯函数：同名的省/国家组合只保留第一条，
 * 然后按人口降序，便于 UI 把更可能的城市排在前面。
 */
export function dedupeLocations(locations: Location[]): Location[] {
  const seen = new Set<string>();
  const unique: Location[] = [];

  for (const location of locations) {
    const key = locationKey(location);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(location);
    }
  }

  return unique.sort(
    (a, b) => (b.population ?? 0) - (a.population ?? 0)
  );
}

/** 正向地理编码；本阶段只提供函数与类型，搜索 UI 留给 M3 */
export async function searchLocations(
  query: string,
  lang: Lang,
  count = 10
): Promise<Location[]> {
  const keyword = query.trim();
  if (keyword.length === 0) {
    return [];
  }

  const url =
    `${GEOCODING_BASE_URL}?name=${encodeURIComponent(keyword)}` +
    `&count=${count}&language=${toApiLanguage(lang)}&format=json`;

  const raw = await fetchJson(url);
  const parsed = geocodingSchema.safeParse(raw);
  if (!parsed.success) {
    throw toAppError(parsed.error);
  }

  const locations: Location[] = (parsed.data.results ?? []).map((result) => ({
    id: String(result.id),
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    countryCode: result.country_code,
    lat: result.latitude,
    lon: result.longitude,
    source: 'search',
    population: result.population,
  }));

  return dedupeLocations(locations);
}
