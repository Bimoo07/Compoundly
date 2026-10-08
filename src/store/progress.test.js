import { describe, it, expect, afterEach } from "vitest";
import { useAppStore } from "./useAppStore";
import { forHabit } from "./slices/growthSlice";
import { resetAppStore } from "../tests/testUtils";

const A = { id: "a", label: "Habit A", source: "curated" };
const B = { id: "b", label: "Habit B", source: "curated" };

afterEach(() => resetAppStore());

describe("progress rules", () => {
  it("choosing a DIFFERENT habit resets experiment + check-ins (phase goes back to Action)", () => {
    const s = useAppStore.getState();
    s.selectHabit(A);
    s.setIntention({ trigger: "after dinner", action: "code 20 min" });
    s.startExperiment();
    s.logCheckIn("2026-01-01", true);

    useAppStore.getState().selectHabit(B);
    const st = useAppStore.getState();
    expect(st.activeHabit.id).toBe("b");
    expect(st.experimentStartDate).toBeNull();
    expect(st.checkIns).toEqual({});
    expect(st.intention).toEqual({ trigger: "", action: "" });
  });

  it("re-selecting the SAME habit keeps the running experiment", () => {
    const s = useAppStore.getState();
    s.selectHabit(A);
    s.startExperiment();
    useAppStore.getState().selectHabit(A);
    expect(useAppStore.getState().experimentStartDate).not.toBeNull();
  });

  it("tags journal entries and setbacks with the active habit and scopes them", () => {
    useAppStore.getState().selectHabit(A);
    useAppStore.getState().addJournalEntry({ text: "x" });
    useAppStore.getState().logSetback({ note: "y" });
    useAppStore.getState().selectHabit(B);
    useAppStore.getState().addJournalEntry({ text: "z" });
    const { journalEntries, burlEvents } = useAppStore.getState();
    expect(forHabit(journalEntries, "a")).toHaveLength(1);
    expect(forHabit(journalEntries, "b")).toHaveLength(1);
    expect(forHabit(burlEvents, "b")).toHaveLength(0);
  });

  it("resetProgress clears everything but keeps the accepted disclaimer", () => {
    const s = useAppStore.getState();
    s.acceptDisclaimer();
    useAppStore.getState().selectHabit(A);
    useAppStore.getState().addJournalEntry({ text: "x" });
    useAppStore.getState().resetProgress();
    const st = useAppStore.getState();
    expect(st.activeHabit).toBeNull();
    expect(st.journalEntries).toEqual([]);
    expect(st.burlEvents).toEqual([]);
    expect(st.hasAcceptedDisclaimer).toBe(true);
  });
});
