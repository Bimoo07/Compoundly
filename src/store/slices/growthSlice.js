// NOTE: growth "Insights" (Consistency, Emotional Regulation, Self-Control,
// Facing Challenges) are intentionally NOT stored here. They are derived
// values computed by lib/psychology/growth.js from journalEntries — keeping
// a single source of truth and honoring the "AI/logic never dictates,
// evidence is always the raw truth" principle from the project doc.

export const createGrowthSlice = (set) => ({
  // { id, text, tags: string[], createdAt, habitId: string|null,
  //   aiFeedback: { text, source: 'ai'|'fallback'|'mock', createdAt } | null }
  journalEntries: [],

  // Returns the new entry id so the caller can attach AI feedback to it.
  addJournalEntry: ({ text, tags = [] }) => {
    const id = crypto.randomUUID();
    set((state) => ({
      journalEntries: [
        {
          id,
          text,
          tags,
          habitId: state.activeHabit?.id ?? null,
          aiFeedback: null,
          createdAt: new Date().toISOString(),
        },
        ...state.journalEntries,
      ],
    }));
    return id;
  },

  setJournalFeedback: (id, aiFeedback) =>
    set((state) => ({
      journalEntries: state.journalEntries.map((e) =>
        e.id === id ? { ...e, aiFeedback } : e,
      ),
    })),
});

/**
 * Pure helper: entries (or burls) belonging to one habit. Use via useMemo in
 * components, never as a Zustand selector (same new-array-reference trap as
 * selectRecentJournalEntries below).
 */
export const forHabit = (items, habitId) =>
  items.filter((item) => (item.habitId ?? null) === (habitId ?? null));

/**
 * Selector: last N days of journal entries. Use this (never the raw array)
 * when preparing context for the Gemini API, per the data-minimization
 * principle — only the last 7 days should ever leave the device.
 *
 * IMPORTANT: this is a plain utility function, NOT meant to be passed
 * directly into `useAppStore(selectRecentJournalEntries)` as a hook
 * selector — `.filter()` returns a new array reference every call, which
 * causes an infinite re-render loop with Zustand's useSyncExternalStore
 * (confirmed by GrowthPage.test.jsx). Instead, select the raw
 * `journalEntries` array normally and derive this via `useMemo` in the
 * component — see GrowthPage.jsx.
 */
export const selectRecentJournalEntries = (state, days = 7) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return state.journalEntries.filter(
    (entry) => new Date(entry.createdAt).getTime() >= cutoff,
  );
};
