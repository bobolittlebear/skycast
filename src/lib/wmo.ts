import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type WeatherIconName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

/** 天气分组只有六种，用于选择渐变与后续卡片的视觉策略 */
export type WeatherGroup =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'fog';

export interface WeatherCodeInfo {
  icon: WeatherIconName;
  i18nKey: string;
  group: WeatherGroup;
}

interface WeatherCodeDefinition {
  group: WeatherGroup;
  dayIcon: WeatherIconName;
  /** 仅晴天与少云在夜间换成月亮系图标 */
  nightIcon?: WeatherIconName;
}

/** WMO weather code -> 图标与分组；覆盖 Open-Meteo 会返回的全部码值 */
const WEATHER_CODES: Record<number, WeatherCodeDefinition> = {
  0: { group: 'clear', dayIcon: 'weather-sunny', nightIcon: 'weather-night' },
  1: {
    group: 'clear',
    dayIcon: 'weather-partly-cloudy',
    nightIcon: 'weather-night-partly-cloudy',
  },
  2: {
    group: 'cloudy',
    dayIcon: 'weather-partly-cloudy',
    nightIcon: 'weather-night-partly-cloudy',
  },
  3: { group: 'cloudy', dayIcon: 'weather-cloudy' },
  45: { group: 'fog', dayIcon: 'weather-fog' },
  48: { group: 'fog', dayIcon: 'weather-fog' },
  51: { group: 'rain', dayIcon: 'weather-rainy' },
  53: { group: 'rain', dayIcon: 'weather-rainy' },
  55: { group: 'rain', dayIcon: 'weather-rainy' },
  56: { group: 'rain', dayIcon: 'weather-snowy-rainy' },
  57: { group: 'rain', dayIcon: 'weather-snowy-rainy' },
  61: { group: 'rain', dayIcon: 'weather-rainy' },
  63: { group: 'rain', dayIcon: 'weather-rainy' },
  65: { group: 'rain', dayIcon: 'weather-pouring' },
  66: { group: 'rain', dayIcon: 'weather-snowy-rainy' },
  67: { group: 'rain', dayIcon: 'weather-snowy-rainy' },
  71: { group: 'snow', dayIcon: 'weather-snowy' },
  73: { group: 'snow', dayIcon: 'weather-snowy' },
  75: { group: 'snow', dayIcon: 'weather-snowy' },
  77: { group: 'snow', dayIcon: 'weather-snowy' },
  80: { group: 'rain', dayIcon: 'weather-rainy' },
  81: { group: 'rain', dayIcon: 'weather-rainy' },
  82: { group: 'rain', dayIcon: 'weather-pouring' },
  85: { group: 'snow', dayIcon: 'weather-snowy' },
  86: { group: 'snow', dayIcon: 'weather-snowy' },
  95: { group: 'thunder', dayIcon: 'weather-lightning' },
  96: { group: 'thunder', dayIcon: 'weather-lightning-rainy' },
  99: { group: 'thunder', dayIcon: 'weather-lightning-rainy' },
};

const UNKNOWN_INFO: WeatherCodeInfo = {
  icon: 'weather-cloudy',
  i18nKey: 'weather.unknown',
  group: 'cloudy',
};

/** 未知码统一降级为多云，不抛错，避免接口新增码值导致整页崩溃 */
export function getWeatherInfo(
  code: number,
  isDay: boolean
): WeatherCodeInfo {
  const definition = WEATHER_CODES[code];
  if (definition === undefined) {
    return UNKNOWN_INFO;
  }

  return {
    icon:
      isDay || definition.nightIcon === undefined
        ? definition.dayIcon
        : definition.nightIcon,
    i18nKey: `weather.code.${code}`,
    group: definition.group,
  };
}

export function getWeatherGroup(code: number): WeatherGroup {
  return WEATHER_CODES[code]?.group ?? 'cloudy';
}
