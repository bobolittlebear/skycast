/** 当前实况；时间字段均为接口返回的当地壁钟时间 */
export interface CurrentConditions {
  time: string;
  /** 摄氏度 */
  temperature: number;
  /** 相对湿度百分比 */
  relativeHumidity: number;
  /** 体感温度，摄氏度 */
  apparentTemperature: number;
  isDay: boolean;
  /** 降水量，mm */
  precipitation: number;
  /** WMO 天气码 */
  weatherCode: number;
  /** 云量百分比 */
  cloudCover: number;
  /** 地面气压，hPa */
  surfacePressure: number;
  /** 风速，km/h */
  windSpeed: number;
  /** 阵风，km/h */
  windGusts: number;
  /** 风向，度 */
  windDirection: number;
}

export interface HourlyPoint {
  /** 接口返回的当地壁钟时间，例如 2026-11-12T14:00 */
  time: string;
  temperature: number;
  weatherCode: number;
  /** 降水概率百分比 */
  precipitationProbability: number;
  isDay: boolean;
}

export interface DailyPoint {
  /** 接口返回的当地日期，例如 2026-11-12 */
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationSum: number;
}

/** 接口实际落到的网格坐标；与调用方传入的坐标分开保存 */
export interface WeatherGrid {
  latitude: number;
  longitude: number;
}

export interface WeatherBundle {
  /** 调用方传入的坐标，禁止被接口返回的网格坐标覆盖 */
  lat: number;
  lon: number;
  grid: WeatherGrid;
  /** 接口返回的 IANA 时区，例如 Asia/Shanghai */
  timezone: string;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  /** 客户端生成时间，ISO 字符串 */
  fetchedAt: string;
}

export interface AirQualityBundle {
  aqi: number;
  /** pm2_5，接口缺失时为 null */
  pm25: number | null;
  fetchedAt: string;
}
