import type { Lang } from '../../../i18n/language';
import type { Location, LocationText } from '../../../types/location';
import { toAppError } from '../errors';
import { fetchJson } from '../http';
import { geocodingResultSchema, geocodingSchema } from './schemas';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODING_DETAIL_URL = 'https://geocoding-api.open-meteo.com/v1/get';

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

/** 单次 geocoding 请求的结果条目；字段与 schemas.ts 中的定义一致 */
interface GeocodingResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

/** 按指定语言请求一次 geocoding；失败时抛出归一化后的 AppError */
async function fetchGeocoding(
  keyword: string,
  apiLang: 'zh' | 'en',
  count: number
): Promise<GeocodingResult[]> {
  const url =
    `${GEOCODING_BASE_URL}?name=${encodeURIComponent(keyword)}` +
    `&count=${count}&language=${apiLang}&format=json`;

  const raw = await fetchJson(url);
  const parsed = geocodingSchema.safeParse(raw);
  if (!parsed.success) {
    throw toAppError(parsed.error);
  }

  return parsed.data.results ?? [];
}

/** 把一条 geocoding 结果转成展示文本，三个字段都可能缺失 */
function toLocationText(result: GeocodingResult): LocationText {
  return {
    name: result.name,
    admin1: result.admin1,
    country: result.country,
  };
}

/**
 * 正向地理编码，按当前语言返回结果。
 *
 * 不在这里同时请求另一种语言：Open-Meteo 的 name 索引按语言隔离，
 * 用中文关键词查 en 只会得到空结果，所以双语名只能在拿到 id 之后补，
 * 见 fetchLocationById。
 */
export async function searchLocations(
  query: string,
  lang: Lang,
  count = 10
): Promise<Location[]> {
  const keyword = query.trim();
  if (keyword.length === 0) {
    return [];
  }

  const results = await fetchGeocoding(keyword, toApiLanguage(lang), count);

  const locations: Location[] = results.map((result) => ({
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

/**
 * 按 geocoding id 取单个地点在指定语言下的文本。
 *
 * 用于补全已保存地点的另一种语言：搜索接口的 name 索引按语言隔离，
 * 中文关键词查不到英文结果，只有 id 是跨语言稳定的。
 * 失败时返回 null，调用方保留原有文本即可，不影响天气主流程。
 */
export async function fetchLocationById(
  id: string,
  lang: Lang
): Promise<LocationText | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  try {
    const url = `${GEOCODING_DETAIL_URL}?id=${numericId}&language=${toApiLanguage(lang)}`;
    const raw = await fetchJson(url);
    const parsed = geocodingResultSchema.safeParse(raw);
    if (!parsed.success) {
      return null;
    }

    return toLocationText(parsed.data);
  } catch {
    // 补全失败不阻塞任何主流程，下次启动会再试
    return null;
  }
}
