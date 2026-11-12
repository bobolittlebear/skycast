import type { JSX, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWeatherGroup } from '../../lib/wmo';
import { weatherGradient, type WeatherGradient } from '../../theme/tokens';

export interface WeatherBackgroundProps {
  /** 无数据时传 undefined，用多云白天渐变兜底 */
  weatherCode?: number;
  isDay?: boolean;
  children: ReactNode;
}

function selectGradient(
  weatherCode: number | undefined,
  isDay: boolean
): WeatherGradient {
  if (weatherCode === undefined) {
    return weatherGradient.dayCloudy;
  }

  if (getWeatherGroup(weatherCode) === 'clear') {
    return isDay ? weatherGradient.dayClear : weatherGradient.nightClear;
  }

  return isDay ? weatherGradient.dayCloudy : weatherGradient.nightCloudy;
}

/** 全屏三段渐变；children 叠在渐变之上，滚动与安全区由调用方处理 */
export function WeatherBackground({
  weatherCode,
  isDay = true,
  children,
}: WeatherBackgroundProps): JSX.Element {
  const gradient = selectGradient(weatherCode, isDay);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
