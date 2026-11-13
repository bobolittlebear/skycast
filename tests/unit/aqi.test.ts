import { describe, expect, it } from "vitest";
import { aqiBandPosition, usAqiToLevel } from "../../src/lib/aqi";

/** [AQI, 期望档位]，覆盖每一档的上下边界 */
const LEVEL_CASES: readonly (readonly [number, number])[] = [
  [0, 1],
  [50, 1],
  [51, 2],
  [100, 2],
  [101, 3],
  [150, 3],
  [151, 4],
  [200, 4],
  [201, 5],
  [300, 5],
  [301, 6],
  [500, 6],
];

describe("usAqiToLevel", () => {
  for (const [aqi, level] of LEVEL_CASES) {
    it(`AQI ${aqi} 落在第 ${level} 档`, () => {
      expect(usAqiToLevel(aqi).level).toBe(level);
    });
  }

  it("负数与 NaN 按最轻一档处理", () => {
    expect(usAqiToLevel(-1).level).toBe(1);
    expect(usAqiToLevel(Number.NaN).level).toBe(1);
  });

  it("文案 key 与档位编号一致", () => {
    expect(usAqiToLevel(25).labelKey).toBe("aqi.level.1");
    expect(usAqiToLevel(75).labelKey).toBe("aqi.level.2");
    expect(usAqiToLevel(400).labelKey).toBe("aqi.level.6");
  });
});

describe("aqiBandPosition", () => {
  it("六段等宽，档位上下界落在段的两端", () => {
    expect(aqiBandPosition(0)).toBeCloseTo(0, 10);
    expect(aqiBandPosition(50)).toBeCloseTo(1 / 6, 10);
    expect(aqiBandPosition(100)).toBeCloseTo(2 / 6, 10);
    expect(aqiBandPosition(150)).toBeCloseTo(3 / 6, 10);
    expect(aqiBandPosition(200)).toBeCloseTo(4 / 6, 10);
    expect(aqiBandPosition(300)).toBeCloseTo(5 / 6, 10);
    expect(aqiBandPosition(500)).toBeCloseTo(1, 10);
  });

  it("档位交界处连续，不会跳变", () => {
    expect(aqiBandPosition(50)).toBeCloseTo(aqiBandPosition(51), 10);
    expect(aqiBandPosition(100)).toBeCloseTo(aqiBandPosition(101), 10);
    expect(aqiBandPosition(200)).toBeCloseTo(aqiBandPosition(201), 10);
  });

  it("档内按比例线性推进", () => {
    // 0-50 档的中点
    expect(aqiBandPosition(25)).toBeCloseTo(0.5 / 6, 10);
    // 最后一档是 301-500，共 199 个整数点，中点是 400.5 而不是 400
    expect(aqiBandPosition(400.5)).toBeCloseTo(5.5 / 6, 10);
    // 500 是收尾的闭区间上界，落在色带末端
    expect(aqiBandPosition(499)).toBeLessThan(1);
  });

  it("超出范围与非法值收敛到两端", () => {
    expect(aqiBandPosition(600)).toBe(1);
    expect(aqiBandPosition(-10)).toBe(0);
    expect(aqiBandPosition(Number.NaN)).toBe(0);
  });

  it("整体单调不减", () => {
    let previous = -1;
    for (let aqi = 0; aqi <= 500; aqi += 5) {
      const position = aqiBandPosition(aqi);
      expect(position).toBeGreaterThanOrEqual(previous);
      previous = position;
    }
  });
});
