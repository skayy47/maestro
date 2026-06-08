# MAESTRO — Design Spec

> **A living neural orchestra you conduct.**
> Portfolio-grade multi-agent AI command center.

| | |
|---|---|
| **Author** | Oussama Skia (SKAY) |
| **Date** | 2026-06-08 |
| **Status** | Approved creative direction → ready for implementation plan |
| **Owner project** | MAESTRO (`C:\Users\Usuario\Desktop\AGENTS`) |
| **Phase** | Foundation spec (this doc). Build = next session. |

---

## 0. Context — why this exists

SKAY's portfolio already proves two things: **RAG / retrieval engineering** (nexus) and **data engineering** (AURA, BI Walmart, Credit Risk). The gap a recruiter for an **AI Engineer / Data Scientist** role still can't see is **system thinking at the orchestration layer** — the ability to make multiple specialized AI capabilities *collaborate* and to wrap that in an interface that signals senior product + frontend taste.

MAESTRO closes that gap. It is deliberately **not** a chatbot and **not** a SaaS landing page. It is an **AI operating system**: the user hands one mission to a conductor-brain, which selects the right specialist agents, runs them as a real pipeline, streams their thinking live, and synthesizes one final deliverable. The intended recruiter reaction: *"This person understands AI systems, orchestration, automation, architecture, and UX — and can turn an idea into a complete system."*

**Design principle that governs every decision:** *the agents are the hero, the UX is the weapon.* Orchestration intelligence carries the technical credibility (survives an interview); the interface is what makes someone screenshot it and forward it.

---

## 1. Identity & creative thesis

**Name:** MAESTRO. **Tagline:** *One mission. Many minds. One Maestro.*

The naming metaphor (conductor) and the visual metaphor (neural brain) are fused into **one** idea rather than two competing ones:

> The **Orchestrator** is the conducting brain-core. Each **agent** is a bioluminescent neuron-section of the orchestra, with its own instrument (specialty) and its own living color. A **mission** is a conducting gesture — energy ripples out across synapses to the sections that need to play. They **perform** (stream their output); the Maestro gathers the movements and **resolves them into one symphony** (the synthesized result).

Conductor + brain + orchestra = one spine. Every visual, motion, and copy decision must reinforce *living intelligence being conducted*, never *machine executing a script*.

---

## 2. Audience lens (recruiter synthesis)

No literal user research — there are no users yet. Instead, the design target is the **technical reviewer**. Two personas:

- **AI/ML hiring manager / senior engineer.** Will open the repo and the network tab. Wants to see: real LLM calls, a real planning step, structured I/O, grounding/anti-hallucination discipline, sane architecture, tests. *Believability under inspection* is the bar.
- **Recruiter / non-technical first-pass.** 20 seconds, probably on a phone or a shared screenshot. Wants an immediate "wow, this is sophisticated." *Visual impact in the first 3 seconds* is the bar.

MAESTRO must satisfy both: genuine engineering underneath, cinematic surface on top. The **replay gallery** (§4.6) exists specifically so the recruiter persona gets instant payoff without waiting on a live run.

---

## 3. Visual system — "Neural Obsidian"

Near-black living organism. Light comes only from intelligence: every glow is an agent thinking. Style lineage = **dark Liquid Glass** (premium, translucent, morphing). Known trade-offs to engineer around: backdrop-blur performance and text contrast (mitigations in §3.3).

### 3.1 Color — the void + the seven instruments

**Base layers (obsidian):**

```
--void:        #050609   /* the abyss behind everything */
--obsidian-900:#0A0C12   /* app background */
--obsidian-800:#0F121A   /* raised surface */
--obsidian-700:#161A24   /* card base */
--obsidian-600:#1E2330   /* elevated / hover */
--hairline:    rgba(255,255,255,0.07)   /* glass borders */
--synapse:     rgba(167,139,250,0.10)   /* resting filament glow */
```

**Text (contrast-checked on obsidian):**

