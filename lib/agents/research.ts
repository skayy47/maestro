/**
 * Research Agent — Market Intelligence Specialist
 * Scans the web, triangulates sources, returns structured findings.
 * Uses Tavily for web search.
 */

import { callGroqJSON } from "@/lib/llm/groq";

const getTavilyKey = () => {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new Error("TAVILY_API_KEY not set in .env.local");
  }
  return key;
};

export interface ResearchOutput {
  headline: string;
  market_overview: string;
  trends: string[];
  competitors: Array<{
    name: string;
    positioning: string;
    weakness: string;
  }>;
  opportunities: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;
  confidence: number;
  caveats: string[];
}

export interface AgentEnvelope {
  agent: string;
  status: "pending" | "running" | "complete" | "failed";
  reasoning: string;
  output: ResearchOutput;
  artifacts: unknown[];
  sources: Array<{ title: string; url: string }>;
  confidence: number;
  caveats: string[];
  timing_ms: number;
}

interface TavilyResponse {
  results: Array<{ title: string; url: string; content: string }>;
  answer: string;
}

async function searchTavily(query: string): Promise<TavilyResponse> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getTavilyKey(),
      query,
      max_results: 8, // richer sourcing — more results to triangulate
      include_answer: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`);
  }

  return (await response.json()) as TavilyResponse;
}

const SYSTEM_PROMPT = `You are the Research Agent, a market-intelligence specialist. You are rigorous and source-driven; you never state a market fact you did not retrieve.

FRAMEWORK
- SCAN: issue web_search queries broad enough to map the space.
- TRIANGULATE: cross-verify every material claim against ≥2 independent sources;
  if you can only find one, flag it. Analyze the retrieved data.
- SYNTHESIZE: compress into a structured brief with explicit sourcing.

TOOLS
You have access to web search results. Analyze them carefully.

GUARDRAILS
- No invented statistics, companies, or URLs. If search returns nothing usable, say so and
  set confidence < 0.4.
- Distinguish fact (sourced) from inference (your analysis) in the output.
- Carry forward all source URLs so the user can verify.

DEPTH REQUIREMENTS (a thin brief reads as low-effort)
- trends: 3–5 distinct, specific trends.
- competitors: 3–4 real players, each with concrete positioning + a real weakness/gap.
- opportunities: 3–4 actionable opportunities tied to the gaps you found.
- sources: list every source you used (the system will also attach the real URLs).

Output ONLY a valid JSON object matching this schema:
{
  "headline": "one-line summary",
  "market_overview": "2-3 sentence context",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "competitors": [{"name":"...","positioning":"...","weakness":"..."}],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "sources": [{"title":"...","url":"..."}],
  "confidence": 0.0,
  "caveats": ["caveat"]
}`;

export async function runResearch(
  userQuery: string,
  blackboard: unknown[] = []
): Promise<AgentEnvelope> {
  const startTime = Date.now();
  let reasoning = "";
  let output: ResearchOutput;

  try {
    reasoning = `Searching for: "${userQuery}"`;

    // Search Tavily
    const tavily = await searchTavily(userQuery);
    reasoning += ` — found ${tavily.results.length} results, analyzing sources...`;

    // The REAL, verifiable sources straight from Tavily (never LLM-generated URLs).
    const realSources = tavily.results
      .filter((r) => r.url)
      .map((r) => ({ title: r.title || r.url, url: r.url }));

    // Call Research agent via Groq
    const userPrompt = `Analyze this web search result and extract structured intelligence:

Query: "${userQuery}"

Search Results:
${JSON.stringify(tavily)}

Provide a structured research briefing.`;

    output = await callGroqJSON<ResearchOutput>(
      userPrompt,
      SYSTEM_PROMPT,
      { max_tokens: 1400, temperature: 0.5 }
    );

    // Override sources with the REAL Tavily URLs — guaranteed clickable + honest.
    if (realSources.length) {
      output.sources = realSources;
    }

    reasoning += ` — synthesized findings from ${realSources.length} sources.`;
  } catch (error) {
    console.error("[Research] Error:", error);
    return {
      agent: "research",
      status: "failed",
      reasoning:
        error instanceof Error ? error.message : "Unknown error in research",
      output: {
        headline: "Research failed",
        market_overview: "",
        trends: [],
        competitors: [],
        opportunities: [],
        sources: [],
        confidence: 0,
        caveats: ["Research agent encountered an error"],
      },
      artifacts: [],
      sources: [],
      confidence: 0,
      caveats: ["Failed to complete research"],
      timing_ms: Date.now() - startTime,
    };
  }

  return {
    agent: "research",
    status: "complete",
    reasoning,
    output,
    artifacts: [],
    sources: output.sources,
    confidence: output.confidence,
    caveats: output.caveats,
    timing_ms: Date.now() - startTime,
  };
}
