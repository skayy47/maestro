<div align="center">

# 🎼 MAESTRO

### One mission. Many minds. One Maestro.

**A multi-agent AI operating system where specialist agents collaborate in real time to turn a single mission into a complete, verifiable solution — streamed live as it happens.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-maestro--lac--theta.vercel.app-7c3aed?style=for-the-badge&logo=vercel&logoColor=white)](https://maestro-lac-theta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-skayy47%2Fmaestro-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/skayy47/maestro)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-48_passing-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](./TESTING.md)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)

</div>

---

## What is MAESTRO?

You give it one mission:

> *"Research the MENA fintech market and design a lead-capture automation for enterprise clients."*

An orchestrating intelligence reads the mission, plans which specialist agents are needed, and runs them as a live streaming pipeline. Each agent is backed by a **real grounded tool** — not a prompted LLM pretending to have one. You get back:

- 🔍 A **sourced market brief** with clickable URLs that are the actual retrieved pages — not LLM-invented links
- 📊 An **analysis of your real data** — upload a CSV and the KPIs are the exact computed statistics of your file
- ⚡ A **valid, importable n8n workflow JSON** — real node types, wired connections, trigger node first — download and run it

**This is not a chatbot. This is an AI operating system.**

---

## Why it's technically interesting

### 1 · Real orchestration, not a hardcoded router

The Orchestrator is an LLM planner. It reads the mission and returns a structured execution plan:

```json
{
  "reasoning": "This mission needs market intelligence + an automation layer. Research first to inform workflow design.",
  "agents": ["research", "automation"],
  "execution_order": ["research", "automation"],
  "scope_assessment": {
    "in_scope": true,
    "missing_capabilities": [],
    "note": ""
  }
}
```

If the mission asks for something outside the current roster (content writing, code gen, audit), the planner **flags it honestly** with a UI banner instead of silently delivering the wrong thing. Honesty about capability boundaries is a feature, not a weakness.

---

### 2 · Server-Sent Events streaming pipeline

`POST /api/orchestrate` returns a live `ReadableStream`. The frontend doesn't poll — it receives typed events as they occur:

```
plan → agent_start → token → agent_done → synthesis → done
```

The SSE parser is a stateful line-by-line processor that tracks `event:` type across lines — critical for chunked delivery where the type header and data body can arrive in separate TCP chunks. A blank line never resets pending type (caught and fixed by the test suite).

---

### 3 · Grounded agents with verifiable artifacts

| Agent | What it actually does | The verifiable artifact |
|---|---|---|
| 🔍 **Research** | Live web search via Tavily API (8 results) | URLs are injected from real Tavily response — LLM output is overridden |
| 📊 **Data** | Dependency-free CSV parser + per-column statistics | Upload a CSV → mean in the UI is `sum(col) / n` of your data. Exact. |
| ⚡ **Automation** | Deterministic n8n workflow compiler | Download the JSON → import into n8n → it works. Real node types, real wiring. |

The n8n compiler illustrates the philosophy clearly: we don't trust the LLM to produce valid JSON (it won't reliably). The LLM designs the *intent* — which integrations, what logic — and `buildN8nWorkflow()` compiles it deterministically using a real node-type catalog, linear connection wiring, and a trigger node injected first.

---

### 4 · Demo-proof resilience

Two layers ensure MAESTRO always demos beautifully:

**Model fallback chain** — Groq Llama 3.3 70B (primary) → Llama 3.1 8B (separate daily quota). `parseRetryAfterMs()` extracts the wait hint from Groq's error messages. Short TPM limits (≤16s) are waited out. Long TPD limits switch models immediately.

**Warmed showcase cache** — A hand-curated, flawless pre-baked run lives in `lib/showcase/missions.ts`. On hard failures (network) or soft failures (all agents rate-limited), the orchestration hook replays it with staggered timing that looks live. A recruiter's demo never ends in error cards.

---

### 5 · Honest about its limits

The scope assessment shows a UI banner when a mission needs capabilities outside the current roster:

```
⚠ Partly outside MAESTRO's roster
Some of this mission needs capabilities the current agents don't cover.
[ content writing ] [ code generation ]
```

The available agents still contribute what they can. No silent failures, no confidently wrong deliverables.

---

## The agent model (4-pillar architecture)

Every agent is built on four consistent pillars — not just a system prompt:

```
┌──────────────────────────────────────────────────────────────┐
│  PERSONA            A specialist identity and voice          │
│  REASONING          An explicit method the LLM is asked to  │
│                     follow (scan → triangulate → synthesize) │
│  GROUNDED TOOLS     Real APIs, compilers, stat engines —     │
│                     not LLM-generated placeholders           │
│  OUTPUT CONTRACT    A typed AgentEnvelope<T> the UI renders  │
│                     richly — structured data, not text blobs │
└──────────────────────────────────────────────────────────────┘
```

