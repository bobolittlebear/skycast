import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import { roundTemp } from "../../lib/format";
import { getWeatherInfo } from "../../lib/wmo";
import { glass, spacing } from "../../theme/tokens";
import type { Location } from "../../types/location";

export interface WeatherHeroProps {
  /** 当前地点；name 为空时展示层兜底为「当前位置」 */
  location: Location;
  /** 当前温度，摄氏度 */
  temperature: number;
  /** 当日最高温，摄氏度 */
  temperatureMax: number;
  /** 当日最低温，摄氏度 */
  temperatureMin: number;
  /** WMO 天气码，用于映射图标与文案 */
  weatherCode: number;
  /** 是否为白天，决定使用日间还是夜间图标 */
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

/**
 * 顶部实况区：地点名、当前温度、当日高低温与天气描述。
 * 地点名为空（GPS 反查失败）时显示「当前位置」。
 */
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
  // GPS 反查失败时名称为空，兜底显示「当前位置」
  const label =
    location.name === ""
      ? t("location.current")
      : formatLocationLabel(location);

  return (
    <View style={styles.container}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.city, { color: palette.textPrimary }]}
      >
        {label}
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
    alignItems: "center",
    width: "100%",
    paddingBlock: spacing.xl,
  },
  city: {
    fontSize: 22,
    lineHeight: 30,
    opacity: 0.9,
    maxWidth: "100%",
    marginBottom: spacing.xxs / 2,
  },
  temperature: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: "200",
    marginBottom: spacing.xxs / 2,
  },
  range: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: spacing.xxs / 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
