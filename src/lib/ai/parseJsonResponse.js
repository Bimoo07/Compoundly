/**
 * Real LLMs don't always follow "respond with ONLY JSON" instructions
 * perfectly — Gemini sometimes wraps output in a ```json fence, or adds a
 * stray leading/trailing sentence. This tries a few reasonable fallbacks
 * before giving up, instead of letting a raw JSON.parse crash the call.
 *
 * @param {string} rawText
 * @returns {any} parsed JSON
 * @throws {Error} if no valid JSON could be extracted
 */
export function parseJsonResponse(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("Empty response from AI — nothing to parse.");
  }

  // 1. Try as-is first — the happy path where the model followed instructions.
  try {
    return JSON.parse(rawText);
  } catch {
    // fall through to the next strategy
  }

  // 2. Strip a markdown code fence (```json ... ``` or ``` ... ```) if present.
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // fall through
    }
  }

  // 3. Last resort: grab the first {...} or [...] block in the text, in case
  // the model added a stray sentence before/after the JSON.
  const braceMatch = rawText.match(/[{[][\s\S]*[}\]]/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      // fall through
    }
  }

  throw new Error(
    `Couldn't parse a valid JSON response from the AI. Raw response started with: "${rawText.slice(0, 80)}..."`,
  );
}
