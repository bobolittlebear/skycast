import type { Lang } from '../../../i18n/language';
import { fetchJson } from '../http';
import { nominatimReverseSchema } from '../openMeteo/schemas';
import type { ReverseGeocodeResult } from './index';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const MIN_INTERVAL_MS = 1000;

/** Nominatim 政策要求可识别的 User-Agent */
const USER_AGENT = 'SkyCast/1.0 (weather app data layer)';

/** 下一次允许发起请求的时间戳；模块级状态用于跨调用节流 */
let nextAllowedAt = 0;

/** 串行化调用之间至少间隔 1 秒，满足 Nominatim 的使用政策 */
async function acquireRateLimitSlot(): Promise<void> {
  const now = Date.now();
  const waitMs = Math.max(0, nextAllowedAt - now);
  nextAllowedAt = Math.max(now, nextAllowedAt) + MIN_INTERVAL_MS;

  if (waitMs > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  }
}

/**
 * Nominatim 反查（备选）。
 * 失败返回 null：此时 BigDataCloud 已经失败，反查整体不可用，
 * 上层显示“当前位置”即可，不应打断天气请求。
 */
export async function reverseGeocodeWithNominatim(
  lat: number,
  lon: number,
  lang: Lang
): Promise<ReverseGeocodeResult | null> {
  try {
    await acquireRateLimitSlot();

    const url =
      `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const raw = await fetchJson(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': lang === 'en' ? 'en' : 'zh',
      },
    });

    const parsed = nominatimReverseSchema.safeParse(raw);
    if (!parsed.success) {
      return null;
    }

    const address = parsed.data.address;
    const name = address?.city ?? address?.town ?? address?.county ?? null;
    if (name === null) {
      return null;
    }

    return {
      name,
      admin1: address?.state ?? null,
      country: address?.country ?? null,
      provider: 'nominatim',
    };
  } catch {
    // 备选实现失败直接放弃反查；返回 null 由上层降级展示
    return null;
  }
}
