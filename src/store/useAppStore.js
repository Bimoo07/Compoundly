import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { createNavigationSlice } from "./slices/navigationSlice";
import { createOnboardingSlice } from "./slices/onboardingSlice";
import { createAwarenessSlice } from "./slices/awarenessSlice";
import { createActionSlice } from "./slices/actionSlice";
import { createGrowthSlice } from "./slices/growthSlice";
import { createRecoverySlice } from "./slices/recoverySlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createResetSlice } from "./slices/resetSlice";

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
      ...createResetSlice(...a),
    }),
    {
      name: "compoundly-storage",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // v1 -> v2: awarenessSlice replaced `activeHabitId` (a bare string)
      // with `activeHabit` (the full { id, label, source } object), so
      // AI-generated habits that don't exist in habitOptions.mock.json can
      // flow through the app without a lookup anywhere. There's no way to
      // reconstruct the full object from just the old id, so anyone with a
      // v1 LocalStorage state loses their active habit selection once and
      // has to re-pick — a one-time inconvenience acceptable during active
      // dev with no real users yet.
      // v2 -> v3: journal entries and burl events now carry `habitId` (so
      // progress can be scoped per habit) and `aiFeedback`. Legacy items are
      // attributed to the habit that is active at migration time.
      migrate: (persistedState, version) => {
        let state = persistedState;
        if (version < 2 && state && "activeHabitId" in state) {
          const { activeHabitId: _oldActiveHabitId, ...rest } = state;
          state = { ...rest, activeHabit: null };
        }
        if (version < 3 && state) {
          const habitId = state.activeHabit?.id ?? null;
          const tag = (items = []) =>
            items.map((i) => ({ habitId, aiFeedback: null, ...i }));
          state = {
            ...state,
            journalEntries: tag(state.journalEntries),
            burlEvents: tag(state.burlEvents),
          };
        }
        return state;
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
