export const createOnboardingSlice = (set) => ({
  hasAcceptedDisclaimer: false,

  acceptDisclaimer: () =>
    set({ hasAcceptedDisclaimer: true, currentView: 'journey' }),
});
