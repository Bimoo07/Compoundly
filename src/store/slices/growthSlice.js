// NOTE: growth "Insights" (Consistency, Emotional Regulation, Self-Control,
// Facing Challenges) are intentionally NOT stored here. They are derived
// values computed by lib/psychology/growth.js from journalEntries — keeping
// a single source of truth and honoring the "AI/logic never dictates,
// evidence is always the raw truth" principle from the project doc.

export const createGrowthSlice = (set) => ({
  journalEntries: [], // { id, text, tags: string[], createdAt }

  addJournalEntry: ({ text, tags = [] }) =>
    set((state) => ({
      journalEntries: [
        {
          id: crypto.randomUUID(),
          text,
          tags,
          createdAt: new Date().toISOString(),
        },
        ...state.journalEntries,
      ],
    })),
});

/**
 * Selector: last N days of journal entries. Use this (never the raw array)
 * when preparing context for the Gemini API, per the data-minimization
 * principle — only the last 7 days should ever leave the device.
 */
export const selectRecentJournalEntries = (state, days = 7) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return state.journalEntries.filter(
    (entry) => new Date(entry.createdAt).getTime() >= cutoff
  );
};
