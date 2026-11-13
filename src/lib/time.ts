import type { Lang } from '../i18n/language';

/**
 * Open-Meteo 在 timezone=auto 时返回的是“地点当地壁钟时间”（没有 Z 或偏移量），
 * 例如 2026-11-12T20:00。若直接 new Date(iso) 再按设备时区解释，设备时区一变
 * 小时数就会错位。因此这里先把壁钟时间按目标 timeZone 换算成绝对时刻，
 * 再用 Intl 显式指定 timeZone 格式化；全程不使用 Date 的本地时区 getter。
 */

const LOCALE_BY_LANG: Record<Lang, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  en: 'en-US',
};

const HAS_OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;

interface WallTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const zonedPartsFormatters = new Map<string, Intl.DateTimeFormat>();
const labelFormatters = new Map<string, Intl.DateTimeFormat>();

function getZonedPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = zonedPartsFormatters.get(timeZone);
  if (cached !== undefined) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  zonedPartsFormatters.set(timeZone, formatter);
  return formatter;
}

function getLabelFormatter(
  lang: Lang,
  timeZone: string,
  kind: 'hour' | 'day'
): Intl.DateTimeFormat {
  const locale = LOCALE_BY_LANG[lang];
  const key = `${locale}|${timeZone}|${kind}`;
  const cached = labelFormatters.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const formatter =
    kind === 'hour'
      ? new Intl.DateTimeFormat(locale, {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
      : new Intl.DateTimeFormat(locale, {
          timeZone,
          month: 'short',
          day: 'numeric',
        });

  labelFormatters.set(key, formatter);
  return formatter;
}

/** 解析无偏移量的 ISO 壁钟时间；失败返回 null */
function parseWallTime(iso: string): WallTimeParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(iso);
  if (match === null) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
  };
}

/** 取某个绝对时刻在目标时区的壁钟组成部分 */
function getZonedParts(
  timestampMs: number,
  timeZone: string
): WallTimeParts {
  const parts = getZonedPartsFormatter(timeZone).formatToParts(
    new Date(timestampMs)
  );
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    switch (part.type) {
      case 'year':
        year = Number(part.value);
        break;
      case 'month':
        month = Number(part.value);
        break;
      case 'day':
        day = Number(part.value);
        break;
      case 'hour':
        hour = Number(part.value) % 24;
        break;
      case 'minute':
        minute = Number(part.value);
        break;
      case 'second':
        second = Number(part.value);
        break;
      default:
        break;
    }
  }

  return { year, month, day, hour, minute, second };
}

/**
 * 把目标时区的壁钟时间换算成 UTC 时间戳。
 * 先用“把壁钟当 UTC”的猜测值，再用 Intl 反推目标时区的实际壁钟，迭代修正偏移；
 * 这样夏令时也能正确处理，且结果与设备时区无关。
 */
function wallTimeToTimestamp(parts: WallTimeParts, timeZone: string): number {
  const targetAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  let candidate = targetAsUtc;

  for (let i = 0; i < 3; i += 1) {
    const actual = getZonedParts(candidate, timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const delta = actualAsUtc - targetAsUtc;
    if (delta === 0) {
      break;
    }
    candidate -= delta;
  }

  return candidate;
}

/** 支持两种输入：带 Z/偏移量的绝对时间，以及 Open-Meteo 的当地壁钟时间 */
function toDate(iso: string, timeZone: string): Date {
  if (HAS_OFFSET_SUFFIX.test(iso)) {
    const absolute = new Date(iso);
    if (!Number.isNaN(absolute.getTime())) {
      return absolute;
    }
  }

  const parts = parseWallTime(iso);
  if (parts !== null) {
    return new Date(wallTimeToTimestamp(parts, timeZone));
  }

  const fallback = new Date(iso);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`无法解析时间：${iso}`);
  }
  return fallback;
}

/** 逐小时标签，例如 14:00；始终按 location 的 timezone 显示 */
export function formatHourLabel(
  iso: string,
  timezone: string,
  lang: Lang
): string {
  return getLabelFormatter(lang, timezone, 'hour').format(
    toDate(iso, timezone)
  );
}

/** 每日标签，例如 11月12日 / Nov 12；始终按 location 的 timezone 显示 */
export function formatDayLabel(
  iso: string,
  timezone: string,
  lang: Lang
): string {
  return getLabelFormatter(lang, timezone, 'day').format(
    toDate(iso, timezone)
  );
}

/** 返回 YYYY-MM-DD 的当地日期 key */
export function localDateKey(iso: string, timezone: string): string {
  const parts = getZonedPartsFormatter(timezone).formatToParts(
    toDate(iso, timezone)
  );
  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') {
      year = part.value;
    } else if (part.type === 'month') {
      month = part.value;
    } else if (part.type === 'day') {
      day = part.value;
    }
  }

  return `${year}-${month}-${day}`;
}

/** 判断两个壁钟时间在指定地点时区是否属于同一天 */
export function isSameLocalDay(
  isoA: string,
  isoB: string,
  timezone: string
): boolean {
  return localDateKey(isoA, timezone) === localDateKey(isoB, timezone);
}

/**
 * 找到“当前小时”在逐小时数组中的索引：取最后一个不晚于当前时间的槽位。
 * 当前时间早于第一个槽位时返回 0，晚于最后一个槽位时返回末位。
 */
export function findCurrentHourIndex(
  hourlyTimes: readonly string[],
  currentTime: string,
  timezone: string
): number {
  if (hourlyTimes.length === 0) {
    return -1;
  }

  const currentMs = toDate(currentTime, timezone).getTime();
  let index = 0;

  for (let i = 0; i < hourlyTimes.length; i += 1) {
    const time = hourlyTimes[i];
    if (time === undefined) {
      break;
    }
    if (toDate(time, timezone).getTime() <= currentMs) {
      index = i;
    } else {
      break;
    }
  }

  return index;
}

const shortFormatters = new Map<string, Intl.DateTimeFormat>();

function getHourShortFormatter(timeZone: string): Intl.DateTimeFormat {
  const key = `hour|${timeZone}`;
  const cached = shortFormatters.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: true,
  });
  shortFormatters.set(key, formatter);
  return formatter;
}

function getWeekdayFormatter(
  lang: Lang,
  timeZone: string
): Intl.DateTimeFormat {
  const key = `weekday|${LOCALE_BY_LANG[lang]}|${timeZone}`;
  const cached = shortFormatters.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
    timeZone,
    weekday: 'short',
  });
  shortFormatters.set(key, formatter);
  return formatter;
}

/**
 * 逐小时条的短标签：
 * 中文固定为「21时 / 21時」（24 小时制、不补零），英文用 Intl 输出「9 PM」。
 * 与 formatHourLabel 一样，始终按 location 的 timezone 计算。
 */
export function formatHourShort(
  iso: string,
  timezone: string,
  lang: Lang
): string {
  if (lang === 'en') {
    return getHourShortFormatter(timezone).format(toDate(iso, timezone));
  }

  const hour = getZonedParts(toDate(iso, timezone).getTime(), timezone).hour;
  return `${hour}${lang === 'zh-Hant' ? '時' : '时'}`;
}

/** 星期短标签，例如「周四」/「週四」/「Thu」；按目标时区计算 */
export function formatWeekdayShort(
  date: string,
  timezone: string,
  lang: Lang
): string {
  return getWeekdayFormatter(lang, timezone).format(toDate(date, timezone));
}
