const DAY_MS = 24 * 60 * 60 * 1000;

// v1 heuristic mapping of journal tags to growth dimensions. This is
// deliberately simple and tunable — the AI layer (lib/ai) may later suggest
// tags to attach to an entry, but this file only ever counts tags that are
// already attached; it never interprets free-text itself. That interpretation
// boundary is what keeps this module AI-independent.
const TAG_CATEGORIES = {
  emotionalRegulation: ['mindfulness', 'urgesurfing', 'triggerresponse'],
  selfControl: ['triggerresponse', 'urgesurfing', 'selfcontrol', 'morningroutine'],
  facingChallenges: ['insight', 'slippattern', 'facingchallenges'],
};

const normalizeTag = (tag) => tag.replace(/^#/, '').toLowerCase();

function scoreToLevel(score) {
  if (score >= 0.67) return 'flowing';
  if (score >= 0.34) return 'steady';
  return 'building';
}

function tagRatioScore(entries, categoryTags) {
  if (entries.length === 0) return 0;
  const matches = entries.filter((entry) =>
    entry.tags.some((tag) => categoryTags.includes(normalizeTag(tag)))
  ).length;
  return Math.min(matches / entries.length, 1);
}

/**
 * Consistency = distinct days with at least one entry, over the observed
 * window (from the earliest entry up to `today`, capped at `windowDays`).
 */
function consistencyScore(entries, today, windowDays) {
  if (entries.length === 0) return 0;

  const windowStart = today.getTime() - windowDays * DAY_MS;
  const inWindow = entries.filter(
    (e) => new Date(e.createdAt).getTime() >= windowStart
  );
  if (inWindow.length === 0) return 0;

  const distinctDays = new Set(
    inWindow.map((e) => new Date(e.createdAt).toISOString().slice(0, 10))
  );

  const earliestInWindow = Math.min(
    ...inWindow.map((e) => new Date(e.createdAt).getTime())
  );
  const observedDays = Math.max(
    1,
    Math.ceil((today.getTime() - earliestInWindow) / DAY_MS) + 1
  );

  return Math.min(distinctDays.size / Math.min(observedDays, windowDays), 1);
}

/**
 * Computes the 4 Growth insight metrics shown on the Growth screen.
 * Pure function of journalEntries — no AI call, no network.
 *
 * @param {{ id: string, text: string, tags: string[], createdAt: string }[]} journalEntries
 * @param {Date} [today] - injectable for testing
 * @param {number} [windowDays] - how many days back "Consistency" looks
 * @returns {{
 *   consistency: { score: number, level: 'building'|'steady'|'flowing' },
 *   emotionalRegulation: { score: number, level: string },
 *   selfControl: { score: number, level: string },
 *   facingChallenges: { score: number, level: string },
 *   hasEnoughData: boolean,
 * }}
 */
export function computeGrowthInsights(journalEntries, today = new Date(), windowDays = 14) {
  const hasEnoughData = journalEntries.length >= 3;

  const consistency = consistencyScore(journalEntries, today, windowDays);
  const emotionalRegulation = tagRatioScore(journalEntries, TAG_CATEGORIES.emotionalRegulation);
  const selfControl = tagRatioScore(journalEntries, TAG_CATEGORIES.selfControl);
  const facingChallenges = tagRatioScore(journalEntries, TAG_CATEGORIES.facingChallenges);

  return {
    consistency: { score: consistency, level: scoreToLevel(consistency) },
    emotionalRegulation: { score: emotionalRegulation, level: scoreToLevel(emotionalRegulation) },
    selfControl: { score: selfControl, level: scoreToLevel(selfControl) },
    facingChallenges: { score: facingChallenges, level: scoreToLevel(facingChallenges) },
    hasEnoughData,
  };
}
