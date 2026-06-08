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
 * Model fallback chain. Each Groq model has its OWN per-day token budget, so
 * when the 70B hits its daily limit (TPD 429), the 8B model — with a much
 * larger separate quota — keeps the system answering. This is what stops a
 * rate limit from collapsing a live demo into "Failed" cards.
 */
const MODEL_CHAIN = [
  "llama-3.3-70b-versatile", // primary: best reasoning
  "llama-3.1-8b-instant", // fallback: separate + larger quota, very fast
];

/** Errors worth retrying on the next model (rate limits, transient 5xx). */
function isRetryable(status: number, message: string): boolean {
  return status === 429 || status >= 500 || /rate limit/i.test(message);
}

/**
 * Longest we'll wait out a short (per-minute TPM) rate-limit before switching
 * models. Groq TPM windows are ≤60s; observed waits are ~12s, so 16s covers
 * them while still bailing fast on per-day limits (which report minutes/hours).
 */
const MAX_RETRY_WAIT_MS = 16000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse Groq's "Please try again in 12.05s / 150ms / 1h10m19s" hint to ms.
 * Short waits (per-minute TPM limits) are worth sleeping out; long waits
 * (per-day TPD limits) are not — we switch models instead.
 */
export function parseRetryAfterMs(message: string): number | null {
  const m = message.match(/try again in ([0-9hms.]+)/i);
  if (!m) return null;
  const str = m[1];
  let ms = 0;
  const h = str.match(/([\d.]+)h/);
  const min = str.match(/([\d.]+)m(?!s)/);
  const s = str.match(/([\d.]+)s/);
  const milli = str.match(/([\d.]+)ms/);
  if (h) ms += parseFloat(h[1]) * 3600_000;
  if (min) ms += parseFloat(min[1]) * 60_000;
  if (s && !milli) ms += parseFloat(s[1]) * 1000;
  if (milli) ms += parseFloat(milli[1]);
  return ms || null;
}

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

/** One attempt against a specific model. Throws a tagged error on failure. */
async function callGroqOnce(
  model: string,
  prompt: string,
  options: LLMOptions
): Promise<string> {
  const {
    temperature = 0.7,
    max_tokens = 2048,
    json_mode = false,
    system = "You are a helpful AI assistant.",
  } = options;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGroqKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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
    let message = response.statusText;
    try {
      const error = await response.json();
      message = error.error?.message || message;
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(`Groq API error: ${message}`) as Error & {
      status?: number;
      retryable?: boolean;
    };
    err.status = response.status;
    err.retryable = isRetryable(response.status, message);
    throw err;
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content || "";
}

/**
 * Call Groq with automatic model fallback.
 * Tries each model in MODEL_CHAIN; on a retryable failure (rate limit / 5xx)
 * it falls through to the next. Throws only if the whole chain fails.
 */
export async function callGroq(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  let lastError: unknown;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];

    // Up to 2 attempts per model: one immediate, one after a short backoff
    // (to ride out per-minute TPM limits that clear in seconds).
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callGroqOnce(model, prompt, options);
        if (i > 0 || attempt > 0) {
          console.warn(`[Groq] Served by "${model}" (attempt ${attempt + 1}).`);
        }
        return result;
      } catch (error) {
        lastError = error;
        const retryable = (error as { retryable?: boolean })?.retryable;
        if (!retryable) {
          console.error(`[Groq] Non-retryable error on "${model}":`, (error as Error).message);
          throw error;
        }

        const waitMs = parseRetryAfterMs((error as Error).message);
        // Short per-minute limit on first attempt → wait it out, retry same model.
        if (attempt === 0 && waitMs != null && waitMs <= MAX_RETRY_WAIT_MS) {
          console.warn(`[Groq] "${model}" throttled; waiting ${Math.round(waitMs)}ms then retrying.`);
          await sleep(waitMs + 300);
          continue;
        }
        // Long limit (daily) or already retried → fall to the next model.
        if (i < MODEL_CHAIN.length - 1) {
          console.warn(`[Groq] "${model}" exhausted. Falling back to "${MODEL_CHAIN[i + 1]}".`);
        }
        break;
      }
    }
  }

  console.error("Groq call failed across all models:", lastError);
  throw lastError;
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
