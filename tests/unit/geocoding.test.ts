import { describe, expect, it } from "vitest";

import { dedupeLocations } from "../../src/services/api/openMeteo/geocoding";
import type { Location } from "../../src/types/location";

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: "1",
    name: "Shenzhen",
    admin1: "Guangdong",
    country: "China",
    lat: 22.5,
    lon: 114.0,
    source: "search",
    ...overrides,
  };
}

describe("dedupeLocations", () => {
  it("同名的地点只保留第一条", () => {
    const first = makeLocation({ id: "a", population: 10 });
    const duplicate = makeLocation({ id: "b", population: 20 });

    const result = dedupeLocations([first, duplicate]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("按人口降序排列，缺人口视为 0", () => {
    const small = makeLocation({ id: "small", name: "A", population: 100 });
    const big = makeLocation({ id: "big", name: "B", population: 5_000 });
    const unknown = makeLocation({ id: "unknown", name: "C", population: undefined });

    const result = dedupeLocations([small, unknown, big]);

    expect(result.map((item) => item.id)).toEqual(["big", "small", "unknown"]);
  });

  describe("边界", () => {
    it("空数组返回空数组", () => {
      expect(dedupeLocations([])).toEqual([]);
    });

    it("大小写和首尾空格不同的同名地点算重复", () => {
      const a = makeLocation({ id: "a", name: "Shenzhen", admin1: "Guangdong" });
      const b = makeLocation({
        id: "b",
        name: "  shenzhen ",
        admin1: "guangdong ",
        country: "CHINA",
      });

      expect(dedupeLocations([a, b])).toHaveLength(1);
    });

    it("同名但省份不同视为不同地点", () => {
      const guangdong = makeLocation({ id: "gd", admin1: "Guangdong" });
      const guangxi = makeLocation({ id: "gx", admin1: "Guangxi" });

      expect(dedupeLocations([guangdong, guangxi])).toHaveLength(2);
    });

    it("缺失 admin1 与 country 时用空串参与比较，不会误判同名不同地", () => {
      const a = makeLocation({ id: "a", name: "Nowhere", admin1: undefined, country: undefined });
      const b = makeLocation({ id: "b", name: "Nowhere", admin1: undefined, country: undefined });
      const c = makeLocation({ id: "c", name: "Nowhere", admin1: "Somewhere", country: undefined });

      expect(dedupeLocations([a, b, c])).toHaveLength(2);
    });

    it("不改动入参数组", () => {
      const input = [
        makeLocation({ id: "a", name: "A", population: 1 }),
        makeLocation({ id: "b", name: "B", population: 2 }),
      ];
      const snapshot = input.map((item) => item.id);

      dedupeLocations(input);

      expect(input.map((item) => item.id)).toEqual(snapshot);
    });
  });
});
