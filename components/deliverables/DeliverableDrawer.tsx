"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AGENTS, type AgentId } from "@/lib/agents/registry";
import type {
  AgentEnvelope,
  ResearchOutput,
  DataOutput,
  AutomationOutput,
  SynthesisOutput,
} from "@/lib/agents/envelopes";
import { ResearchDeliverable } from "./ResearchDeliverable";
import { DataDeliverable } from "./DataDeliverable";
import { AutomationDeliverable } from "./AutomationDeliverable";
import { SynthesisDeliverable } from "./SynthesisDeliverable";

export type DrawerItem =
  | { kind: "agent"; envelope: AgentEnvelope }
  | { kind: "synthesis"; output: SynthesisOutput };

interface DeliverableDrawerProps {
  item: DrawerItem | null;
  onClose: () => void;
}

function drawerMeta(item: DrawerItem) {
  if (item.kind === "synthesis") {
    return {
      accent: AGENTS.orchestrator.core,
      title: "Synthesis",
      subtitle: "The conductor's final briefing",
      timing: undefined as number | undefined,
    };
  }
  const id = item.envelope.agent as AgentId;
  const a = AGENTS[id] ?? AGENTS.orchestrator;
  return {
    accent: a.core,
    title: a.label,
    subtitle: a.role,
    timing: item.envelope.timing_ms,
  };
}

function DeliverableBody({ item }: { item: DrawerItem }) {
  if (item.kind === "synthesis") {
    return <SynthesisDeliverable output={item.output as SynthesisOutput} />;
  }
  const { agent, output } = item.envelope;
  if (agent === "research") return <ResearchDeliverable output={output as ResearchOutput} />;
  if (agent === "data") return <DataDeliverable output={output as DataOutput} />;
  if (agent === "automation") return <AutomationDeliverable output={output as AutomationOutput} />;
  // Fallback: dump reasoning for unknown agents
  return (
    <p className="text-[13px] leading-relaxed text-text-secondary">
      {item.envelope.reasoning}
    </p>
  );
}

export function DeliverableDrawer({ item, onClose }: DeliverableDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  const meta = item ? drawerMeta(item) : null;

  return (
    <AnimatePresence>
      {item && meta ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="glass fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[520px] flex-col rounded-none border-l p-0"
            style={{ borderColor: `${meta.accent}33` }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-5"
              style={{ background: `${meta.accent}0A` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: meta.accent, boxShadow: `0 0 12px ${meta.accent}` }}
                />
                <div>
                  <p className="font-display text-base font-bold text-text-primary">
                    {meta.title}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    {meta.subtitle}
                    {meta.timing != null ? ` · ${meta.timing}ms` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-text-tertiary transition hover:border-white/20 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <DeliverableBody item={item} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