```
--text-primary:  #F4F6FB   /* ~16:1 on obsidian-900 */
--text-secondary:#A8B0C0   /* ~7:1  */
--text-tertiary: #5C6678   /* labels only, never body */
```

**The 7 bioluminescent agent identities** — each agent owns a `core` (its glow) and `deep` (pressed/edge):

| Agent | `core` | `deep` | Soul |
|---|---|---|---|
| Orchestrator | `#A78BFA` | `#7C3AED` | violet — the conductor / home theme |
| Research | `#22D3EE` | `#0891B2` | cyan — scanning |
| Content | `#E879F9` | `#C026D3` | magenta — expression |
| Data | `#2DD4BF` | `#0D9488` | teal — signal |
| Automation | `#FBBF24` | `#D97706` | amber — flow |
| Builder | `#4ADE80` | `#16A34A` | neon green — assembly |
| Audit | `#FB7185` | `#E11D48` | rose / clinical (+ white scan) — inspection |

### 3.2 Typography — three-font system

| Role | Font | Why |
|---|---|---|
| Display / headings | **Space Grotesk** | character without gamer-cliché; tagged "best for AI products" |
| Body | **Inter** | clean, premium, ideal for AI dashboards |
| System / data / logs | **JetBrains Mono** | the mono is what sells the "OS" feel — agent logs, KPIs, code, timers |

Scale: `12 · 14 · 16 · 18 · 24 · 32 · 48`. Body ≥16px. Mono uses tabular figures for data columns/timers (prevents layout shift). Weights: headings 600–700, body 400, labels 500.

```js
// tailwind.config — fontFamily
display: ['Space Grotesk', 'sans-serif'],
sans:    ['Inter', 'sans-serif'],
mono:    ['JetBrains Mono', 'monospace'],
```

### 3.3 Glass & effects (dark Liquid Glass)

```
panel-bg:     rgba(15,18,26,0.55)              /* obsidian-800 @ 55% */
panel-blur:   backdrop-filter: blur(20px) saturate(140%)
panel-border: 1px solid var(--hairline)
panel-edge:   linear-gradient(180deg, rgba(255,255,255,0.06), transparent 40%)  /* glass catches light */
panel-active: 0 0 40px -10px var(--agent), inset 0 0 0 1px color-mix(in srgb, var(--agent) 25%, transparent)
depth-shadow: 0 8px 40px -12px rgba(0,0,0,0.7)
noise:        2–3% grain overlay  /* kills OLED banding on dark gradients */
```

**Discipline (mandatory):**
- Text **never** sits directly on blurred glass — always on a slightly more opaque inner plate, verified ≥4.5:1.
- Max **2–3** stacked backdrop-blur layers per view (perf).
- Ship a **"lite mode"** toggle + honor `prefers-reduced-motion` (drops blur/particles, keeps the data).

### 3.4 Motion language — breathing, never mechanical

Spring physics over cubic-bezier. Enter = spring (`stiffness ~180, damping ~22`); micro = `ease-out 200ms`; exit = `ease-in 140ms` (faster than enter). Animate **transform/opacity only**.

| Moment | Motion |
|---|---|
| Idle | core slow-pulses (scale 1↔1.03, glow 0.6↔1.0) on a ~4s loop; particles drift along synapses |
| Conducting gesture (mission submit) | energy travels input → core → core **blooms** → pulses ripple out along synapses to selected agents (~1.2s choreographed) |
| Agent activation | neuron **fires**: scale bloom with overshoot to 1.08 → settle 1.0; glow ignites; one ring ripple (~400ms) |
| Data transfer | light packet travels the synapse edge source→target, color fading source→target |
| Output streaming | Content typewriters; others reveal line-by-line, stagger 30–50ms |
| Synthesis | all active agent colors converge into the core → white-violet flare → final panel resolves |

All animations interruptible; never block input. `prefers-reduced-motion` → swap choreography for simple fades, data appears instantly.

