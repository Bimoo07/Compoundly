// Recovery Rate itself is NOT stored here — it's a derived value computed by
// lib/psychology/recovery.js from burlEvents + the action-phase check-in
// history. This slice only holds the raw, user-authored log entries.

export const createRecoverySlice = (set) => ({
  burlEvents: [], // { id, note, createdAt }

  logSetback: ({ note }) =>
    set((state) => ({
      burlEvents: [
        { id: crypto.randomUUID(), note, createdAt: new Date().toISOString() },
        ...state.burlEvents,
      ],
    })),
});
