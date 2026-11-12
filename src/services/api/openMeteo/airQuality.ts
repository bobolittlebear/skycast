import type { AirQualityBundle } from "../../../types/weather";
import { toAppError } from "../errors";
import { fetchJson } from "../http";
import { airQualitySchema } from "./schemas";

const AIR_QUALITY_BASE_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

/**
 * 只取 current 的 us_aqi 与 pm2_5。
 * us_aqi 缺失会被 schema 拦截；pm2_5 允许缺失并映射为 null。
 */
export async function fetchAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualityBundle> {
  const url =
    `${AIR_QUALITY_BASE_URL}?latitude=${lat}&longitude=${lon}` +
    "&current=us_aqi,pm2_5&timezone=auto";

  const raw = await fetchJson(url);
  const parsed = airQualitySchema.safeParse(raw);
  if (!parsed.success) {
    throw toAppError(parsed.error);
  }

  // - 手动核对 AQI 分级边界：49、50、51、100、101、150、151、200、201、300、301 共 11 个输入，
  // 等级依次为优、优、良、良、轻度污染、轻度污染、中度污染、中度污染、重度污染、重度污染、严重污染

  return {
    aqi: parsed.data.current.us_aqi,
    pm25: parsed.data.current.pm2_5 ?? null,
    fetchedAt: new Date().toISOString(),
  };
}
