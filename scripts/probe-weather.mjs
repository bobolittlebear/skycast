#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */

/**
 * 数据层探针：不依赖 App / TS 编译，直接用 Node 原生 fetch 请求真实接口，
 * 用于确认 Open-Meteo 返回的字段名与数组长度仍符合我们的 zod schema。
 * 运行：pnpm probe
 */

const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const TIMEOUT_MS = 8000;
const FORECAST_DAYS = 15;
const MIN_HOURLY_COUNT = 48;

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'surface_pressure',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
];

const HOURLY_FIELDS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'is_day',
];

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
];

const LOCATIONS = [
  { name: '上海', latitude: 31.2304, longitude: 121.4737 },
  { name: '北京', latitude: 39.9042, longitude: 116.4074 },
];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`  ✗ ${message}`);
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** 按点路径读取字段；null/undefined 都算缺失 */
function readField(source, path) {
  let current = source;

  for (const key of path.split('.')) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !(key in current)
    ) {
      return { found: false, value: undefined };
    }
    current = current[key];
  }

  if (current === null || current === undefined) {
    return { found: false, value: undefined };
  }

  return { found: true, value: current };
}

function requireField(source, path, label) {
  const result = readField(source, path);
  if (!result.found) {
    fail(`缺少字段 ${label ?? path}`);
    return undefined;
  }
  return result.value;
}

function requireArray(source, path, minLength) {
  const value = requireField(source, path);
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    fail(`${path} 不是数组`);
    return undefined;
  }
  if (value.length < minLength) {
    fail(`${path} 长度 ${value.length}，期望至少 ${minLength}`);
    return undefined;
  }
  return value;
}

async function probeForecast(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_FIELDS.join(','),
    hourly: HOURLY_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });

  const data = await fetchJson(`${FORECAST_BASE_URL}?${params.toString()}`);

  for (const field of CURRENT_FIELDS) {
    requireField(data, `current.${field}`);
  }
  for (const field of HOURLY_FIELDS) {
    requireArray(data, `hourly.${field}`, MIN_HOURLY_COUNT);
  }
  for (const field of DAILY_FIELDS) {
    requireArray(data, `daily.${field}`, FORECAST_DAYS);
  }

  const dailyCount = Array.isArray(data?.daily?.time) ? data.daily.time.length : 0;
  if (dailyCount !== FORECAST_DAYS) {
    fail(`daily 条数 ${dailyCount}，期望 ${FORECAST_DAYS}`);
  }

  const temperature = readField(data, 'current.temperature_2m').value;
  const weatherCode = readField(data, 'current.weather_code').value;
  const timezone = readField(data, 'timezone').value;

  console.log(
    `  气温 ${String(temperature)}°C · weather code ${String(weatherCode)} · daily ${dailyCount} 条 · timezone ${String(timezone)}`
  );
  ok('forecast 字段齐全');
}

async function probeAirQuality(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'us_aqi,pm2_5',
    timezone: 'auto',
  });

  const data = await fetchJson(`${AIR_QUALITY_BASE_URL}?${params.toString()}`);
  const aqi = requireField(data, 'current.us_aqi');

  // pm2_5 在我们的 schema 里允许为 null，这里只提示不判失败
  const pm25 = readField(data, 'current.pm2_5').value;
  if (pm25 === undefined) {
    console.warn('  ! current.pm2_5 缺失（代码中按 null 处理）');
  }

  console.log(`  AQI ${String(aqi)} · PM2.5 ${pm25 === undefined ? 'null' : String(pm25)}`);
  ok('air-quality 字段齐全');
}

async function main() {
  for (const location of LOCATIONS) {
    console.log(`\n${location.name} (${location.latitude}, ${location.longitude})`);

    try {
      await probeForecast(location);
    } catch (error) {
      fail(`forecast 请求失败：${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await probeAirQuality(location);
    } catch (error) {
      fail(
        `air-quality 请求失败：${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (failed) {
    console.error('\n探针失败：存在缺失字段或请求错误');
    process.exitCode = 1;
    return;
  }

  console.log('\n探针通过：所有字段与数量符合预期');
}

await main();
