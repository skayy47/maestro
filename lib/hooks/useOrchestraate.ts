/**
 * useOrchestrate — SSE streaming hook
 * Sends a mission, listens to /api/orchestrate SSE stream,
 * yields events as they arrive (plan, agent updates, final result).
 */

import { useCallback, useState } from "react";

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

  const conduct = useCallback(async (mission: string) => {
    if (!mission.trim()) {
      setState((s) => ({ ...s, error: "Mission cannot be empty" }));
      return;
    }

    setState({ loading: true, error: null, events: [] });

    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const events: StreamEvent[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines.shift();
            if (dataLine?.startsWith("data: ")) {
              try {
                const data = JSON.parse(dataLine.slice(6));
                const event: StreamEvent = { type: eventType as StreamEvent["type"], data };
                events.push(event);
                setState((s) => ({ ...s, events: [...s.events, event] }));
              } catch (e) {
                console.error("Failed to parse SSE data:", dataLine);
              }
            }
          }
        }
      }

      setState((s) => ({ ...s, loading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, events: [] });
  }, []);

  return { ...state, conduct, reset };
}
