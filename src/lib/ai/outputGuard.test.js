import { describe, it, expect } from "vitest";
import { validateNarrative } from "./outputGuard";

describe("validateNarrative", () => {
  it("accepts a short, non-clinical sentence", () => {
    expect(validateNarrative("You showed up again — that matters.").ok).toBe(true);
  });

  it("rejects empty or non-string output", () => {
    expect(validateNarrative("").reason).toBe("empty");
    expect(validateNarrative(null).reason).toBe("empty");
  });

  it("rejects overly long output", () => {
    expect(validateNarrative("a".repeat(500)).reason).toBe("too-long");
  });

  it.each(["That sounds like a depression pattern.", "Ini gangguan kecemasan.", "Your streak is broken."])(
    "rejects clinical or streak vocabulary: %s",
    (t) => expect(validateNarrative(t).reason).toBe("banned-term"),
  );

  it("rejects numbers that are not in facts or the user's text", () => {
    const r = validateNarrative("You recovered 5 days faster.", { facts: { fasterByDays: 2 } });
    expect(r.reason).toBe("unsupported-number");
  });

  it("accepts numbers that come from facts or from the user's own text", () => {
    expect(validateNarrative("You came back in 3 days.", { facts: { latestRecoveryDays: 3 } }).ok).toBe(true);
    expect(validateNarrative("30 minutes of coding is a solid start.", { userText: "coding 30 minutes" }).ok).toBe(true);
  });
});
