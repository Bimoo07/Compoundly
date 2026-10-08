/**
 * Output guard — the LAST deterministic check before any AI-written text
 * reaches the UI. Mirror image of guardrails.js (which checks INPUT).
 *
 * Rules (each one is unit-tested in outputGuard.test.js):
 *  R1  text must be a non-empty string, <= MAX_CHARS
 *  R2  no clinical / diagnostic vocabulary, no shaming vocabulary, no "streak"
 *  R3  every number in the text must come from (a) the deterministic facts
 *      computed by lib/psychology, or (b) the user's own text. The model may
 *      narrate numbers, never invent or recompute them.
 */
const MAX_CHARS = 420;

const BANNED =
  /\b(diagnos\w*|disorder|gangguan|depress\w*|clinical|klinis|therapy|terapi|medication|obat|worthless|pathetic|lazy|malas|lemah|streak)\b/i;

const numbersIn = (s = "") => new Set(s.match(/\d+(?:[.,]\d+)?/g) ?? []);

/**
 * @param {unknown} text
 * @param {{ facts?: object, userText?: string }} [ctx]
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateNarrative(text, { facts = {}, userText = "" } = {}) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, reason: "empty" };
  }
  if (text.length > MAX_CHARS) return { ok: false, reason: "too-long" };
  if (BANNED.test(text)) return { ok: false, reason: "banned-term" };

  const allowed = new Set([
    ...numbersIn(JSON.stringify(facts)),
    ...numbersIn(userText),
  ]);
  for (const n of numbersIn(text)) {
    if (!allowed.has(n)) return { ok: false, reason: "unsupported-number" };
  }
  return { ok: true };
}
