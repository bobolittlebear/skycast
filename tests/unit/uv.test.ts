import { describe, expect, it } from "vitest";
import { uvIndexToLevel } from "../../src/lib/uv";

/** [UV 值, 期望档位]，覆盖 WHO 五档的边界 */
const CASES: readonly (readonly [number, number])[] = [
  [0, 1],
  [2, 1],
  [3, 2],
  [5, 2],
  [6, 3],
  [7, 3],
  [8, 4],
  [10, 4],
  [11, 5],
  [20, 5],
];

describe("uvIndexToLevel", () => {
  for (const [value, level] of CASES) {
    it(`UV ${value} 落在第 ${level} 档`, () => {
      expect(uvIndexToLevel(value).level).toBe(level);
    });
  }

  it("负数与 NaN 按最低一档处理", () => {
    expect(uvIndexToLevel(-1).level).toBe(1);
    expect(uvIndexToLevel(Number.NaN).level).toBe(1);
  });

  it("文案 key 与档位编号一致", () => {
    expect(uvIndexToLevel(1).labelKey).toBe("uv.level.1");
    expect(uvIndexToLevel(9).labelKey).toBe("uv.level.4");
    expect(uvIndexToLevel(15).labelKey).toBe("uv.level.5");
  });
});
