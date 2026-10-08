import mockData from "../../mocks/data/aiReflection.mock.json";

/**
 * Mock version of geminiClient.js's `suggestHabitsFromNarrative`.
 * Same signature, same return shape — swappable with zero changes
 * to any component that calls it.
 *
 * @param {string} narrative - unused in the mock, kept for signature parity.
 * @returns {Promise<{ habits: { id: string, label: string, source: 'ai' }[] }>}
 */
export async function suggestHabitsFromNarrative(_narrative) {
  // Simulate network latency so loading states can be tested honestly.
  await new Promise((resolve) => setTimeout(resolve, 400));
  const { habits } = mockData.habitSuggestions;
  // Tagged the same way the real client tags its output, so AwarenessPage
  // doesn't need to know or care whether it's talking to the mock or the
  // real Gemini client.
  return { habits: habits.map((h) => ({ ...h, source: "ai" })) };
}

/**
 * Mock version of geminiClient.js's `generateGrowthReflection`.
 * Same signature, same return shape.
 *
 * @param {object} _payload - unused in the mock, kept for signature parity.
 * @returns {Promise<{ reflection: string }>}
 */
export async function generateGrowthReflection(_payload) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockData.growthReflection;
}

/**
 * Mock of generateJournalFeedback. Deterministic, but still echoes the habit
 * label so UI tests can tell that the payload really reached the client.
 */
export async function generateJournalFeedback({ habit }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    reflection: `Noticing this moment is itself progress on "${habit?.label ?? "your habit"}".`,
  };
}

/**
 * Mock of generateBurlFeedback. Narrates only numbers present in `facts`.
 */
export async function generateBurlFeedback({ facts }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const d = facts?.latestRecoveryDays;
  return {
    reflection:
      d != null
        ? `You came back in ${d} day${d === 1 ? "" : "s"} — this setback is information about your plan, not about you.`
        : "This setback is information about your plan, not about you. One tiny step is enough to continue.",
  };
}
