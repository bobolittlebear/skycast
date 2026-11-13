import { describe, expect, it } from "vitest";
import { getWeatherGroup, getWeatherInfo } from "../../src/lib/wmo";

/** Open-Meteo 会返回的全部 WMO 码；新增码值时应同步扩展这份清单 */
const KNOWN_CODES: readonly number[] = [
  0, 1, 2, 3, 45, 48,
  51, 53, 55, 56, 57,
  61, 63, 65, 66, 67,
  71, 73, 75, 77,
  80, 81, 82, 85, 86,
  95, 96, 99,
];

describe("getWeatherInfo", () => {
  it("为每个已知码返回对应的 i18n key 与天气图标", () => {
    for (const code of KNOWN_CODES) {
      const info = getWeatherInfo(code, true);
      expect(info.i18nKey).toBe(`weather.code.${code}`);
      expect(info.icon.startsWith("weather-")).toBe(true);
    }
  });

  it("晴天白天用太阳、夜间用月亮", () => {
    expect(getWeatherInfo(0, true).icon).toBe("weather-sunny");
    expect(getWeatherInfo(0, false).icon).toBe("weather-night");
  });

  it("少云在夜间切换为月亮系图标", () => {
    expect(getWeatherInfo(1, false).icon).toBe("weather-night-partly-cloudy");
    expect(getWeatherInfo(2, false).icon).toBe("weather-night-partly-cloudy");
  });

  it("没有夜间图标的码在夜间沿用白天图标", () => {
    for (const code of [3, 45, 61, 65, 71, 95]) {
      expect(getWeatherInfo(code, false).icon).toBe(
        getWeatherInfo(code, true).icon
      );
    }
  });

  it("未知码降级为多云，不抛错", () => {
    expect(getWeatherInfo(999, true)).toEqual({
      icon: "weather-cloudy",
      i18nKey: "weather.unknown",
      group: "cloudy",
    });
  });
});

describe("getWeatherGroup", () => {
  it("把码值映射到六种分组", () => {
    expect(getWeatherGroup(0)).toBe("clear");
    expect(getWeatherGroup(2)).toBe("cloudy");
    expect(getWeatherGroup(45)).toBe("fog");
    expect(getWeatherGroup(61)).toBe("rain");
    expect(getWeatherGroup(71)).toBe("snow");
    expect(getWeatherGroup(95)).toBe("thunder");
  });

  it("未知码降级为 cloudy，保证背景始终可用", () => {
    expect(getWeatherGroup(999)).toBe("cloudy");
    expect(getWeatherGroup(-1)).toBe("cloudy");
  });
});
