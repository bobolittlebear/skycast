import type { JSX } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Button, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationDots } from "../../components/locations/LocationDots";
import { AqiCard } from "../../components/weather/AqiCard";
import { DailyForecastCard } from "../../components/weather/DailyForecastCard";
import { GlassCard } from "../../components/weather/GlassCard";
import { HourlyStrip } from "../../components/weather/HourlyStrip";
import { MetricCard } from "../../components/weather/MetricCard";
import { WeatherBackground } from "../../components/weather/WeatherBackground";
import { WeatherHero } from "../../components/weather/WeatherHero";
import {
  formatPercent,
  formatSpeed,
  formatWindDirection,
  roundTemp,
} from "../../lib/format";
import { formatHourShort } from "../../lib/time";
import { uvIndexToLevel } from "../../lib/uv";
import { spacing } from "../../theme/tokens";
import { useSettings } from "../settings/SettingsContext";
import { DEFAULT_LOCATION } from "../locations/defaultLocation";
import { useLocations } from "../locations/LocationsContext";
import { useWeather } from "./useWeather";

/** 底部额外留白，避免内容被悬浮按钮与地点圆点遮挡 */
const BOTTOM_EXTRA_PADDING = 120;

/**
 * 天气主页：按当前选中地点取天气与空气质量，负责加载态、错误重试与各区块组装。
 * 未选中地点时回退上海；空气质量失败不影响其余区块。
 */
export function WeatherScreen(): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { locations, activeId, activeLocation, setActiveId } = useLocations();
  // 地点尚未恢复或未选中时回退到上海，保证首屏永远有内容
  const location = activeLocation ?? DEFAULT_LOCATION;
  const { weather, air, weatherError, refetch } = useWeather(
    location.lat,
    location.lon,
  );

  if (weather === undefined && weatherError !== null) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.onBackground }]}>
          {t("weather.loadFailed")}
        </Text>
        <Button mode="contained" onPress={refetch} style={styles.retry}>
          {t("weather.retry")}
        </Button>
      </View>
    );
  }

  // 只要天气主数据到达就渲染页面，空气质量卡单独处理加载/失败
  if (weather === undefined) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const current = weather.current;
  const today = weather.daily[0];
  const ultraviolet =
    today === undefined ? null : uvIndexToLevel(today.uvIndexMax);
  const windIndex = formatWindDirection(current.windDirection);
  // 英文的 windSuffix 是空字符串，i18next 会把空串当作缺失并返回 key，这里直接不用
  const windSuffix = lang === "en" ? "" : t("weather.windSuffix");
  const windDirection = `${t(`direction.${windIndex}`)}${windSuffix}`;

  const temperatureMax = today?.temperatureMax ?? current.temperature;
  const temperatureMin = today?.temperatureMin ?? current.temperature;

  return (
    <WeatherBackground weatherCode={current.weatherCode} isDay={current.isDay}>
      {/* 渐变背景上固定使用浅色状态栏图标；离开本屏后恢复全局设置 */}
      <StatusBar style="light" />
      <ScrollView
        key={location.id}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + BOTTOM_EXTRA_PADDING,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
      >
        <WeatherHero
          location={location}
          temperature={current.temperature}
          temperatureMax={temperatureMax}
          temperatureMin={temperatureMin}
          weatherCode={current.weatherCode}
          isDay={current.isDay}
        />

        <View style={styles.sections}>
          <AqiCard air={air} />

          <GlassCard>
            <HourlyStrip
              hourly={weather.hourly}
              timezone={weather.timezone}
              currentTime={current.time}
            />
          </GlassCard>

          <DailyForecastCard
            daily={weather.daily}
            timezone={weather.timezone}
            currentTime={current.time}
          />

          <View style={styles.row}>
            <MetricCard
              title={t("weather.windSpeed")}
              value={formatSpeed(current.windSpeed)}
              caption={`${t("weather.windGust")} ${formatSpeed(
                current.windGusts,
              )} · ${windDirection}`}
              icon="weather-windy"
              style={styles.halfCard}
            />
            <MetricCard
              title={t("weather.precipitation")}
              value={`${roundTemp(current.precipitation)} mm`}
              caption={
                today === undefined
                  ? t("weather.noData")
                  : `${t("weather.precipitationToday")} ${roundTemp(
                      today.precipitationSum,
                    )} mm`
              }
              icon="weather-pouring"
              style={styles.halfCard}
            />
          </View>

          <View style={styles.row}>
            <MetricCard
              title={t("weather.uvIndex")}
              value={
                today === undefined
                  ? t("weather.noData")
                  : String(roundTemp(today.uvIndexMax))
              }
              caption={
                ultraviolet === null ? undefined : t(ultraviolet.labelKey)
              }
              icon="white-balance-sunny"
              style={styles.halfCard}
            />
            <MetricCard
              title={t("weather.feelsLike")}
              value={`${roundTemp(current.apparentTemperature)}°`}
              caption={`${t("weather.actualTemp")} ${roundTemp(
                current.temperature,
              )}°`}
              icon="thermometer"
              style={styles.halfCard}
            />
          </View>

          <View style={styles.row}>
            <MetricCard
              title={t("weather.humidity")}
              value={formatPercent(current.relativeHumidity)}
              icon="water-percent"
              style={styles.halfCard}
            />
            <MetricCard
              title={t("weather.sunrise")}
              value={
                today === undefined
                  ? t("weather.noData")
                  : formatHourShort(today.sunrise, weather.timezone, lang)
              }
              caption={
                today === undefined
                  ? undefined
                  : `${t("weather.sunset")} ${formatHourShort(
                      today.sunset,
                      weather.timezone,
                      lang,
                    )}`
              }
              icon="weather-sunset-up"
              style={styles.halfCard}
            />
          </View>
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[styles.dots, { bottom: insets.bottom + spacing.md }]}
      >
        <LocationDots
          locations={locations}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </View>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: 17,
    textAlign: "center",
  },
  retry: {
    minWidth: 120,
  },
  scroll: {
    flex: 1,
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  sections: {
    marginTop: spacing.lg,
    gap: spacing.sm + spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm + spacing.xs,
  },
  halfCard: {
    flex: 1,
    minHeight: 96,
  },
});
