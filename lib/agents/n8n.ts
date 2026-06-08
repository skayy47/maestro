/**
 * Deterministic n8n workflow compiler.
 *
 * The LLM is good at DESIGNING a workflow (steps, integrations, order) but bad
 * at emitting valid n8n JSON — it invents node type names, omits the trigger,
 * and never wires `connections`. So we never trust its `workflow_json`. Instead
 * we compile the structured `trigger` + `steps` into guaranteed-valid,
 * importable n8n JSON here.
 *
 * This is what makes the downloadable artifact real: it imports cleanly into
 * n8n for ANY mission.
 */

import type { AutomationOutput } from "@/lib/agents/envelopes";

/** Map our catalog integrations → real n8n node type identifiers. */
const N8N_TYPE: Record<string, string> = {
  webhook: "n8n-nodes-base.webhook",
  http: "n8n-nodes-base.httpRequest",
  email: "n8n-nodes-base.emailSend",
  slack: "n8n-nodes-base.slack",
  airtable: "n8n-nodes-base.airtable",
  gsheets: "n8n-nodes-base.googleSheets",
  gsheetssheet: "n8n-nodes-base.googleSheets",
  googlesheets: "n8n-nodes-base.googleSheets",
  delay: "n8n-nodes-base.wait",
  conditional: "n8n-nodes-base.if",
  if: "n8n-nodes-base.if",
  merge: "n8n-nodes-base.merge",
  notification: "n8n-nodes-base.noOp",
  noop: "n8n-nodes-base.noOp",
};

const FALLBACK_TYPE = "n8n-nodes-base.noOp";

function n8nType(integration: string | undefined): string {
  if (!integration) return FALLBACK_TYPE;
  const key = integration.toLowerCase().replace(/[^a-z]/g, "");
  return N8N_TYPE[key] ?? FALLBACK_TYPE;
}

interface N8nNode {
  parameters: Record<string, unknown>;
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, { main: Array<Array<{ node: string; type: "main"; index: number }>> }>;
  active: boolean;
  settings: Record<string, unknown>;
}

/** Make node names unique (n8n keys connections by node name). */
function uniqueName(base: string, used: Set<string>): string {
  let name = (base || "Step").trim().slice(0, 60) || "Step";
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let i = 2;
  while (used.has(`${name} ${i}`)) i++;
  const final = `${name} ${i}`;
  used.add(final);
  return final;
}

/**
 * Compile an AutomationOutput into valid, importable n8n workflow JSON.
 * Wires the trigger → steps linearly (matching the displayed flow).
 */
export function buildN8nWorkflow(output: AutomationOutput): N8nWorkflow {
  const used = new Set<string>();
  const nodes: N8nNode[] = [];
  const x0 = 240;
  const y = 300;
  const dx = 220;

  // 1) Trigger node (always present, always first)
  const triggerIntegration = output.trigger?.integration || "webhook";
  const triggerName = uniqueName(
    output.trigger?.description?.slice(0, 40) || "Trigger",
    used
  );
  nodes.push({
    parameters: {},
    id: "node-0",
    name: triggerName,
    type: n8nType(triggerIntegration),
    typeVersion: 1,
    position: [x0, y],
  });

  // 2) Step nodes in order
  const steps = Array.isArray(output.steps) ? output.steps : [];
  steps.forEach((step, i) => {
    const name = uniqueName(step.action || step.node_type || `Step ${i + 1}`, used);
    const params: Record<string, unknown> = {};
    if (step.config_notes) params.notes = step.config_notes;
    nodes.push({
      parameters: params,
      id: `node-${i + 1}`,
      name,
      type: n8nType(step.integration || step.node_type),
      typeVersion: 1,
      position: [x0 + (i + 1) * dx, y],
    });
  });

  // 3) Wire linearly: node[k] → node[k+1]
  const connections: N8nWorkflow["connections"] = {};
  for (let k = 0; k < nodes.length - 1; k++) {
    connections[nodes[k].name] = {
      main: [[{ node: nodes[k + 1].name, type: "main", index: 0 }]],
    };
  }

  return {
    name: `MAESTRO · ${(output.objective || "Automation").slice(0, 60)}`,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: "v1" },
  };
}
