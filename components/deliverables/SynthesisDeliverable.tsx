"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import type { SynthesisOutput } from "@/lib/agents/envelopes";
import { Section, ConfidenceBar } from "./primitives";

const ACCENT = "#7C3AED"; // orchestrator violet

interface SynthesisFull extends SynthesisOutput {
  total_agents_run?: number;
  total_duration_ms?: number;
}

export function SynthesisDeliverable({ output }: { output: SynthesisFull }) {
  return (
    <div className="space-y-5">
      {/* Executive summary — the bottom line */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0D` }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            Executive summary
          </p>
        </div>
        <p className="text-[14px] font-medium leading-relaxed text-text-primary">
          {output.executive_summary}
        </p>
      </div>

      {/* Key findings */}
      {output.key_findings?.length ? (
        <Section label="Key findings">
          <ol className="space-y-2">
            {output.key_findings.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold"
                  style={{ background: `${ACCENT}1A`, color: ACCENT }}
                >
                  {i + 1}
                </span>
                <span className="text-[12.5px] leading-relaxed text-text-secondary">{f}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* The deliverable — the heart */}
      {output.the_deliverable ? (
        <Section label="The deliverable">
          <p className="rounded-lg border-l-2 bg-lift/[0.03] py-2 pl-3 pr-2 text-[13px] leading-relaxed text-text-secondary"
            style={{ borderColor: ACCENT }}>
            {output.the_deliverable}
          </p>
        </Section>
      ) : null}

      {/* Next steps */}
      {output.next_steps?.length ? (
        <Section label="Recommended next steps">
          <ul className="space-y-1.5">
            {output.next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ConfidenceBar value={output.confidence} accent={ACCENT} />

      {/* Run stats */}
      {output.total_agents_run != null ? (
        <div className="flex items-center justify-between border-t border-lift/[0.09] pt-3 font-mono text-[10px] text-text-tertiary">
          <span>{output.total_agents_run} agents orchestrated</span>
          {output.total_duration_ms != null ? (
            <span>{(output.total_duration_ms / 1000).toFixed(1)}s total</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
