"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * The Orchestrator core — the conducting brain at the center of the orchestra.
 * Breathes at idle; glows in the live agent color. Clicking resets to the
 * Orchestrator (home) theme.
 */
export function OrchestratorCore() {
  const { setActiveAgent } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setActiveAgent("orchestrator")}
      aria-label="Orchestrator core — reset to home theme"
      className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 outline-none"
    >
      {/* outer halo */}
      <motion.span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 250,
          height: 250,
          background:
            "radial-gradient(circle, rgb(var(--agent-rgb) / 0.26), transparent 65%)",
          filter: "blur(6px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* rotating accent ring with a traveling node */}
      <motion.span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: 172,
          height: 172,
          borderColor: "rgb(var(--agent-rgb) / 0.35)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute -top-[3px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
          style={{ background: "var(--agent)", boxShadow: "0 0 12px var(--agent)" }}
        />
      </motion.span>

      {/* the core */}
      <motion.span
        className="relative grid h-28 w-28 place-items-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgb(var(--agent-rgb) / 0.95), rgb(var(--agent-deep-rgb) / 0.5) 58%, rgba(10,12,18,0.92))",
          boxShadow:
            "0 0 60px -8px var(--agent), inset 0 0 28px -10px rgba(255,255,255,0.9)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain className="h-9 w-9 text-white/90" strokeWidth={1.5} />
      </motion.span>
    </button>
  );
}
