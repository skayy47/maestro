import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentEnvelope } from "@/lib/agents/envelopes";

vi.mock("@/lib/llm/groq", () => ({
  callGroqJSON: vi.fn(),
}));

import { callGroqJSON } from "@/lib/llm/groq";
import { synthesize, digestEnvelopes } from "@/lib/agents/synthesizer";

function env(
  agent: string,
  output: any,
  status: AgentEnvelope["status"] = "complete",
  confidence = 0.8
): AgentEnvelope {
  return {
    agent,
    status,
    reasoning: "",
    output,
    artifacts: [],
    sources: [],
    confidence,
    caveats: [],
    timing_ms: 100,
  };
}

describe("failed envelopes never masquerade as findings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("digestEnvelopes skips failed agents entirely", () => {
    const digest = digestEnvelopes([
      env("research", { headline: "Research failed" }, "failed", 0),
      env("automation", { objective: "Capture leads" }),
    ]);
    expect(digest).not.toContain("Research failed");
    expect(digest).not.toContain("RESEARCH");
    expect(digest).toContain("Capture leads");
  });

  it("all agents failed → honest zero-briefing without calling the LLM", async () => {
    const result = await synthesize("mission", [
      env("research", { headline: "Research failed" }, "failed", 0),
    ]);
    expect(callGroqJSON).not.toHaveBeenCalled();
    expect(result.confidence).toBe(0);
    expect(result.executive_summary).toContain("research");
    expect(result.executive_summary).toMatch(/failed/i);
    expect(result.next_steps.length).toBeGreaterThanOrEqual(2);
  });

  it("partial failure → LLM is told which agents failed, digest holds survivors only", async () => {
    (callGroqJSON as any).mockResolvedValue({
      executive_summary: "Briefing.",
      key_findings: ["a", "b"],
      the_deliverable: "Do X.",
      next_steps: ["1", "2"],
      confidence: 0.8,
    });
    await synthesize("mission", [
      env("research", { headline: "Research failed" }, "failed", 0),
      env("data", { insights: ["real insight"] }),
    ]);
    const prompt = (callGroqJSON as any).mock.calls[0][0] as string;
    expect(prompt).toContain("FAILED");
    expect(prompt).toContain("research");
    expect(prompt).toContain("real insight");
    expect(prompt).not.toContain("Research failed");
  });

  it("missing LLM confidence is clamped to a real number", async () => {
    (callGroqJSON as any).mockResolvedValue({
      executive_summary: "Briefing.",
      key_findings: ["a", "b"],
      the_deliverable: "Do X.",
      next_steps: ["1", "2"],
      // confidence intentionally omitted
    });
    const result = await synthesize("mission", [env("data", { insights: ["i"] })]);
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThan(0);
  });
});
