import type { SatisfactionStats } from "./types.ts";

/** Percentil com interpolação linear (método "type 7", o mesmo do Excel PERCENTIL.INC). */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function satisfactionStats(values: number[]): SatisfactionStats {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const eps = 1e-9;
  return {
    count: n,
    min: n ? s[0] : 0,
    p10: percentile(s, 0.1),
    p25: percentile(s, 0.25),
    median: percentile(s, 0.5),
    avg: n ? s.reduce((a, b) => a + b, 0) / n : 0,
    p75: percentile(s, 0.75),
    p90: percentile(s, 0.9),
    below25: s.filter((v) => v < 0.25 - eps).length,
    below50: s.filter((v) => v < 0.5 - eps).length,
    above80: s.filter((v) => v > 0.8 + eps).length,
    full: s.filter((v) => v >= 1 - eps).length,
    zero: s.filter((v) => v <= eps).length,
  };
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - m) * (b - m), 0) / values.length);
}
