/**
 * Synthesizer — the Orchestrator's final movement.
 *
 * Takes every agent envelope produced during the mission and composes a single,
 * coherent executive briefing that actually ANSWERS the mission. This is the
 * deliverable the user came for — not a status line, but a real briefing.
 */

import { callGroqJSON } from "@/lib/llm/groq";
import type { AgentEnvelope, SynthesisOutput } from "@/lib/agents/envelopes";

const SYSTEM_PROMPT = `You are MAESTRO, the Orchestrator, in your final synthesis movement.

Several specialist agents have each produced a structured contribution to a mission. Your job is to weave their outputs into ONE coherent, decision-ready executive briefing that directly answers the mission. You are the conductor resolving the symphony into a single chord.

PRINCIPLES
- Synthesize, do not merely concatenate. Connect findings across agents into one narrative.
- Be concrete and useful. A reader should be able to act on this immediately.
- Ground every claim in what the agents actually produced. Do not invent facts.
- Lead with the answer. The executive_summary must state the bottom line in 2-3 sentences.
- "the_deliverable" is the heart: the actual recommendation / plan / answer, 3-5 sentences, specific.

Output ONLY a valid JSON object matching this schema:
{
  "executive_summary": "2-3 sentence bottom line that answers the mission",
  "key_findings": ["the 3-5 most important takeaways across all agents"],
  "the_deliverable": "the actual recommendation/plan/answer, specific and actionable, 3-5 sentences",
  "next_steps": ["concrete next action 1", "concrete next action 2"],
  "confidence": 0.0
}`;

/**
 * Build a compact, token-efficient digest of each agent's output so the
 * synthesizer reasons over substance, not raw JSON noise.
 */
function digestEnvelopes(envelopes: AgentEnvelope[]): string {
  return envelopes
    .map((e) => {
      const out = (e.output ?? {}) as Record<string, unknown>;
      const parts: string[] = [`### ${e.agent.toUpperCase()} (confidence ${e.confidence ?? "n/a"})`];

      // Pull the human-meaningful fields per agent, defensively.
      if (out.headline) parts.push(`Headline: ${out.headline}`);
      if (out.market_overview) parts.push(`Overview: ${out.market_overview}`);
      if (Array.isArray(out.trends) && out.trends.length) parts.push(`Trends: ${out.trends.join("; ")}`);
      if (Array.isArray(out.opportunities) && out.opportunities.length) parts.push(`Opportunities: ${out.opportunities.join("; ")}`);
      if (Array.isArray(out.kpis) && out.kpis.length) {
        parts.push(`KPIs: ${(out.kpis as any[]).map((k) => `${k.label}=${k.value} (${k.trend})`).join("; ")}`);
      }
      if (Array.isArray(out.insights) && out.insights.length) parts.push(`Insights: ${out.insights.join("; ")}`);
      if (Array.isArray(out.recommendations) && out.recommendations.length) parts.push(`Recommendations: ${out.recommendations.join("; ")}`);
      if (out.objective) parts.push(`Automation objective: ${out.objective}`);
      if (Array.isArray(out.steps) && out.steps.length) {
        parts.push(`Workflow steps: ${(out.steps as any[]).map((s) => s.action || s.node_type).join(" → ")}`);
      }
      if (Array.isArray(out.integrations_required) && out.integrations_required.length) {
        parts.push(`Integrations: ${(out.integrations_required as string[]).join(", ")}`);
      }
      return parts.join("\n");
    })
    .join("\n\n");
}

export async function synthesize(
  mission: string,
  envelopes: AgentEnvelope[]
): Promise<SynthesisOutput> {
  // No agents ran — nothing to synthesize.
  if (!envelopes.length) {
    return {
      executive_summary: "No agents produced output for this mission.",
      key_findings: [],
      the_deliverable: "The orchestration completed without agent contributions.",
      next_steps: ["Refine the mission and try again."],
      confidence: 0,
    };
  }

  const digest = digestEnvelopes(envelopes);
  const userPrompt = `MISSION: "${mission}"

AGENT CONTRIBUTIONS:
${digest}

Compose the final executive briefing that answers the mission.`;

  try {
    return await callGroqJSON<SynthesisOutput>(userPrompt, SYSTEM_PROMPT, {
      max_tokens: 1024,
      temperature: 0.4,
    });
  } catch (error) {
    console.error("[Synthesizer] Error, falling back to digest summary:", error);
    // Graceful fallback — still useful, built from real agent data.
    const avgConfidence =
      envelopes.reduce((sum, e) => sum + (e.confidence || 0), 0) /
      Math.max(envelopes.length, 1);
    return {
      executive_summary: `${envelopes.length} specialist agent${envelopes.length > 1 ? "s" : ""} contributed to: "${mission}". See each agent's deliverable for detail.`,
      key_findings: envelopes
        .map((e) => {
          const out = (e.output ?? {}) as Record<string, unknown>;
          return (out.headline as string) || (out.objective as string) || `${e.agent} completed`;
        })
        .filter(Boolean),
      the_deliverable:
        "The agents have each produced a structured deliverable. Open each card to review the full output and any downloadable artifacts.",
      next_steps: ["Review each agent deliverable", "Export the automation workflow if applicable"],
      confidence: Number(avgConfidence.toFixed(2)),
    };
  }
}
