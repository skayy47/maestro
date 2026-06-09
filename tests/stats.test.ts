import { describe, it, expect } from "vitest";
import { mean, median, std, trendOf, bucket } from "@/lib/agents/stats";

describe("stats", () => {
  it("mean / median / std", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(std([2, 4, 6], 4)).toBeCloseTo(1.633, 2);
  });

  it("empty inputs are safe", () => {
    expect(mean([])).toBe(0);
    expect(median([])).toBe(0);
    expect(std([])).toBe(0);
  });

  it("trendOf classifies direction", () => {
    expect(trendOf([1, 2, 3, 4, 5, 6])).toBe("increasing");
    expect(trendOf([6, 5, 4, 3, 2, 1])).toBe("decreasing");
    expect(trendOf([5, 5, 5, 5, 5, 5])).toBe("stable");
  });

  it("bucket down-samples long series, passes short ones through", () => {
    expect(bucket([1, 2, 3], 12)).toEqual([1, 2, 3]);
    expect(bucket(Array.from({ length: 120 }, (_, i) => i), 12)).toHaveLength(12);
  });
});
