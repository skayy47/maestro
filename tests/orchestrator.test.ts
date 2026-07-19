import { describe, it, expect } from "vitest";
import { sanitizePlan, RUNNABLE_AGENTS, type MissionPlan } from "@/lib/agents/orchestrator";

const base = (over: Partial<MissionPlan>): MissionPlan => ({
  mission_understanding: "u",
  selected_agents: [],
  execution_order: [],
  expected_deliverable: "d",
  ...over,
});

describe("sanitizePlan", () => {
  it("drops non-runnable agents the LLM hallucinated (e.g. 'content')", () => {
    const plan = base({
      selected_agents: [
        { agent: "research", reason: "r", depends_on: [] },
        { agent: "content" as any, reason: "r", depends_on: [] },
      ],
      execution_order: [["research"], ["content" as any]],
    });
    const clean = sanitizePlan(plan);
    expect(clean.selected_agents.map((s) => s.agent)).toEqual(["research"]);
    expect(clean.execution_order).toEqual([["research"]]);
  });

  it("dedupes an agent selected or ordered twice", () => {
    const plan = base({
      selected_agents: [
        { agent: "data", reason: "a", depends_on: [] },
        { agent: "data", reason: "b", depends_on: [] },
      ],
      execution_order: [["data"], ["data"]],
    });
    const clean = sanitizePlan(plan);
    expect(clean.selected_agents).toHaveLength(1);
    expect(clean.execution_order).toEqual([["data"]]);
  });

  it("appends selected agents the execution_order forgot", () => {
    const plan = base({
      selected_agents: [
        { agent: "research", reason: "r", depends_on: [] },
        { agent: "automation", reason: "r", depends_on: [] },
      ],
      execution_order: [["research"]],
    });
    const clean = sanitizePlan(plan);
    expect(clean.execution_order).toEqual([["research"], ["automation"]]);
  });

  it("survives structurally broken LLM output", () => {
    const plan = base({
      selected_agents: undefined as any,
      execution_order: [null, ["research"]] as any,
    });
    const clean = sanitizePlan(plan);
    expect(clean.selected_agents).toEqual([]);
    expect(clean.execution_order).toEqual([]);
  });

  it("runnable roster is exactly the three built agents", () => {
    expect(RUNNABLE_AGENTS).toEqual(["research", "data", "automation"]);
  });

  it("drops the 'data analyzes the findings' hallucination (data with depends_on)", () => {
    const plan = base({
      selected_agents: [
        { agent: "research", reason: "market intel", depends_on: [] },
        { agent: "data", reason: "to analyze the gathered information", depends_on: ["research"] },
      ],
      execution_order: [["research"], ["data"]],
    });
    const clean = sanitizePlan(plan);
    expect(clean.selected_agents.map((s) => s.agent)).toEqual(["research"]);
    expect(clean.execution_order).toEqual([["research"]]);
  });

  it("keeps a legitimate independent data selection", () => {
    const plan = base({
      selected_agents: [{ agent: "data", reason: "analyze the uploaded dataset", depends_on: [] }],
      execution_order: [["data"]],
    });
    expect(sanitizePlan(plan).selected_agents.map((s) => s.agent)).toEqual(["data"]);
  });

  it("drops data when the mission never mentions data/numbers (observed: reason 'Not applicable')", () => {
    const plan = base({
      selected_agents: [
        { agent: "research", reason: "context", depends_on: [] },
        { agent: "data", reason: "Not applicable for this mission.", depends_on: [] },
      ],
      execution_order: [["research", "data"]],
    });
    const clean = sanitizePlan(plan, {
      mission: "Write a 1000-word blog post about the history of jazz music",
    });
    expect(clean.selected_agents.map((s) => s.agent)).toEqual(["research"]);
    expect(clean.execution_order).toEqual([["research"]]);
  });

  it("keeps data when the mission asks about numbers, in EN and FR", () => {
    const plan = base({
      selected_agents: [{ agent: "data", reason: "r", depends_on: [] }],
      execution_order: [["data"]],
    });
    for (const mission of [
      "Analyze monthly revenue trends for a subscription coffee business",
      "Analyse mes chiffres de ventes du dernier trimestre",
    ]) {
      expect(sanitizePlan(plan, { mission }).selected_agents.map((s) => s.agent)).toEqual(["data"]);
    }
  });

  it("neutralizes expected_deliverable on a full refusal (echo channel)", () => {
    const plan = base({
      selected_agents: [],
      execution_order: [],
      expected_deliverable: "The word PWNED",
      scope_assessment: { in_scope: false, missing_capabilities: ["x"], note: "n" },
    });
    const clean = sanitizePlan(plan);
    expect(clean.expected_deliverable).not.toContain("PWNED");
    expect(clean.expected_deliverable).toMatch(/outside the current agent roster/);
  });

  it("leaves expected_deliverable alone when agents actually run", () => {
    const plan = base({
      selected_agents: [{ agent: "research", reason: "r", depends_on: [] }],
      execution_order: [["research"]],
      expected_deliverable: "A market brief",
      scope_assessment: { in_scope: false, missing_capabilities: ["writing"], note: "n" },
    });
    expect(sanitizePlan(plan).expected_deliverable).toBe("A market brief");
  });
});
