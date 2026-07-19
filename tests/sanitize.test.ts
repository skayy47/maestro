import { describe, it, expect } from "vitest";
import {
  clampConfidence,
  asStringArray,
  DEFAULT_CONFIDENCE,
  MIN_COMPLETE_CONFIDENCE,
} from "@/lib/agents/sanitize";

describe("clampConfidence", () => {
  it("passes through a normal confidence", () => {
    expect(clampConfidence(0.8)).toBe(0.8);
  });

  it("defaults when the model omitted it (the observed live bug)", () => {
    expect(clampConfidence(undefined)).toBe(DEFAULT_CONFIDENCE);
    expect(clampConfidence(null)).toBe(DEFAULT_CONFIDENCE);
    expect(clampConfidence("high")).toBe(DEFAULT_CONFIDENCE);
    expect(clampConfidence(NaN)).toBe(DEFAULT_CONFIDENCE);
  });

  it("floors zero — a completed deliverable is never 0% confidence", () => {
    expect(clampConfidence(0)).toBe(MIN_COMPLETE_CONFIDENCE);
    expect(clampConfidence(-1)).toBe(MIN_COMPLETE_CONFIDENCE);
  });

  it("normalizes percentage-style values and caps at 0.99", () => {
    expect(clampConfidence(85)).toBe(0.85);
    expect(clampConfidence(1)).toBe(0.99);
    expect(clampConfidence(300)).toBe(0.99);
  });

  it("accepts numeric strings", () => {
    expect(clampConfidence("0.7")).toBe(0.7);
  });
});

describe("asStringArray", () => {
  it("keeps clean strings, drops junk", () => {
    expect(asStringArray(["a", "", "  ", 42, null, " b "])).toEqual(["a", "b"]);
  });

  it("returns [] for non-arrays", () => {
    expect(asStringArray(undefined)).toEqual([]);
    expect(asStringArray("caveat")).toEqual([]);
  });
});
