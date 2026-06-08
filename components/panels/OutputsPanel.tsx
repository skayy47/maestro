"use client";

import { motion } from "framer-motion";
import { Radio, Check, AlertCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { StreamEvent } from "@/lib/hooks/useOrchestraate";

interface OutputsPanelProps {
  events: StreamEvent[];
  loading: boolean;
}

export function OutputsPanel({ events, loading }: OutputsPanelProps) {
  const agentDoneEvents = events.filter((e) => e.type === "agent_done");
  const synthesisEvent = events.find(
    (e) => e.type === "synthesis" && (e.data as any)?.deliverable
  );

  if (!loading && agentDoneEvents.length === 0 && !synthesisEvent) {
    return (
      <GlassPanel eyebrow="Live Outputs" className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-white/[0.08] bg-white/[0.02]">
            <Radio className="h-6 w-6 text-text-tertiary" />
          </div>
          <p className="font-display text-sm text-text-secondary">
            Awaiting performance
          </p>
          <p className="max-w-[220px] font-sans text-xs leading-relaxed text-text-tertiary">
            Agent results stream here as the orchestra plays.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel eyebrow="Live Outputs" className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {/* Agent results */}
        {agentDoneEvents.map((event, i) => {
          const envelope = event.data as any;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-accent/30 bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                <span className="font-display text-xs font-semibold text-text-primary capitalize">
                  {envelope.agent}
                </span>
                <span className="ml-auto font-mono text-[10px] text-text-tertiary">
                  {envelope.timing_ms}ms
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                {envelope.reasoning}
              </p>
              {envelope.output?.confidence ? (
                <p className="mt-1 font-mono text-[9px] text-text-tertiary">
                  confidence: {(envelope.output.confidence * 100).toFixed(0)}%
                </p>
              ) : null}
            </motion.div>
          );
        })}

        {/* Synthesis */}
        {synthesisEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-accent/50 bg-accent/10 p-3"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              <span className="font-display text-xs font-semibold text-text-primary">
                Synthesis
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              {(synthesisEvent.data as any).executive_summary}
            </p>
          </motion.div>
        ) : null}

        {/* Loading state */}
        {loading && agentDoneEvents.length > 0 ? (
          <motion.div className="flex items-center gap-2 text-[10px] text-text-tertiary">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Radio className="h-3 w-3" />
            </motion.span>
            Orchestrating…
          </motion.div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
