import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type JSX } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FloatingIconButton } from "./src/components/ui/FloatingIconButton";
import { SettingsPanel } from "./src/features/settings/SettingsPanel";
import {
  SettingsProvider,
  useSettings,
} from "./src/features/settings/SettingsContext";
import { WeatherScreen } from "./src/features/weather/WeatherScreen";
import { queryClient } from "./src/services/query/queryClient";

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
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <WeatherScreen />

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

const styles = StyleSheet.create({
  boot: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});
