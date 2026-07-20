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

  it("force-adds data when the mission explicitly asks to analyze it but the planner skipped it (the live fitness miss)", () => {
    const plan = base({
      selected_agents: [
        { agent: "research", reason: "market", depends_on: [] },
        { agent: "automation", reason: "workflow", depends_on: [] },
      ],
      execution_order: [["research"], ["automation"]],
    });
    const clean = sanitizePlan(plan, {
      mission:
        "Analyze the online fitness coaching market, break down the subscriber revenue trends, and design an onboarding automation.",
    });
    const agents = clean.selected_agents.map((s) => s.agent);
    expect(agents).toContain("data");
    // and it must be scheduled to actually run, not just listed
    expect(clean.execution_order.flat()).toContain("data");
  });

  it("force-adds data on an explicit FR data-analysis ask", () => {
    const plan = base({
      selected_agents: [{ agent: "research", reason: "marché", depends_on: [] }],
      execution_order: [["research"]],
    });
    const clean = sanitizePlan(plan, {
      mission: "Analyse les tendances de revenus et décompose la croissance des abonnés",
    });
    expect(clean.selected_agents.map((s) => s.agent)).toContain("data");
  });

  it("does NOT force data onto a pure market-research mission (no analysis ask)", () => {
    const plan = base({
      selected_agents: [{ agent: "research", reason: "landscape", depends_on: [] }],
      execution_order: [["research"]],
    });
    const clean = sanitizePlan(plan, {
      mission:
        "Research the competitive landscape for RAG-as-a-service startups targeting accounting firms in 2026",
    });
    expect(clean.selected_agents.map((s) => s.agent)).toEqual(["research"]);
  });

  it("does not duplicate data when the planner already selected it", () => {
    const plan = base({
      selected_agents: [{ agent: "data", reason: "analyze revenue", depends_on: [] }],
      execution_order: [["data"]],
    });
    const clean = sanitizePlan(plan, { mission: "Analyze my revenue data trends" });
    expect(clean.selected_agents.filter((s) => s.agent === "data")).toHaveLength(1);
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
