import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type JSX } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { PaperProvider, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FloatingIconButton } from "./src/components/ui/FloatingIconButton";
import { SettingsPanel } from "./src/features/settings/SettingsPanel";
import {
  SettingsProvider,
  useSettings,
} from "./src/features/settings/SettingsContext";
import { useWeather } from "./src/features/weather/useWeather";
import { usAqiToLevel } from "./src/lib/aqi";
import { formatHourLabel } from "./src/lib/time";
import { queryClient } from "./src/services/query/queryClient";
import { borderRadius, spacing } from "./src/theme/tokens";

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** 等本地偏好读取完成后再挂 PaperProvider，避免主题先亮后暗闪烁 */
function AppContent(): JSX.Element {
  const { ready, theme, themeMode } = useSettings();
  const systemScheme = useColorScheme();

  if (!ready) {
    return <View style={styles.boot} />;
  }

  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <HomeScreen />
    </PaperProvider>
  );
}

function HomeScreen(): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const { lang, themeMode } = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const langLabelKey =
    lang === "zh-Hans"
      ? "language.zhHans"
      : lang === "zh-Hant"
        ? "language.zhHant"
        : "language.en";

  const themeLabelKey =
    themeMode === "system"
      ? "theme.system"
      : themeMode === "light"
        ? "theme.light"
        : "theme.dark";

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.content} edges={["top", "left", "right"]}>
        {/* <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {t("home.title")}
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("home.subtitle")}
        </Text> */}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          {/* <Text variant="bodyMedium">
            {t("home.currentLang")}: {t(langLabelKey)}
          </Text>
          <Text variant="bodyMedium">
            {t("home.currentTheme")}: {t(themeLabelKey)}
          </Text> */}

          {/* 临时数据校验块：M2 接入正式天气 UI 后删除 */}
          <View style={styles.probe}>
            <WeatherProbe />
          </View>
        </View>
      </SafeAreaView>

      <FloatingIconButton
        icon="cog-outline"
        position="left"
        onPress={() => setSettingsVisible(true)}
        accessibilityLabel={t("settings.title")}
      />

      <SettingsPanel
        visible={settingsVisible}
        onDismiss={() => setSettingsVisible(false)}
      />
    </View>
  );
}

/** 固定取上海坐标，只用于人工确认数据层已经打通 */
function WeatherProbe(): JSX.Element {
  const { lang } = useSettings();
  const { weather, air, isLoading, weatherError, airError } = useWeather(
    31.2304,
    121.4737,
  );

  if (isLoading) {
    return (
      <Text variant="bodySmall" style={styles.probeLine}>
        数据加载中…
      </Text>
    );
  }

  return (
    <>
      {weather !== undefined ? (
        <Text variant="bodySmall" style={styles.probeLine}>
          上海 {weather.current.temperature}°C · 湿度{" "}
          {weather.current.relativeHumidity}% ·{" "}
          {formatHourLabel(weather.current.time, weather.timezone, lang)}
        </Text>
      ) : (
        <Text variant="bodySmall" style={styles.probeLine}>
          天气加载失败：{weatherError?.message ?? "未知错误"}
        </Text>
      )}

      {air !== undefined ? (
        <Text variant="bodySmall" style={styles.probeLine}>
          AQI {air.aqi} · {usAqiToLevel(air.aqi).labelKey}
          {air.pm25 !== null ? ` · PM2.5 ${air.pm25}` : ""}
        </Text>
      ) : (
        <Text variant="bodySmall" style={styles.probeLine}>
          空气质量加载失败：{airError?.message ?? "未知错误"}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  infoCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  probe: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  probeLine: {
    opacity: 0.8,
  },
});
