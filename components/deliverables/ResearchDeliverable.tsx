"use client";

import { ExternalLink } from "lucide-react";
import type { ResearchOutput } from "@/lib/agents/envelopes";
import { Section, Chip, BulletList, ConfidenceBar, Caveats } from "./primitives";

const ACCENT = "#22D3EE"; // research cyan

export function ResearchDeliverable({ output }: { output: ResearchOutput }) {
  return (
    <div className="space-y-5">
      {/* Headline */}
      {output.headline ? (
        <h3 className="font-display text-base font-semibold leading-snug text-text-primary">
          {output.headline}
        </h3>
      ) : null}

      {/* Market overview */}
      {output.market_overview ? (
        <p className="text-[13px] leading-relaxed text-text-secondary">
          {output.market_overview}
        </p>
      ) : null}

      {/* Trends */}
      {output.trends?.length ? (
        <Section label="Trends">
          <div className="flex flex-wrap gap-1.5">
            {output.trends.map((t, i) => (
              <Chip key={i} accent={ACCENT}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Competitors */}
      {output.competitors?.length ? (
        <Section label="Competitive landscape">
          <div className="space-y-2">
            {output.competitors.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <p className="font-display text-[13px] font-semibold text-text-primary">
                  {c.name}
                </p>
                {c.positioning ? (
                  <p className="mt-1 text-[11.5px] leading-relaxed text-text-secondary">
                    {c.positioning}
                  </p>
                ) : null}
                {c.weakness ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-rose-300/80">
                    <span className="font-mono text-[9px] uppercase tracking-wider">gap: </span>
                    {c.weakness}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Opportunities */}
      {output.opportunities?.length ? (
        <Section label="Opportunities">
          <BulletList items={output.opportunities} accent={ACCENT} marker="→" />
        </Section>
      ) : null}

      {/* Sources — the verifiable trail */}
      {output.sources?.length ? (
        <Section label={`Sources · ${output.sources.length}`}>
          <div className="space-y-1">
            {output.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-[11.5px] text-text-secondary transition hover:text-[color:var(--c)]"
                style={{ ["--c" as string]: ACCENT }}
              >
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                <span className="truncate">{s.title || s.url}</span>
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <ConfidenceBar value={output.confidence} accent={ACCENT} />
      <Caveats items={output.caveats} />
    </div>
  );
}
