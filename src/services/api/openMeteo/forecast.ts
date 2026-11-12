import type {
  DailyPoint,
  HourlyPoint,
  WeatherBundle,
} from '../../../types/weather';
import { AppError, toAppError } from '../errors';
import { fetchJson } from '../http';
import { forecastSchema } from './schemas';

const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'surface_pressure',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
].join(',');

const HOURLY_FIELDS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'is_day',
].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
].join(',');

/** 逐小时只取前 48 条；数组长度不一致时显式报 schema 错误，避免 undefined 扩散 */
function valueAt<T>(values: readonly T[], index: number, path: string): T {
  const value = values[index];
  if (value === undefined) {
    throw new AppError('schema', `${path}[${index}] 缺失`);
  }
  return value;
}

/**
 * 拉取 15 天预报，映射为 WeatherBundle。
 * 坐标始终使用调用方传入的 lat/lon；接口实际命中的网格坐标单独存到 grid。
 */
export async function fetchForecast(
  lat: number,
  lon: number
): Promise<WeatherBundle> {
  const url =
    `${FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_FIELDS}` +
    `&hourly=${HOURLY_FIELDS}` +
    `&daily=${DAILY_FIELDS}` +
    '&forecast_days=15&timezone=auto';

  const raw = await fetchJson(url);
  const parsed = forecastSchema.safeParse(raw);
  if (!parsed.success) {
    throw toAppError(parsed.error);
  }

  const data = parsed.data;

  const hourly: HourlyPoint[] = data.hourly.time
    .slice(0, 48)
    .map((time, index) => ({
      time,
      temperature: valueAt(
        data.hourly.temperature_2m,
        index,
        'hourly.temperature_2m'
      ),
      weatherCode: valueAt(
        data.hourly.weather_code,
        index,
        'hourly.weather_code'
      ),
      precipitationProbability: valueAt(
        data.hourly.precipitation_probability,
        index,
        'hourly.precipitation_probability'
      ),
      isDay: valueAt(data.hourly.is_day, index, 'hourly.is_day') !== 0,
    }));

  const daily: DailyPoint[] = data.daily.time.map((date, index) => ({
    date,
    weatherCode: valueAt(data.daily.weather_code, index, 'daily.weather_code'),
    temperatureMax: valueAt(
      data.daily.temperature_2m_max,
      index,
      'daily.temperature_2m_max'
    ),
    temperatureMin: valueAt(
      data.daily.temperature_2m_min,
      index,
      'daily.temperature_2m_min'
    ),
    sunrise: valueAt(data.daily.sunrise, index, 'daily.sunrise'),
    sunset: valueAt(data.daily.sunset, index, 'daily.sunset'),
    uvIndexMax: valueAt(data.daily.uv_index_max, index, 'daily.uv_index_max'),
    precipitationSum: valueAt(
      data.daily.precipitation_sum,
      index,
      'daily.precipitation_sum'
    ),
  }));

  return {
    lat,
    lon,
    grid: {
      latitude: data.latitude,
      longitude: data.longitude,
    },
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      relativeHumidity: data.current.relative_humidity_2m,
      apparentTemperature: data.current.apparent_temperature,
      isDay: data.current.is_day !== 0,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      cloudCover: data.current.cloud_cover,
      surfacePressure: data.current.surface_pressure,
      windSpeed: data.current.wind_speed_10m,
      windGusts: data.current.wind_gusts_10m,
      windDirection: data.current.wind_direction_10m,
    },
    hourly,
    daily,
    fetchedAt: new Date().toISOString(),
  };
}
