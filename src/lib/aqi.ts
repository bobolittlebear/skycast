export interface AqiLevel {
  /** 1-6，对应美国 EPA 六档 */
  level: number;
  /** 等级文案的 i18n key，例如 aqi.level.1 */
  labelKey: string;
  /** EPA 官方色值 */
  color: string;
  /** 与背景色对比度足够的文字颜色 */
  textColor: string;
}

interface AqiLevelDefinition extends AqiLevel {
  /** 该档位的最大 AQI（含） */
  max: number;
}

const LEVELS: readonly AqiLevelDefinition[] = [
  {
    level: 1,
    max: 50,
    labelKey: 'aqi.level.1',
    color: '#00E400',
    textColor: '#000000',
  },
  {
    level: 2,
    max: 100,
    labelKey: 'aqi.level.2',
    color: '#FFFF00',
    textColor: '#000000',
  },
  {
    level: 3,
    max: 150,
    labelKey: 'aqi.level.3',
    color: '#FF7E00',
    textColor: '#000000',
  },
  {
    level: 4,
    max: 200,
    labelKey: 'aqi.level.4',
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  {
    level: 5,
    max: 300,
    labelKey: 'aqi.level.5',
    color: '#8F3F97',
    textColor: '#FFFFFF',
  },
  {
    level: 6,
    max: Number.POSITIVE_INFINITY,
    labelKey: 'aqi.level.6',
    color: '#7E0023',
    textColor: '#FFFFFF',
  },
];

/** 色带右端对应的 AQI 上限；超过该值一律贴在最右侧 */
const BAND_POSITION_MAX = 500;

/**
 * 美国 EPA AQI 六档分级：
 * 0-50 优、51-100 良、101-150 轻度污染、151-200 中度污染、
 * 201-300 重度污染、301+ 严重污染。
 */
export function usAqiToLevel(aqi: number): AqiLevel {
  const value = Number.isFinite(aqi) ? Math.max(0, aqi) : 0;
  // 最后一档 max 是 Infinity，正常数据下必定命中；兜底只用于满足类型收窄
  const level =
    LEVELS.find((item) => value <= item.max) ?? LEVELS[LEVELS.length - 1];
  if (level === undefined) {
    throw new Error('AQI 等级表为空');
  }

  return {
    level: level.level,
    labelKey: level.labelKey,
    color: level.color,
    textColor: level.textColor,
  };
}

/**
 * 当前 AQI 在六段等宽色带上的相对位置，取值 [0, 1]。
 *
 * 六段宽度相同，但各档对应的 AQI 区间宽度不同（50/50/50/50/100/200），
 * 因此不能直接用 aqi / 500，必须先在档内算出偏移比例再叠加档位索引。
 * 最后一个档位的上限按 BAND_POSITION_MAX 计算，超出部分贴在最右侧。
 */
export function aqiBandPosition(aqi: number): number {
  const value = Number.isFinite(aqi)
    ? Math.min(Math.max(aqi, 0), BAND_POSITION_MAX)
    : 0;

  // 每档的下界是上一档上限 + 1（AQI 为整数刻度）
  let lower = 0;

  for (let index = 0; index < LEVELS.length; index += 1) {
    const level = LEVELS[index];
    if (level === undefined) {
      continue;
    }

    const isLast = index === LEVELS.length - 1;
    const upper = isLast ? BAND_POSITION_MAX : level.max;

    if (value <= upper) {
      const ratio = (value - lower) / (upper - lower);
      const clamped = Math.min(Math.max(ratio, 0), 1);
      return (index + clamped) / LEVELS.length;
    }

    lower = upper + 1;
  }

  return 1;
}
