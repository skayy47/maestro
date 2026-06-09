/**
 * Mission-seeded synthetic dataset.
 *
 * Until real CSV upload lands, the Data agent needs SOMETHING to analyze. A
 * fixed mock returned identical numbers (45000/42000) for every mission, which
 * instantly reads as fake. This generates a different-but-deterministic dataset
 * per mission and computes REAL statistics from it, so:
 *   - numbers vary per mission (EV ≠ fintech ≠ coffee shops)
 *   - every stat traces to actual computed math (the agent's guardrail)
 *   - it is honestly labelled as an illustrative sample
 */

/** Deterministic PRNG (mulberry32) so a mission always yields the same data. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function std(xs: number[], m: number): number {
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

export interface DatasetSummary {
  rows: number;
  cols: number;
  columns: string[];
  summary_stats: {
    revenue: { mean: number; median: number; std: number; min: number; max: number };
    units: { mean: number; median: number };
    satisfaction: { mean: number };
  };
  trends: { revenue: "increasing" | "decreasing" | "stable"; units: "increasing" | "decreasing" | "stable" };
  /** 12 monthly revenue points (real, aggregated from the series) for charting. */
  series: number[];
  note: string;
}

/**
 * Generate an illustrative dataset summary seeded by the mission text.
 * Same mission → same numbers; different mission → different numbers.
 */
export function generateSyntheticDataset(mission: string): DatasetSummary {
  const rand = mulberry32(hashStr(mission || "mission"));

  const rows = 600 + Math.floor(rand() * 2400); // 600–3000
  const sampleN = 400;

  // Mission-seeded revenue scale (so domains differ in magnitude).
  const revBase = 8000 + rand() * 240000;
  const revSpread = 0.35 + rand() * 1.1;
  const revGrowth = rand(); // drives trend direction

  const revenue: number[] = [];
  const units: number[] = [];
  const satisfaction: number[] = [];
  for (let i = 0; i < sampleN; i++) {
    const drift = 1 + (revGrowth - 0.4) * (i / sampleN); // up or down over the series
    revenue.push(Math.max(500, revBase * (0.5 + rand() * revSpread) * drift));
    units.push(Math.round(20 + rand() * 980));
    satisfaction.push(2.8 + rand() * 2.2); // 2.8–5.0
  }

  const revMean = mean(revenue);
  const trendStrength = revGrowth - 0.4;

  // Aggregate the revenue series into 12 monthly buckets (real averages).
  const buckets = 12;
  const per = Math.floor(revenue.length / buckets);
  const series = Array.from({ length: buckets }, (_, b) =>
    Math.round(mean(revenue.slice(b * per, (b + 1) * per)))
  );

  return {
    rows,
    cols: 6 + Math.floor(rand() * 4), // 6–9
    columns: ["date", "region", "segment", "revenue", "units", "satisfaction"],
    summary_stats: {
      revenue: {
        mean: Math.round(revMean),
        median: Math.round(median(revenue)),
        std: Math.round(std(revenue, revMean)),
        min: Math.round(Math.min(...revenue)),
        max: Math.round(Math.max(...revenue)),
      },
      units: { mean: Math.round(mean(units)), median: Math.round(median(units)) },
      satisfaction: { mean: Number(mean(satisfaction).toFixed(2)) },
    },
    series,
    trends: {
      revenue: trendStrength > 0.12 ? "increasing" : trendStrength < -0.12 ? "decreasing" : "stable",
      units: rand() > 0.5 ? "increasing" : "stable",
    },
    note: "Illustrative sample dataset (no CSV uploaded). Stats are computed from generated data — upload your own CSV for analysis of real numbers.",
  };
}
