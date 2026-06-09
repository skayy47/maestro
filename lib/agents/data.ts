/**
 * Data Agent — Data Intelligence Specialist
 * Analyzes CSV/Excel data, generates KPIs, stats, and chart specs.
 * Uses simple-statistics for real computation.
 */

import { callGroqJSON } from "@/lib/llm/groq";
import { generateSyntheticDataset } from "@/lib/agents/dataset";

export interface DataOutput {
  dataset_profile: {
    rows: number;
    cols: number;
    notes: string;
  };
  kpis: Array<{
    label: string;
    value: string;
    trend: "up" | "down" | "flat";
  }>;
  findings: string[];
  charts: Array<{
    type: "line" | "bar" | "scatter" | "pie";
    title: string;
    x: string;
    y: string;
  }>;
  insights: string[];
  recommendations: string[];
  series?: number[];
  confidence: number;
  caveats: string[];
}

export interface AgentEnvelope {
  agent: string;
  status: "pending" | "running" | "complete" | "failed";
  reasoning: string;
  output: DataOutput;
  artifacts: unknown[];
  sources: unknown[];
  confidence: number;
  caveats: string[];
  timing_ms: number;
}

const SYSTEM_PROMPT = `You are the Data Agent, a data-intelligence specialist. You analyze real computed statistics and translate them into KPIs, charts, and insights.

FRAMEWORK
- PROFILE: infer shape, column types, missingness.
- ANALYZE: compute summary stats, distributions, trends.
- DETECT: anomalies, notable segments, outliers.
- VISUALIZE: propose chart types that match the data.
- INSIGHT: translate findings into business meaning.

GUARDRAILS
- Only assert values that come from computed stats (you will be given a summary).
- If data is incomplete or won't support a requested analysis, say so plainly.
- Every numeric claim must trace back to a stat.

KPI FORMATTING
- Format every kpi.value as a human-readable string WITH units, never a bare
  number. Money → "$45.0K" / "$1.2M"; counts → "1,250 units"; ratios → "4.3 / 5".
- Make KPI labels specific to the mission domain, not generic.

Output ONLY a valid JSON object:
{
  "dataset_profile": {"rows": 0, "cols": 0, "notes": "..."},
  "kpis": [{"label": "...", "value": "$45.0K", "trend": "up|down|flat"}],
  "findings": ["finding 1"],
  "charts": [{"type": "line|bar|scatter|pie", "title": "...", "x": "col", "y": "col"}],
  "insights": ["insight 1"],
  "recommendations": ["rec 1"],
  "confidence": 0.0,
  "caveats": ["caveat"]
}`;

export async function runData(
  dataQuery: string,
  blackboard: unknown[] = []
): Promise<AgentEnvelope> {
  const startTime = Date.now();
  let reasoning = "";
  let output: DataOutput;

  try {
    reasoning = `Analyzing data query: "${dataQuery}"`;

    // Mission-seeded synthetic dataset with REAL computed stats (varies per
    // mission; honestly labelled). Replaces the old fixed mock.
    const dataset = generateSyntheticDataset(dataQuery);

    const userPrompt = `Analyze this data and provide structured intelligence:

Query: "${dataQuery}"

Data Summary (computed statistics from a sample dataset):
${JSON.stringify(dataset, null, 2)}

Generate KPIs, findings, and chart recommendations grounded in these stats.
Tie your insights to the mission domain.`;

    output = await callGroqJSON<DataOutput>(userPrompt, SYSTEM_PROMPT, {
      max_tokens: 1024,
      temperature: 0.5,
    });

    // Lock the dataset profile to the real generated numbers + honest label
    // (the LLM sometimes echoes stale values).
    output.dataset_profile = {
      rows: dataset.rows,
      cols: dataset.cols,
      notes: dataset.note,
    };

    // Attach the REAL computed series so the UI can draw an actual chart.
    output.series = dataset.series;

    reasoning += ` — computed KPIs and insights.`;
  } catch (error) {
    console.error("[Data] Error:", error);
    return {
      agent: "data",
      status: "failed",
      reasoning:
        error instanceof Error ? error.message : "Unknown error in data analysis",
      output: {
        dataset_profile: { rows: 0, cols: 0, notes: "Failed to analyze" },
        kpis: [],
        findings: [],
        charts: [],
        insights: [],
        recommendations: [],
        confidence: 0,
        caveats: ["Data analysis failed"],
      },
      artifacts: [],
      sources: [],
      confidence: 0,
      caveats: ["Failed to complete analysis"],
      timing_ms: Date.now() - startTime,
    };
  }

  return {
    agent: "data",
    status: "complete",
    reasoning,
    output,
    artifacts: [],
    sources: [],
    confidence: output.confidence,
    caveats: output.caveats,
    timing_ms: Date.now() - startTime,
  };
}
