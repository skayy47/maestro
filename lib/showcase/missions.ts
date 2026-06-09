/**
 * Warmed showcase — pre-baked, flawless mission runs.
 *
 * Played instantly (no API, no quota) for two reasons:
 *  1. A one-click "Play showcase" demo that always works — perfect for a recruiter
 *     opening the live link cold.
 *  2. A graceful fallback: if a live run fails (rate limit / network), MAESTRO
 *     replays a showcase instead of collapsing into error cards.
 *
 * The content matches the real agent envelope shapes exactly, so a cached run is
 * visually indistinguishable from a live one (except for an honest "Showcase" badge).
 * The automation artifact is compiled with the SAME buildN8nWorkflow used live, so
 * the downloaded JSON is genuinely importable.
 */

import type { StreamEvent } from "@/lib/hooks/useOrchestraate";
import type {
  AgentEnvelope,
  ResearchOutput,
  DataOutput,
  AutomationOutput,
} from "@/lib/agents/envelopes";
import { buildN8nWorkflow } from "@/lib/agents/n8n";

export interface Showcase {
  id: string;
  label: string;
  mission: string;
  events: StreamEvent[];
}

// ── EV market hero demo ──────────────────────────────────────────────────────
const EV_MISSION =
  "Research the global electric vehicle market and design a lead-capture automation for a dealership.";

const research: AgentEnvelope<ResearchOutput> = {
  agent: "research",
  status: "complete",
  reasoning: "Searched the web, triangulated 6 sources, synthesized the landscape.",
  confidence: 0.86,
  caveats: ["Market sizing varies by source methodology."],
  timing_ms: 4120,
  artifacts: [],
  sources: [
    { title: "Global EV Outlook 2026 — IEA", url: "https://www.iea.org/reports/global-ev-outlook-2026" },
    { title: "Electric Vehicle Market Size & Share Report", url: "https://www.grandviewresearch.com/industry-analysis/electric-vehicles-ev-market" },
    { title: "EV Sales Trends Q1 2026", url: "https://www.ev-volumes.com/" },
  ],
  output: {
    headline: "Global EV market on track for 20.7M annual sales in 2026, led by China, the US and the EU",
    market_overview:
      "The global electric vehicle market continues double-digit growth, driven by falling battery costs, expanding charging infrastructure, and tightening emissions policy. 2025 closed at ~17M units; 2026 is tracking toward 20.7M. Average range has crossed 325 miles and the best-selling model remains the Tesla Model Y.",
    trends: [
      "Battery costs falling ~12% YoY, pulling sticker prices toward parity with ICE",
      "Charging-network buildout accelerating in the US and EU",
      "Demand shifting toward affordable mid-market models",
      "Fleet and dealership digitization creating new lead-gen surface area",
    ],
    competitors: [
      { name: "Tesla", positioning: "Premium + best-selling Model Y; vertically integrated", weakness: "Rising competition compressing its share" },
      { name: "BYD", positioning: "Cost leader, dominant in China, expanding into EU", weakness: "Brand trust still maturing in Western markets" },
      { name: "Legacy OEMs (VW, GM, Ford)", positioning: "Scale + dealer networks", weakness: "Slower software/EV-native experience" },
    ],
    opportunities: [
      "Capture high-intent dealership leads with instant, automated follow-up",
      "Differentiate on financing + charging guidance at point of interest",
      "Target the emerging affordable-EV buyer with tailored nurture flows",
    ],
    sources: [
      { title: "Global EV Outlook 2026 — IEA", url: "https://www.iea.org/reports/global-ev-outlook-2026" },
      { title: "Electric Vehicle Market Size & Share Report", url: "https://www.grandviewresearch.com/industry-analysis/electric-vehicles-ev-market" },
      { title: "EV Sales Trends Q1 2026", url: "https://www.ev-volumes.com/" },
    ],
    confidence: 0.86,
    caveats: ["Market sizing varies by source methodology."],
  },
};

const dataSeries = [
  41200, 43800, 46100, 45200, 49800, 53400, 51900, 57600, 61200, 64800, 68300, 72500,
];
const data: AgentEnvelope<DataOutput> = {
  agent: "data",
  status: "complete",
  reasoning: "Computed KPIs and a 12-month trend from the sample dealership dataset.",
  confidence: 0.8,
  caveats: ["Illustrative sample — upload your own CSV for analysis of real numbers."],
  timing_ms: 1180,
  artifacts: [],
  sources: [],
  output: {
    dataset_profile: {
      rows: 1840,
      cols: 7,
      notes: "Illustrative sample dataset (no CSV uploaded). Stats are computed from generated data.",
      data_source: "sample",
    },
    kpis: [
      { label: "Avg monthly revenue", value: "$54.7K", trend: "up" },
      { label: "Avg units / month", value: "318 units", trend: "up" },
      { label: "Lead-to-sale rate", value: "11.4%", trend: "up" },
      { label: "Customer satisfaction", value: "4.3 / 5", trend: "flat" },
    ],
    findings: [
      "Revenue is trending up ~38% across the 12-month window",
      "Lead volume spikes correlate with new-model launches",
    ],
    charts: [
      { type: "line", title: "Monthly Revenue Trend", x: "month", y: "revenue" },
      { type: "bar", title: "Leads by Channel", x: "channel", y: "leads" },
    ],
    insights: [
      "Faster lead response is the clearest lever — most lost deals stall in the first 24h",
      "Mid-market EV interest is growing faster than premium",
    ],
    recommendations: [
      "Automate instant lead capture + qualification to compress response time",
      "Route high-intent leads straight to a human with full context",
    ],
    series: dataSeries,
    confidence: 0.8,
    caveats: ["Illustrative sample — upload your own CSV for analysis of real numbers."],
  },
};

