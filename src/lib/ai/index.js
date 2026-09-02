// Single entry point for the rest of the app. Components should only ever
// `import { suggestHabitsFromNarrative } from '@/lib/ai'` — never reach into
// geminiClient.js or mockGeminiClient.js directly. That's what makes the
// swap invisible to every component, AND what guarantees the crisis
// guardrail below can never be accidentally bypassed.
import { checkForCrisisSignal, getCrisisResponse } from './guardrails.js';

const useMock = import.meta.env.VITE_USE_MOCK_AI === 'true';

const client = useMock
  ? await import('./mockGeminiClient.js')
  : await import('./geminiClient.js');

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
      // TODO: pass the user's actual language preference from settingsSlice
      // instead of hardcoding 'en' here once this is wired into a component.
      return { crisisDetected: true, ...getCrisisResponse('en') };
    }
    return aiFn(text, ...rest);
  };
}

export const suggestHabitsFromNarrative = withCrisisGuardrail(
  client.suggestHabitsFromNarrative
);
