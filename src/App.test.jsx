import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useAppStore } from "./store/useAppStore";
import { resetAppStore } from "./tests/testUtils";

afterEach(() => {
  resetAppStore();
});

describe("App — onboarding flow", () => {
  it("shows the disclaimer screen on first launch, not the Journey Map", () => {
    render(<App />);
    expect(screen.getByText(/welcome to compoundly/i)).toBeInTheDocument();
    expect(screen.getByText(/not a diagnostic tool/i)).toBeInTheDocument();
    expect(screen.queryByText(/your journey map/i)).not.toBeInTheDocument();
  });

  it("proceeds to the Journey Map after accepting the disclaimer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /i understand, let's begin/i }),
    );

    expect(useAppStore.getState().hasAcceptedDisclaimer).toBe(true);
    expect(await screen.findByText(/your journey map/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/welcome to compoundly/i),
    ).not.toBeInTheDocument();
  });

  it("skips the disclaimer entirely if already accepted in a previous session", () => {
    useAppStore.setState({
      hasAcceptedDisclaimer: true,
      currentView: "journey",
    });
    render(<App />);
    expect(screen.getByText(/your journey map/i)).toBeInTheDocument();
  });
});
