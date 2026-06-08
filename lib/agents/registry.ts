/**
 * Agent registry — the single source of truth for every agent's identity:
 * name, role, color (the "bioluminescent instrument"), and build phase.
 * UI, theme engine, and (later) the orchestration runner all read from here.
 */

export type AgentId =
  | "orchestrator"
  | "research"
  | "data"
  | "automation"
  | "content"
  | "builder"
  | "audit";

export type AgentPhase = "mvp" | "wave2" | "wave3";

export interface AgentIdentity {
  id: AgentId;
  label: string;
  role: string;
  /** Core glow (hex). */
  core: string;
  /** Deep / pressed edge (hex). */
  deep: string;
  /** Core as "R G B" channels (for rgb(var / <alpha>) theming). */
  rgb: string;
  /** Deep as "R G B" channels. */
  deepRgb: string;
  tagline: string;
  phase: AgentPhase;
}

export const AGENTS: Record<AgentId, AgentIdentity> = {
  orchestrator: {
    id: "orchestrator",
    label: "Orchestrator",
    role: "The Conductor",
    core: "#A78BFA",
    deep: "#7C3AED",
    rgb: "167 139 250",
    deepRgb: "124 58 237",
    tagline: "Understands the mission, summons the right minds, resolves the symphony.",
    phase: "mvp",
  },
  research: {
    id: "research",
    label: "Research",
    role: "Market Intelligence",
    core: "#22D3EE",
    deep: "#0891B2",
    rgb: "34 211 238",
    deepRgb: "8 145 178",
    tagline: "Scans the web, triangulates sources, maps the landscape.",
    phase: "mvp",
  },
  data: {
    id: "data",
    label: "Data",
    role: "Data Intelligence",
    core: "#2DD4BF",
    deep: "#0D9488",
    rgb: "45 212 191",
    deepRgb: "13 148 136",
    tagline: "Turns real numbers into KPIs, charts, and insight.",
    phase: "mvp",
  },
  automation: {
    id: "automation",
    label: "Automation",
    role: "Workflow Architect",
    core: "#FBBF24",
    deep: "#D97706",
    rgb: "251 191 36",
    deepRgb: "217 119 6",
    tagline: "Designs runnable workflows — a real, importable automation.",
    phase: "mvp",
  },
  content: {
    id: "content",
    label: "Content",
    role: "Communication",
    core: "#E879F9",
    deep: "#C026D3",
    rgb: "232 121 249",
    deepRgb: "192 38 211",
    tagline: "Writes sharp, on-brand copy grounded in the findings.",
    phase: "wave2",
  },
  builder: {
    id: "builder",
    label: "Builder",
    role: "Software Engineering",
    core: "#4ADE80",
    deep: "#16A34A",
    rgb: "74 222 128",
    deepRgb: "22 163 74",
    tagline: "Generates real code, APIs, and architecture.",
    phase: "wave3",
  },
  audit: {
    id: "audit",
    label: "Audit",
    role: "Quality Assurance",
    core: "#FB7185",
    deep: "#E11D48",
    rgb: "251 113 133",
    deepRgb: "225 29 72",
    tagline: "Validates the chain, flags contradictions, scores quality.",
    phase: "wave3",
  },
};

/** Agents shown orbiting the core (everything except the Orchestrator). */
export const ORBIT_AGENTS: AgentId[] = [
  "research",
  "data",
  "automation",
  "content",
  "builder",
  "audit",
];

/** The agents shipping in MVP-4. */
export const MVP_AGENTS: AgentId[] = [
  "orchestrator",
  "research",
  "data",
  "automation",
];

export const isMvp = (id: AgentId) => AGENTS[id].phase === "mvp";
