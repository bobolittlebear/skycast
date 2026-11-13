/**
 * 纯展示格式化函数：只做数值转换，不依赖 locale 与设备时区。
 * 温度统一取整，组件里不再出现 toFixed。
 */

export function roundTemp(value: number): number {
  return Math.round(value);
}

/**
 * 降水量展示：Open-Meteo 的精度是 0.1 mm，不能用 roundTemp 取整，
 * 否则 0.4 mm 会被显示成 0。单位固定为 mm。
 * 非有限数或 <= 0 返回 "0 mm"；0 < value < 0.1 返回 "<0.1 mm"；
 * 其余四舍五入到 1 位小数，整数结果不带 ".0"。
 */
export function formatPrecipitation(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 mm";
  }
  if (value < 0.1) {
    return "<0.1 mm";
  }
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} mm`;
}

/**
 * 角度换算成 8 方位索引：0 为北，顺时针递增（东 2、南 4、西 6）。
 * 负数与超过 360 的角度都会先归一到 [0, 360)。
 */
export function formatWindDirection(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized / 45) % 8;
}

/** 湿度等比例值四舍五入为整数百分比 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Open-Meteo 默认风速单位为 km/h */
export function formatSpeed(value: number): string {
  return `${Math.round(value)} km/h`;
}