### 3.5 Theme engine — the `--agent` mechanic (WOW #2)

A single CSS custom property drives **every** accent: borders, glows, focus rings, the active node, primary buttons, progress.

```
:root { --agent: #A78BFA; --agent-deep: #7C3AED; }   /* Orchestrator = home */
```

A React `ThemeContext` sets `--agent` / `--agent-deep` on a root wrapper as the active agent changes. The transition between agents animates the variable (violet→cyan when Orchestrator hands to Research) over ~600ms, so **the entire UI breathes to the active agent's mood**. Components reference only `var(--agent)` — never a hardcoded agent hex — so the theme switch is one source of truth.

---

## 4. Architecture

### 4.1 Pipeline

```
Mission ─▶ Orchestrator ─▶ [Agent DAG] ─▶ Blackboard ─▶ Audit ─▶ Synthesis ─▶ Result
            (planner)        (runner)     (shared ctx)   (QA)    (Orchestrator)
```

1. **Plan.** Orchestrator (JSON-mode LLM call) reads the mission and returns a `MissionPlan` — which agents, dependency DAG, and *why*. This is **WOW #1** and it is genuinely an LLM decision, not scripted.
2. **Run.** A runner executes the DAG: independent agents in parallel, dependents after their inputs land. Each agent reads the shared **blackboard** (prior structured outputs) and writes its own envelope back.
3. **Audit.** The Audit agent validates each envelope against its schema and cross-checks agents for contradictions (wave 2; V1 ships a lightweight schema/format validator).
4. **Synthesize.** Orchestrator (synthesizer mode) merges all envelopes into the final deliverable, grounded only in agent outputs.

### 4.2 Key decisions (ADR-lite)

- **ADR-1 — Next.js API routes, not FastAPI.** One repo, one deploy, end-to-end TypeScript, native SSE, trivially readable by a reviewer. *Trade-off:* heavy numeric work (the Data agent) has no pandas. *Resolution:* V1 Data tool uses a JS stats lib (`simple-statistics` / `danfo.js`) in-route; if real pandas is needed later, add a small Python serverless sidecar behind the same tool interface.
- **ADR-2 — Groq Llama 3.3 70B primary, Gemini fallback.** Groq's speed is the live-demo magic (sub-second first token = the choreography feels alive) and SKAY already has it wired from nexus. Gemini reserved for long-context / fallback.
- **ADR-3 — Hybrid execution.** Real Groq calls; one **warmed showcase mission** cached in Supabase; graceful fallback to cached output if an API errors or rate-limits. Genuinely real, never breaks live. Cost/rate guard on the orchestrate route.
- **ADR-4 — SSE over WebSockets.** One-way server→client streaming is all the visualization needs; SSE is simpler and works on serverless.

### 4.3 Data contracts

Every agent returns the same typed envelope (renders as rich cards; lets Audit validate):

```ts
type AgentStatus = "pending" | "running" | "complete" | "failed" | "skipped";

interface AgentEnvelope<T = unknown> {
  agent: string;            // "research" | "data" | ...
  status: AgentStatus;
  reasoning: string;        // the visible "thinking" stream
  output: T;                // agent-specific schema (below)
  artifacts: Artifact[];    // charts, code files, docs
  sources: Source[];        // grounding (url/title or "tool:...")
  confidence: number;       // 0..1, calibrated
  caveats: string[];        // explicit uncertainty
  timing_ms: number;
}
```

The Orchestrator plan:

```ts
interface MissionPlan {
  mission_understanding: string;
  selected_agents: { agent: string; reason: string; depends_on: string[] }[];
  execution_order: string[][];   // groups; inner array = runs in parallel
  expected_deliverable: string;
}
```

### 4.4 Streaming

`POST /api/orchestrate` returns an SSE stream of typed events the UI renders directly:

```
event: plan        data: MissionPlan
event: agent_start data: { agent }
event: token       data: { agent, delta }      // drives live typing + synapse activity
event: agent_done  data: AgentEnvelope
event: synthesis   data: { delta | final }
event: done        data: { missionId }
event: error       data: { agent?, message, recoverable }
```

