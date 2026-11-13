import type { JSX } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationDots } from "../../components/locations/LocationDots";
import { AqiCard } from "../../components/weather/AqiCard";
import { DailyForecastCard } from "../../components/weather/DailyForecastCard";
import { GlassCard } from "../../components/weather/GlassCard";
import { HourlyStrip } from "../../components/weather/HourlyStrip";
import { MetricCard } from "../../components/weather/MetricCard";
import { WeatherBackground } from "../../components/weather/WeatherBackground";
import { WeatherErrorView } from "../../components/weather/WeatherErrorView";
import { WeatherHero } from "../../components/weather/WeatherHero";
import { WeatherSkeleton } from "../../components/weather/WeatherSkeleton";
import {
  formatPercent,
  formatSpeed,
  formatWindDirection,
  roundTemp,
} from "../../lib/format";
import { formatHourShort } from "../../lib/time";
import { uvIndexToLevel } from "../../lib/uv";
import { glass, spacing, typography } from "../../theme/tokens";
import { useSettings } from "../settings/SettingsContext";
import { DEFAULT_LOCATION } from "../locations/defaultLocation";
import { useLocations } from "../locations/LocationsContext";
import { useWeather } from "./useWeather";

/** 底部额外留白，避免内容被悬浮按钮与地点圆点遮挡 */
const BOTTOM_EXTRA_PADDING = 120;

/**
 * 客户端抓取时间，与地点当地时间无关；只用于提示数据新鲜度。
 * 按设备默认时区输出 HH:mm，缓存恢复时也不会随地点时区漂移。
 */
function formatUpdatedTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

/**
 * 天气主页：按当前选中地点取天气与空气质量，负责加载态、错误重试与各区块组装。
 * 未选中地点时回退上海；空气质量失败不影响其余区块。
 */
export function WeatherScreen(): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  const palette = theme.dark ? glass.dark : glass.light;
  const insets = useSafeAreaInsets();
  const { locations, activeId, activeLocation, setActiveId } = useLocations();
  // 地点尚未恢复或未选中时回退到上海，保证首屏永远有内容
  const location = activeLocation ?? DEFAULT_LOCATION;
  const {
    weather,
    air,
    weatherError,
    weatherUpdatedAt,
    isRefetching,
    refetch,
  } = useWeather(location.lat, location.lon);

  // 无数据也无错误：冷加载或缓存尚未恢复，用与页面结构一致的骨架占位
  if (weather === undefined && weatherError === null) {
    return (
      <WeatherBackground>
        <WeatherSkeleton />
      </WeatherBackground>
    );
  }

  // 无数据且已有错误：按 AppError 的 code 展示分级文案与重试
  if (weather === undefined) {
    return <WeatherErrorView error={weatherError} onRetry={refetch} />;
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            accessibilityLabel={t("weather.refresh")}
          />
        }
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

        {weatherUpdatedAt > 0 && (
          <Text style={[styles.updatedAt, { color: palette.textPrimary }]}>
            {t("weather.updatedAt", {
              time: formatUpdatedTime(weatherUpdatedAt),
            })}
          </Text>
        )}

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
  scroll: {
    flex: 1,
  },
  updatedAt: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    textAlign: "center",
    opacity: 0.7,
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
