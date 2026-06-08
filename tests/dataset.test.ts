import { describe, it, expect } from "vitest";
import { generateSyntheticDataset } from "@/lib/agents/dataset";

/**
 * The dataset must be deterministic per mission but DIFFERENT across missions
 * (the old mock returned identical 45000 for everything — the fake-data tell).
 */
describe("generateSyntheticDataset", () => {
  it("is deterministic: same mission → identical numbers", () => {
    const a = generateSyntheticDataset("EV market analysis");
    const b = generateSyntheticDataset("EV market analysis");
    expect(a.summary_stats.revenue.mean).toBe(b.summary_stats.revenue.mean);
    expect(a.rows).toBe(b.rows);
  });

  it("differs across missions (not a fixed mock)", () => {
    const ev = generateSyntheticDataset("electric vehicle market");
    const fin = generateSyntheticDataset("MENA fintech market");
    const coffee = generateSyntheticDataset("coffee shop chain sales");
    const means = [ev, fin, coffee].map((d) => d.summary_stats.revenue.mean);
    expect(new Set(means).size).toBe(3); // all three different
  });

  it("computes coherent stats: min ≤ median ≤ max, std ≥ 0", () => {
    const d = generateSyntheticDataset("any mission");
    const r = d.summary_stats.revenue;
    expect(r.min).toBeLessThanOrEqual(r.median);
    expect(r.median).toBeLessThanOrEqual(r.max);
    expect(r.std).toBeGreaterThanOrEqual(0);
  });

  it("carries an honest illustrative-sample label", () => {
    const d = generateSyntheticDataset("x");
    expect(d.note.toLowerCase()).toContain("sample");
    expect(d.rows).toBeGreaterThan(0);
  });
});