### 4.5 File structure (target)

```
/app
  /api
    /orchestrate/route.ts     # POST → SSE: plan + run + synthesize
    /missions/route.ts        # GET past runs (replay gallery)
  /(maestro)/page.tsx         # the command center
/lib
  /agents/                    # one file per agent: persona + tools + schema
    orchestrator.ts  research.ts  data.ts  content.ts  ...
  /orchestration/             # planner · runner · blackboard · stream
  /llm/                       # Groq/Gemini client, JSON-mode, retries, fallback
  /tools/                     # real tools: web-search, csv-analyze, code-gen
/components
  /core/                      # OrchestratorCore (Three.js orb), SynapticWeb
  /agents/                    # AgentNode, AgentCard, theme system
  /panels/                    # MissionInput, LiveOutputs, WorkflowTimeline
/design/tokens.ts             # the Neural Obsidian token system (§3)
```

### 4.6 Persistence & replay

Supabase stores each run: `{ mission, plan, envelopes[], timing, created_at }`. Powers a **replay gallery** — a recruiter clicks a past mission and watches the full choreography re-play instantly from stored events (no live latency, no API cost). Doubles as the demo-proof layer for ADR-3.

---

## 5. Agent intelligence — the superpower model

The differentiator from "six chatbots with different system prompts" is that an agent is **not** a persona. It is four things:

> **Persona** (voice + domain expertise) · **Reasoning Framework** (a discipline-specific method, i.e. structured chain-of-thought) · **Real Tools** (actual capability, grounded — not hallucination) · **Output Contract** (typed JSON the UI renders and Audit verifies).

**Cross-cutting guardrails baked into every system prompt:**
- *Grounding:* "You may only assert facts that come from tool results or upstream agent outputs. Never invent figures, names, or sources."
- *Calibrated confidence:* return `confidence ∈ [0,1]`; >0.8 = direct, 0.5–0.8 = answer + caveats, <0.5 = state what's missing and lower it.
- *Failure honesty:* if a tool returns nothing usable, say so, don't fabricate; emit a `failed`/low-confidence envelope rather than a confident hallucination.
- *Valid JSON only:* output must parse against the schema; a fallback extractor + one re-ask handles malformed output.
- System prompts are cached (stable prefix) for latency/cost.

### 5.1 Orchestrator — Planner mode

```
ROLE
You are MAESTRO, the orchestrating intelligence of a multi-agent system. You are
strategic, precise, and economical — you summon the *minimum* set of specialists a
mission truly needs, never more.

AGENT ROSTER (select only from these)
- research : market intelligence — web search, competitor & trend analysis
- data     : data intelligence — CSV/Excel stats, KPIs, charts, insights
- content  : communication — copy, landing pages, emails, positioning
- automation: workflow design — process & integration plans
- builder  : software — code, APIs, architecture, components
- audit    : QA — validation, consistency, security review

FRAMEWORK (think, then emit)
1. ANALYZE the mission: what is the user truly asking for as a deliverable?
2. IDENTIFY the disciplines required. Map each to at most one roster agent.
3. SELECT the minimum viable set. Omit agents that add no value.
4. SEQUENCE as a DAG: mark which agents depend on which (e.g. content depends on
   research). Independent agents share an execution group (run in parallel).
5. JUSTIFY each selection in one sentence.

GUARDRAILS
- Choose only from the roster. Never invent an agent.
- Prefer 2–4 agents; selecting all of them is almost always wrong.
- If the mission is ambiguous, state your assumption in mission_understanding and proceed.
- Output ONLY valid JSON matching MissionPlan. No prose outside JSON.

OUTPUT (MissionPlan)
{ "mission_understanding": "...",
  "selected_agents": [{"agent":"research","reason":"...","depends_on":[]}],
  "execution_order": [["research","data"],["content"]],
  "expected_deliverable": "..." }
```

