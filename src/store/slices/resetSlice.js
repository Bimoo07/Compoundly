// Soft reset: wipes ALL progress (story, habit, experiment, journal, setbacks)
// but keeps the accepted disclaimer and settings. Unlike "Delete All Data"
// in Settings it needs no page reload and no LocalStorage surgery.
export const PROGRESS_DEFAULTS = {
  futureSelfNarrative: "",
  activeHabit: null,
  habitSelectedAt: null,
  intention: { trigger: "", action: "" },
  experimentStartDate: null,
  checkIns: {},
  journalEntries: [],
  burlEvents: [],
};

export const createResetSlice = (set) => ({
  resetProgress: () => set({ ...PROGRESS_DEFAULTS, currentView: "journey" }),
});