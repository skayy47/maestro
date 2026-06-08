/**
 * agentHighlight — turn a completed agent envelope into a meaningful one-line
 * highlight drawn from its REAL output (not the `reasoning` status string).
 *
 * This is the function that decides what the user sees on each output card.
 * If it ever falls back to status text, the panel feels empty again — so it is
 * unit-tested against each agent's output shape.
 */

import type { AgentEnvelope } from "@/lib/agents/envelopes";

export function agentHighlight(envelope: AgentEnvelope): string {
  const out = (envelope.output ?? {}) as Record<string, any>;
  switch (envelope.agent) {
    case "research":
      return out.headline || out.market_overview || "Market intelligence ready";
    case "data": {
      if (Array.isArray(out.kpis) && out.kpis.length) {
        return `${out.kpis.length} KPIs · ${out.kpis[0].label}: ${out.kpis[0].value}`;
      }
      return out.insights?.[0] || out.findings?.[0] || "Analysis ready";
    }
    case "automation": {
      const steps = Array.isArray(out.steps) ? out.steps.length : 0;
      return out.objective
        ? `${out.objective}${steps ? ` · ${steps} steps` : ""}`
        : "Workflow designed";
    }
    default:
      return envelope.reasoning || "Complete";
  }
}
