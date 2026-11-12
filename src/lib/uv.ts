export interface UvLevel {
  /** 1-5，对应 WHO 五档 */
  level: number;
  /** 等级文案的 i18n key，例如 uv.level.1 */
  labelKey: string;
  /** WHO 分级常用色 */
  color: string;
}

interface UvLevelDefinition extends UvLevel {
  /** 该档位的最大 UV 值（含） */
  max: number;
}

const UV_LEVELS: readonly UvLevelDefinition[] = [
  { level: 1, max: 2, labelKey: 'uv.level.1', color: '#3EA72D' },
  { level: 2, max: 5, labelKey: 'uv.level.2', color: '#FFF300' },
  { level: 3, max: 7, labelKey: 'uv.level.3', color: '#F18B00' },
  { level: 4, max: 10, labelKey: 'uv.level.4', color: '#E53210' },
  {
    level: 5,
    max: Number.POSITIVE_INFINITY,
    labelKey: 'uv.level.5',
    color: '#B567A4',
  },
];

/**
 * WHO 紫外线指数分级：0-2 低、3-5 中、6-7 高、8-10 很高、11+ 极高。
 * 非法数值按 0 处理，不抛错。
 */
export function uvIndexToLevel(value: number): UvLevel {
  const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  const definition =
    UV_LEVELS.find((item) => normalized <= item.max) ??
    UV_LEVELS[UV_LEVELS.length - 1];
  if (definition === undefined) {
    throw new Error('UV 等级表为空');
  }

  return {
    level: definition.level,
    labelKey: definition.labelKey,
    color: definition.color,
  };
}
