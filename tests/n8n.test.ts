import { describe, it, expect } from "vitest";
import { buildN8nWorkflow } from "@/lib/agents/n8n";
import type { AutomationOutput } from "@/lib/agents/envelopes";

/**
 * The downloadable artifact must be VALID, importable n8n JSON for any mission.
 * The LLM's raw workflow_json was broken (no connections, no trigger node,
 * invalid node types) — these tests guard the deterministic compiler.
 */
function sampleOutput(): AutomationOutput {
  return {
    objective: "Capture and qualify dealership leads",
    trigger: { type: "webhook", integration: "webhook", description: "New sales data update" },
    steps: [
      { id: "n1", node_type: "http", integration: "http", action: "Fetch sales data from EV API" },
      { id: "n2", node_type: "airtable", integration: "airtable", action: "Store sales data in Airtable" },
      { id: "n3", node_type: "gsheets", integration: "gsheets", action: "Analyze trends in Google Sheets" },
      { id: "n4", node_type: "conditional", integration: "conditional", action: "Check qualification criteria" },
      { id: "n5", node_type: "slack", integration: "slack", action: "Notify sales team" },
    ],
    connections: [],
    error_handling: [],
    human_checkpoints: [],
    integrations_required: [],
    workflow_json: {},
    confidence: 0.8,
    caveats: [],
  };
}

describe("buildN8nWorkflow", () => {
  it("includes a trigger node FIRST, then every step (steps + 1 nodes)", () => {
    const wf = buildN8nWorkflow(sampleOutput());
    expect(wf.nodes).toHaveLength(6); // trigger + 5 steps
    expect(wf.nodes[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("maps catalog integrations to REAL n8n node types", () => {
    const wf = buildN8nWorkflow(sampleOutput());
    const types = wf.nodes.map((n) => n.type);
    expect(types).toContain("n8n-nodes-base.httpRequest"); // not .http
    expect(types).toContain("n8n-nodes-base.googleSheets"); // not .gsheets
    expect(types).toContain("n8n-nodes-base.if"); // not .conditional
    expect(types).toContain("n8n-nodes-base.airtable");
    expect(types).toContain("n8n-nodes-base.slack");
  });

  it("wires connections linearly so the workflow is not a pile of orphans", () => {
    const wf = buildN8nWorkflow(sampleOutput());
    // n-1 connection entries for n nodes
    expect(Object.keys(wf.connections)).toHaveLength(wf.nodes.length - 1);
    // first node connects to the second
    const firstName = wf.nodes[0].name;
    expect(wf.connections[firstName].main[0][0].node).toBe(wf.nodes[1].name);
  });

  it("gives every node a unique name (n8n keys connections by name)", () => {
    const dup = sampleOutput();
    dup.steps = [
      { id: "a", node_type: "http", integration: "http", action: "Sync" },
      { id: "b", node_type: "http", integration: "http", action: "Sync" },
    ];
    const wf = buildN8nWorkflow(dup);
    const names = wf.nodes.map((n) => n.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("unknown integrations degrade to noOp, never undefined", () => {
    const weird = sampleOutput();
    weird.steps = [{ id: "x", node_type: "quantum", integration: "quantum", action: "Teleport" }];
    const wf = buildN8nWorkflow(weird);
    expect(wf.nodes[1].type).toBe("n8n-nodes-base.noOp");
  });
});
