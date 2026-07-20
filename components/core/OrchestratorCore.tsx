"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { AGENTS } from "@/lib/agents/registry";

const PULSES = [0, 1, 2];

/**
 * The CSS orb — previously the core itself, now the instant-paint fallback
 * while the 3D gem's chunk loads (and the no-WebGL degradation path).
 */
function CssCoreFallback() {
  return (
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
    />
  );
}

// The 3D gem is client-only and code-split: first paint shows the CSS orb,
// the gem fades in when its chunk arrives.
const CoreGem = dynamic(() => import("@/components/core/CoreGem"), {
  ssr: false,
  loading: () => <CssCoreFallback />,
});

/**
 * The Orchestrator core — the conducting brain at the center of the orchestra.
 *
 * Motion concept "Conducting Pulse": the core *broadcasts* — rhythmic signal
 * rings emanate outward like a conductor's beat rippling to the orchestra —
 * while the real-3D Conductor's Gem (see CoreGem.tsx) breathes at the center,
 * re-lighting itself in the live agent color. Clicking resets to the
 * Orchestrator theme.
 *
 * Note: animated layers center via Framer's own `x/y` (not Tailwind
 * `-translate-*`), because Framer owns the `transform` property and would
 * otherwise wipe a CSS translate.
 */
export function OrchestratorCore() {
  const { activeAgent, setActiveAgent } = useTheme();
  const reduced = useReducedMotion() ?? false;
  const identity = AGENTS[activeAgent] ?? AGENTS.orchestrator;

  return (
    <button
      type="button"
      onClick={() => setActiveAgent("orchestrator")}
      aria-label="Orchestrator core — reset to home theme"
      className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--agent)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent rounded-full"
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

      {/* the Conductor's Gem — real 3D, sized well beyond the button so the
          sparkle field and glow can breathe; clicks pass through to the button */}
      <motion.span
        className="pointer-events-none absolute left-1/2 top-1/2 block"
        style={{ width: 250, height: 250, x: "-50%", y: "-50%" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <CoreGem
          colorHex={identity.core}
          deepHex={identity.deep}
          reduced={reduced}
        />
      </motion.span>
    </button>
  );
}