Agents return `AgentEnvelope<T>` — a typed structure carrying status, confidence score, timing (ms), and the full richly-structured output. The UI consumes the envelope directly.

---

## Architecture

```
  User Mission
       │
       ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /api/orchestrate  (Next.js API Route — ReadableStream)    │
  │                                                            │
  │  ┌──────────────────┐                                      │
  │  │   Orchestrator   │  LLM planner → MissionPlan DAG       │
  │  │  (Llama 3.3 70B) │  + scope_assessment                  │
  │  └────────┬─────────┘                                      │
  │           │  execution_order                               │
  │           ▼                                                │
  │  ┌────────────────────────────────────────┐               │
  │  │          Agent Pipeline                │               │
  │  │                                        │               │
  │  │  ┌───────────┐  ┌───────────────────┐  │               │
  │  │  │ Research  │  │      Data         │  │               │
  │  │  │  Tavily   │  │  CSV parser +     │  │               │
  │  │  │   API     │  │  stats engine     │  │               │
  │  │  └─────┬─────┘  └────────┬──────────┘  │               │
  │  │        │                  │             │               │
  │  │  ┌─────▼──────────────────▼──────────┐  │               │
  │  │  │          Automation               │  │               │
  │  │  │   n8n deterministic compiler      │  │               │
  │  │  └────────────────┬──────────────────┘  │               │
  │  └───────────────────┼────────────────────┘               │
  │                      │  typed AgentEnvelopes (SSE stream)  │
  │  ┌───────────────────▼────────────────────┐               │
  │  │           Synthesizer                  │               │
  │  │   executive briefing via real LLM call │               │
  │  │   summary · findings · deliverable     │               │
  │  │   · next steps                         │               │
  │  └────────────────────────────────────────┘               │
  └────────────────────────────────────────────────────────────┘
       │
       ▼
  Decision-ready briefing  +  3 verifiable artifacts
```

---

## Design system: Neural Obsidian

A custom design system built for cognitive focus in high-information, real-time interfaces:

- **Near-black surfaces** (`obsidian-950`/`900`) with dark liquid glass panels and subtle borders
- **7 bioluminescent per-agent accent colors** — each agent has a distinct identity across the UI
- **Single `--agent` CSS variable** — one property drives the entire active-agent aesthetic (glow, borders, chips, timeline state)
- **Framer Motion** with streaming-state animations, entry staggering, and `prefers-reduced-motion` compliance

| Agent | Color | Identity |
|---|---|---|
| 🎼 Orchestrator | `#7C3AED` violet | Command, synthesis, planning |
| 🔍 Research | `#0EA5E9` sky | Intelligence, clarity, depth |
| 📊 Data | `#2DD4BF` teal | Precision, signal, truth |
| ⚡ Automation | `#F59E0B` amber | Energy, execution, flow |
| ✍️ Content | `#10B981` emerald | Voice, narrative *(Wave 2)* |
| 🏗️ Builder | `#6366F1` indigo | Structure, creation *(Wave 3)* |
| 🔬 Audit | `#EF4444` rose | Rigor, verification *(Wave 3)* |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript 5 | API routes for SSE, full-stack TypeScript |
| **LLM** | Groq — Llama 3.3 70B → 3.1 8B fallback | JSON mode for structured output; fallback chain for free-tier reliability |
| **Web search** | Tavily API | Grounded real-web results with source URLs |
| **Streaming** | Next.js `ReadableStream` + SSE | Live event delivery to the UI without polling |
| **UI** | Tailwind CSS + Framer Motion | Neural Obsidian design system |
| **Charts** | Hand-rolled SVG area chart | Zero dependencies; full control over the gradient fill + trend badge |
| **Testing** | Vitest | 48 unit tests over pure orchestration logic |
| **Deployment** | Vercel | Auto-deploy on `git push main` |

---

## Getting started

```bash
# Clone
git clone https://github.com/skayy47/maestro.git
cd maestro

# Install
npm install

# Configure environment
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GROQ_API_KEY=gsk_...       # https://console.groq.com/keys  — free tier works
TAVILY_API_KEY=tvly-...    # https://tavily.com             — free tier works
```

```bash
# Start the dev server
npm run dev
# → http://localhost:3000

# Run the test suite
npm run test:run
# → 48/48 passing
```

Both keys are **free tier** — no credit card required. Groq has generous daily token limits; the model fallback chain handles quota exhaustion automatically.

---

## Project structure

