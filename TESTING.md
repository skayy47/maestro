# MAESTRO — Testing Strategy

> The system's job is to **deliver real value**, not status messages. This
> strategy targets the failure modes that would silently break that promise.

## Testing pyramid

```
            ┌─────────────────┐
            │   E2E (manual)  │   Few · full orchestration via preview
            ├─────────────────┤
            │   Integration   │   Some · SSE route → agents → synthesis
            ├─────────────────┤
            │   Unit (vitest) │   Many · pure logic, fast, deterministic
            └─────────────────┘
```

Most confidence comes from fast unit tests over the **pure logic** that decides
whether the user sees value. Network-bound agent calls are covered by a thin
integration smoke test and manual E2E, not mocked into oblivion.

## What we test, and why

| Area | Type | Why it's critical | Status |
|---|---|---|---|
| **SSE parser** (`lib/hooks/sse.ts`) | Unit | A parser bug here = "nothing happens on Conduct". The original dropped multi-event chunks. | ✅ `tests/sse.test.ts` |
| **agentHighlight** (`lib/agents/highlight.ts`) | Unit | Decides the one-line value shown per card. A regression here makes the panel feel empty again. | ✅ `tests/highlight.test.ts` |
| **synthesizer** (`lib/agents/synthesizer.ts`) | Unit | The final briefing is the deliverable. Must degrade gracefully if the LLM fails. | ✅ `tests/synthesizer.test.ts` |
| **Shared orchestration state** (`CommandCenter` → panels) | Manual/E2E | Split hook instances = events never reach outputs. Verified: single `useOrchestrate` lifted to `CommandCenter`. | ✅ verified |
| **Deliverable rendering** (`components/deliverables/*`) | E2E (preview) | The rich output (KPIs, sources, workflow) must render, not be discarded. | ✅ preview-verified |
| **Downloadable artifact** (`AutomationDeliverable`) | E2E (preview) | The n8n `workflow_json` must be valid, non-empty, downloadable. | ✅ 2.1KB valid JSON verified |
| **Orchestration route** (`/api/orchestrate`) | Integration | plan → agents → synthesis → done event sequence, error isolation per agent. | ⚠️ manual curl; automate later |
| **Agent envelopes** (research/data/automation) | Unit | Output schema conformance + graceful failure envelope. | ⚠️ gap — see below |

## Coverage targets

- **Pure logic** (`lib/hooks/sse`, `lib/agents/highlight`, `synthesizer` non-network paths): **100%** of branches. These are cheap and high-leverage.
- **Agent runners**: cover the **failure envelope** path (every agent returns a typed envelope even on error) — target each agent's catch block.
- **Components**: smoke-rendered via preview E2E; no per-pixel snapshot tests (brittle for a motion-heavy UI).
- **Route**: one happy-path integration test + one per-agent-failure isolation test.

## Example test cases (implemented)

```ts
// SSE — the regression that caused "nothing happens"
it("emits MULTIPLE events delivered in one chunk", () => {
  parser('event: agent_start\ndata: {"agent":"research"}\n\n'
       + 'event: agent_done\ndata: {"agent":"research","timing_ms":120}\n\n');
  expect(events.map(e => e.type)).toEqual(["agent_start", "agent_done"]);
});

// Highlight — must surface real output, never the status string
it("research → the headline (not the reasoning trace)", () => {
  expect(agentHighlight(env("research", { headline: "MENA $11B by 2031" })))
    .toBe("MENA $11B by 2031");
});

// Synthesizer — degrade gracefully when the LLM is down
it("falls back to a digest summary when the LLM throws", async () => {
  (callGroqJSON as any).mockRejectedValue(new Error("groq down"));
  const r = await synthesize("mission", [env("research", { headline: "H" }, 0.8)]);
  expect(r.executive_summary).toContain("specialist agent");
});
```

A failing test already paid for itself: the SSE suite caught a blank-line reset
bug that wiped the pending event type when a message split across reads.

## Known gaps / next

1. **Agent runner failure envelopes** — unit-test that `runResearch`/`runData`/
   `runAutomation` return a well-formed `failed` envelope when their upstream
   API throws (mock `fetch` / `callGroqJSON`).
2. **Route integration** — spin the handler in-process, assert the full event
   sequence and that one agent failing emits a recoverable `error` event
   without aborting the run.
3. **n8n schema validation** — assert `workflow_json` always has `nodes` +
   `connections` arrays so the downloaded artifact imports cleanly.
4. **Accessibility** — drawer focus trap + Escape (Escape done; trap pending).

## Running

```bash
npm test        # watch mode
npm run test:run  # single run (CI)
```
