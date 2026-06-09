/**
 * useOrchestrate — SSE streaming hook
 * Sends a mission to /api/orchestrate, reads the Server-Sent Events stream,
 * and accumulates typed events in React state as they arrive.
 *
 * SSE format per RFC:
 *   event: <type>\n
 *   data: <json>\n
 *   \n
 */

import { useCallback, useState } from "react";
import { makeSseParser } from "@/lib/hooks/sse";

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

export interface UseOrchestrateState {
  loading: boolean;
  error: string | null;
  events: StreamEvent[];
}

export function useOrchestrate() {
  const [state, setState] = useState<UseOrchestrateState>({
    loading: false,
    error: null,
    events: [],
  });

  const conduct = useCallback(
    async (mission: string, csv?: { name: string; content: string }) => {
    if (!mission.trim()) {
      setState((s) => ({ ...s, error: "Mission cannot be empty" }));
      return;
    }

    setState({ loading: true, error: null, events: [] });

    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, csv }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let carry = ""; // leftover from previous chunk (no trailing \n yet)

      const parser = makeSseParser((event) => {
        const typed: StreamEvent = {
          type: event.type as StreamEvent["type"],
          data: event.data,
        };
        setState((s) => ({ ...s, events: [...s.events, typed] }));
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = carry + decoder.decode(value, { stream: true });
        // Keep the last incomplete line as carry-over for next chunk
        const lastNl = chunk.lastIndexOf("\n");
        if (lastNl === -1) {
          carry = chunk;
          continue;
        }
        const complete = chunk.slice(0, lastNl + 1);
        carry = chunk.slice(lastNl + 1);

        parser(complete);
      }

      // Process any remaining carry
      if (carry) parser(carry);

      setState((s) => ({ ...s, loading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useOrchestrate] error:", message);
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, events: [] });
  }, []);

  return { ...state, conduct, reset };
}
