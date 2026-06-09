/**
 * Shared statistics helpers — used by both the synthetic dataset generator and
 * the real CSV analyzer, so "computed from a stat" means the same thing
 * everywhere and is unit-tested in one place.
 */

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function std(xs: number[], m: number = mean(xs)): number {
  return xs.length ? Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) : 0;
}

export type Trend = "increasing" | "decreasing" | "stable";

/** Classify a series' direction by comparing its first third to its last third. */
export function trendOf(series: number[]): Trend {
  if (series.length < 2) return "stable";
  const third = Math.max(1, Math.floor(series.length / 3));
  const first = mean(series.slice(0, third));
  const last = mean(series.slice(-third));
  const delta = first ? (last - first) / Math.abs(first) : 0;
  return delta > 0.05 ? "increasing" : delta < -0.05 ? "decreasing" : "stable";
}

/** Down-sample a long series into `n` averaged buckets (for charting). */
export function bucket(points: number[], n = 12): number[] {
  if (points.length <= n) return points;
  const per = Math.floor(points.length / n);
  return Array.from({ length: n }, (_, b) =>
    Math.round(mean(points.slice(b * per, (b + 1) * per)))
  );
}
