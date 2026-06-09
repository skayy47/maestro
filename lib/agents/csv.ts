/**
 * CSV parsing + real analysis.
 *
 * When the user uploads a CSV, the Data agent must analyze THEIR real numbers,
 * not a synthetic sample. This parses the file (dependency-free, quote-aware)
 * and computes real per-column statistics + a chartable series. The resulting
 * summary is fed to the LLM so every KPI/insight traces to a real computed stat.
 */

import { mean, median, std, trendOf, bucket, type Trend } from "@/lib/agents/stats";

export interface NumericColumn {
  name: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  trend: Trend;
}

export interface CategoricalColumn {
  name: string;
  unique: number;
  examples: string[];
}

export interface CsvAnalysis {
  rows: number;
  cols: number;
  columns: string[];
  numeric_columns: NumericColumn[];
  categorical_columns: CategoricalColumn[];
  /** Primary numeric column rendered as a chart. */
  series: { column: string; points: number[] } | null;
  note: string;
  data_source: "uploaded";
}

/** Tokenize CSV text into rows of fields. Handles quotes, escaped quotes, CRLF. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse a numeric value, tolerating $, commas, %, and whitespace. */
export function toNumber(v: string | undefined): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/[$,%\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Analyze a CSV string into a structured, real summary.
 * Throws if the text has no usable header + data rows.
 */
export function analyzeCsv(text: string): CsvAnalysis {
  const parsed = parseCsvText(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (parsed.length < 2) {
    throw new Error("CSV needs a header row and at least one data row.");
  }

  const headers = parsed[0].map((h, i) => h.trim() || `col_${i + 1}`);
  const dataRows = parsed.slice(1);
  const cols = headers.length;

  const numeric_columns: NumericColumn[] = [];
  const categorical_columns: CategoricalColumn[] = [];

  for (let c = 0; c < cols; c++) {
    const raw = dataRows.map((r) => r[c]).filter((v) => v != null && v.trim() !== "");
    if (!raw.length) continue;

    const nums = raw.map(toNumber).filter((n): n is number => n !== null);
    const isNumeric = nums.length >= raw.length * 0.7 && nums.length >= 2;

    if (isNumeric) {
      const m = mean(nums);
      numeric_columns.push({
        name: headers[c],
        count: nums.length,
        mean: Math.round(m * 100) / 100,
        median: Math.round(median(nums) * 100) / 100,
        std: Math.round(std(nums, m) * 100) / 100,
        min: Math.min(...nums),
        max: Math.max(...nums),
        trend: trendOf(nums),
      });
    } else {
      const uniq = new Set(raw.map((v) => v.trim()));
      categorical_columns.push({
        name: headers[c],
        unique: uniq.size,
        examples: Array.from(uniq).slice(0, 4),
      });
    }
  }

  // Primary series = the numeric column with the most variation (most "interesting").
  let series: CsvAnalysis["series"] = null;
  if (numeric_columns.length) {
    const primary = [...numeric_columns].sort(
      (a, b) => b.std / (Math.abs(b.mean) || 1) - a.std / (Math.abs(a.mean) || 1)
    )[0];
    const colIdx = headers.indexOf(primary.name);
    const points = dataRows
      .map((r) => toNumber(r[colIdx]))
      .filter((n): n is number => n !== null);
    series = { column: primary.name, points: bucket(points, 24) };
  }

  return {
    rows: dataRows.length,
    cols,
    columns: headers,
    numeric_columns,
    categorical_columns,
    series,
    note: `Analysis of your uploaded CSV — ${dataRows.length} rows × ${cols} columns of real data.`,
    data_source: "uploaded",
  };
}
