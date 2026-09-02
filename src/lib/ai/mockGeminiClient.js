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
 * @param {string} _recentEntriesText - unused in the mock, kept for signature parity.
 * @returns {Promise<{ reflection: string }>}
 */
export async function generateGrowthReflection(_recentEntriesText) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockData.growthReflection;
}
