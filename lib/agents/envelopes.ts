/**
 * Shared agent envelope + output types.
 *
 * The orchestration route streams `agent_done` events whose `data` is an
 * AgentEnvelope. The frontend deliverable renderers import these types so the
 * rich agent output is rendered with full type safety (not just `reasoning`).
 */

export interface ResearchOutput {
  headline: string;
  market_overview: string;
  trends: string[];
  competitors: Array<{ name: string; positioning: string; weakness: string }>;
  opportunities: string[];
  sources: Array<{ title: string; url: string }>;
  confidence: number;
  caveats: string[];
}

export interface DataOutput {
  dataset_profile: { rows: number; cols: number; notes: string };
  kpis: Array<{ label: string; value: string; trend: "up" | "down" | "flat" }>;
  findings: string[];
  charts: Array<{ type: "line" | "bar" | "scatter" | "pie"; title: string; x: string; y: string }>;
  insights: string[];
  recommendations: string[];
  confidence: number;
  caveats: string[];
}

export interface WorkflowNode {
  id: string;
  node_type: string;
  integration: string;
  action: string;
  inputs_from?: string[];
  config_notes?: string;
}

export interface AutomationOutput {
  objective: string;
  trigger: { type: string; integration: string; description: string };
  steps: WorkflowNode[];
  connections: Array<{ from: string; to: string; data_passed: string }>;
  error_handling: string[];
  human_checkpoints: string[];
  integrations_required: string[];
  workflow_json: unknown;
  diagram?: { nodes: Array<{ id: string; label: string; x: number; y: number }>; edges: Array<{ from: string; to: string }> };
  confidence: number;
  caveats: string[];
}

export interface SynthesisOutput {
  executive_summary: string;
  key_findings: string[];
  the_deliverable: string;
  next_steps: string[];
  confidence: number;
}

/** The typed envelope every agent returns and streams over SSE. */
export interface AgentEnvelope<T = unknown> {
  agent: string;
  status: "pending" | "running" | "complete" | "failed";
  reasoning: string;
  output: T;
  artifacts: unknown[];
  sources: Array<{ title: string; url: string }> | unknown[];
  confidence: number;
  caveats: string[];
  timing_ms: number;
}

export type ResearchEnvelope = AgentEnvelope<ResearchOutput>;
export type DataEnvelope = AgentEnvelope<DataOutput>;
export type AutomationEnvelope = AgentEnvelope<AutomationOutput>;
