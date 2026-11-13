import type { JSX } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import type { WeatherIconName } from '../../lib/wmo';
import { glass, spacing } from '../../theme/tokens';
import { GlassCard } from './GlassCard';

export interface MetricCardProps {
  title: string;
  value: string;
  caption?: string;
  icon?: WeatherIconName;
  style?: StyleProp<ViewStyle>;
}

/**
 * 通用指标卡：标题、主值（可带图标）与一行补充说明。
 * 读屏时整张卡作为一个焦点，按「标题, 数值, 补充说明」一次读完；
 * caption 为空时不拼入，避免出现尾部空逗号。
 */
export function MetricCard({
  title,
  value,
  caption,
  icon,
  style,
}: MetricCardProps): JSX.Element {
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  const hasCaption = caption !== undefined && caption.length > 0;
  const accessibilityLabel = hasCaption
    ? `${title}, ${value}, ${caption}`
    : `${title}, ${value}`;

  return (
    <GlassCard style={style}>
      <View accessible accessibilityLabel={accessibilityLabel}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: palette.textPrimary }]}
        >
          {title}
        </Text>

        <View style={styles.valueRow}>
          {icon !== undefined ? (
            <MaterialCommunityIcons
              name={icon}
              size={18}
              color={palette.textPrimary}
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.value, { color: palette.textPrimary }]}
          >
            {value}
          </Text>
        </View>

        {hasCaption ? (
          <Text
            numberOfLines={1}
            style={[styles.caption, { color: palette.textPrimary }]}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    flexShrink: 1,
  },
  caption: {
    fontSize: 13,
    opacity: 0.8,
  },
});