### 5.2 Orchestrator — Synthesizer mode

```
ROLE
You are MAESTRO in synthesis. The specialists have performed; you resolve their
movements into one coherent deliverable for the user.

FRAMEWORK
1. REVIEW each agent envelope: its output, confidence, and caveats.
2. RESOLVE conflicts: prefer higher-confidence and Audit-validated claims; when
   agents disagree, surface the disagreement rather than hiding it.
3. WEAVE a single narrative/deliverable shaped to expected_deliverable.
4. ATTRIBUTE: note which agent contributed which part.

GUARDRAILS
- Ground ONLY in the provided envelopes. Introduce NO new facts.
- Carry forward unresolved caveats into your own caveats.
- Match the deliverable format the mission implied (strategy doc, brief, plan...).

OUTPUT
{ "executive_summary": "...",
  "deliverable": { ...shaped to the mission... },
  "key_insights": ["..."],
  "contributions": {"research":"...","data":"..."},
  "confidence": 0.0,
  "caveats": ["..."] }
```

### 5.3 Research agent — Market Intelligence Specialist

```
ROLE
You are the Research Agent, a market-intelligence specialist. You are rigorous and
source-driven; you never state a market fact you did not retrieve.

FRAMEWORK
- SCAN: issue web_search queries broad enough to map the space.
- TRIANGULATE: cross-verify every material claim against ≥2 independent sources;
  if you can only find one, flag it. fetch_url to read primary sources.
- SYNTHESIZE: compress into a structured brief with explicit sourcing.

TOOLS
- web_search(query: string) -> { results: {title,url,snippet}[] }
- fetch_url(url: string) -> { title, text }
Protocol: you MUST call web_search before asserting any external fact. Never state a
statistic or company claim without a corresponding entry in sources[].

GUARDRAILS
- No invented statistics, companies, or URLs. If search is empty/unusable, say so and
  set confidence < 0.4.
- Distinguish fact (sourced) from inference (your analysis) in the output.

OUTPUT
{ "headline": "...",
  "market_overview": "...",
  "trends": ["..."],
  "competitors": [{"name":"...","positioning":"...","weakness":"..."}],
  "opportunities": ["..."],
  "sources": [{"title":"...","url":"..."}],
  "confidence": 0.0, "caveats": ["..."] }
```

### 5.4 Data agent — Data Intelligence Specialist

```
ROLE
You are the Data Agent, a data-intelligence specialist. You INTERPRET real computed
statistics into business meaning. The numbers come from the analysis tool; the meaning
comes from you. You never fabricate a value.

FRAMEWORK
- PROFILE: shape, column types, missingness (from tool output).
- ANALYZE: distributions, correlations, segment comparisons.
- DETECT: trends, anomalies, notable segments.
- VISUALIZE: propose chart specs that reference real columns.
- INSIGHT: translate findings into KPIs, insights, and recommendations.

TOOLS
- analyze_dataset(fileRef) -> { profile, summary_stats, correlations, series }
Protocol: every numeric claim MUST trace to analyze_dataset output. Chart encodings
must reference columns that exist in the profile.

GUARDRAILS
- Never invent values, columns, or trends not present in the tool output.
- If the dataset can't support a requested analysis, say so plainly and lower confidence.

OUTPUT
{ "dataset_profile": {"rows":0,"cols":0,"notes":"..."},
  "kpis": [{"label":"...","value":"...","trend":"up|down|flat"}],
  "findings": ["..."],
  "charts": [{"type":"line|bar|scatter|...","title":"...","x":"col","y":"col"}],
  "insights": ["..."],
  "recommendations": ["..."],
  "confidence": 0.0, "caveats": ["..."] }
```

### 5.5 Content agent — Communication Specialist (wave 2, specced)

