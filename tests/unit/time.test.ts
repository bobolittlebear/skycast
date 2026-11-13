import { describe, expect, it } from "vitest";
import {
  findCurrentHourIndex,
  formatHourLabel,
  formatHourShort,
  formatWeekdayShort,
  isSameLocalDay,
  localDateKey,
} from "../../src/lib/time";

const SHANGHAI = "Asia/Shanghai";
const NEW_YORK = "America/New_York";

describe("localDateKey", () => {
  it("按地点时区取当地日期", () => {
    expect(localDateKey("2026-11-12T20:00", SHANGHAI)).toBe("2026-11-12");
    expect(localDateKey("2026-11-12T23:59", SHANGHAI)).toBe("2026-11-12");
    expect(localDateKey("2026-11-13T00:00", SHANGHAI)).toBe("2026-11-13");
  });

  it("壁钟时间不随 timeZone 漂移，这是不使用 new Date(iso) 的原因", () => {
    expect(localDateKey("2026-11-12T20:00", SHANGHAI)).toBe("2026-11-12");
    expect(localDateKey("2026-11-12T20:00", NEW_YORK)).toBe("2026-11-12");
    expect(localDateKey("2026-11-12T20:00", "UTC")).toBe("2026-11-12");
  });

  it("午夜前后的时间不会被错误地分到同一天", () => {
    expect(localDateKey("2026-11-12T00:00", SHANGHAI)).toBe("2026-11-12");
    expect(localDateKey("2026-11-12T23:00", SHANGHAI)).toBe("2026-11-12");
    expect(localDateKey("2026-11-13T01:00", SHANGHAI)).toBe("2026-11-13");
  });
});

describe("isSameLocalDay", () => {
  it("同一天的不同时刻返回 true", () => {
    expect(isSameLocalDay("2026-11-12T00:00", "2026-11-12T23:59", SHANGHAI)).toBe(
      true
    );
  });

  it("跨日返回 false", () => {
    expect(isSameLocalDay("2026-11-12T23:00", "2026-11-13T00:00", SHANGHAI)).toBe(
      false
    );
  });
});

describe("findCurrentHourIndex", () => {
  const hours = [
    "2026-11-12T00:00",
    "2026-11-12T01:00",
    "2026-11-12T02:00",
  ];

  it("取不晚于当前时间的最后一个槽位", () => {
    expect(findCurrentHourIndex(hours, "2026-11-12T01:30", SHANGHAI)).toBe(1);
    expect(findCurrentHourIndex(hours, "2026-11-12T02:00", SHANGHAI)).toBe(2);
  });

  it("当前时间早于第一个槽位时返回 0", () => {
    expect(findCurrentHourIndex(hours, "2026-11-11T22:00", SHANGHAI)).toBe(0);
  });

  it("当前时间晚于最后一个槽位时返回末位", () => {
    expect(findCurrentHourIndex(hours, "2026-11-12T08:00", SHANGHAI)).toBe(2);
  });

  it("空数组返回 -1，由调用方判断无数据", () => {
    expect(findCurrentHourIndex([], "2026-11-12T08:00", SHANGHAI)).toBe(-1);
  });
});

describe("时间标签", () => {
  it("逐小时标签按地点时区输出 24 小时制", () => {
    expect(formatHourLabel("2026-11-12T20:00", SHANGHAI, "zh-Hans")).toBe("20:00");
    expect(formatHourLabel("2026-11-12T09:05", SHANGHAI, "zh-Hans")).toBe("09:05");
  });

  it("中文短标签不补零，繁体用「時」", () => {
    expect(formatHourShort("2026-11-12T21:00", SHANGHAI, "zh-Hans")).toBe("21时");
    expect(formatHourShort("2026-11-12T09:00", SHANGHAI, "zh-Hans")).toBe("9时");
    expect(formatHourShort("2026-11-12T21:00", SHANGHAI, "zh-Hant")).toBe("21時");
  });

  it("英文短标签使用 12 小时制", () => {
    expect(formatHourShort("2026-11-12T21:00", SHANGHAI, "en")).toMatch(
      /^9\s?PM$/
    );
  });

  it("星期标签随语言变化", () => {
    expect(formatWeekdayShort("2026-11-12", SHANGHAI, "zh-Hans")).toBe("周四");
    expect(formatWeekdayShort("2026-11-12", SHANGHAI, "zh-Hant")).toBe("週四");
    expect(formatWeekdayShort("2026-11-12", SHANGHAI, "en")).toBe("Thu");
  });
});
