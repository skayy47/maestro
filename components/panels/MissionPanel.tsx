"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

const EXAMPLES = [
  "Analyze a startup idea and create a launch strategy.",
  "Research the MENA fintech market and design a lead-capture automation.",
  "Take this sales data, find the trends, turn them into an action plan.",
];

/** Left panel — where a mission is conducted. (Engine wires up next phase.) */
export function MissionPanel() {
  const [mission, setMission] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <GlassPanel eyebrow="Mission" className="flex h-full flex-col">
      <textarea
        value={mission}
        onChange={(e) => setMission(e.target.value)}
        placeholder="Give MAESTRO a mission…"
        className="min-h-[120px] flex-1 resize-none rounded-xl border border-white/[0.05] bg-obsidian-900/60 p-3 font-sans text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
      />

      <div className="mt-3 flex flex-col gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setMission(ex)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-left font-mono text-[10px] leading-snug text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            {ex}
          </button>
        ))}
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() =>
          setStatus("engine offline — orchestration lands in the next build phase")
        }
        disabled={!mission.trim()}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.15] py-2.5 font-display text-sm font-semibold text-text-primary transition hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" />
        Conduct
      </motion.button>

      <p className="mt-2 h-4 font-mono text-[10px] text-text-tertiary">
        {status ? `▮ ${status}` : "▮ engine: standby"}
      </p>
    </GlassPanel>
  );
}
