import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionPage from "./ActionPage";
import { useAppStore } from "../store/useAppStore";
import { resetAppStore } from "../tests/testUtils";

afterEach(() => {
  resetAppStore();
});

describe("ActionPage — submit intention flow", () => {
  it("starts with no experiment running, and the intention form empty", () => {
    render(<ActionPage />);
    expect(
      screen.getByText(/save your intention to start day 1/i),
    ).toBeInTheDocument();
  });

  it("saves the intention and starts Day 1 of the experiment when submitted", async () => {
    const user = userEvent.setup();
    render(<ActionPage />);

    await user.type(
      screen.getByLabelText(/if i…/i),
      "feel overwhelmed during work",
    );
    await user.type(
      screen.getByLabelText(/then i will…/i),
      "take 3 slow, deep breaths",
    );
    await user.click(screen.getByRole("button", { name: /save experiment/i }));

    // Store was actually updated, not just local component state.
    const state = useAppStore.getState();
    expect(state.intention.trigger).toBe("feel overwhelmed during work");
    expect(state.intention.action).toBe("take 3 slow, deep breaths");
    expect(state.experimentStartDate).not.toBeNull();

    // UI reflects the new state: progress panel now shows Day 1/7.
    expect(await screen.findByText(/day 1\/7/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /yes, i experimented/i }),
    ).toBeEnabled();
  });

  it("the Save Experiment button stays disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<ActionPage />);

    const saveButton = screen.getByRole("button", { name: /save experiment/i });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText(/if i…/i), "something");
    expect(saveButton).toBeDisabled(); // still missing the "then" field

    await user.type(screen.getByLabelText(/then i will…/i), "something else");
    expect(saveButton).toBeEnabled();
  });

  it('logs a check-in for today when "Yes, I experimented" is clicked', async () => {
    const user = userEvent.setup();

    // Pre-seed an already-running experiment so we can test the check-in
    // button directly, without repeating the full intention-submit flow.
    useAppStore.getState().startExperiment();

    render(<ActionPage />);

    const checkInButton = screen.getByRole("button", {
      name: /yes, i experimented/i,
    });
    await user.click(checkInButton);

    const today = new Date().toISOString().slice(0, 10);
    expect(useAppStore.getState().checkIns[today]).toBe(true);
    expect(await screen.findByText(/logged for today/i)).toBeInTheDocument();
  });
});
