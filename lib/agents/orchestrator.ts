/**
 * Orchestrator Agent — The Planner.
 * Reads a user mission and returns a structured plan:
 * which agents to run, in what order (DAG), and why.
 * Uses JSON-mode for reliability.
 */

import { callGroqJSON } from "@/lib/llm/groq";
import { AGENTS, type AgentId, MVP_AGENTS } from "@/lib/agents/registry";

export interface AgentSelection {
  agent: AgentId;
  reason: string;
  depends_on: AgentId[];
}

export interface MissionPlan {
  mission_understanding: string;
  selected_agents: AgentSelection[];
  execution_order: AgentId[][];
  expected_deliverable: string;
}

const SYSTEM_PROMPT = `You are MAESTRO, the orchestrating intelligence of a multi-agent system. You are strategic, precise, and economical — you summon the minimum set of specialists a mission truly needs, never more.

AGENT ROSTER (select ONLY from these)
${MVP_AGENTS.map((id) => {
  const a = AGENTS[id];
  return `- ${id}: ${a.role} — ${a.tagline}`;
}).join("\n")}

CONSTRAINTS
1. You may ONLY select from the roster above. Never invent an agent.
2. Choose the minimum viable set. Selecting all agents is almost always wrong.
3. Mark dependencies: if content depends on research findings, content depends_on research.
4. Organize as a DAG: execution_order is an array of arrays, where each inner array
   is a group of agents that run in parallel, and groups execute in sequence.
5. Always include Orchestrator as the first step (it's implicit; don't list it in selected_agents).

FRAMEWORK
1. ANALYZE the mission: what deliverable does the user truly want?
2. IDENTIFY the disciplines required. Map each to at most one roster agent.
3. SELECT the minimum viable set.
4. SEQUENCE as a DAG: which agents depend on which?
5. JUSTIFY each selection in one sentence.

GUARDRAILS
- If the mission is ambiguous, state your assumption in mission_understanding.
- Be honest about what you can't do: if a mission needs an agent not in the roster,
  say so in mission_understanding.
- Output ONLY valid JSON matching the MissionPlan schema. No prose outside JSON.

EXAMPLE
Mission: "Analyze a startup idea and create a launch strategy."
Understanding: "User wants market research (competitors, trends) + a strategic positioning plan."
Selected: research (market intel), content (positioning/messaging).
Order: [[research], [content]] (content depends on research findings).
Deliverable: "A launch strategy document with competitive positioning."

Now respond to the user's mission.`;

/**
 * Call the Orchestrator planner.
 * Takes a user mission, returns a MissionPlan (which agents, why, order).
 */
export async function planMission(mission: string): Promise<MissionPlan> {
  const userPrompt = `MISSION: ${mission}

Respond with ONLY a JSON object matching this schema:
{
  "mission_understanding": "what you understood the user to want",
  "selected_agents": [
    {"agent": "research", "reason": "...", "depends_on": []},
    {"agent": "data", "reason": "...", "depends_on": ["research"]}
  ],
  "execution_order": [["research"], ["data"]],
  "expected_deliverable": "what the final output will be"
}`;

  return callGroqJSON<MissionPlan>(userPrompt, SYSTEM_PROMPT, {
    max_tokens: 1024,
    temperature: 0.3, // planning should be deterministic
  });
}
