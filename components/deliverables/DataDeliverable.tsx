"use client";

import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import type { DataOutput } from "@/lib/agents/envelopes";
import { Section, Chip, BulletList, ConfidenceBar, Caveats } from "./primitives";

const ACCENT = "#2DD4BF"; // data teal

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
  return <Minus className="h-3.5 w-3.5 text-text-tertiary" />;
}

export function DataDeliverable({ output }: { output: DataOutput }) {
  return (
    <div className="space-y-5">
      {/* Dataset profile */}
      {output.dataset_profile ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <BarChart3 className="h-4 w-4" style={{ color: ACCENT }} />
          <div className="flex-1">
            <p className="font-mono text-[11px] text-text-primary">
              {output.dataset_profile.rows?.toLocaleString()} rows ×{" "}
              {output.dataset_profile.cols} cols
            </p>
            {output.dataset_profile.notes ? (
              <p className="text-[10.5px] text-text-tertiary">
                {output.dataset_profile.notes}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* KPI cards — the hero stats */}
      {output.kpis?.length ? (
        <Section label="Key metrics">
          <div className="grid grid-cols-2 gap-2">
            {output.kpis.map((kpi, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
                    {kpi.label}
                  </p>
                  <TrendIcon trend={kpi.trend} />
                </div>
                <p
                  className="mt-1 font-display text-lg font-bold tabular-nums"
                  style={{ color: ACCENT }}
                >
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Findings */}
      {output.findings?.length ? (
        <Section label="Findings">
          <BulletList items={output.findings} accent={ACCENT} />
        </Section>
      ) : null}

      {/* Insights — emphasized */}
      {output.insights?.length ? (
        <Section label="Insights">
          <div className="space-y-1.5">
            {output.insights.map((insight, i) => (
              <p
                key={i}
                className="rounded-lg border-l-2 bg-white/[0.02] py-1.5 pl-3 pr-2 text-[12.5px] leading-relaxed text-text-secondary"
                style={{ borderColor: ACCENT }}
              >
                {insight}
              </p>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Recommendations */}
      {output.recommendations?.length ? (
        <Section label="Recommendations">
          <BulletList items={output.recommendations} accent={ACCENT} marker="✓" />
        </Section>
      ) : null}

      {/* Proposed charts */}
      {output.charts?.length ? (
        <Section label="Suggested visualizations">
          <div className="flex flex-wrap gap-1.5">
            {output.charts.map((c, i) => (
              <Chip key={i} accent={ACCENT}>
                {c.type} · {c.title}
              </Chip>
            ))}
          </div>
        </Section>
      ) : null}

      <ConfidenceBar value={output.confidence} accent={ACCENT} />
      <Caveats items={output.caveats} />
    </div>
  );
}