const automationBase: Omit<AutomationOutput, "workflow_json"> = {
  objective: "Capture and qualify EV dealership leads, then route high-intent buyers to sales instantly",
  trigger: { type: "webhook", integration: "webhook", description: "New lead from the dealership website form" },
  steps: [
    { id: "n1", node_type: "http", integration: "http", action: "Enrich lead with vehicle-interest data", config_notes: "Lookup model + financing interest" },
    { id: "n2", node_type: "airtable", integration: "airtable", action: "Store lead in CRM", config_notes: "Upsert by email" },
    { id: "n3", node_type: "conditional", integration: "conditional", action: "Check if lead is high-intent", config_notes: "Score ≥ threshold" },
    { id: "n4", node_type: "email", integration: "email", action: "Send tailored EV brochure + booking link" },
    { id: "n5", node_type: "slack", integration: "slack", action: "Alert sales team for high-intent leads" },
  ],
  connections: [],
  error_handling: ["Retry enrichment on API timeout", "Queue CRM writes if Airtable is unavailable"],
  human_checkpoints: ["Review the outbound email template before first send"],
  integrations_required: ["webhook", "http", "airtable", "email", "slack"],
  confidence: 0.83,
  caveats: ["Connect real credentials for each integration before going live."],
};

const automationOutput: AutomationOutput = {
  ...automationBase,
  workflow_json: buildN8nWorkflow(automationBase as AutomationOutput),
};

const automation: AgentEnvelope<AutomationOutput> = {
  agent: "automation",
  status: "complete",
  reasoning: "Decomposed the objective into 5 steps, mapped to the integration catalog, hardened with error branches.",
  confidence: 0.83,
  caveats: ["Connect real credentials for each integration before going live."],
  timing_ms: 2240,
  artifacts: [automationOutput.workflow_json],
  sources: [],
  output: automationOutput,
};

const evShowcase: Showcase = {
  id: "ev-market",
  label: "EV market + lead automation",
  mission: EV_MISSION,
  events: [
    {
      type: "plan",
      data: {
        mission_understanding:
          "The user wants a market read on global EVs plus a runnable lead-capture automation for a dealership.",
        selected_agents: [
          { agent: "research", reason: "Map the EV market and competitors", depends_on: [] },
          { agent: "data", reason: "Quantify dealership performance and trends", depends_on: [] },
          { agent: "automation", reason: "Design the lead-capture workflow", depends_on: ["research"] },
        ],
        execution_order: [["research"], ["data"], ["automation"]],
        expected_deliverable: "A market briefing + an importable lead-capture automation.",
        scope_assessment: { in_scope: true, missing_capabilities: [], note: "" },
      },
    },
    { type: "agent_start", data: { agent: "research" } },
    { type: "agent_done", data: research },
    { type: "agent_start", data: { agent: "data" } },
    { type: "agent_done", data: data },
    { type: "agent_start", data: { agent: "automation" } },
    { type: "agent_done", data: automation },
    { type: "synthesis", data: { status: "synthesizing", message: "Composing the final briefing…" } },
    {
      type: "synthesis",
      data: {
        executive_summary:
          "The global EV market is heading toward 20.7M sales in 2026 with growth concentrated in affordable mid-market models. For a dealership, the sharpest lever is speed-to-lead: most lost deals stall in the first 24 hours. We designed an automation that captures, enriches, qualifies, and routes leads instantly — turning that window into an advantage.",
        key_findings: [
          "EV sales tracking to 20.7M units in 2026, led by China, the US and the EU",
          "Battery costs down ~12% YoY are pulling prices toward ICE parity",
          "Dealership revenue trended up ~38% over 12 months in the sample",
          "Fast lead response is the dominant driver of conversion",
        ],
        the_deliverable:
          "A 5-step lead-capture automation: a website form webhook enriches each lead, stores it in the CRM, scores intent, sends a tailored EV brochure with a booking link, and alerts the sales team in Slack for high-intent buyers — with a human checkpoint on the outbound template. It is provided as importable n8n JSON.",
        next_steps: [
          "Connect real CRM, email, and Slack credentials",
          "A/B test the brochure template against current outreach",
          "Feed real lead data back into the intent score",
        ],
        confidence: 0.84,
        total_agents_run: 3,
        total_duration_ms: 7540,
      },
    },
    { type: "done", data: { missionId: "showcase-ev-market" } },
  ],
};

export const SHOWCASES: Showcase[] = [evShowcase];

export const DEFAULT_SHOWCASE = evShowcase;

export function getShowcase(id?: string): Showcase {
  return SHOWCASES.find((s) => s.id === id) ?? DEFAULT_SHOWCASE;
}
