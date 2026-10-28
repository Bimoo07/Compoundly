import { describe, it, expect } from "vitest";
import { computeRecoveryRate } from "./recovery";

const day = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
const dayOnly = (n) => day(n).slice(0, 10);

describe("computeRecoveryRate", () => {
  it('returns "no-data" when there are no burl events yet', () => {
    const result = computeRecoveryRate([], {});
    expect(result.status).toBe("no-data");
    expect(result.message).toBeNull();
  });

  it('returns "awaiting-recovery" when the most recent burl has no check-in after it', () => {
    const burlEvents = [{ id: "b1", note: "still stuck", createdAt: day(-2) }];
    const result = computeRecoveryRate(burlEvents, {});
    expect(result.status).toBe("awaiting-recovery");
    expect(result.latestRecoveryDays).toBeNull();
    expect(result.message).toMatch(/part of the process/i);
  });

  it('returns "insufficient-history" for the first-ever recovery (nothing to compare against)', () => {
    const burlEvents = [
      { id: "b1", note: "first setback", createdAt: day(-10) },
    ];
    const checkIns = { [dayOnly(-7)]: true }; // recovered 3 days after the burl
    const result = computeRecoveryRate(burlEvents, checkIns);
    expect(result.status).toBe("insufficient-history");
    expect(result.latestRecoveryDays).toBe(3);
    expect(result.deltaDays).toBeNull();
  });

  it("reports a positive deltaDays when the latest recovery was faster than before", () => {
    const burlEvents = [
      { id: "b1", note: "skipped 3 days", createdAt: day(-30) },
      { id: "b2", note: "skipped again", createdAt: day(-10) },
    ];
    const checkIns = {
      [dayOnly(-25)]: true, // recovered 5 days after b1
      [dayOnly(-7)]: true, // recovered 3 days after b2 -> 2 days faster
    };
    const result = computeRecoveryRate(burlEvents, checkIns);
    expect(result.status).toBe("ok");
    expect(result.latestRecoveryDays).toBe(3);
    expect(result.previousAverageDays).toBe(5);
    expect(result.deltaDays).toBe(2);
    expect(result.message).toMatch(/2 days faster/i);
  });

  it("reports a negative deltaDays without being punitive in tone when recovery was slower", () => {
    const burlEvents = [
      { id: "b1", note: "first", createdAt: day(-30) },
      { id: "b2", note: "second", createdAt: day(-10) },
    ];
    const checkIns = {
      [dayOnly(-28)]: true, // recovered 2 days after b1
      [dayOnly(-4)]: true, // recovered 6 days after b2 -> 4 days slower
    };
    const result = computeRecoveryRate(burlEvents, checkIns);
    expect(result.deltaDays).toBe(-4);
    expect(result.message).toMatch(/that's alright/i);
  });
});

describe("computeRecoveryRate — independent of time of day", () => {
  it.each(["2026-10-08T00:30:00Z", "2026-10-08T14:26:00Z", "2026-10-08T23:59:00Z"])(
    "counts whole calendar days when 'now' is %s",
    async (now) => {
      const { vi } = await import("vitest");
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));
      const burlEvents = [{ id: "b1", note: "x", createdAt: day(-10) }];
      const result = computeRecoveryRate(burlEvents, { [dayOnly(-7)]: true });
      vi.useRealTimers();
      expect(result.latestRecoveryDays).toBe(3);
    },
  );
});
