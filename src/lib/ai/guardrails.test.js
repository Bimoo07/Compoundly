import { describe, it, expect } from "vitest";
import { checkForCrisisSignal, getCrisisResponse } from "./guardrails";

describe("checkForCrisisSignal", () => {
  it("does not flag ordinary text", () => {
    expect(
      checkForCrisisSignal(
        "I wake up feeling rested, reaching for water instead of my phone.",
      ),
    ).toEqual({ flagged: false });
  });

  it("flags English crisis phrases", () => {
    expect(
      checkForCrisisSignal(
        "I don't see the point anymore, I just want to end my life.",
      ).flagged,
    ).toBe(true);
  });

  it("flags Indonesian crisis phrases", () => {
    expect(
      checkForCrisisSignal("Rasanya aku ingin mengakhiri hidup saja.").flagged,
    ).toBe(true);
    expect(checkForCrisisSignal("kadang aku ingin bunuh diri").flagged).toBe(
      true,
    );
  });

  it("handles empty, null, and non-string input safely without throwing", () => {
    expect(checkForCrisisSignal("")).toEqual({ flagged: false });
    expect(checkForCrisisSignal(null)).toEqual({ flagged: false });
    expect(checkForCrisisSignal(undefined)).toEqual({ flagged: false });
  });
});

describe("getCrisisResponse", () => {
  it('returns Indonesian resources (Healing119.id) for locale "id"', () => {
    const response = getCrisisResponse("id");
    expect(response.resourceLabel).toMatch(/healing119/i);
  });

  it("falls back to English resources for an unrecognized locale", () => {
    const response = getCrisisResponse("fr");
    expect(response.resourceLabel).toMatch(/find a helpline/i);
  });

  it("defaults to English when no locale is given", () => {
    const response = getCrisisResponse();
    expect(response.resourceLabel).toMatch(/find a helpline/i);
  });
});

describe("guardrail v2", () => {
  it("mengembalikan locale dan rule (bukan teks pengguna) saat ditandai", () => {
    const r = checkForCrisisSignal("kadang aku ingin bunuh diri");
    expect(r).toEqual({ flagged: true, locale: "id", rule: "bunuh diri" });
    expect(checkForCrisisSignal("I want to kill myself").locale).toBe("en");
  });

  it("tahan terhadap leetspeak, huruf berulang, dan aksen", () => {
    expect(checkForCrisisSignal("aku pengen m4t1").flagged).toBe(true);
    expect(checkForCrisisSignal("I wanna diiiie").flagged).toBe(true);
    expect(checkForCrisisSignal("aku ingin bunuh dirí").flagged).toBe(true);
  });

  it("tidak menandai idiom jinak dan kelelahan umum", () => {
    for (const t of [
      "Cut myself some slack today",
      "hp ku udah mau mati",
      "Hari ini mati lampu",
      "capek banget hari ini",
      "I'm dying laughing",
    ]) {
      expect(checkForCrisisSignal(t).flagged, t).toBe(false);
    }
  });

  it("sengaja over-flag kalimat bernegasi (kebijakan konservatif)", () => {
    expect(checkForCrisisSignal("aku tidak ingin bunuh diri").flagged).toBe(true);
  });
});
