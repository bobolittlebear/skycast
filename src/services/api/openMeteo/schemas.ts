import { z } from 'zod';

/**
 * 这些 schema 只服务于 API 边界，推导出的类型仅供 services 层使用，
 * 不向上层（UI / hooks 的返回值）泄漏。
 */

const numericArray = z.array(z.number()).min(1);
const stringArray = z.array(z.string()).min(1);

/** forecast 接口：一次返回 current + hourly + daily */
export const forecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    is_day: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    cloud_cover: z.number(),
    surface_pressure: z.number(),
    wind_speed_10m: z.number(),
    wind_gusts_10m: z.number(),
    wind_direction_10m: z.number(),
  }),
  hourly: z.object({
    time: stringArray,
    temperature_2m: numericArray,
    weather_code: numericArray,
    precipitation_probability: numericArray,
    is_day: numericArray,
  }),
  daily: z.object({
    time: stringArray,
    weather_code: numericArray,
    temperature_2m_max: numericArray,
    temperature_2m_min: numericArray,
    sunrise: stringArray,
    sunset: stringArray,
    uv_index_max: numericArray,
    precipitation_sum: numericArray,
  }),
});

/** air-quality 接口：只校验本阶段用到的 current 字段 */
export const airQualitySchema = z.object({
  current: z.object({
    us_aqi: z.number(),
    // 接口在缺少污染物数据时会返回 null 或直接省略，两者都按“无 pm2_5”处理
    pm2_5: z.number().nullable().optional(),
  }),
});

/** geocoding 接口：无结果时 results 字段可能整体缺失 */
export const geocodingResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  admin1: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  population: z.number().optional(),
});

export const geocodingSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
});

/** BigDataCloud 反查：字段可能为空，缺失时由映射层降级 */
export const bigDataCloudReverseSchema = z.object({
  city: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  principalSubdivision: z.string().nullable().optional(),
  countryName: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
});

/** Nominatim 反查：只有 address 内部字段可用时才算成功 */
export const nominatimReverseSchema = z.object({
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type ForecastResponse = z.infer<typeof forecastSchema>;
export type AirQualityResponse = z.infer<typeof airQualitySchema>;
export type GeocodingResponse = z.infer<typeof geocodingSchema>;
export type GeocodingResult = z.infer<typeof geocodingResultSchema>;
export type BigDataCloudReverseResponse = z.infer<
  typeof bigDataCloudReverseSchema
>;
export type NominatimReverseResponse = z.infer<typeof nominatimReverseSchema>;