```
maestro/
├── app/
│   ├── api/orchestrate/        SSE orchestration API route
│   └── page.tsx
├── components/
│   ├── deliverables/           Per-agent rich renderers + slide-in drawer
│   │   ├── ResearchDeliverable.tsx
│   │   ├── DataDeliverable.tsx
│   │   ├── AutomationDeliverable.tsx
│   │   ├── SynthesisDeliverable.tsx
│   │   ├── MiniChart.tsx       Hand-rolled SVG area chart
│   │   ├── DeliverableDrawer.tsx
│   │   └── primitives.tsx      Section, Chip, BulletList, ConfidenceBar
│   ├── panels/
│   │   ├── MissionPanel.tsx    Mission input + CSV upload
│   │   └── OutputsPanel.tsx    Live streaming outputs
│   ├── timeline/
│   │   └── WorkflowTimeline.tsx  Execution timeline (pulse → checkmark)
│   └── agents/
│       └── AgentOrbit.tsx      Orbital agent visualization
├── lib/
│   ├── agents/
│   │   ├── orchestrator.ts     LLM planner (DAG + scope assessment)
│   │   ├── research.ts         Tavily search agent
│   │   ├── data.ts             CSV / synthetic data agent
│   │   ├── automation.ts       n8n workflow agent
│   │   ├── synthesizer.ts      Executive briefing generator
│   │   ├── n8n.ts              Deterministic n8n workflow compiler
│   │   ├── csv.ts              Dependency-free CSV parser + analyzer
│   │   ├── dataset.ts          Mission-seeded synthetic data (mulberry32 PRNG)
│   │   ├── stats.ts            Shared statistics (mean, median, std, trend)
│   │   ├── envelopes.ts        Typed output contracts
│   │   ├── highlight.ts        Per-agent card summary extractor
│   │   └── registry.ts         Agent identities, colors, MVP roster
│   ├── llm/
│   │   └── groq.ts             Model fallback chain + retry-with-backoff
│   ├── hooks/
│   │   ├── useOrchestraate.ts  Orchestration state + showcase replay engine
│   │   └── sse.ts              Stateful SSE stream parser
│   └── showcase/
│       └── missions.ts         Warmed showcase cache (always-demoable)
└── tests/                      48 Vitest unit tests
    ├── sse.test.ts
    ├── n8n.test.ts
    ├── csv.test.ts
    ├── dataset.test.ts
    ├── stats.test.ts
    ├── groq.test.ts
    ├── highlight.test.ts
    ├── synthesizer.test.ts
    └── showcase.test.ts
```

---

## Testing

48 unit tests cover the orchestration-critical pure logic — the pieces where a silent bug breaks the entire output:

| Suite | What it protects |
|---|---|
| `sse.test.ts` | Chunked delivery, blank-line edge cases, multi-event sequences |
| `n8n.test.ts` | Valid node types, wired connections, trigger node present |
| `csv.test.ts` | Quote handling, CRLF, empty fields, numeric detection |
| `dataset.test.ts` | Different output per mission, same output for same mission |
| `stats.test.ts` | mean / median / std are mathematically correct |
| `groq.test.ts` | Retry delay parsing from Groq error messages |
| `highlight.test.ts` | Card summaries surface real data from each agent type |
| `synthesizer.test.ts` | Digest logic handles multi-agent envelope combinations |
| `showcase.test.ts` | Cached run is complete, valid, and n8n artifact imports correctly |

The showcase test suite (5 tests) is particularly important — it guards against the warmed cache rotting silently. It validates event order, agent delivery status, n8n artifact validity, synthesis structure, and fallback behavior.

```bash
npm run test:run    # single run
npm run test        # watch mode
```

---

## Security

- **API keys are never committed.** `.env.local` is in `.gitignore`. The repo ships `.env.local.example` with empty placeholders only.
- **Keys are lazy-initialized** at first API call — `npm run build` passes cleanly with zero env vars set.
- **Verified:** `git log -S GROQ_API_KEY` returns empty. Keys have never touched git history.
- **Remote check:** `.env.local` returns 404 on GitHub. Not tracked, not present.

---

## Roadmap

| Wave | Capabilities | Status |
|---|---|---|
| **MVP-4** | Orchestrator · Research · Data · Automation · Synthesizer | ✅ Shipped |
| **Wave 2** | Content agent (copy, blog, social) · Run history + replay gallery | 🔜 Next |
| **Wave 3** | Builder (code generation) · Audit (cross-agent verification) | 🔮 Designed |

---

<div align="center">

Built by **[Oussama Skia (SKAY)](https://github.com/skayy47)** — AI Engineer · Data Scientist

*MAESTRO demonstrates multi-agent AI system design, real-time streaming, and engineering depth.*  
*Not a vibe-coded demo — every artifact is verifiable.*

</div>
