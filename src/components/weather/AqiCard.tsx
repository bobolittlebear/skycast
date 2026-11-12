import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import { roundTemp } from "../../lib/format";
import { usAqiToLevel } from "../../lib/aqi";
import { glass, spacing } from "../../theme/tokens";
import type { AirQualityBundle } from "../../types/weather";
import { GlassCard } from "./GlassCard";

export interface AqiCardProps {
  /** 空气质量请求失败或尚未返回时为 undefined */
  air: AirQualityBundle | undefined;
}

/**
 * 六个档位的代表值，仅用于从 aqi.ts 取到各档色值；
 * 当前档位再按真实 AQI 计算。
 */
const BAND_SAMPLES = [0, 75, 125, 175, 250, 400] as const;
const BAND_COLORS = BAND_SAMPLES.map((value) => usAqiToLevel(value));
/**
 * 当前空气质量卡片：六段等级色带 + AQI 数值 + 等级文案。
 * air 为 undefined 时只显示标题与「暂无数据」，不阻塞页面其余部分。
 */
export function AqiCard({ air }: AqiCardProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  const currentLevel = air === undefined ? null : usAqiToLevel(air.aqi);

  return (
    <GlassCard>
      <Text
        numberOfLines={1}
        style={[styles.title, { color: palette.textPrimary }]}
      >
        {t("weather.aqi")}
      </Text>

      {air === undefined || currentLevel === null ? (
        <Text style={[styles.noData, { color: palette.textSecondary }]}>
          {t("weather.noData")}
        </Text>
      ) : (
        <>
          <View style={styles.band}>
            {BAND_COLORS.map((level) => (
              <View
                key={level.level}
                style={[
                  styles.segment,
                  {
                    backgroundColor: level.color,
                    opacity: level.level === currentLevel.level ? 1 : 0.45,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.summary}>
            <Text style={[styles.value, { color: palette.textPrimary }]}>
              {roundTemp(air.aqi)}
            </Text>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t(currentLevel.labelKey)}
            </Text>
          </View>
        </>
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
  band: {
    flexDirection: "row",
    gap: 2,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  value: {
    fontSize: 28,
    fontWeight: "600",
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
  },
  noData: {
    fontSize: 15,
  },
});
