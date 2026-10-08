// Recovery Rate itself is NOT stored here — it's a derived value computed by
// lib/psychology/recovery.js from burlEvents + the action-phase check-in
// history. This slice only holds the raw, user-authored log entries.

export const createRecoverySlice = (set, get) => ({
  // { id, note, createdAt, habitId: string|null, aiFeedback: {...}|null }
  burlEvents: [],

  // Returns the new burl so the caller can feed it to the AI layer.
  logSetback: ({ note }) => {
    const burl = {
      id: crypto.randomUUID(),
      note,
      habitId: get().activeHabit?.id ?? null,
      aiFeedback: null,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ burlEvents: [burl, ...state.burlEvents] }));
    return burl;
  },

  setBurlFeedback: (id, aiFeedback) =>
    set((state) => ({
      burlEvents: state.burlEvents.map((b) =>
        b.id === id ? { ...b, aiFeedback } : b,
      ),
    })),
});
