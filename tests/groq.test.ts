import { describe, it, expect } from "vitest";
import { parseRetryAfterMs } from "@/lib/llm/groq";

/**
 * The retry/fallback strategy depends on telling short (per-minute) limits from
 * long (per-day) ones. This parses Groq's "try again in ..." hint.
 */
describe("parseRetryAfterMs", () => {
  it("parses seconds with decimals", () => {
    expect(parseRetryAfterMs("Please try again in 12.05s.")).toBeCloseTo(12050, -1);
  });

  it("parses milliseconds", () => {
    expect(parseRetryAfterMs("try again in 150ms")).toBe(150);
  });

  it("parses compound h/m/s (a long daily limit)", () => {
    const ms = parseRetryAfterMs("try again in 1h10m19.776s");
    // 1h + 10m + ~19.78s
    expect(ms).toBeGreaterThan(60 * 60 * 1000);
  });

  it("returns null when there is no hint", () => {
    expect(parseRetryAfterMs("some other error")).toBeNull();
  });

  it("distinguishes a short per-minute limit from a long per-day limit", () => {
    // A TPM limit clears in ~seconds; a TPD limit is minutes/hours away.
    const tpm = parseRetryAfterMs("try again in 12.05s")!;
    const tpd = parseRetryAfterMs("try again in 35m36.672s")!;
    expect(tpm).toBeLessThan(16000); // waitable
    expect(tpd).toBeGreaterThan(16000); // switch models instead
  });
});
