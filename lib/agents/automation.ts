/**
 * Automation Agent — Workflow Architect
 * Designs runnable automations that emit n8n-importable workflow JSON.
 * Grounded by a fixed integration catalog (no hallucinations).
 */

import { callGroqJSON } from "@/lib/llm/groq";
import { buildN8nWorkflow } from "@/lib/agents/n8n";

export interface WorkflowNode {
  id: string;
  node_type: string;
  integration: string;
  action: string;
  inputs_from: string[];
  config_notes: string;
}

export interface AutomationOutput {
  objective: string;
  trigger: {
    type: string;
    integration: string;
    description: string;
  };
  steps: WorkflowNode[];
  connections: Array<{
    from: string;
    to: string;
    data_passed: string;
  }>;
  error_handling: string[];
  human_checkpoints: string[];
  integrations_required: string[];
  workflow_json: unknown;
  diagram: {
    nodes: Array<{ id: string; label: string; x: number; y: number }>;
    edges: Array<{ from: string; to: string }>;
  };
  confidence: number;
  caveats: string[];
}

export interface AgentEnvelope {
  agent: string;
  status: "pending" | "running" | "complete" | "failed";
  reasoning: string;
  output: AutomationOutput;
  artifacts: unknown[];
  sources: unknown[];
  confidence: number;
  caveats: string[];
  timing_ms: number;
}

const INTEGRATION_CATALOG = `
AVAILABLE INTEGRATIONS:
- webhook (HTTP trigger)
- http (HTTP request action)
- email (send email)
- slack (send to Slack)
- airtable (read/write)
- gsheetssheet (read/write Google Sheets)
- delay (pause execution)
- conditional (if/then branching)
- merge (combine data)
- notification (human approval gate)
`;

const SYSTEM_PROMPT = `You are the Automation Agent, a workflow architect. You design verifiable automations — every node must come from the real integration catalog.

FRAMEWORK
1. DECOMPOSE the objective into discrete steps: trigger, actions, branches.
2. MAP each step to a node type + integration from the catalog.
3. WIRE the data flow: specify what each node passes to the next.
4. HARDEN: add error branches + human approval checkpoints before irreversible actions (send, delete, post).

INTEGRATION CATALOG
${INTEGRATION_CATALOG}

GUARDRAILS
- Select node types/integrations ONLY from the catalog. Never invent.
- Mark every outward-facing / irreversible step with a human_checkpoint.
- No dangling edges; every step must be reachable.
- Output a valid n8n-importable workflow_json.

Output ONLY a valid JSON object:
{
  "objective": "...",
  "trigger": {"type": "webhook", "integration": "webhook", "description": "..."},
  "steps": [{"id": "n1", "node_type": "http", "integration": "http", "action": "..."}],
  "connections": [{"from": "trigger", "to": "n1", "data_passed": "..."}],
  "error_handling": ["..."],
  "human_checkpoints": ["..."],
  "integrations_required": ["..."],
  "workflow_json": {"nodes": [], "connections": []},
  "diagram": {"nodes": [], "edges": []},
  "confidence": 0.0,
  "caveats": ["..."]
}`;

export async function runAutomation(
  automationQuery: string,
  blackboard: unknown[] = []
): Promise<AgentEnvelope> {
  const startTime = Date.now();
  let reasoning = "";
  let output: AutomationOutput;

  try {
    reasoning = `Designing automation for: "${automationQuery}"`;

    const userPrompt = `Design a runnable automation workflow for:

Objective: "${automationQuery}"

Use the integration catalog provided in the system prompt. Return a complete workflow design that could be imported into n8n.`;

    output = await callGroqJSON<AutomationOutput>(userPrompt, SYSTEM_PROMPT, {
      max_tokens: 1024,
      temperature: 0.5,
    });

    reasoning += ` — designed workflow with ${output.steps.length} steps.`;

    // Never trust the LLM's workflow_json — compile a guaranteed-valid,
    // importable n8n workflow from the structured trigger + steps.
    output.workflow_json = buildN8nWorkflow(output);
  } catch (error) {
    console.error("[Automation] Error:", error);
    return {
      agent: "automation",
      status: "failed",
      reasoning:
        error instanceof Error ? error.message : "Unknown error in automation design",
      output: {
        objective: "Failed",
        trigger: {
          type: "unknown",
          integration: "unknown",
          description: "Failed to design automation",
        },
        steps: [],
        connections: [],
        error_handling: [],
        human_checkpoints: [],
        integrations_required: [],
        workflow_json: {},
        diagram: { nodes: [], edges: [] },
        confidence: 0,
        caveats: ["Automation design failed"],
      },
      artifacts: [],
      sources: [],
      confidence: 0,
      caveats: ["Failed to complete automation design"],
      timing_ms: Date.now() - startTime,
    };
  }

  return {
    agent: "automation",
    status: "complete",
    reasoning,
    output,
    artifacts: [output.workflow_json],
    sources: [],
    confidence: output.confidence,
    caveats: output.caveats,
    timing_ms: Date.now() - startTime,
  };
}
