import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentEnvelope } from "@/lib/agents/envelopes";

// Mock the LLM client so synthesis logic is tested without network/keys.
vi.mock("@/lib/llm/groq", () => ({
  callGroqJSON: vi.fn(),
}));

import { callGroqJSON } from "@/lib/llm/groq";
import { synthesize, digestEnvelopes } from "@/lib/agents/synthesizer";

function env(agent: string, output: any, confidence = 0.8): AgentEnvelope {
  return {
    agent,
    status: "complete",
    reasoning: "",
    output,
    artifacts: [],
    sources: [],
    confidence,
    caveats: [],
    timing_ms: 100,
  };
}

describe("digestEnvelopes", () => {
  it("includes each agent's name and key human-meaningful fields", () => {
    const digest = digestEnvelopes([
      env("research", { headline: "Big market", trends: ["AI", "mobile"] }),
      env("automation", { objective: "Capture leads", integrations_required: ["email"] }),
    ]);
    expect(digest).toContain("RESEARCH");
    expect(digest).toContain("Big market");
    expect(digest).toContain("AI; mobile");
    expect(digest).toContain("AUTOMATION");
    expect(digest).toContain("Capture leads");
  });
});

describe("synthesize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a no-agents result without calling the LLM when given nothing", async () => {
    const result = await synthesize("do something", []);
    expect(callGroqJSON).not.toHaveBeenCalled();
    expect(result.confidence).toBe(0);
    expect(result.executive_summary).toMatch(/no agents/i);
  });

  it("returns the LLM briefing on success", async () => {
    (callGroqJSON as any).mockResolvedValue({
      executive_summary: "All good.",
      key_findings: ["a", "b"],
      the_deliverable: "Do X.",
      next_steps: ["step 1"],
      confidence: 0.9,
    });
    const result = await synthesize("mission", [env("research", { headline: "H" })]);
    expect(result.executive_summary).toBe("All good.");
    expect(result.key_findings).toHaveLength(2);
  });

  it("falls back to a digest summary when the LLM throws", async () => {
    (callGroqJSON as any).mockRejectedValue(new Error("groq down"));
    const result = await synthesize("mission", [
      env("research", { headline: "Market headline" }, 0.8),
      env("automation", { objective: "Automate" }, 0.6),
    ]);
    // Fallback is still useful and built from real agent data.
    expect(result.executive_summary).toContain("2 specialist agents");
    expect(result.key_findings).toContain("Market headline");
    expect(result.confidence).toBeCloseTo(0.7, 1);
  });
});
