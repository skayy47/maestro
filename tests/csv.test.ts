import { describe, it, expect } from "vitest";
import { parseCsvText, toNumber, analyzeCsv } from "@/lib/agents/csv";

describe("parseCsvText", () => {
  it("parses a simple grid", () => {
    const rows = parseCsvText("a,b,c\n1,2,3\n4,5,6");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("respects quoted fields containing commas and escaped quotes", () => {
    const rows = parseCsvText('name,note\n"Doe, John","say ""hi"""');
    expect(rows[1]).toEqual(["Doe, John", 'say "hi"']);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCsvText("x,y\r\n1,2\r\n");
    expect(rows).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });
});

describe("toNumber", () => {
  it("strips currency, commas, and percent", () => {
    expect(toNumber("$1,250.50")).toBe(1250.5);
    expect(toNumber("42%")).toBe(42);
  });
  it("returns null for non-numeric", () => {
    expect(toNumber("hello")).toBeNull();
    expect(toNumber("")).toBeNull();
  });
});

describe("analyzeCsv", () => {
  const csv = [
    "month,region,revenue,units",
    "Jan,EU,1000,50",
    "Feb,EU,1500,60",
    "Mar,US,2000,70",
    "Apr,US,2500,80",
  ].join("\n");

  it("detects numeric vs categorical columns", () => {
    const a = analyzeCsv(csv);
    expect(a.rows).toBe(4);
    expect(a.cols).toBe(4);
    const numericNames = a.numeric_columns.map((c) => c.name).sort();
    expect(numericNames).toEqual(["revenue", "units"]);
    const catNames = a.categorical_columns.map((c) => c.name).sort();
    expect(catNames).toEqual(["month", "region"]);
  });

  it("computes real stats on a numeric column", () => {
    const a = analyzeCsv(csv);
    const rev = a.numeric_columns.find((c) => c.name === "revenue")!;
    expect(rev.mean).toBe(1750); // (1000+1500+2000+2500)/4
    expect(rev.min).toBe(1000);
    expect(rev.max).toBe(2500);
    expect(rev.trend).toBe("increasing");
  });

  it("builds a chartable series and marks the data as uploaded", () => {
    const a = analyzeCsv(csv);
    expect(a.series).not.toBeNull();
    expect(a.series!.points.length).toBeGreaterThan(0);
    expect(a.data_source).toBe("uploaded");
    expect(a.note.toLowerCase()).toContain("uploaded");
  });

  it("throws on a header-only or empty file", () => {
    expect(() => analyzeCsv("only,header")).toThrow();
    expect(() => analyzeCsv("")).toThrow();
  });
});
