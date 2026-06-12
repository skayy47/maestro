/**
 * Ivory Cognition — design scalars consumed by JS/TS (motion, layout, depth).
 * Color identities live in lib/agents/registry.ts (the single source of truth
 * for per-agent color), and the Tailwind theme mirrors these values.
 */

export const SURFACE = {
  void: "#EEF1F8",
  900: "#F7F9FC",
  800: "#FFFFFF",
  700: "#EEF1F7",
  600: "#E3E8F1",
} as const;

export const TEXT = {
  primary: "#1E1B4B",
  secondary: "#475569",
  tertiary: "#64748B",
} as const;

/** Organic motion language — spring + eased, never linear. */
export const MOTION = {
  spring: { type: "spring", stiffness: 180, damping: 22 } as const,
  springSoft: { type: "spring", stiffness: 120, damping: 18 } as const,
  enter: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const,
  exit: { duration: 0.14, ease: [0.4, 0, 1, 1] } as const,
  themeShiftMs: 600,
} as const;

/** Glass treatment tokens (light Liquid Glass). */
export const GLASS = {
  bg: "rgba(255,255,255,0.72)",
  blur: "20px",
  saturate: "140%",
  hairline: "rgba(30,27,75,0.07)",
} as const;
