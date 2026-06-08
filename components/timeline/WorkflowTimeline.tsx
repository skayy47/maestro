"use client";

import { AGENTS, MVP_AGENTS } from "@/lib/agents/registry";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";

/** Bottom panel — the execution pipeline for the MVP-4 agents. */
export function WorkflowTimeline() {
  const { activeAgent } = useTheme();

  return (
    <div className="glass flex items-center gap-4 px-5 py-3">
      <p className="eyebrow shrink-0">Workflow</p>

      <div className="flex flex-1 items-center">
        {MVP_AGENTS.map((id, i) => {
          const a = AGENTS[id];
          const isActive = activeAgent === id;
          return (
            <div key={id} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                  style={{
                    background: isActive ? a.core : `rgb(${a.rgb} / 0.3)`,
                    boxShadow: isActive ? `0 0 10px ${a.core}` : "none",
                  }}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] transition-colors",
                    isActive ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {a.label}
                </span>
              </div>
              {i < MVP_AGENTS.length - 1 ? (
                <div
                  className="mx-3 h-px flex-1"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <span className="shrink-0 font-mono text-[10px] text-text-tertiary">
        idle
      </span>
    </div>
  );
}
