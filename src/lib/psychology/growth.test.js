import { describe, it, expect } from "vitest";
import { computeGrowthInsights } from "./growth";

const day = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

describe("computeGrowthInsights", () => {
  it("returns all-zero scores and hasEnoughData=false for an empty journal", () => {
    const result = computeGrowthInsights([]);
    expect(result.hasEnoughData).toBe(false);
    expect(result.consistency.score).toBe(0);
    expect(result.emotionalRegulation.score).toBe(0);
    expect(result.consistency.level).toBe("building");
  });

  it("flags hasEnoughData=true once there are at least 3 entries", () => {
    const entries = [
      { id: "1", text: "a", tags: [], createdAt: day(0) },
      { id: "2", text: "b", tags: [], createdAt: day(-1) },
      { id: "3", text: "c", tags: [], createdAt: day(-2) },
    ];
    expect(computeGrowthInsights(entries).hasEnoughData).toBe(true);
  });

  it("scores emotionalRegulation higher when entries are tagged with matching categories", () => {
    const entries = [
      { id: "1", text: "a", tags: ["#Mindfulness"], createdAt: day(0) },
      { id: "2", text: "b", tags: ["#TriggerResponse"], createdAt: day(-1) },
      { id: "3", text: "c", tags: [], createdAt: day(-2) },
    ];
    const result = computeGrowthInsights(entries);
    // 2 of 3 entries match emotionalRegulation tags -> score ~0.67
    expect(result.emotionalRegulation.score).toBeCloseTo(2 / 3, 5);
    expect(result.emotionalRegulation.level).not.toBe("building");
  });

  it("scores 0 for a category with no matching tags at all", () => {
    const entries = [
      { id: "1", text: "a", tags: ["#Unrelated"], createdAt: day(0) },
    ];
    const result = computeGrowthInsights(entries);
    expect(result.facingChallenges.score).toBe(0);
  });

  it("never returns a score above 1, even with excessive matching tags", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      text: "x",
      tags: ["#Insight", "#SlipPattern", "#FacingChallenges"],
      createdAt: day(-i),
    }));
    const result = computeGrowthInsights(entries);
    expect(result.facingChallenges.score).toBeLessThanOrEqual(1);
  });
});
