"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AGENTS, type AgentId } from "@/lib/agents/registry";

interface AgentNodeProps {
  id: AgentId;
  active: boolean;
  dim?: boolean;
  onSelect: (id: AgentId) => void;
  style?: CSSProperties;
}

/**
 * A single agent neuron orbiting the core.
 *
 * Positioning and animation transforms are deliberately on SEPARATE elements:
 * the outer wrapper owns the `-translate-*` centering (so the circle's center
 * sits exactly on the orbit ring), while the inner motion element owns the
 * hover/float transforms. If both lived on one node, Framer Motion would
 * overwrite the Tailwind translate and the ring would drift off the core.
 * The label is absolutely positioned so its height never nudges the circle.
 */
export function AgentNode({ id, active, dim, onSelect, style }: AgentNodeProps) {
  const a = AGENTS[id];

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      <motion.button
        type="button"
        onClick={() => onSelect(id)}
        className="group relative block outline-none"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.96 }}
        animate={active ? { y: [0, -4, 0] } : { y: 0 }}
        transition={{
          duration: 3,
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
        }}
        aria-label={`${a.label} — ${a.role}`}
        aria-pressed={active}
      >
        {/* circle — anchored on the orbit ring */}
        <span
          className={cn(
            "grid h-14 w-14 place-items-center rounded-full border transition-all duration-300",
            dim ? "opacity-45" : "opacity-100",
          )}
          style={{
            borderColor: `rgb(${a.rgb} / ${active ? 0.9 : 0.45})`,
            background: `radial-gradient(circle at 50% 32%, rgb(${a.rgb} / ${
              active ? 0.32 : 0.14
            }), rgba(255,255,255,0.92) 72%)`,
            boxShadow: active
              ? `0 0 28px -4px rgb(${a.rgb} / 0.6), 0 6px 16px -8px rgb(${a.rgb} / 0.4)`
              : `0 0 16px -8px rgb(${a.rgb} / 0.4), 0 4px 12px -8px rgba(30,27,75,0.18)`,
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: a.core, boxShadow: `0 0 10px ${a.core}` }}
          />
        </span>

        {/* label — floats below the circle, out of flow */}
        <span className="absolute left-1/2 top-full mt-2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap leading-tight">
          <span
            className={cn(
              "font-display text-xs font-medium",
              dim ? "text-text-secondary" : "text-text-primary",
            )}
          >
            {a.label}
          </span>
          {dim ? (
            <span className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
              soon
            </span>
          ) : null}
        </span>
      </motion.button>
    </div>
  );
}
