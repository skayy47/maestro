import { describe, it, expect } from "vitest";
import { buildSearchDigest } from "@/lib/agents/research";

const result = (i: number, contentLen = 5000) => ({
  title: `Result ${i}`,
  url: `https://example.com/${i}`,
  content: "x".repeat(contentLen),
});

describe("buildSearchDigest", () => {
  it("bounds the prompt: caps results and truncates content", () => {
    const tavily = {
      answer: "a".repeat(2000),
      results: Array.from({ length: 8 }, (_, i) => result(i)),
    };
    const digest = buildSearchDigest(tavily as any);
    // 6 results max, 700 chars each + 600-char answer + titles/urls ≈ well
    // under the 8B fallback model's 6K-token/minute budget. The raw JSON of
    // this fixture is ~42K chars — the digest must be a fraction of that.
    expect(digest.length).toBeLessThan(6500);
    expect(digest).toContain("Result 5");
    expect(digest).not.toContain("Result 6"); // capped at 6
  });

  it("keeps real URLs so the model grounds on them", () => {
    const digest = buildSearchDigest({
      answer: "",
      results: [result(1, 50)],
    } as any);
    expect(digest).toContain("https://example.com/1");
  });

  it("collapses whitespace noise in page content", () => {
    const digest = buildSearchDigest({
      answer: "",
      results: [{ title: "T", url: "https://e.com", content: "a\n\n\t  b" }],
    } as any);
    expect(digest).toContain("a b");
  });
});
