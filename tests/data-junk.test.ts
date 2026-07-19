import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/llm/groq", () => ({
  callGroqJSON: vi.fn(),
}));

import { callGroqJSON } from "@/lib/llm/groq";
import { runData } from "@/lib/agents/data";

const llmOutput = (over: object = {}) => ({
  dataset_profile: { rows: 0, cols: 0, notes: "" },
  kpis: [],
  findings: [],
  charts: [],
  insights: [],
  recommendations: [],
  confidence: 0.7,
  caveats: [],
  ...over,
});

describe("data agent on junk / KPI-less input", () => {
  beforeEach(() => vi.clearAllMocks());

  it("zero KPIs on an uploaded file always carries the honest caveat", async () => {
    (callGroqJSON as any).mockResolvedValue(llmOutput({ kpis: [], caveats: [] }));
    const env = await runData("analyze my sales", [], "not,a\nreal,csv");
    expect(env.status).toBe("complete");
    expect(env.output.kpis).toEqual([]);
    expect(env.output.caveats.join(" ")).toMatch(/no usable numeric data/i);
    expect(env.confidence).toBeGreaterThan(0);
  });

  it("real KPIs do not get the empty-KPI caveat bolted on", async () => {
    (callGroqJSON as any).mockResolvedValue(
      llmOutput({ kpis: [{ label: "Revenue", value: "$47.3K", trend: "up" }] })
    );
    const env = await runData("analyze revenue", [], "month,revenue\n2026-01,42000\n2026-02,45500");
    expect(env.output.kpis).toHaveLength(1);
    expect(env.output.caveats.join(" ")).not.toMatch(/could not be computed/i);
  });

  it("missing confidence from the model is clamped, not undefined", async () => {
    (callGroqJSON as any).mockResolvedValue(llmOutput({ confidence: undefined }));
    const env = await runData("analyze trends", []);
    expect(typeof env.confidence).toBe("number");
    expect(env.confidence).toBeGreaterThan(0);
  });
});
