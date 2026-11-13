/**
 * 纯展示格式化函数：只做数值转换，不依赖 locale 与设备时区。
 * 温度统一取整，组件里不再出现 toFixed。
 */

export function roundTemp(value: number): number {
  return Math.round(value);
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
