export const createNavigationSlice = (set) => ({
  currentView: 'onboarding',

  setView: (view) => set({ currentView: view }),
});
