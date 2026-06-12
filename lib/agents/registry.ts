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
    core: "#7C3AED",
    deep: "#6D28D9",
    rgb: "124 58 237",
    deepRgb: "109 40 217",
    tagline: "Understands the mission, summons the right minds, resolves the symphony.",
    phase: "mvp",
  },
  research: {
    id: "research",
    label: "Research",
    role: "Market Intelligence",
    core: "#0891B2",
    deep: "#0E7490",
    rgb: "8 145 178",
    deepRgb: "14 116 144",
    tagline: "Scans the web, triangulates sources, maps the landscape.",
    phase: "mvp",
  },
  data: {
    id: "data",
    label: "Data",
    role: "Data Intelligence",
    core: "#0D9488",
    deep: "#0F766E",
    rgb: "13 148 136",
    deepRgb: "15 118 110",
    tagline: "Turns real numbers into KPIs, charts, and insight.",
    phase: "mvp",
  },
  automation: {
    id: "automation",
    label: "Automation",
    role: "Workflow Architect",
    core: "#D97706",
    deep: "#B45309",
    rgb: "217 119 6",
    deepRgb: "180 83 9",
    tagline: "Designs runnable workflows — a real, importable automation.",
    phase: "mvp",
  },
  content: {
    id: "content",
    label: "Content",
    role: "Communication",
    core: "#C026D3",
    deep: "#A21CAF",
    rgb: "192 38 211",
    deepRgb: "162 28 175",
    tagline: "Writes sharp, on-brand copy grounded in the findings.",
    phase: "wave2",
  },
  builder: {
    id: "builder",
    label: "Builder",
    role: "Software Engineering",
    core: "#16A34A",
    deep: "#15803D",
    rgb: "22 163 74",
    deepRgb: "21 128 61",
    tagline: "Generates real code, APIs, and architecture.",
    phase: "wave3",
  },
  audit: {
    id: "audit",
    label: "Audit",
    role: "Quality Assurance",
    core: "#E11D48",
    deep: "#BE123C",
    rgb: "225 29 72",
    deepRgb: "190 18 60",
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
