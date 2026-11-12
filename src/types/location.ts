export type LocationSource = 'search' | 'gps';

/** 应用内的统一地点模型；搜索与 GPS 定位共用 */
export interface Location {
  /** geocoding 的数字 id；GPS 地点使用 `${lat4},${lon4}` */
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lon: number;
  source: LocationSource;
  isCurrent?: boolean;
  /** geocoding 返回的人口数，仅用于搜索结果排序，不参与展示 */
  population?: number;
}
