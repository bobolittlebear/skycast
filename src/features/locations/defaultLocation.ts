import type { Location } from '../../types/location';

/**
 * M2a 固定展示上海。
 * M3 接入地点选择与定位后，这个常量会被用户当前选择的地点替换。
 */
export const DEFAULT_LOCATION: Location = {
  id: 'shanghai',
  name: '上海',
  admin1: '上海市',
  lat: 31.2304,
  lon: 121.4737,
  source: 'search',
};
