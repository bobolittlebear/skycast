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
