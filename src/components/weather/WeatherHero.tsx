import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { roundTemp } from '../../lib/format';
import { getWeatherInfo } from '../../lib/wmo';
import { glass, spacing } from '../../theme/tokens';
import type { Location } from '../../types/location';

export interface WeatherHeroProps {
  location: Location;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  isDay: boolean;
}

/** 只有区域名确实提供额外信息时才拼接，避免出现「上海 · 上海市」 */
function formatLocationLabel(location: Location): string {
  const region = location.admin1;
  if (
    region === undefined ||
    region === location.name ||
    region.startsWith(location.name)
  ) {
    return location.name;
  }
  return `${location.name} · ${region}`;
}

export function WeatherHero({
  location,
  temperature,
  temperatureMax,
  temperatureMin,
  weatherCode,
  isDay,
}: WeatherHeroProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  const info = getWeatherInfo(weatherCode, isDay);

  return (
    <View style={styles.container}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.city, { color: palette.textPrimary }]}
      >
        {formatLocationLabel(location)}
      </Text>

      <Text
        numberOfLines={1}
        style={[styles.temperature, { color: palette.textPrimary }]}
      >
        {roundTemp(temperature)}°
      </Text>

      <Text style={[styles.range, { color: palette.textPrimary }]}>
        {roundTemp(temperatureMax)}° / {roundTemp(temperatureMin)}°
      </Text>

      <Text style={[styles.description, { color: palette.textPrimary }]}>
        {t(info.i18nKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  city: {
    fontSize: 38,
    lineHeight: 44,
    opacity: 0.9,
    maxWidth: '100%',
    marginBottom: spacing.sm,
  },
  temperature: {
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '200',
    marginBottom: spacing.sm + spacing.xs,
  },
  range: {
    fontSize: 38,
    lineHeight: 44,
    marginBottom: spacing.sm + spacing.xs,
  },
  description: {
    fontSize: 19,
    lineHeight: 24,
    opacity: 0.8,
  },
});
