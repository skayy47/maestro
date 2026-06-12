import type { Config } from "tailwindcss";

/**
 * Ivory Cognition — MAESTRO light premium design system.
 *
 * The `accent` colors are driven at runtime by the active agent via CSS vars
 * (--agent-rgb / --agent-deep-rgb), so any `*-accent` utility breathes with the
 * theme engine. Static agent colors live under `agent-*` (deepened for legible
 * contrast on the light surface — they keep their hue identity).
 *
 * Token keys are kept stable to avoid churn across every component:
 *  - `obsidian.*` is now the Ivory SURFACE ramp (900 = page, 800 = raised card).
 *  - `text.*` is now the INK ramp (primary = indigo-ink, never pure black).
 *  - `lift` is an indigo-ink tint for the faint "raised surface" fills/borders
 *    that used to be white-on-dark (white-alpha is invisible on a light surface).
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
        // Ivory surface ramp (was the dark obsidian ramp; keys kept stable).
        void: "#EEF1F8",
        obsidian: {
          900: "#F7F9FC", // page base
          800: "#FFFFFF", // raised card / input
          700: "#EEF1F7", // sunken
          600: "#E3E8F1", // deepest divider fill
        },
        // Ink ramp — premium indigo-tinted text, all AA+ on white.
        text: {
          primary: "#1E1B4B",
          secondary: "#475569",
          tertiary: "#64748B",
        },
        // Indigo-ink tint for faint raised-surface fills/borders on light.
        lift: "rgb(30 27 75 / <alpha-value>)",
        // Live theme accent — follows the active agent.
        accent: "rgb(var(--agent-rgb) / <alpha-value>)",
        "accent-deep": "rgb(var(--agent-deep-rgb) / <alpha-value>)",
        // Static per-agent identities — deepened for contrast on the light surface.
        agent: {
          orchestrator: "#7C3AED",
          research: "#0891B2",
          content: "#C026D3",
          data: "#0D9488",
          automation: "#D97706",
          builder: "#16A34A",
          audit: "#E11D48",
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
        // Soft, layered ambient shadow for the light premium surface.
        glass: "0 1px 2px rgba(30,27,75,0.04), 0 12px 32px -16px rgba(30,27,75,0.18)",
        "glow-accent": "0 0 40px -10px rgb(var(--agent-rgb) / 0.45)",
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
