"use client";

import { useState } from "react";
import {
  Zap,
  Download,
  Copy,
  Check,
  Code2,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import type { AutomationOutput } from "@/lib/agents/envelopes";
import { Section, Chip, ConfidenceBar, Caveats } from "./primitives";
import { cn } from "@/lib/utils";

const ACCENT = "#FBBF24"; // automation amber

export function AutomationDeliverable({ output }: { output: AutomationOutput }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const workflowJson = JSON.stringify(output.workflow_json ?? {}, null, 2);
  const hasArtifact =
    output.workflow_json &&
    typeof output.workflow_json === "object" &&
    Object.keys(output.workflow_json as object).length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workflowJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const handleDownload = () => {
    const blob = new Blob([workflowJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug =
      (output.objective || "workflow")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) || "workflow";
    a.href = url;
    a.download = `maestro-${slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Objective */}
      {output.objective ? (
        <h3 className="font-display text-base font-semibold leading-snug text-text-primary">
          {output.objective}
        </h3>
      ) : null}

      {/* Trigger */}
      {output.trigger ? (
        <div
          className="flex items-start gap-2.5 rounded-lg border p-3"
          style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0D` }}
        >
          <Zap className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
              trigger · {output.trigger.integration}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-secondary">
              {output.trigger.description}
            </p>
          </div>
        </div>
      ) : null}

      {/* Workflow steps — vertical flow */}
      {output.steps?.length ? (
        <Section label={`Workflow · ${output.steps.length} steps`}>
          <div className="relative space-y-0">
            {output.steps.map((step, i) => (
              <div key={step.id || i} className="relative flex gap-3 pb-3 last:pb-0">
                {/* Connector line + node */}
                <div className="flex flex-col items-center">
                  <div
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold"
                    style={{
                      borderColor: `${ACCENT}55`,
                      background: `${ACCENT}15`,
                      color: ACCENT,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < output.steps.length - 1 ? (
                    <div
                      className="w-px flex-1"
                      style={{ background: `${ACCENT}30`, minHeight: "12px" }}
                    />
                  ) : null}
                </div>
                {/* Step content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-[12.5px] font-medium text-text-primary">
                      {step.action || step.node_type}
                    </p>
                    <span className="font-mono text-[9px] text-text-tertiary">
                      {step.integration}
                    </span>
                  </div>
                  {step.config_notes ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-text-tertiary">
                      {step.config_notes}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Integrations required */}
      {output.integrations_required?.length ? (
        <Section label="Integrations required">
          <div className="flex flex-wrap gap-1.5">
            {output.integrations_required.map((int, i) => (
              <Chip key={i} accent={ACCENT}>
                {int}
              </Chip>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Error handling */}
      {output.error_handling?.length ? (
        <Section label="Error handling">
          <ul className="space-y-1.5">
            {output.error_handling.map((e, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-text-secondary">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/70" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Human checkpoints */}
      {output.human_checkpoints?.length ? (
        <Section label="Human checkpoints">
          <ul className="space-y-1.5">
            {output.human_checkpoints.map((h, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-text-secondary">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/70" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* THE ARTIFACT — importable workflow JSON */}
      {hasArtifact ? (
        <div
          className="rounded-xl border p-3"
          style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}08` }}
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" style={{ color: ACCENT }} />
            <p className="font-display text-[12px] font-semibold text-text-primary">
              n8n-importable workflow
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-text-tertiary">
            A real artifact. Download and import directly into n8n, or copy the JSON.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-display text-[12px] font-semibold transition"
              style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}44` }}
            >
              <Download className="h-3.5 w-3.5" />
              Download .json
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 font-display text-[12px] font-medium text-text-secondary transition hover:text-text-primary"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Collapsible raw JSON */}
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="mt-2 flex items-center gap-1 font-mono text-[10px] text-text-tertiary transition hover:text-text-secondary"
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showJson && "rotate-180")}
            />
            {showJson ? "hide" : "view"} raw JSON
          </button>
          {showJson ? (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/[0.06] bg-obsidian-900/80 p-2.5 font-mono text-[10px] leading-relaxed text-text-secondary">
              {workflowJson}
            </pre>
          ) : null}
        </div>
      ) : null}

      <ConfidenceBar value={output.confidence} accent={ACCENT} />
      <Caveats items={output.caveats} />
    </div>
  );
}
