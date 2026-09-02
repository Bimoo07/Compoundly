import { GoogleGenAI } from "@google/genai";

// NOTE ON SECURITY: this key is bundled into client-side JS, so it is visible
// to anyone who inspects network requests or the built bundle. At minimum,
// restrict this key by HTTP referrer in Google Cloud Console before shipping.
// See the accompanying explanation for why a thin serverless proxy is a
// stronger long-term option if Compoundly gets real users.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// gemini-2.5-flash is scheduled to shut down October 16, 2026, so this
// stays off the 2.5 family entirely. gemini-3.5-flash-lite (not 3.7-flash)
// is used here on purpose: this call only turns a short narrative into a
// small JSON list, which doesn't need heavy reasoning. Flash-Lite is
// cheaper, faster, and — being a less in-demand model — far less likely to
// return a 503 "high demand" error than the newest flagship Flash model.
// If a future AI feature needs deeper reasoning (e.g. growth insights over
// 7 days of behavioral evidence), consider gemini-3.7-flash for that call
// specifically rather than upgrading this one.
const MODEL = "gemini-3.5-flash-lite";

const RETRYABLE_STATUSES = new Set([503, 429]);

/**
 * New, popular models occasionally return 503 UNAVAILABLE ("high demand")
 * or 429 RESOURCE_EXHAUSTED. Both are transient — worth a couple of quick
 * retries before surfacing an error to the user.
 */
function isRetryableError(err) {
  const status = Number(err?.status ?? err?.code ?? err?.error?.code);
  if (RETRYABLE_STATUSES.has(status)) return true;
  const message = typeof err?.message === "string" ? err.message : "";
  return (
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("503") ||
    message.includes("429")
  );
}

async function generateWithRetry(request, { maxRetries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt === maxRetries) throw err;
      const delayMs = 1000 * 2 ** attempt; // 1s, then 2s
      console.warn(
        `[geminiClient] model overloaded, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

/**
 * AI 1 — Context Analyzer
 * Turns the user's free-text "future self" narrative into 3-5 newly
 * generated habit suggestions. This is a UX/NLP layer only — it never
 * decides which habit "wins"; the user always picks.
 *
 * IMPORTANT: keep this function's signature identical to
 * mockGeminiClient.js's `suggestHabitsFromNarrative`, so swapping the client
 * never touches any React component.
 *
 * Each returned habit is tagged `source: 'ai'` and given an id namespaced
 * with `ai-` plus a random suffix. This guarantees uniqueness against the
 * curated habitOptions.mock.json ids (and against habits from a previous
 * call) WITHOUT constraining what Gemini is allowed to suggest — the whole
 * point of this version is that these are new habits, not a pick from a
 * fixed list. Downstream, the app stores this entire object (see
 * awarenessSlice.js's `activeHabit`) instead of just an id, so nothing else
 * needs to look it up again.
 *
 * @param {string} narrative - the user's future-self story (already trimmed
 *   to the last 7 days of relevant context per the data-minimization rule).
 * @returns {Promise<{ habits: { id: string, label: string, source: 'ai' }[] }>}
 */
export async function suggestHabitsFromNarrative(narrative) {
  const prompt = `
You are a behavior-change assistant. A user wrote the following description
of what their life looks like in 6 months:

"""
${narrative}
"""

Suggest 3 to 5 small, concrete, achievable daily habits that would move them
toward that future. Each habit must be small enough to attempt within a
single day. Respond ONLY with JSON in this exact shape, no other text:

{ "habits": [ { "id": "short-kebab-case-slug", "label": "Human readable habit name" } ] }
`.trim();

  try {
    const response = await generateWithRetry({
      model: MODEL,
      contents: prompt,
      config: {
        // Forces Gemini to return raw JSON instead of prose or a
        // ```json fenced block, so JSON.parse below doesn't need to
        // guess at stripping markdown.
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text);
    const rawHabits = parsed.habits ?? [];

    if (rawHabits.length === 0) {
      throw new Error("Model returned no habits");
    }

    const habits = rawHabits.map((h) => ({
      // Namespaced + suffixed so this can never collide with a curated
      // habit's id, or with another AI-generated habit from an earlier call.
      id: `ai-${h.id}-${crypto.randomUUID().slice(0, 8)}`,
      label: h.label,
      source: "ai",
    }));

    return { habits };
  } catch (err) {
    // Covers two distinct failure modes: network/API errors from
    // generateContent, and malformed/empty output from Gemini.
    console.error("[geminiClient] suggestHabitsFromNarrative failed:", err);
    throw new Error(
      "Gagal mendapatkan saran dari AI. Silakan coba lagi sebentar lagi.",
    );
  }
}
