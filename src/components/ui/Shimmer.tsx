import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "react-native-paper";
import { borderRadius, glass } from "../../theme/tokens";

const MIN_OPACITY = 0.35;
const MAX_OPACITY = 0.7;
const DURATION_MS = 900;

export interface ShimmerProps {
  /** 灰块宽度，单位 px */
  width: number;
  /** 灰块高度，单位 px */
  height: number;
  /** 圆角，默认使用最小圆角 token */
  radius?: number;
  /** 额外布局样式，例如外边距 */
  style?: StyleProp<ViewStyle>;
}

/**
 * 骨架屏灰块：在 0.35–0.7 的透明度之间循环呼吸。
 * Web 与原生都支持 opacity 动画；Web 缺少原生动画模块，自动降级为 JS 驱动。
 */
export function Shimmer({
  width,
  height,
  radius = borderRadius.sm,
  style,
}: ShimmerProps): JSX.Element {
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  // 用惰性 state 持有动画值，避免渲染期访问 ref 触发 React 19 的 lint 规则
  const [opacity] = useState(() => new Animated.Value(MIN_OPACITY));

  useEffect(() => {
    const timing = {
      duration: DURATION_MS,
      // Web 没有原生动画模块，交给 JS 驱动避免控制台告警
      useNativeDriver: Platform.OS !== "web",
    };
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { ...timing, toValue: MAX_OPACITY }),
        Animated.timing(opacity, { ...timing, toValue: MIN_OPACITY }),
      ])
    );

    animation.start();
    // 卸载时停止循环，避免动画句柄继续持有组件
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: palette.backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
