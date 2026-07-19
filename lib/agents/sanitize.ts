/**
 * Envelope sanitizers.
 *
 * Agent envelopes promise `confidence: number` and `caveats: string[]`, but
 * both ultimately come from LLM JSON — which sometimes omits them (observed
 * live: the automation agent shipped `confidence: undefined` when served by
 * the 8B fallback model). Every agent runs its LLM output through these before
 * returning, so the envelope contract holds no matter what the model did.
 */

/** Default confidence when the model omitted it entirely. */
export const DEFAULT_CONFIDENCE = 0.55;

/** Floor for a COMPLETED envelope — "done but confidence 0" is a contradiction. */
export const MIN_COMPLETE_CONFIDENCE = 0.05;

/**
 * Coerce an LLM-provided confidence into a real number in
 * [MIN_COMPLETE_CONFIDENCE, 0.99]. Missing / NaN / non-numeric → fallback.
 */
export function clampConfidence(
  value: unknown,
  fallback: number = DEFAULT_CONFIDENCE
): number {
  // null/undefined/"" mean "omitted" — Number() would silently coerce them to 0.
  if (value == null) return fallback;
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  // Models occasionally emit percentages ("85") — normalize.
  const scaled = n > 1 && n <= 100 ? n / 100 : n;
  return Math.min(0.99, Math.max(MIN_COMPLETE_CONFIDENCE, scaled));
}

/** Coerce an LLM-provided list into a clean string[] (drops junk entries). */
export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => (v as string).trim());
}
