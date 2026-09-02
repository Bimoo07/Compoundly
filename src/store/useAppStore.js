import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { createNavigationSlice } from "./slices/navigationSlice";
import { createOnboardingSlice } from "./slices/onboardingSlice";
import { createAwarenessSlice } from "./slices/awarenessSlice";
import { createActionSlice } from "./slices/actionSlice";
import { createGrowthSlice } from "./slices/growthSlice";
import { createRecoverySlice } from "./slices/recoverySlice";
import { createSettingsSlice } from "./slices/settingsSlice";

/**
 * Single combined store, built from per-phase slices (see src/store/slices/).
 * Everything persists to LocalStorage — this IS the entire backend for
 * Compoundly, per the local-first architecture. No server, no database.
 */
export const useAppStore = create(
  persist(
    (...a) => ({
      ...createNavigationSlice(...a),
      ...createOnboardingSlice(...a),
      ...createAwarenessSlice(...a),
      ...createActionSlice(...a),
      ...createGrowthSlice(...a),
      ...createRecoverySlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: "compoundly-storage",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 -> v2: awarenessSlice replaced `activeHabitId` (a bare string)
      // with `activeHabit` (the full { id, label, source } object), so
      // AI-generated habits that don't exist in habitOptions.mock.json can
      // flow through the app without a lookup anywhere. There's no way to
      // reconstruct the full object from just the old id, so anyone with a
      // v1 LocalStorage state loses their active habit selection once and
      // has to re-pick — a one-time inconvenience acceptable during active
      // dev with no real users yet.
      migrate: (persistedState, version) => {
        if (
          version < 2 &&
          persistedState &&
          "activeHabitId" in persistedState
        ) {
          const { activeHabitId: _oldActiveHabitId, ...rest } = persistedState;
          return { ...rest, activeHabit: null };
        }
        return persistedState;
      },
      // currentView is intentionally excluded from persistence — on reload,
      // navigation should re-derive from hasAcceptedDisclaimer/activeHabitId
      // rather than resuming on whatever screen was open when the tab closed.
      partialize: (state) => {
        const { currentView: _currentView, ...rest } = state;
        return rest;
      },
    },
  ),
);
