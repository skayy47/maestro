"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Radio, Check, Sparkles, ChevronRight, Loader2, AlertTriangle, PlayCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AGENTS, type AgentId } from "@/lib/agents/registry";
import type { StreamEvent, RunSource } from "@/lib/hooks/useOrchestraate";
import type { AgentEnvelope, SynthesisOutput } from "@/lib/agents/envelopes";
import { agentHighlight } from "@/lib/agents/highlight";
import { DeliverableDrawer, type DrawerItem } from "@/components/deliverables/DeliverableDrawer";

interface OutputsPanelProps {
  events: StreamEvent[];
  loading: boolean;
  source?: RunSource;
  fellBack?: boolean;
}

export function OutputsPanel({ events, loading, source, fellBack }: OutputsPanelProps) {
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);

  const agentDoneEvents = useMemo(
    () => events.filter((e) => e.type === "agent_done"),
    [events]
  );

  // The final synthesis carries executive_summary + key_findings.
  const synthesis = useMemo(() => {
    const ev = [...events]
      .reverse()
      .find(
        (e) =>
          e.type === "synthesis" &&
          (e.data as any)?.executive_summary &&
          (e.data as any)?.key_findings
      );
    return ev ? (ev.data as SynthesisOutput) : null;
  }, [events]);

  const synthesizing = useMemo(
    () => events.some((e) => e.type === "synthesis" && (e.data as any)?.status === "synthesizing"),
    [events]
  );

  const hasError = useMemo(
    () => events.find((e) => e.type === "error"),
    [events]
  );

  // Honest scope notice — from the planner's scope_assessment.
  const scope = useMemo(() => {
    const plan = events.find((e) => e.type === "plan");
    const sa = (plan?.data as any)?.scope_assessment;
    if (sa && (sa.in_scope === false || (sa.missing_capabilities?.length ?? 0) > 0)) {
      return sa as { in_scope: boolean; missing_capabilities: string[]; note: string };
    }
    return null;
  }, [events]);

  // Empty state
  if (!loading && agentDoneEvents.length === 0 && !synthesis) {
    return (
      <GlassPanel eyebrow="Live Outputs" className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-lift/[0.10] bg-lift/[0.03]">
            <Radio className="h-6 w-6 text-text-tertiary" />
          </div>
          <p className="font-display text-sm text-text-secondary">Awaiting performance</p>
          <p className="max-w-[220px] font-sans text-xs leading-relaxed text-text-tertiary">
            Agent deliverables stream here as the orchestra plays. Click any to open it.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel eyebrow="Live Outputs" className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
          {/* SHOWCASE / FALLBACK notice — honest about cached runs (icon + text) */}
          {source === "showcase" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                fellBack
                  ? "rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-2.5"
                  : "rounded-lg border border-accent/25 bg-accent/[0.06] p-2.5"
              }
            >
              <div className="flex items-center gap-1.5">
                <PlayCircle
                  className={fellBack ? "h-3.5 w-3.5 text-amber-600" : "h-3.5 w-3.5 text-accent"}
                />
                <span className="font-display text-[11px] font-semibold text-text-primary">
                  {fellBack ? "Showing a cached showcase" : "Showcase run"}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-text-tertiary">
                {fellBack
                  ? "The live API was unavailable, so MAESTRO replayed a pre-baked run. Try Conduct again for a live result."
                  : "A pre-baked run, replayed instantly — no API call. Conduct a mission of your own for a live result."}
              </p>
            </motion.div>
          ) : null}

          {/* SCOPE NOTICE — honest about what's outside the roster */}
          {scope ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-3"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-display text-[11px] font-semibold text-text-primary">
                  Partly outside MAESTRO&apos;s roster
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                {scope.note ||
                  "Some of this mission needs capabilities the current agents don't cover."}
              </p>
              {scope.missing_capabilities?.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {scope.missing_capabilities.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-amber-500/30 bg-amber-400/[0.12] px-2 py-0.5 font-mono text-[9px] text-amber-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-1.5 font-mono text-[9px] text-text-tertiary">
                the available agents still contributed what they can below
              </p>
            </motion.div>
          ) : null}

          {/* SYNTHESIS HERO — the deliverable */}
          {synthesis ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setDrawerItem({ kind: "synthesis", output: synthesis })}
              className="glass--active group w-full rounded-xl border p-3.5 text-left transition"
              style={{ borderColor: `${AGENTS.orchestrator.core}55` }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: AGENTS.orchestrator.core }} />
                <span className="font-display text-[12px] font-bold text-text-primary">
                  Deliverable ready
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-text-primary" />
              </div>
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-text-secondary">
                {synthesis.executive_summary}
              </p>
              <p className="mt-2 font-mono text-[10px]" style={{ color: AGENTS.orchestrator.core }}>
                open full briefing →
              </p>
            </motion.button>
          ) : synthesizing ? (
            <div className="flex items-center gap-2 rounded-xl border border-lift/[0.09] bg-lift/[0.03] p-3 text-[11px] text-text-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: AGENTS.orchestrator.core }} />
              Composing the final briefing…
            </div>
          ) : null}

          {/* AGENT CARDS — real highlights, click to open */}
          {agentDoneEvents.map((event, i) => {
            const envelope = event.data as AgentEnvelope;
            const id = envelope.agent as AgentId;
            const a = AGENTS[id] ?? AGENTS.orchestrator;
            const failed = envelope.status === "failed";
            return (
              <motion.button
                type="button"
                key={`${envelope.agent}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setDrawerItem({ kind: "agent", envelope })}
                className="group w-full rounded-lg border bg-lift/[0.03] p-3 text-left transition hover:bg-lift/[0.05]"
                style={{ borderColor: failed ? "rgba(244,63,94,0.3)" : `${a.core}33` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: a.core, boxShadow: `0 0 8px ${a.core}` }}
                  />
                  <span className="font-display text-[12px] font-semibold text-text-primary">
                    {a.label}
                  </span>
                  {!failed ? <Check className="h-3.5 w-3.5" style={{ color: a.core }} /> : null}
                  <span className="ml-auto font-mono text-[9px] text-text-tertiary">
                    {envelope.timing_ms}ms
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-text-secondary">
                  {failed ? envelope.reasoning : agentHighlight(envelope)}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  {envelope.confidence != null && !failed ? (
                    <span className="font-mono text-[9px] text-text-tertiary">
                      confidence {(envelope.confidence * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className="flex items-center gap-0.5 font-mono text-[9px] transition group-hover:gap-1.5"
                    style={{ color: a.core }}
                  >
                    open <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.button>
            );
          })}

          {/* Running indicator */}
          {loading && !synthesizing ? (
            <div className="flex items-center gap-2 px-1 py-1 text-[10px] text-text-tertiary">
              <Loader2 className="h-3 w-3 animate-spin" />
              orchestrating…
            </div>
          ) : null}

          {/* Fatal error (non-recoverable) */}
          {hasError && (hasError.data as any)?.recoverable === false ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/[0.08] p-2.5 text-[11px] text-rose-600">
              {(hasError.data as any).message}
            </div>
          ) : null}
        </div>
      </GlassPanel>

      {/* Focused reading view */}
      <DeliverableDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}
