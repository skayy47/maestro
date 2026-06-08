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

async function searchTavily(query: string): Promise<string> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getTavilyKey(),
      query,
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{ title: string; url: string; content: string }>;
    answer: string;
  };
  return JSON.stringify(data);
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

Output ONLY a valid JSON object matching this schema:
{
  "headline": "one-line summary",
  "market_overview": "2-3 sentence context",
  "trends": ["trend 1", "trend 2"],
  "competitors": [{"name":"...","positioning":"...","weakness":"..."}],
  "opportunities": ["opportunity 1"],
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
    const searchResults = await searchTavily(userQuery);
    reasoning += ` — found results, analyzing sources...`;

    // Call Research agent via Groq
    const userPrompt = `Analyze this web search result and extract structured intelligence:

Query: "${userQuery}"

Search Results:
${searchResults}

Provide a structured research briefing.`;

    output = await callGroqJSON<ResearchOutput>(
      userPrompt,
      SYSTEM_PROMPT,
      { max_tokens: 1024, temperature: 0.5 }
    );

    reasoning += ` — synthesized findings.`;
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
