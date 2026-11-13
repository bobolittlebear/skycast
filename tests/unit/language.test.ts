import { describe, expect, it } from "vitest";

import { isLang, normalizeLocale } from "../../src/i18n/language";

describe("normalizeLocale", () => {
  it("简体中文的各种写法都归一为 zh-Hans", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-Hans");
    expect(normalizeLocale("zh-Hans-CN")).toBe("zh-Hans");
    expect(normalizeLocale("zh")).toBe("zh-Hans");
  });

  it("繁体中文的写法归一为 zh-Hant", () => {
    expect(normalizeLocale("zh-TW")).toBe("zh-Hant");
    expect(normalizeLocale("zh-HK")).toBe("zh-Hant");
    expect(normalizeLocale("zh-Hant-MO")).toBe("zh-Hant");
  });

  it("英文与其它语言都归一为 en", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("ja-JP")).toBe("en");
  });

  describe("边界", () => {
    it("大小写混写不影响判断", () => {
      expect(normalizeLocale("ZH-hant-TW")).toBe("zh-Hant");
      expect(normalizeLocale("EN-us")).toBe("en");
    });

    it("空字符串与非法值落到 en，不抛异常", () => {
      expect(normalizeLocale("")).toBe("en");
      expect(normalizeLocale("not-a-locale")).toBe("en");
    });

    it("含 tw/hk/mo 但不以 zh 开头的 locale 不被当成繁体中文", () => {
      expect(normalizeLocale("en-HK")).toBe("en");
    });
  });
});

describe("isLang", () => {
  it("接受三个受支持的语言代码", () => {
    expect(isLang("zh-Hans")).toBe(true);
    expect(isLang("zh-Hant")).toBe(true);
    expect(isLang("en")).toBe(true);
  });

  describe("边界", () => {
    it("拒绝大小写不符与带地区的写法", () => {
      expect(isLang("zh-hans")).toBe(false);
      expect(isLang("zh-CN")).toBe(false);
    });

    it("拒绝空串与其它语言", () => {
      expect(isLang("")).toBe(false);
      expect(isLang("ja")).toBe(false);
    });
  });
});
