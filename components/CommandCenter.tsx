"use client";

import { useState } from "react";
import { useOrchestrate } from "@/lib/hooks/useOrchestraate";
import { AgentOrbit } from "@/components/agents/AgentOrbit";
import { MissionPanel } from "@/components/panels/MissionPanel";
import { OutputsPanel } from "@/components/panels/OutputsPanel";
import { WorkflowTimeline } from "@/components/timeline/WorkflowTimeline";
import { ProfileLinks } from "@/components/ui/ProfileLinks";

/**
 * The MAESTRO command center — the AI operating system shell.
 *
 * Single source of truth: useOrchestrate() lives here only.
 * - conduct + loading + error → passed down to MissionPanel
 * - events + loading → passed down to OutputsPanel
 * - events + loading → passed down to WorkflowTimeline
 *
 * This ensures all panels share the same stream.
 */
export function CommandCenter() {
  const { events, loading, error, source, fellBack, conduct, playShowcase, reset } =
    useOrchestrate();

  // Bridge: an agent-orbit click asks the mission box to load a starter mission.
  // The nonce makes each pick distinct so repeated clicks re-trigger the effect.
  const [missionPrefill, setMissionPrefill] = useState<{ text: string; nonce: number } | null>(
    null
  );

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-4 p-4 lg:p-6">
      {/* Header — lifted above the panels so profile tooltips (which drop into
          the grid area) paint over the backdrop-filter panels, not behind. */}
      <header className="relative z-30 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="wordmark-iridescent font-display text-xl font-bold tracking-tight">
            MAESTRO
          </span>
          <span className="hidden font-sans text-sm text-text-tertiary sm:inline">
            One mission. Many minds. One Maestro.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ProfileLinks />
          <span className="hidden h-5 w-px bg-lift/[0.12] sm:block" />
          <div className="hidden items-center gap-4 font-mono text-[10px] text-text-tertiary sm:flex">
            <span className="hidden lg:inline">v0.1 · ivory-cognition</span>
            {loading ? (
              <span className="flex items-center gap-1.5 text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                orchestrating
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                interface online
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main grid: mission · stage · outputs */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px]">
        <MissionPanel
          loading={loading}
          error={error}
          conduct={conduct}
          onPlayShowcase={playShowcase}
          onReset={reset}
          prefill={missionPrefill}
        />
        <div className="flex items-center justify-center py-6">
          <AgentOrbit
            onPickMission={(text) => setMissionPrefill({ text, nonce: Date.now() })}
          />
        </div>
        <OutputsPanel
          events={events}
          loading={loading}
          source={source}
          fellBack={fellBack}
        />
      </div>

      {/* Execution timeline */}
      <WorkflowTimeline events={events} loading={loading} />
    </main>
  );
}
