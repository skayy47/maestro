"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AGENTS, type AgentId } from "@/lib/agents/registry";

interface ThemeContextValue {
  /** The agent the whole UI is currently themed to. */
  activeAgent: AgentId;
  setActiveAgent: (id: AgentId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Drives the `--agent*` CSS variables off the active agent. Every accent in the
 * app reads those vars, so changing the active agent makes the entire UI breathe
 * to that agent's bioluminescent color (WOW #2 — the theme engine).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeAgent, setActiveAgent] = useState<AgentId>("orchestrator");

  useEffect(() => {
    const a = AGENTS[activeAgent];
    const root = document.documentElement;
    root.style.setProperty("--agent", a.core);
    root.style.setProperty("--agent-deep", a.deep);
    root.style.setProperty("--agent-rgb", a.rgb);
    root.style.setProperty("--agent-deep-rgb", a.deepRgb);
  }, [activeAgent]);

  return (
    <ThemeContext.Provider value={{ activeAgent, setActiveAgent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
