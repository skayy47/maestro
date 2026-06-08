import { describe, it, expect } from "vitest";
import { agentHighlight } from "@/lib/agents/highlight";
import type { AgentEnvelope } from "@/lib/agents/envelopes";

/**
 * agentHighlight must always surface REAL output, never the status string.
 * This is what keeps the outputs panel from feeling empty.
 */
function env(agent: string, output: any, reasoning = "status..."): AgentEnvelope {
  return {
    agent,
    status: "complete",
    reasoning,
    output,
    artifacts: [],
    sources: [],
    confidence: 0.8,
    caveats: [],
    timing_ms: 100,
  };
}

describe("agentHighlight", () => {
  it("research → the headline (not the reasoning trace)", () => {
    const h = agentHighlight(
      env("research", { headline: "MENA fintech to hit $11B by 2031" })
    );
    expect(h).toBe("MENA fintech to hit $11B by 2031");
  });

  it("data → KPI count + first KPI", () => {
    const h = agentHighlight(
      env("data", {
        kpis: [
          { label: "Avg Revenue", value: "45000", trend: "up" },
          { label: "Units", value: "1250", trend: "flat" },
        ],
      })
    );
    expect(h).toBe("2 KPIs · Avg Revenue: 45000");
  });

  it("automation → objective + step count", () => {
    const h = agentHighlight(
      env("automation", {
        objective: "Lead capture",
        steps: [{}, {}, {}, {}, {}],
      })
    );
    expect(h).toBe("Lead capture · 5 steps");
  });

  it("never returns the raw reasoning status for known agents", () => {
    const h = agentHighlight(env("research", { market_overview: "Growing fast." }));
    expect(h).not.toContain("status...");
    expect(h).toBe("Growing fast.");
  });

  it("degrades gracefully when output is empty", () => {
    expect(agentHighlight(env("research", {}))).toBe("Market intelligence ready");
    expect(agentHighlight(env("data", {}))).toBe("Analysis ready");
    expect(agentHighlight(env("automation", {}))).toBe("Workflow designed");
  });

  it("unknown agent falls back to reasoning", () => {
    expect(agentHighlight(env("mystery", {}, "did a thing"))).toBe("did a thing");
  });
});
