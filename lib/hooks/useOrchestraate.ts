/**
 * useOrchestrate — SSE streaming hook + warmed-showcase replay.
 *
 * Live: POSTs a mission to /api/orchestrate and accumulates SSE events.
 * Showcase: replays a pre-baked run with staggered timing so it looks live.
 * Fallback: if a live run can't deliver (network error, or every agent
 *   rate-limited), it gracefully falls back to a showcase instead of showing
 *   a wall of error cards.
 */

import { useCallback, useRef, useState } from "react";
import { makeSseParser } from "@/lib/hooks/sse";
import { getShowcase } from "@/lib/showcase/missions";

export interface StreamEvent {
  type:
    | "plan"
    | "agent_start"
    | "token"
    | "agent_done"
    | "synthesis"
    | "done"
    | "error";
  data: unknown;
}

export type RunSource = "live" | "showcase" | null;

export interface UseOrchestrateState {
  loading: boolean;
  error: string | null;
  events: StreamEvent[];
  /** Where the current run came from. */
  source: RunSource;
  /** True when a showcase is playing because a live run failed. */
  fellBack: boolean;
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hard ceiling on a single live run before we abort and fall back. */
const LIVE_TIMEOUT_MS = 45000;

/** Per-event pacing so a replay feels like a live performance. */
function delayFor(event: StreamEvent): number {
  if (reducedMotion()) return 0;
  switch (event.type) {
    case "plan":
      return 350;
    case "agent_start":
      return 180;
    case "agent_done":
      return 750; // the "work" beat
    case "synthesis":
      return (event.data as any)?.status === "synthesizing" ? 250 : 650;
    case "done":
      return 150;
    default:
      return 60;
  }
}

export function useOrchestrate() {
  const [state, setState] = useState<UseOrchestrateState>({
    loading: false,
    error: null,
    events: [],
    source: null,
    fellBack: false,
  });

  // Token to cancel a stale replay when a new run starts.
  const runIdRef = useRef(0);
  // Controller for the in-flight live fetch, so we can abort it (timeout,
  // reset, or a new run superseding it) instead of leaking a stream.
  const abortRef = useRef<AbortController | null>(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  /** Replay a cached event sequence with staggered timing. */
  const replay = useCallback(
    async (events: StreamEvent[], opts: { fellBack: boolean }) => {
      cancelInFlight();
      const myRun = ++runIdRef.current;
      setState({
        loading: true,
        error: null,
        events: [],
        source: "showcase",
        fellBack: opts.fellBack,
      });

      for (const event of events) {
        await sleep(delayFor(event));
        if (runIdRef.current !== myRun) return; // superseded
        setState((s) => ({ ...s, events: [...s.events, event] }));
      }
      if (runIdRef.current === myRun) {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [cancelInFlight]
  );

  const playShowcase = useCallback(
    (id?: string) => replay(getShowcase(id).events, { fellBack: false }),
    [replay]
  );

  const conduct = useCallback(
    async (mission: string, csv?: { name: string; content: string }) => {
      if (!mission.trim()) {
        setState((s) => ({ ...s, error: "Mission cannot be empty" }));
        return;
      }

      cancelInFlight();
      const myRun = ++runIdRef.current;
      setState({ loading: true, error: null, events: [], source: "live", fellBack: false });

      const collected: StreamEvent[] = [];
      const controller = new AbortController();
      abortRef.current = controller;
      // Don't let a hung server spin forever — abort and fall back.
      const timeout = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

      try {
        const response = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission, csv }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`API error ${response.status}: ${response.statusText}`);
        if (!response.body) throw new Error("No response body from server");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let carry = "";

        const parser = makeSseParser((event) => {
          const typed: StreamEvent = {
            type: event.type as StreamEvent["type"],
            data: event.data,
          };
          collected.push(typed);
          setState((s) => ({ ...s, events: [...s.events, typed] }));
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = carry + decoder.decode(value, { stream: true });
          const lastNl = chunk.lastIndexOf("\n");
          if (lastNl === -1) {
            carry = chunk;
            continue;
          }
          parser(chunk.slice(0, lastNl + 1));
          carry = chunk.slice(lastNl + 1);
        }
        if (carry) parser(carry);

        if (runIdRef.current !== myRun) return; // superseded by a newer run

        // Soft-failure: the run completed but no agent actually delivered
        // (e.g. every call rate-limited). Fall back to a showcase.
        const delivered = collected.some(
          (e) => e.type === "agent_done" && (e.data as any)?.status === "complete"
        );
        if (!delivered) {
          console.warn("[useOrchestrate] live run delivered nothing — falling back to showcase.");
          await replay(getShowcase().events, { fellBack: true });
          return;
        }

        setState((s) => ({ ...s, loading: false }));
      } catch (err) {
        // Superseded by a newer run or a deliberate reset → stay silent.
        if (runIdRef.current !== myRun) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[useOrchestrate] live error, falling back to showcase:", message);
        // Hard failure (network/server/timeout) → graceful showcase fallback.
        await replay(getShowcase().events, { fellBack: true });
      } finally {
        clearTimeout(timeout);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [replay, cancelInFlight]
  );

  const reset = useCallback(() => {
    cancelInFlight();
    runIdRef.current++;
    setState({ loading: false, error: null, events: [], source: null, fellBack: false });
  }, [cancelInFlight]);

  return { ...state, conduct, playShowcase, reset };
}
