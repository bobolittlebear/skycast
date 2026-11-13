import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppError } from "../../services/api/errors";
import { spacing, typography } from "../../theme/tokens";

export interface WeatherErrorViewProps {
  /** 归一化后的错误；null 时按未知错误兜底 */
  error: AppError | null;
  /** 点击重试，重新请求天气与空气质量 */
  onRetry: () => void;
}

/** 只按 AppError 的 code 与状态码映射文案，不解析服务端返回文本 */
function getMessageKey(error: AppError | null): string {
  if (error === null) {
    return "weather.errorUnknown";
  }

  switch (error.code) {
    case "network":
    case "timeout":
      return "weather.errorNetwork";
    case "http":
      return error.status === 429 ? "weather.errorBusy" : "weather.errorRequest";
    case "schema":
      return "weather.errorData";
    case "empty":
    case "unknown":
      return "weather.errorUnknown";
  }
}

/**
 * 天气加载失败视图：按错误分级展示标题、统一提示与重试按钮。
 * 使用主题背景与安全区，可直接替代整页内容。
 */
export function WeatherErrorView({
  error,
  onRetry,
}: WeatherErrorViewProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        {t(getMessageKey(error))}
      </Text>
      <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        {t("weather.errorHint")}
      </Text>
      <Button mode="contained" onPress={onRetry} style={styles.retry}>
        {t("weather.retry")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    textAlign: "center",
  },
  hint: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  retry: {
    minWidth: 120,
  },
});
