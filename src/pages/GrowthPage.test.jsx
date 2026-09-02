import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GrowthPage from "./GrowthPage";
import { useAppStore } from "../store/useAppStore";
import { resetAppStore } from "../tests/testUtils";

afterEach(() => {
  resetAppStore();
});

describe("GrowthPage — save journal entry flow", () => {
  it("shows the empty state when there are no entries yet", () => {
    render(<GrowthPage />);
    expect(
      screen.getByText(/no entries yet — your first one starts the pattern/i),
    ).toBeInTheDocument();
  });

  it("saves a journal entry with tags, and it appears in Recent Evidence", async () => {
    const user = userEvent.setup();
    render(<GrowthPage />);

    await user.type(
      screen.getByPlaceholderText(/record a moment of growth today/i),
      "Resisted the evening urge and read a book instead.",
    );
    await user.type(
      screen.getByPlaceholderText(/#mindfulness #urgesurfing/i),
      "#TriggerResponse #Mindfulness",
    );
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    // Store actually has the entry, with tags parsed into an array.
    const entries = useAppStore.getState().journalEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe(
      "Resisted the evening urge and read a book instead.",
    );
    expect(entries[0].tags).toEqual(["#TriggerResponse", "#Mindfulness"]);

    // UI reflects it too.
    expect(
      await screen.findByText(/resisted the evening urge/i),
    ).toBeInTheDocument();

    // Empty state message is gone now that there's at least one entry.
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument();
  });

  it("clears the form after saving, ready for the next entry", async () => {
    const user = userEvent.setup();
    render(<GrowthPage />);

    const textarea = screen.getByPlaceholderText(
      /record a moment of growth today/i,
    );
    await user.type(textarea, "First entry");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(textarea).toHaveValue("");
  });

  it("the Save Entry button stays disabled until there is text", async () => {
    render(<GrowthPage />);
    expect(screen.getByRole("button", { name: /save entry/i })).toBeDisabled();
  });
});
