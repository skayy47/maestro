"use client";

import { AGENTS, ORBIT_AGENTS } from "@/lib/agents/registry";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { OrchestratorCore } from "@/components/core/OrchestratorCore";
import { AgentNode } from "@/components/agents/AgentNode";

const RADIUS = 42; // % of half-container

function polar(index: number, total: number) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
  return {
    left: 50 + RADIUS * Math.cos(angle),
    top: 50 + RADIUS * Math.sin(angle),
  };
}

/** The orbital layout: the conducting core ringed by agent neurons + synapses. */
export function AgentOrbit() {
  const { activeAgent, setActiveAgent } = useTheme();
  const total = ORBIT_AGENTS.length;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* resting synapse ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: "84%",
          height: "84%",
          borderColor: "rgba(167,139,250,0.1)",
        }}
      />

      {/* synapses from core to each neuron */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {ORBIT_AGENTS.map((id, i) => {
          const { left, top } = polar(i, total);
          const isActive = activeAgent === id;
          const a = AGENTS[id];
          return (
            <line
              key={id}
              x1={50}
              y1={50}
              x2={left}
              y2={top}
              stroke={isActive ? "var(--agent)" : `rgb(${a.rgb} / 0.16)`}
              strokeWidth={isActive ? 0.5 : 0.25}
            />
          );
        })}
      </svg>

      <OrchestratorCore />

      {ORBIT_AGENTS.map((id, i) => {
        const { left, top } = polar(i, total);
        return (
          <AgentNode
            key={id}
            id={id}
            active={activeAgent === id}
            dim={AGENTS[id].phase !== "mvp"}
            onSelect={setActiveAgent}
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
