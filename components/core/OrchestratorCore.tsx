"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";

const PULSES = [0, 1, 2];

/**
 * The Orchestrator core — the conducting brain at the center of the orchestra.
 *
 * Motion concept "Conducting Pulse": instead of a rotating ring, the core
 * *broadcasts* — rhythmic signal rings emanate outward like a conductor's beat
 * rippling to the orchestra (and a neural pulse), while a slow energy sheen
 * sweeps inside the brain so it reads as alive, not mechanical. Everything
 * glows in the live agent color. Clicking resets to the Orchestrator theme.
 *
 * Note: animated layers center via Framer's own `x/y` (not Tailwind
 * `-translate-*`), because Framer owns the `transform` property and would
 * otherwise wipe a CSS translate.
 */
export function OrchestratorCore() {
  const { setActiveAgent } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setActiveAgent("orchestrator")}
      aria-label="Orchestrator core — reset to home theme"
      className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center outline-none"
    >
      {/* conducting pulses — rhythmic rings emanating outward */}
      {PULSES.map((i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: 140,
            height: 140,
            x: "-50%",
            y: "-50%",
            borderColor: "rgb(var(--agent-rgb) / 0.5)",
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2], opacity: [0.55, 0] }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 1.2,
          }}
        />
      ))}

      {/* breathing ambient halo */}
      <motion.span
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 230,
          height: 230,
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgb(var(--agent-rgb) / 0.26), transparent 65%)",
          filter: "blur(6px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* the core */}
      <motion.span
        className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 32%, rgb(var(--agent-rgb) / 1), rgb(var(--agent-deep-rgb) / 0.92) 62%, rgb(var(--agent-deep-rgb) / 0.78))",
          boxShadow:
            "0 12px 40px -8px rgb(var(--agent-rgb) / 0.55), inset 0 1px 14px -4px rgba(255,255,255,0.85)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* slow energy sheen sweeping inside the brain — "thinking" */}
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgb(var(--agent-rgb) / 0.35) 70deg, transparent 150deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <Brain className="relative h-9 w-9 text-white/90" strokeWidth={1.5} />
      </motion.span>
    </button>
  );
}
