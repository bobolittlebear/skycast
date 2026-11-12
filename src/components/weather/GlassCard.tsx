import type { JSX, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { glass } from '../../theme/tokens';

/** 圆角与内边距按 Apple 天气卡片规格固定为 20 */
const CARD_RADIUS = 20;
const CARD_PADDING = 20;

export type GlassTone = 'primary' | 'secondary';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** secondary 使用更淡的背景，用于层级更低的卡片 */
  tone?: GlassTone;
}

/**
 * 无模糊效果的玻璃卡片：半透明底色 + 1px 描边。
 * tone 只影响背景层的透明度，不改变 children 的可读性。
 */
export function GlassCard({
  children,
  style,
  tone = 'primary',
}: GlassCardProps): JSX.Element {
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;

  return (
    <View
      style={[
        styles.card,
        { borderColor: palette.borderColor },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.background,
          {
            backgroundColor: palette.backgroundColor,
            opacity: tone === 'primary' ? 1 : 0.6,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: CARD_PADDING,
  },
  background: {
    borderRadius: CARD_RADIUS,
  },
});
