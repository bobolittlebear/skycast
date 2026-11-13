import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type JSX } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FloatingIconButton } from "./src/components/ui/FloatingIconButton";
import { LocationsProvider } from "./src/features/locations/LocationsContext";
import { LocationSheet } from "./src/features/locations/LocationSheet";
import { SettingsPanel } from "./src/features/settings/SettingsPanel";
import {
  SettingsProvider,
  useSettings,
} from "./src/features/settings/SettingsContext";
import { WeatherScreen } from "./src/features/weather/WeatherScreen";
import { queryClient } from "./src/services/query/queryClient";
import {
  CACHE_BUSTER,
  PERSIST_MAX_AGE,
  persister,
} from "./src/services/query/persister";

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE,
          buster: CACHE_BUSTER,
        }}
      >
        <SettingsProvider>
          <LocationsProvider>
            <AppContent />
          </LocationsProvider>
        </SettingsProvider>
      </PersistQueryClientProvider>
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
  const [listVisible, setListVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <WeatherScreen />

      <FloatingIconButton
        icon="cog-outline"
        position="left"
        onPress={() => setSettingsVisible(true)}
        accessibilityLabel={t("settings.title")}
      />

      <FloatingIconButton
        icon="format-list-bulleted"
        position="right"
        onPress={() => setListVisible(true)}
        accessibilityLabel={t("location.listTitle")}
      />

      <SettingsPanel
        visible={settingsVisible}
        onDismiss={() => setSettingsVisible(false)}
      />

      <LocationSheet
        visible={listVisible}
        onDismiss={() => setListVisible(false)}
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
