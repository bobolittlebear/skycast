import type { ComponentProps, JSX } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BOTTOM_CONTROL_HEIGHT,
  borderRadius,
  glass,
  spacing,
  typography,
} from '../../theme/tokens';

export type FloatingIconButtonPosition = 'left' | 'right';

export interface FloatingIconButtonProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  position: FloatingIconButtonPosition;
  accessibilityLabel: string;
}

/**
 * 可复用的圆形悬浮按钮，支持左右定位。
 * 位置基于安全区计算，iOS 上不会压到 Home Indicator。
 */
export function FloatingIconButton({
  icon,
  onPress,
  position,
  accessibilityLabel,
}: FloatingIconButtonProps): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // 浅色主题用半透明白底，深色主题用半透明黑底，保证在昼夜渐变上都可辨识
  const palette = theme.dark ? glass.dark : glass.light;

  const horizontalStyle =
    position === 'left' ? { left: spacing.md } : { right: spacing.md };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        horizontalStyle,
        {
          bottom: insets.bottom + spacing.md,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={typography.fontSize.xxl}
        color={theme.colors.onSurface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: BOTTOM_CONTROL_HEIGHT,
    height: BOTTOM_CONTROL_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});
