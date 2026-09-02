export const createSettingsSlice = (set) => ({
  notifications: {
    dailyReflectionEnabled: true,
    dailyReflectionTime: '20:00',
    experimentReviewEnabled: true,
    experimentReviewDay: 'Sunday',
    experimentReviewTime: '09:00',
  },
  darkMode: true,
  language: 'en', // 'en' | 'id'

  updateNotificationSetting: (key, value) =>
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    })),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  setLanguage: (language) => set({ language }),
});
