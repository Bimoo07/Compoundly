/**
 * Crisis guardrail.
 *
 * MUST be checked before ANY user-authored free text (future-self narrative,
 * journal entries, setback notes) is sent to the Gemini API. If a crisis
 * signal is detected, the AI call is skipped entirely — the app responds
 * with a supportive, non-AI message and real-world resources instead.
 *
 * This module is intentionally simple pattern-matching, not sentiment
 * analysis or an AI model. Keeping it deterministic and dependency-free
 * means it can never fail open because of a network issue, and it runs
 * before the AI boundary is even touched.
 *
 * IMPORTANT: this is a first line of defense, not a substitute for
 * professional crisis intervention. It intentionally errs toward
 * over-flagging (a few false positives are an acceptable cost) rather than
 * risking a missed signal.
 */

// Deliberately kept to ideation-level phrases (English + Indonesian) —
// not an exhaustive clinical taxonomy, and never method-specific.
// Review and extend this list with input from a mental health professional
// before shipping to real users.
const CRISIS_PATTERNS = [
  /kill myself/i,
  /want(ed)? to die/i,
  /end(ing)? my life/i,
  /suicid(e|al)/i,
  /no reason to live/i,
  /(hurt|harm) myself/i,
  /self[- ]harm/i,
  /bunuh diri/i,
  /ingin mati/i,
  /mengakhiri hidup/i,
  /menyakiti diri/i,
  /tidak ada alasan (untuk )?hidup/i,
];

/**
 * @param {string} text
 * @returns {{ flagged: boolean }}
 */
export function checkForCrisisSignal(text) {
  if (!text || typeof text !== 'string') return { flagged: false };
  const flagged = CRISIS_PATTERNS.some((pattern) => pattern.test(text));
  return { flagged };
}

/**
 * Supportive, non-AI response shown instead of any Gemini output when a
 * crisis signal is detected. Resources are locale-aware but deliberately
 * conservative — verify and update these periodically, as hotline details
 * can change.
 *
 * @param {'en' | 'id'} locale
 */
export function getCrisisResponse(locale = 'en') {
  const copy = {
    id: {
      message:
        "Sepertinya kamu sedang menghadapi momen yang sangat berat. Compoundly bukan layanan krisis, tapi kamu tidak harus melalui ini sendirian.",
      resourceLabel: 'Healing119.id — layanan kesehatan jiwa Kemenkes RI, gratis & 24 jam',
      resourceContact: 'Telepon 119 ext. 8, atau chat di healing119.id',
    },
    en: {
      message:
        "It sounds like you're going through something really difficult right now. Compoundly isn't a crisis service, but you don't have to face this alone.",
      resourceLabel: 'Find A Helpline — free, confidential support directory by country',
      resourceContact: 'findahelpline.com',
    },
  };

  return copy[locale] ?? copy.en;
}
