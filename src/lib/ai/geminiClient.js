import { GoogleGenAI } from "@google/genai";
import { parseJsonResponse } from "./parseJsonResponse.js";

// NOTE ON SECURITY: this key is bundled into client-side JS, so it is visible
// to anyone who inspects network requests or the built bundle. At minimum,
// restrict this key by HTTP referrer in Google Cloud Console before shipping.
// See the accompanying explanation for why a thin serverless proxy is a
// stronger long-term option if Compoundly gets real users.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 15000;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

/**
 * AI 1 — Context Analyzer
 * Turns the user's free-text "future self" narrative into 3-5 suggested
 * critical habits. This is a UX/NLP layer only — it never decides which
 * habit "wins"; the user always picks.
 *
 * IMPORTANT: keep this function's signature identical to
 * mockGeminiClient.js's `suggestHabitsFromNarrative`, so swapping the client
 * never touches any React component.
 *
 * @param {string} narrative - the user's future-self story (already trimmed
 *   to the last 7 days of relevant context per the data-minimization rule).
 * @returns {Promise<{ habits: { id: string, label: string }[] }>}
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

{ "habits": [ { "id": "string-slug", "label": "Human readable habit name" } ] }
`.trim();

  const response = await withTimeout(
    ai.models.generateContent({ model: MODEL, contents: prompt }),
    TIMEOUT_MS,
    "Gemini took too long to respond (timed out after 15s).",
  );

  return parseJsonResponse(response.text);
}

/**
 * AI "Reflective Prompting" — writes ONE short, warm, non-clinical sentence
 * reflecting on the user's recent journal entries.
 *
 * IMPORTANT ARCHITECTURAL NOTE: this function deliberately does NOT compute
 * any scores, levels, or diagnoses. All of that (Consistency, Emotional
 * Regulation, Self-Control, Facing Challenges, Recovery Rate) is computed
 * by lib/psychology/ from raw data, with zero AI involvement — see
 * GrowthPage.jsx and RecoveryPage.jsx. This function only ever adds a
 * human-sounding reflection ON TOP of numbers that were already determined
 * deterministically. This resolves what were originally called "AI 3:
 * Pattern Identifier" and "AI 4: Reflective Prompting" in the project's
 * early design — their role narrowed to narrative framing only, since
 * lib/psychology/ ended up owning the actual pattern detection.
 *
 * @param {string} recentEntriesText - last 7 days of journal entries,
 *   already joined into one string by the caller (see
 *   selectRecentJournalEntries in growthSlice.js) — never the full history.
 * @returns {Promise<{ reflection: string }>}
 */
export async function generateGrowthReflection(recentEntriesText) {
  const prompt = `
You are a warm, non-clinical growth companion. Here are a user's recent
journal entries about their personal growth journey:

"""
${recentEntriesText}
"""

Write exactly ONE short sentence (max 25 words) reflecting on what you
notice — supportive, specific if possible, never diagnostic, never using
clinical language. Respond ONLY with JSON in this exact shape, no other text:

{ "reflection": "your one sentence here" }
`.trim();

  const response = await withTimeout(
    ai.models.generateContent({ model: MODEL, contents: prompt }),
    TIMEOUT_MS,
    "Gemini took too long to respond (timed out after 15s).",
  );

  return parseJsonResponse(response.text);
}
