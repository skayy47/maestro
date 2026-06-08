"use client";

import { useOrchestrate } from "@/lib/hooks/useOrchestraate";
import { AgentOrbit } from "@/components/agents/AgentOrbit";
import { MissionPanel } from "@/components/panels/MissionPanel";
import { OutputsPanel } from "@/components/panels/OutputsPanel";
import { WorkflowTimeline } from "@/components/timeline/WorkflowTimeline";

/** The MAESTRO command center — the AI operating system shell. */
export function CommandCenter() {
  const { events, loading } = useOrchestrate();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-4 p-4 lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-glow font-display text-xl font-bold tracking-tight text-text-primary">
            MAESTRO
          </span>
          <span className="hidden font-sans text-sm text-text-tertiary sm:inline">
            One mission. Many minds. One Maestro.
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] text-text-tertiary">
          <span className="hidden sm:inline">v0.1 · neural-obsidian</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            interface online
          </span>
        </div>
      </header>

      {/* Main grid: mission · stage · outputs */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px]">
        <MissionPanel />
        <div className="flex items-center justify-center py-6">
          <AgentOrbit />
        </div>
        <OutputsPanel events={events} loading={loading} />
      </div>

      {/* Execution timeline */}
      <WorkflowTimeline />
    </main>
  );
}
