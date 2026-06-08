/**
 * Neural Obsidian — design scalars consumed by JS/TS (motion, layout, depth).
 * Color identities live in lib/agents/registry.ts (the single source of truth
 * for per-agent color), and the Tailwind theme mirrors these values.
 */

export const OBSIDIAN = {
  void: "#050609",
  900: "#0A0C12",
  800: "#0F121A",
  700: "#161A24",
  600: "#1E2330",
} as const;

export const TEXT = {
  primary: "#F4F6FB",
  secondary: "#A8B0C0",
  tertiary: "#5C6678",
} as const;

/** Organic motion language — spring + eased, never linear. */
export const MOTION = {
  spring: { type: "spring", stiffness: 180, damping: 22 } as const,
  springSoft: { type: "spring", stiffness: 120, damping: 18 } as const,
  enter: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const,
  exit: { duration: 0.14, ease: [0.4, 0, 1, 1] } as const,
  themeShiftMs: 600,
} as const;

/** Glass treatment tokens (dark Liquid Glass). */
export const GLASS = {
  bg: "rgba(15,18,26,0.55)",
  blur: "20px",
  saturate: "140%",
  hairline: "rgba(255,255,255,0.07)",
} as const;
