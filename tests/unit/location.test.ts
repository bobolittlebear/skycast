import { describe, expect, it } from "vitest";
import { cleanAdminName, getLocalizedText } from "../../src/lib/location";
import type { Location } from "../../src/types/location";

/** 只填测试关心的字段；其余用固定值占位 */
function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: "1795565",
    name: "深圳",
    lat: 22.5455,
    lon: 114.0683,
    source: "search",
    ...overrides,
  };
}

describe("cleanAdminName", () => {
  it("去掉英文行政区名的拼音后缀", () => {
    expect(cleanAdminName("Guangdong Sheng")).toBe("Guangdong");
    expect(cleanAdminName("Dongguan Shi")).toBe("Dongguan");
    expect(cleanAdminName("Shanghai Municipality")).toBe("Shanghai");
    expect(cleanAdminName("Hulunbuir Region")).toBe("Hulunbuir");
  });

  it("自治区保留主体名称，去掉行政后缀", () => {
    expect(cleanAdminName("Guangxi Zhuang Autonomous Region")).toBe(
      "Guangxi Zhuang"
    );
    expect(cleanAdminName("Xinjiang Uygur Zizhiqu")).toBe("Xinjiang Uygur");
  });

  it("不误伤不含后缀的正常地名", () => {
    expect(cleanAdminName("Inner Mongolia")).toBe("Inner Mongolia");
    expect(cleanAdminName("Guangdong")).toBe("Guangdong");
    expect(cleanAdminName("Shaanxi")).toBe("Shaanxi");
  });

  it("中文名称原样保留", () => {
    expect(cleanAdminName("广东省")).toBe("广东省");
    expect(cleanAdminName("内蒙古自治区")).toBe("内蒙古自治区");
  });

  it("空值与空白返回 undefined，不返回空串", () => {
    expect(cleanAdminName(undefined)).toBeUndefined();
    expect(cleanAdminName("")).toBeUndefined();
    expect(cleanAdminName("   ")).toBeUndefined();
  });
});

describe("getLocalizedText", () => {
  it("有双语文本时按当前语言取", () => {
    const location = makeLocation({
      names: {
        zh: { name: "深圳", admin1: "广东", country: "中国" },
        en: { name: "Shenzhen", admin1: "Guangdong", country: "China" },
      },
    });

    expect(getLocalizedText(location, "en").name).toBe("Shenzhen");
    expect(getLocalizedText(location, "zh-Hans").name).toBe("深圳");
    expect(getLocalizedText(location, "zh-Hant").name).toBe("深圳");
  });

  it("缺少对应语言时回退到主名称，不返回空", () => {
    const location = makeLocation({
      name: "深圳",
      names: { zh: { name: "深圳" } },
    });

    expect(getLocalizedText(location, "en").name).toBe("深圳");
  });

  it("GPS 地点与旧数据没有 names，直接使用原字段", () => {
    const location = makeLocation({
      name: "当前位置",
      admin1: "广东",
      country: "中国",
      source: "gps",
    });

    const text = getLocalizedText(location, "en");
    expect(text.name).toBe("当前位置");
    expect(text.admin1).toBe("广东");
    expect(text.country).toBe("中国");
  });

  it("输出中的 admin1 已经清洗过后缀", () => {
    const location = makeLocation({
      names: {
        en: { name: "Shenzhen", admin1: "Guangdong Sheng", country: "China" },
      },
    });

    expect(getLocalizedText(location, "en").admin1).toBe("Guangdong");
  });

  it("空名称保持空串，由展示层兜底为「当前位置」", () => {
    const location = makeLocation({ name: "", source: "gps" });
    expect(getLocalizedText(location, "zh-Hans").name).toBe("");
  });
});
