import type { Config } from "tailwindcss";

/**
 * Neural Obsidian — MAESTRO design system.
 * The `accent` colors are driven at runtime by the active agent via CSS vars
 * (--agent-rgb / --agent-deep-rgb), so any `*-accent` utility breathes with the
 * theme engine. Static agent colors live under `agent-*`.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050609",
        obsidian: {
          900: "#0A0C12",
          800: "#0F121A",
          700: "#161A24",
          600: "#1E2330",
        },
        text: {
          primary: "#F4F6FB",
          secondary: "#A8B0C0",
          tertiary: "#5C6678",
        },
        // Live theme accent — follows the active agent.
        accent: "rgb(var(--agent-rgb) / <alpha-value>)",
        "accent-deep": "rgb(var(--agent-deep-rgb) / <alpha-value>)",
        // Static per-agent identities.
        agent: {
          orchestrator: "#A78BFA",
          research: "#22D3EE",
          content: "#E879F9",
          data: "#2DD4BF",
          automation: "#FBBF24",
          builder: "#4ADE80",
          audit: "#FB7185",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        glass: "1.25rem",
      },
      boxShadow: {
        glass: "0 8px 40px -12px rgba(0,0,0,0.7)",
        "glow-accent": "0 0 40px -10px rgb(var(--agent-rgb) / 0.5)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        drift: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        drift: "drift 6s ease-in-out infinite",
      },
      transitionTimingFunction: {
        organic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
