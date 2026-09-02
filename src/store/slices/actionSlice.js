const todayISO = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

export const createActionSlice = (set, get) => ({
  intention: { trigger: '', action: '' },
  experimentStartDate: null,
  // checkIns is a map of 'YYYY-MM-DD' -> boolean, NOT an array of 7 fixed
  // slots. This keeps the data model honest: which calendar day is "Day 3"
  // is derived (in lib/psychology), never hardcoded here.
  checkIns: {},

  setIntention: ({ trigger, action }) => set({ intention: { trigger, action } }),

  // Starting the experiment is separate from saving the intention, so a user
  // can draft their intention without committing to Day 1 yet.
  startExperiment: () => {
    if (get().experimentStartDate) return; // already running, no-op
    set({ experimentStartDate: todayISO(), checkIns: {} });
  },

  logCheckIn: (dateISO = todayISO(), completed = true) =>
    set((state) => ({
      checkIns: { ...state.checkIns, [dateISO]: completed },
    })),

  // Matches the "Reset Current Experiment" action in Settings.
  resetExperiment: () => set({ experimentStartDate: null, checkIns: {} }),
});
