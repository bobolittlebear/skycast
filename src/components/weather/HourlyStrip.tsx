import type { JSX } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import { useSettings } from "../../features/settings/SettingsContext";
import { roundTemp } from "../../lib/format";
import { findCurrentHourIndex, formatHourShort } from "../../lib/time";
import { getWeatherInfo } from "../../lib/wmo";
import { glass, spacing, typography } from "../../theme/tokens";
import type { HourlyPoint } from "../../types/weather";

export interface HourlyStripProps {
  hourly: readonly HourlyPoint[];
  timezone: string;
  currentTime: string;
}

const ITEM_WIDTH = 56;
const VISIBLE_HOURS = 24;

/**
 * 24小时逐时天气预报横条
 *
 * 以横向滚动列表展示从当前小时起的未来24小时天气预报，
 * 首项时间标签显示为「现在」，其余项显示对应小时（如「14时」）。
 * 每项包含时间、天气图标和温度。
 */
export function HourlyStrip({
  hourly,
  timezone,
  currentTime,
}: HourlyStripProps): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;

  const times = hourly.map((item) => item.time);
  const startIndex = findCurrentHourIndex(times, currentTime, timezone);
  const visible =
    startIndex < 0 ? [] : hourly.slice(startIndex, startIndex + VISIBLE_HOURS);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {visible.map((item, index) => {
        const info = getWeatherInfo(item.weatherCode, item.isDay);

        return (
          <View key={item.time} style={styles.item}>
            <Text
              numberOfLines={1}
              style={[styles.time, { color: palette.textSecondary }]}
            >
              {index === 0
                ? t("weather.now")
                : formatHourShort(item.time, timezone, lang)}
            </Text>

            <MaterialCommunityIcons
              name={info.icon}
              size={20}
              color={palette.textPrimary}
            />

            <Text style={[styles.temperature, { color: palette.textPrimary }]}>
              {roundTemp(item.temperature)}°
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: "center",
    gap: spacing.sm,
  },
  time: {
    fontSize: typography.fontSize.sm,
  },
  temperature: {
    fontSize: typography.fontSize.md,
    fontWeight: "500",
  },
});
