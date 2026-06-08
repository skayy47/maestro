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
 * A single agent neuron orbiting the core. Shows its own instrument color;
 * selecting it themes the whole UI to that agent.
 */
export function AgentNode({ id, active, dim, onSelect, style }: AgentNodeProps) {
  const a = AGENTS[id];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      style={style}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 outline-none"
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.96 }}
      animate={active ? { y: [0, -4, 0] } : { y: 0 }}
      transition={{ duration: 3, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      aria-label={`${a.label} — ${a.role}`}
      aria-pressed={active}
    >
      <span
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full border transition-all duration-300",
          dim ? "opacity-45" : "opacity-100",
        )}
        style={{
          borderColor: `rgb(${a.rgb} / ${active ? 0.9 : 0.4})`,
          background: `radial-gradient(circle at 50% 35%, rgb(${a.rgb} / ${
            active ? 0.45 : 0.2
          }), rgba(15,18,26,0.6) 70%)`,
          boxShadow: active
            ? `0 0 28px -4px rgb(${a.rgb} / 0.85)`
            : `0 0 16px -6px rgb(${a.rgb} / 0.5)`,
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: a.core, boxShadow: `0 0 10px ${a.core}` }}
        />
      </span>
      <span className="flex flex-col items-center leading-tight">
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
  );
}
