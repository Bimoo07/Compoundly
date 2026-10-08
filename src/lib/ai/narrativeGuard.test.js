import { describe, it, expect } from "vitest";
import { generateJournalFeedback, generateBurlFeedback } from "./index";

const habit = { id: "h1", label: "Morning Sunlight", source: "curated" };

describe("narrative guard pipeline (mock client)", () => {
  it("skips the AI and returns crisis resources when the entry has a crisis signal", async () => {
    const res = await generateJournalFeedback({
      habit, language: "id", text: "aku ingin mati", tags: [], recentEntries: [], facts: {},
    });
    expect(res.crisisDetected).toBe(true);
    expect(res.reflection).toBeUndefined();
  });

  it("also checks the recent entries, not just the new one", async () => {
    const res = await generateJournalFeedback({
      habit, language: "en", text: "fine today", tags: [],
      recentEntries: [{ text: "I want to die" }], facts: {},
    });
    expect(res.crisisDetected).toBe(true);
  });

  it("returns validated AI text for a normal journal entry", async () => {
    const res = await generateJournalFeedback({
      habit, language: "en", text: "I went outside at 7am", tags: [], recentEntries: [], facts: {},
    });
    expect(res.source).toBe("ai");
    expect(res.reflection).toMatch(/Morning Sunlight/);
  });

  it("checks the setback note for crisis signals before any AI call", async () => {
    const res = await generateBurlFeedback({
      habit, language: "en", note: "I want to kill myself", recentEntries: [], facts: {},
    });
    expect(res.crisisDetected).toBe(true);
  });

  it("narrates recovery days that come from deterministic facts", async () => {
    const res = await generateBurlFeedback({
      habit, language: "en", note: "skipped 3 days", recentEntries: [],
      facts: { latestRecoveryDays: 2 }, deterministicMessage: "fallback",
    });
    expect(res.source).toBe("ai");
    expect(res.reflection).toMatch(/2 days/);
  });
});
