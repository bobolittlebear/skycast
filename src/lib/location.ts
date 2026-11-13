import type { Lang } from "../i18n/language";
import type { Location, LocationText } from "../types/location";

/**
 * GeoNames 的英文行政区名会带拼音后缀：
 * 省级写作 "Guangdong Sheng"，地级市写作 "Dongguan Shi"，
 * 直辖市写作 "Shanghai Municipality"，自治区写作 "Guangxi Zhuang Autonomous Region"。
 * 直接展示会在英文界面出现 "Shenzhen · Guangdong Sheng" 这类中英混排的冗余后缀。
 *
 * 只匹配以空格分隔的完整单词后缀，中文名称（如「广东省」）不会命中。
 */
const ADMIN_SUFFIX_PATTERN =
  /\s+(?:Autonomous\s+Region|Sheng|Shi|Xian|Zizhiqu|Region|Municipality)$/i;

/**
 * 清除英文行政区名的拼音后缀，返回可直接展示的名称。
 * 传入 undefined 或空串时返回 undefined；清洗后为空则保留原值，避免把名字抹掉。
 */
export function cleanAdminName(name: string | undefined): string | undefined {
  const trimmed = name?.trim();
  if (trimmed === undefined || trimmed === "") {
    return undefined;
  }

  const cleaned = trimmed.replace(ADMIN_SUFFIX_PATTERN, "").trim();
  return cleaned === "" ? trimmed : cleaned;
}

/**
 * 取出地点在当前语言下的展示文本。
 *
 * 搜索结果携带 names（添加时同时取了中英两份），切换语言无需重新请求；
 * GPS 地点和旧版本存储的数据没有 names，回退到 name / admin1 / country。
 * admin1 在这里统一清洗，调用方不必再处理 GeoNames 后缀。
 */
export function getLocalizedText(location: Location, lang: Lang): LocationText {
  const key = lang === "en" ? "en" : "zh";
  const localized = location.names?.[key];

  return {
    name: localized?.name ?? location.name,
    admin1: cleanAdminName(localized?.admin1 ?? location.admin1),
    country: localized?.country ?? location.country,
  };
}
