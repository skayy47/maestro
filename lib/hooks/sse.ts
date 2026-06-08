/**
 * SSE parsing — pure, stateful, framework-free (so it is unit-testable).
 *
 * The orchestration endpoint streams Server-Sent Events:
 *   event: <type>\n
 *   data: <json>\n
 *   \n
 *
 * Chunked transport can split a message across reads, so the parser tracks the
 * pending `event:` type across lines and only emits when a `data:` line lands.
 *
 * This module exists because the original inline parser used `lines.shift()`
 * inside a `for...of`, which silently dropped events — the bug behind the
 * "nothing happens on Conduct" report. Extracting it makes that class of bug
 * impossible to ship untested again.
 */

export interface ParsedSseEvent {
  type: string;
  data: unknown;
}

/**
 * Create a stateful SSE chunk processor. Feed it text (already split on a
 * trailing newline by the caller); it invokes `onEvent` for each complete
 * event/data pair. Malformed JSON is reported via `onError` (or warned).
 */
export function makeSseParser(
  onEvent: (e: ParsedSseEvent) => void,
  onError?: (raw: string, err: unknown) => void
) {
  let pendingType = "";

  return function processChunk(text: string): void {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        pendingType = line.slice(7).trim();
      } else if (line.startsWith("data: ") && pendingType) {
        const raw = line.slice(6);
        try {
          const data = JSON.parse(raw);
          onEvent({ type: pendingType, data });
        } catch (err) {
          if (onError) onError(raw, err);
          else console.warn("[SSE] Failed to parse data line:", raw);
        }
        // Emitting consumes the pending type. We intentionally do NOT reset on
        // blank lines: when a single SSE message is split across reads (type in
        // one chunk, data in the next), the trailing "" from the first chunk
        // would otherwise wipe the pending type before its data arrives.
        pendingType = "";
      }
    }
  };
}
