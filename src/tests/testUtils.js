import { useAppStore } from "../store/useAppStore";

// Captured once, before any test mutates the store. Includes both data
// fields AND action functions — replacing state with this snapshot in
// afterEach() restores data to defaults while actions stay valid (they're
// stable closures from store creation, unaffected by being "reset").
const initialState = useAppStore.getState();

export function resetAppStore() {
  useAppStore.setState(initialState, true);
  window.localStorage.clear();
}
