// Single entry point for the rest of the app. Components should only ever
// `import { suggestHabitsFromNarrative } from '@/lib/ai'` — never reach into
// geminiClient.js or mockGeminiClient.js directly. That's what makes the
// swap invisible to every component, AND what guarantees the crisis
// guardrail below can never be accidentally bypassed.
import { checkForCrisisSignal, getCrisisResponse } from "./guardrails.js";
import { validateNarrative } from "./outputGuard.js";

const useMock = import.meta.env.VITE_USE_MOCK_AI === "true";

const client = useMock
  ? await import("./mockGeminiClient.js")
  : await import("./geminiClient.js");

/**
 * Wraps any AI function so that user-authored text is checked for crisis
 * signals BEFORE the underlying client (mock or real) is ever called.
 * If flagged, the AI call is skipped entirely.
 *
 * @param {(text: string, ...rest: any[]) => Promise<any>} aiFn
 */
function withCrisisGuardrail(aiFn) {
  return async (text, ...rest) => {
    const { flagged } = checkForCrisisSignal(text);
    if (flagged) {
      // Optional 2nd arg { language } — callers pass the store's language.
      return { crisisDetected: true, ...getCrisisResponse(rest[0]?.language ?? "en") };
    }
    return aiFn(text, ...rest);
  };
}

/**
 * Single choke point for every NARRATIVE AI function (journal, burl, growth
 * reflection). Pipeline, in this exact order:
 *   1. crisis check on ALL user-authored fields  -> skip AI entirely
 *   2. AI call (mock or real, same signature)
 *   3. output validation (outputGuard.js)       -> else deterministic fallback
 * The UI therefore never sees raw, unvalidated model output, and an AI outage
 * can never break a core feature (fallback is computed by lib/psychology).
 *
 * @param {object} cfg
 * @param {(payload:any)=>Promise<{reflection:string}>} cfg.aiFn
 * @param {(payload:any)=>string} cfg.getUserText - every user-authored field
 * @param {(payload:any)=>string|null} [cfg.getFallback]
 */
function withNarrativeGuard({ aiFn, getUserText, getFallback = () => null }) {
  return async (payload) => {
    const userText = getUserText(payload);
    if (checkForCrisisSignal(userText).flagged) {
      return { crisisDetected: true, ...getCrisisResponse(payload.language ?? "en") };
    }
    try {
      const res = await aiFn(payload);
      const check = validateNarrative(res?.reflection, {
        facts: payload.facts,
        // habit label may legitimately contain digits ("10-Min Reflection")
        userText: `${userText} ${payload.habit?.label ?? ""}`,
      });
      if (!check.ok) {
        return { reflection: getFallback(payload), source: "fallback", reason: check.reason };
      }
      return { reflection: res.reflection.trim(), source: "ai" };
    } catch (err) {
      return { reflection: getFallback(payload), source: "fallback", reason: err.message };
    }
  };
}

export const suggestHabitsFromNarrative = withCrisisGuardrail(
  client.suggestHabitsFromNarrative,
);

export const generateGrowthReflection = withNarrativeGuard({
  aiFn: client.generateGrowthReflection,
  getUserText: (p) => p.entriesText,
});

export const generateJournalFeedback = withNarrativeGuard({
  aiFn: client.generateJournalFeedback,
  getUserText: (p) =>
    [p.text, ...(p.recentEntries ?? []).map((e) => e.text)].join("\n"),
});

export const generateBurlFeedback = withNarrativeGuard({
  aiFn: client.generateBurlFeedback,
  getUserText: (p) =>
    [p.note, ...(p.recentEntries ?? []).map((e) => e.text)].join("\n"),
  // Deterministic message from lib/psychology/recovery.js — the core
  // feature still works when Gemini is down or its output is rejected.
  getFallback: (p) => p.deterministicMessage ?? null,
});
