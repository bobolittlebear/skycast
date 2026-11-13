import type { JSX } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Shimmer } from "../ui/Shimmer";
import { borderRadius, spacing } from "../../theme/tokens";
import { GlassCard } from "./GlassCard";

/** 逐小时占位块数量，与成功态首屏可见列数接近 */
const HOURLY_BLOCKS = [0, 1, 2, 3, 4] as const;

/**
 * 首屏骨架：按成功态结构摆放地点、温度、高低温、描述、逐小时与指标卡灰块。
 * 只使用 Shimmer 占位，不读取任何真实数据，也不发起请求。
 */
export function WeatherSkeleton(): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      testID="weather-skeleton"
      style={styles.scroll}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      <View style={styles.hero}>
        <Shimmer width={120} height={16} />
        <Shimmer width={160} height={64} radius={borderRadius.md} />
        <View style={styles.range}>
          <Shimmer width={52} height={20} />
          <Shimmer width={52} height={20} />
        </View>
        <Shimmer width={80} height={14} radius={borderRadius.sm} />
      </View>

      <View style={styles.sections}>
        <GlassCard>
          <View style={styles.hourly}>
            {HOURLY_BLOCKS.map((block) => (
              <Shimmer
                key={block}
                width={44}
                height={72}
                radius={borderRadius.md}
              />
            ))}
          </View>
        </GlassCard>

        <View style={styles.metricRow}>
          <GlassCard style={styles.metricCard}>
            <Shimmer width={56} height={12} />
            <Shimmer width={72} height={28} radius={borderRadius.sm} />
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Shimmer width={56} height={12} />
            <Shimmer width={72} height={28} radius={borderRadius.sm} />
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  range: {
    flexDirection: "row",
    gap: spacing.md,
  },
  sections: {
    gap: spacing.sm + spacing.xs,
  },
  hourly: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm + spacing.xs,
  },
  metricCard: {
    flex: 1,
    minHeight: 96,
    gap: spacing.sm,
  },
});
