import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import { useSettings } from "../../features/settings/SettingsContext";
import { roundTemp } from "../../lib/format";
import { formatWeekdayShort, localDateKey } from "../../lib/time";
import { getWeatherInfo } from "../../lib/wmo";
import { glass, spacing } from "../../theme/tokens";
import type { DailyPoint } from "../../types/weather";
import { GlassCard } from "./GlassCard";

export interface DailyForecastCardProps {
  daily: readonly DailyPoint[];
  timezone: string;
  /** 当前实况时间，用于判断哪一行是「今天」 */
  currentTime: string;
}

const DAY_COLUMN_WIDTH = 56;
const ROW_HEIGHT = 40;
/**
 * 未来 N 天天气预报列表（含今天）
 *
 * 以列表形式展示未来 N 天的天气预报，数据包括天气状况（晴、多云等）、
 * 最低气温和最高气温。支持单日或多日展示，N 通过 daily 数组长度控制。
 * 当数组为空时展示空状态提示。
 */
export function DailyForecastCard({
  daily,
  timezone,
  currentTime,
}: DailyForecastCardProps): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  const todayKey = localDateKey(currentTime, timezone);

  return (
    <GlassCard>
      <Text
        numberOfLines={1}
        style={[styles.title, { color: palette.textPrimary }]}
      >
        {t("weather.dailyForecast")}
      </Text>

      {daily.length === 0 ? (
        <Text style={[styles.noData, { color: palette.textSecondary }]}>
          {t("weather.noData")}
        </Text>
      ) : (
        <View>
          {daily.map((item) => {
            const info = getWeatherInfo(item.weatherCode, true);
            const isToday = item.date === todayKey;

            return (
              <View key={item.date} style={styles.row}>
                <Text
                  numberOfLines={1}
                  style={[styles.day, { color: palette.textPrimary }]}
                >
                  {isToday
                    ? t("weather.today")
                    : formatWeekdayShort(item.date, timezone, lang)}
                </Text>

                <View style={styles.iconSlot}>
                  <MaterialCommunityIcons
                    name={info.icon}
                    size={22}
                    color={palette.textPrimary}
                  />
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.range, { color: palette.textPrimary }]}
                >
                  {roundTemp(item.temperatureMin)}° ~{" "}
                  {roundTemp(item.temperatureMax)}°
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  day: {
    width: DAY_COLUMN_WIDTH,
    fontSize: 14,
  },
  iconSlot: {
    flex: 1,
    alignItems: "center",
  },
  range: {
    width: 84,
    fontSize: 14,
    textAlign: "right",
  },
  noData: {
    fontSize: 15,
  },
});
