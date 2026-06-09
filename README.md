<div align="center">

# 🎼 MAESTRO

### One mission. Many minds. One Maestro.

**A multi-agent AI command center where specialist agents collaborate to turn a single mission into a complete, verifiable solution.**

`Next.js 14` · `TypeScript` · `Groq Llama 3.3 70B` · `Tavily` · `Framer Motion` · `SSE streaming`

</div>

---

## What it is

You give MAESTRO one mission — *"Research the EV market and design a lead-capture automation"* — and an orchestrating intelligence plans the work, summons the right specialist agents, runs them as a streaming pipeline, and synthesizes their outputs into one decision-ready briefing.

It is not a chatbot. Every agent is grounded in **real tools** and returns a **typed, verifiable deliverable** — a sourced market brief, an analysis of your real data, or a workflow you can download and import into n8n.

## Why it's interesting (the engineering)

- **Real orchestration, not a prompt chain.** The Orchestrator is an LLM planner that reads a mission and returns a DAG of agents (who runs, in what order, why), then the engine executes it.
- **Server-Sent Events streaming.** `POST /api/orchestrate` returns a live event stream — `plan → agent_start → token → agent_done → synthesis → done` — rendered in real time.
- **Grounded agents with real artifacts:**
  - 🔍 **Research** — live web search via Tavily; sources are the **real retrieved URLs**, never LLM-invented.
  - 📊 **Data** — upload a CSV and it computes **real statistics** (the KPIs are exact means of your data) and renders an actual chart. No file? It analyzes a clearly-labelled illustrative sample.
  - ⚡ **Automation** — designs a workflow and compiles **valid, importable n8n JSON** (real node types, wired connections, trigger node) — download it and run it.
- **Resilience built in.** A model fallback chain (70B → 8B) plus retry-with-backoff rides out rate limits so a live demo doesn't collapse into error cards.
- **Honest about its limits.** The planner flags missions that need capabilities outside its roster (content writing, code, audit) instead of silently passing off a research brief as the thing you asked for.

## The agent model

Every agent is built on four pillars:

| Pillar | What it means |
|---|---|
| **Persona** | A specialist identity and voice |
| **Reasoning framework** | An explicit method (scan → triangulate → synthesize, etc.) |
| **Real grounded tools** | Tavily search, CSV stats, n8n compilation — not just text |
| **Typed output contract** | A structured envelope the UI renders richly |

## Architecture

```
Mission
   │
   ▼
┌─────────────┐   plans a DAG
│ Orchestrator│──────────────►  [ Research ] [ Data ] [ Automation ]
└─────────────┘                       │         │          │
   │  scope check                      └────┬────┴────┬─────┘
   │                                        ▼         ▼
   │                                  typed envelopes (SSE)
   ▼                                        │
Synthesis  ◄────────────────────────────────┘
(executive briefing: summary, findings, the deliverable, next steps)
```

## Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **LLM:** Groq — Llama 3.3 70B (primary) with Llama 3.1 8B fallback, JSON-mode for structured output
- **Web search:** Tavily
- **Streaming:** Next.js API route → `ReadableStream` of Server-Sent Events
- **UI:** Tailwind CSS, Framer Motion — a custom **"Neural Obsidian"** design system (near-black surfaces, 7 bioluminescent per-agent accents driven by a single `--agent` CSS variable, dark liquid glass)
- **Testing:** Vitest (43 unit tests over the orchestration-critical pure logic)

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
#   then add your keys:
#   GROQ_API_KEY   → https://console.groq.com/keys
#   TAVILY_API_KEY → https://tavily.com

# 3. Run
npm run dev
#   open http://localhost:3000

# 4. Test
npm run test:run
```

## Project layout

```
app/api/orchestrate   SSE orchestration route
lib/agents            orchestrator, research, data, automation, synthesizer,
                      n8n compiler, CSV analyzer, stats, registry
lib/llm               Groq client (model fallback + retry/backoff)
components/deliverables  rich per-agent deliverable renderers + drawer
components/panels      mission input, live outputs
TESTING.md            test strategy
```

## Roadmap

MAESTRO ships with **MVP-4**: Orchestrator + Research + Data + Automation.

- **Wave 2:** Content agent · run persistence + replay gallery
- **Wave 3:** Builder (code generation) · Audit (cross-agent verification)
- **Next:** warmed showcase cache for offline-proof demos

## License

Personal portfolio project.

---

<div align="center">

Built by **Oussama Skia (SKAY)** — AI Engineer / Data Scientist

</div>
