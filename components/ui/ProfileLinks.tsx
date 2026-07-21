"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Header profile links — GitHub, LinkedIn, Portfolio.
 *
 * Premium, theme-reactive icon buttons: they lift on hover with a spring, bloom
 * a soft glow in the LIVE agent color (same language as the rest of the app),
 * tint their icon to the accent, and reveal a tooltip. Accessible: real links,
 * 36px targets, aria-labels, visible focus ring, open in a new tab.
 */

// Brand marks inlined as SVG (fill: currentColor) so they inherit the button's
// ink → accent color transition and never depend on a brand-icon package.
function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-full w-full">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-full w-full">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

interface LinkDef {
  label: string;
  href: string;
  icon: ReactNode;
}

const LINKS: LinkDef[] = [
  { label: "GitHub", href: "https://github.com/skayy47", icon: <GithubMark /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/oussama-skia", icon: <LinkedinMark /> },
  {
    label: "Portfolio",
    href: "https://skay-portfolio.vercel.app",
    icon: <Globe className="h-full w-full" strokeWidth={2} aria-hidden="true" />,
  },
];

export function ProfileLinks() {
  return (
    <nav aria-label="Profiles" className="flex items-center gap-1.5">
      {LINKS.map((l) => (
        <motion.a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${l.label} (opens in a new tab)`}
          className="group relative grid h-9 w-9 place-items-center rounded-xl border border-lift/[0.10] bg-white/70 text-text-secondary outline-none transition-colors duration-200 hover:border-accent/45 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          {/* agent-color glow that blooms on hover */}
          <span
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: "0 0 20px -4px rgb(var(--agent-rgb) / 0.55)" }}
          />
          <span className="relative h-[17px] w-[17px]">{l.icon}</span>

          {/* tooltip — opens UPWARD (above the header), where no panel can clip
              it; dropping it downward collided with the Live Outputs panel. */}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-text-primary px-2 py-0.5 font-mono text-[9px] tracking-wide text-white opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {l.label}
          </span>
        </motion.a>
      ))}
    </nav>
  );
}
