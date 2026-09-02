import { describe, it, expect } from "vitest";
import { detectBurlTrigger } from "./burl";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOnly = (date, n) =>
  new Date(date.getTime() + n * DAY_MS).toISOString().slice(0, 10);

describe("detectBurlTrigger", () => {
  it("is never triggered when no experiment has started", () => {
    const result = detectBurlTrigger({}, null);
    expect(result.triggered).toBe(false);
    expect(result.missedStreak).toBe(0);
  });

  it("is not triggered when check-ins are current (missed streak below threshold)", () => {
    const today = new Date("2026-06-10T12:00:00Z");
    const start = dayOnly(today, -2);
    const checkIns = {
      [dayOnly(today, -2)]: true,
      [dayOnly(today, -1)]: true,
      [dayOnly(today, 0)]: true,
    };
    const result = detectBurlTrigger(checkIns, start, today);
    expect(result.triggered).toBe(false);
    expect(result.missedStreak).toBe(0);
  });

  it("is triggered once the missed streak reaches the threshold (2 consecutive days)", () => {
    const today = new Date("2026-06-10T12:00:00Z");
    const start = dayOnly(today, -5);
    const checkIns = {
      [dayOnly(today, -5)]: true,
      [dayOnly(today, -4)]: true,
      // -3, -2, -1, 0 all missed → 4-day streak, well past the threshold of 2
    };
    const result = detectBurlTrigger(checkIns, start, today);
    expect(result.triggered).toBe(true);
    expect(result.missedStreak).toBe(4);
    expect(result.lastCheckInDate).toBe(dayOnly(today, -4));
  });

  it("reports the correct lastCheckInDate even when not currently triggered", () => {
    const today = new Date("2026-06-10T12:00:00Z");
    const start = dayOnly(today, -3);
    const checkIns = { [dayOnly(today, -3)]: true };
    const result = detectBurlTrigger(checkIns, start, today);
    expect(result.lastCheckInDate).toBe(dayOnly(today, -3));
  });
});