```
ROLE
You are the Content Agent, a communication specialist. You write sharp, on-brand copy
grounded in what the other agents found — never generic filler.

FRAMEWORK
- POSITION: from the blackboard (research/data), fix the audience + core value prop.
- DRAFT: produce the requested asset(s) to a format schema.
- REFINE: tighten tone, remove cliché, ensure every claim traces to an upstream finding.

TOOLS: none (LLM) — reads research/data envelopes from the blackboard for grounding.

GUARDRAILS
- Any factual claim must trace to a research/data finding; mark anything speculative.
- Respect the requested format (landing | email | social | positioning).

OUTPUT
{ "deliverables": [{"type":"...","title":"...","body":"..."}],
  "variants": ["..."], "tone": "...", "confidence": 0.0, "caveats": ["..."] }
```

### 5.6 Automation · Builder · Audit (waves 2–3, sketched)

- **Automation — Workflow Architect.** Framework: MAP process → DESIGN nodes → CONNECT tools. Tool: workflow-graph generator emitting n8n/Make-style JSON. Output: `{ steps[], integrations[], diagram, confidence }`.
- **Builder — Software Engineering Specialist.** Framework: SPEC → ARCHITECT → GENERATE → document. Tool: code-gen producing real file artifacts. Output: `{ architecture, files[{path,language,content}], notes, confidence }`.
- **Audit — QA Specialist (the differentiator).** Framework: VALIDATE each envelope vs schema → CROSS-CHECK agents for contradictions → FLAG unsupported claims → SCORE. Rule-based first (schema/format), LLM second (semantic consistency). Output: `{ checks[{target,status,issue}], contradictions[], quality_score, blocking_issues[], confidence }`.

---

## 6. UX flow & WOW map

Layout (the command center): **center** = Orchestrator core + synaptic web; **orbit** = agent nodes; **left** = mission input + config; **right** = live outputs (streaming envelope cards); **bottom** = workflow timeline + execution status.

Flow: mission → conducting gesture → plan DAG materializes → agents ignite in sequence → live streamed performance (synapse packets between dependents) → Audit scan → synthesis flare → final deliverable.

| WOW | Mechanic |
|---|---|
| #1 AI selects agents | the real `MissionPlan` DAG animating into existence from the planner call |
| #2 UI adapts to active agent | the `--agent` theme-breathing engine (§3.5) |
| #3 live collaboration | SSE-driven synaptic data packets traveling between agents |
| #4 one mission → full solution | the synthesis flare + final artifact panel |

---

## 7. Scope & phasing

- **MVP (V1) — Orchestrator + Research + Data.** *(Adjusted from the original Orchestrator+Research+Content: Data is a stronger flex for AI/Data roles than marketing copy.)* Ships: real planner, real web-search Research, real stats Data, SSE streaming, the Neural Obsidian shell with core + 3 agent nodes + theme engine, one warmed showcase mission, Supabase run persistence + replay.
- **Wave 2 — Content + Audit.** Content is trivial (LLM-only, grounded on blackboard). Audit is the QA differentiator.
- **Wave 3 — Automation + Builder.** Full 7-agent roster + richer artifacts.

YAGNI guardrails: no auth, no multi-user, no billing in V1. Three.js is used **only** for the Orchestrator core orb — every other node is DOM + Framer Motion (perf + simplicity).

---

## 8. Risks & open questions

- **Liquid-glass perf/contrast.** Mitigated by the §3.3 discipline (plate-behind-text, ≤3 blur layers, lite mode). Verify on a mid laptop, not just the dev machine.
- **Live LLM latency/cost in demos.** Mitigated by ADR-3 hybrid + the replay gallery.
- **Data tool depth.** JS stats lib covers V1; revisit a Python sidecar only if a mission needs real pandas/ML.
- **Open:** web-search provider (Tavily vs Brave vs SerpAPI) — decide at build time on free-tier limits. Confirm Groq rate limits are enough for a public demo or gate runs behind the warmed showcase + replay.

---

*Next step: `writing-plans` → implementation plan for the V1 slice (Orchestrator + Research + Data). Deferred to next session per SKAY.*
