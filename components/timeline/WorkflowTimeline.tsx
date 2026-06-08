"use client";

import { useMemo } from "react";
import { AGENTS, MVP_AGENTS } from "@/lib/agents/registry";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import type { StreamEvent } from "@/lib/hooks/useOrchestraate";

interface WorkflowTimelineProps {
  events: StreamEvent[];
  loading: boolean;
}

/** Bottom bar — live execution pipeline showing agent run state. */
export function WorkflowTimeline({ events, loading }: WorkflowTimelineProps) {
  const { activeAgent } = useTheme();

  // Derive which agents have started / completed from the event stream
  const agentState = useMemo(() => {
    const started = new Set<string>();
    const done = new Set<string>();
    for (const e of events) {
      if (e.type === "agent_start") started.add((e.data as any).agent);
      if (e.type === "agent_done") done.add((e.data as any).agent);
    }
    return { started, done };
  }, [events]);

  const currentlyRunning = useMemo(() => {
    // An agent that has started but not yet finished
    for (const id of agentState.started) {
      if (!agentState.done.has(id)) return id;
    }
    return null;
  }, [agentState]);

  return (
    <div className="glass flex items-center gap-4 px-5 py-3">
      <p className="eyebrow shrink-0">Workflow</p>

      <div className="flex flex-1 items-center">
        {MVP_AGENTS.map((id, i) => {
          const a = AGENTS[id];
          const isActive = activeAgent === id;
          const isDone = agentState.done.has(id);
          const isRunning = currentlyRunning === id;

          return (
            <div key={id} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-500",
                    isRunning && "animate-pulse",
                  )}
                  style={{
                    background: isDone || isActive || isRunning
                      ? a.core
                      : `rgb(${a.rgb} / 0.25)`,
                    boxShadow:
                      isRunning
                        ? `0 0 14px ${a.core}`
                        : isDone
                          ? `0 0 6px ${a.core}60`
                          : "none",
                  }}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] transition-colors duration-300",
                    isDone
                      ? "text-text-primary"
                      : isRunning
                        ? "text-text-primary"
                        : "text-text-tertiary",
                  )}
                >
                  {a.label}
                </span>
                {isDone && (
                  <span className="font-mono text-[9px] text-text-tertiary">✓</span>
                )}
              </div>
              {i < MVP_AGENTS.length - 1 ? (
                <div
                  className="mx-3 h-px flex-1 transition-all duration-500"
                  style={{
                    background: isDone
                      ? `linear-gradient(90deg, rgb(${a.rgb} / 0.4), rgba(255,255,255,0.05))`
                      : "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <span className="shrink-0 font-mono text-[10px] text-text-tertiary">
        {loading
          ? currentlyRunning
            ? `running: ${AGENTS[currentlyRunning as keyof typeof AGENTS]?.label ?? currentlyRunning}`
            : "planning…"
          : agentState.done.size > 0
            ? `${agentState.done.size} agent${agentState.done.size > 1 ? "s" : ""} complete`
            : "idle"}
      </span>
    </div>
  );
}
