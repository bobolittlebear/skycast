import { describe, expect, it } from "vitest";
import {
  formatPercent,
  formatPrecipitation,
  formatSpeed,
  formatWindDirection,
  roundTemp,
} from "../../src/lib/format";

describe("roundTemp", () => {
  it("四舍五入到整数", () => {
    expect(roundTemp(18.4)).toBe(18);
    expect(roundTemp(18.5)).toBe(19);
    expect(roundTemp(-1.5)).toBe(-1);
    expect(roundTemp(-1.6)).toBe(-2);
  });
});

describe("formatPrecipitation", () => {
  it("零与负值显示 0 mm", () => {
    expect(formatPrecipitation(0)).toBe("0 mm");
    expect(formatPrecipitation(-0.3)).toBe("0 mm");
  });

  it("非有限值按 0 mm 处理", () => {
    expect(formatPrecipitation(Number.NaN)).toBe("0 mm");
    expect(formatPrecipitation(Number.POSITIVE_INFINITY)).toBe("0 mm");
  });

  it("小于 0.1 mm 显示下界而不是取整成 0", () => {
    expect(formatPrecipitation(0.04)).toBe("<0.1 mm");
    expect(formatPrecipitation(0.09)).toBe("<0.1 mm");
  });

  it("保留一位小数，这是 0.4 mm 不被吞掉的原因", () => {
    expect(formatPrecipitation(0.1)).toBe("0.1 mm");
    expect(formatPrecipitation(0.4)).toBe("0.4 mm");
    expect(formatPrecipitation(1.24)).toBe("1.2 mm");
    expect(formatPrecipitation(1.26)).toBe("1.3 mm");
  });

  it("整数结果不携带 .0", () => {
    expect(formatPrecipitation(2)).toBe("2 mm");
    expect(formatPrecipitation(2.04)).toBe("2 mm");
    expect(formatPrecipitation(2.96)).toBe("3 mm");
  });
});

describe("formatWindDirection", () => {
  it("按 45 度一档换算成八方位索引", () => {
    expect(formatWindDirection(0)).toBe(0);
    expect(formatWindDirection(45)).toBe(1);
    expect(formatWindDirection(90)).toBe(2);
    expect(formatWindDirection(180)).toBe(4);
    expect(formatWindDirection(270)).toBe(6);
  });

  it("接近 360 度时回到北方", () => {
    expect(formatWindDirection(359)).toBe(0);
    expect(formatWindDirection(360)).toBe(0);
    expect(formatWindDirection(720)).toBe(0);
  });

  it("负角度先归一到 [0, 360)", () => {
    expect(formatWindDirection(-45)).toBe(7);
    expect(formatWindDirection(-90)).toBe(6);
  });

  it("非有限值回退到北方", () => {
    expect(formatWindDirection(Number.NaN)).toBe(0);
  });
});

describe("formatPercent / formatSpeed", () => {
  it("湿度四舍五入并带百分号", () => {
    expect(formatPercent(55.5)).toBe("56%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("风速四舍五入并带单位", () => {
    expect(formatSpeed(12.4)).toBe("12 km/h");
    expect(formatSpeed(12.6)).toBe("13 km/h");
  });
});
