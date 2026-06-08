"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled section inside a deliverable. */
export function Section({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>
      {children}
    </div>
  );
}

/** A small pill — used for trends, integrations, tags. */
export function Chip({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] leading-none"
      style={{
        borderColor: accent ? `${accent}40` : "rgba(255,255,255,0.1)",
        background: accent ? `${accent}12` : "rgba(255,255,255,0.03)",
        color: accent ?? "#A8B0C0",
      }}
    >
      {children}
    </span>
  );
}

/** Bulleted list with custom marker color. */
export function BulletList({
  items,
  accent,
  marker = "•",
}: {
  items: string[];
  accent?: string;
  marker?: string;
}) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-text-secondary">
          <span className="mt-0.5 shrink-0 font-mono text-[11px]" style={{ color: accent ?? "#5C6678" }}>
            {marker}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Confidence meter — a labeled bar. */
export function ConfidenceBar({
  value,
  accent = "#A78BFA",
}: {
  value?: number;
  accent?: string;
}) {
  if (value == null || Number.isNaN(value)) return null;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-text-tertiary">confidence</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 8px ${accent}80` }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums" style={{ color: accent }}>
        {pct}%
      </span>
    </div>
  );
}

/** Caveats footnote — honest about limits. */
export function Caveats({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
        caveats
      </p>
      <ul className="space-y-1">
        {items.map((c, i) => (
          <li key={i} className="text-[11px] leading-snug text-text-tertiary">
            — {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
