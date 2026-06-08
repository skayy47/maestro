/**
 * Groq LLM client — primary brain.
 * Llama 3.3 70B for speed + reasoning. JSON-mode for structured outputs.
 * Fallback to Gemini for long-context or if Groq rate-limits.
 */

// Lazy check: only throw if the API is actually called without a key
const getGroqKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY not set in .env.local. Add it and restart the dev server."
    );
  }
  return key;
};
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Helper to check if API key is available (for build-time checks)
 */
export const hasGroqKey = () => {
  return !!process.env.GROQ_API_KEY;
};

export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
  system?: string;
}

/**
 * Call Groq Llama 3.3 70B.
 * Returns the text response. If JSON mode, response is valid JSON.
 */
export async function callGroq(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const {
    temperature = 0.7,
    max_tokens = 2048,
    json_mode = false,
    system = "You are a helpful AI assistant.",
  } = options;

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getGroqKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens,
        response_format: json_mode ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message.content || "";
  } catch (error) {
    console.error("Groq call failed:", error);
    // TODO: fallback to Gemini here if needed
    throw error;
  }
}

/**
 * Call Groq with a system prompt and get JSON back.
 * Useful for structured outputs (MissionPlan, AgentEnvelope, etc).
 */
export async function callGroqJSON<T = unknown>(
  userPrompt: string,
  systemPrompt: string,
  options: Omit<LLMOptions, "system" | "json_mode"> = {}
): Promise<T> {
  const response = await callGroq(userPrompt, {
    ...options,
    system: systemPrompt,
    json_mode: true,
  });

  try {
    return JSON.parse(response) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", response);
    throw new Error(`Invalid JSON from Groq: ${(e as Error).message}`);
  }
}

/**
 * Stream Groq response as a generator (for SSE).
 * Yields chunks as they arrive.
 */
export async function* streamGroq(
  prompt: string,
  options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    temperature = 0.7,
    max_tokens = 2048,
    system = "You are a helpful AI assistant.",
  } = options;

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getGroqKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) yield chunk;
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  } catch (error) {
    console.error("Groq stream failed:", error);
    throw error;
  }
}
