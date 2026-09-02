const DAY_MS = 24 * 60 * 60 * 1000;

// Two consecutive missed days is the trigger threshold. Kept as a named
// constant (not buried in the function) since this is exactly the kind of
// psychological threshold that should be easy to find and tune deliberately,
// not accidentally.
const MISSED_DAY_THRESHOLD = 2;

const toDateOnly = (date) => new Date(date.toDateString());

/**
 * Detects whether the user's current 7-Day Experiment has drifted into a
 * "burl" state — MISSED_DAY_THRESHOLD or more consecutive days without a
 * completed check-in — while the experiment is still active.
 *
 * This is a pure pattern check. It never judges *why* the days were missed
 * and never contacts the AI layer — it only surfaces the pattern so the UI
 * can gently invite the user to log a Setback (Phase 4), never auto-logs
 * one on their behalf.
 *
 * @param {Record<string, boolean>} checkIns - from actionSlice
 * @param {string | null} experimentStartDate - 'YYYY-MM-DD' or null
 * @param {Date} [today] - injectable for testing
 * @returns {{
 *   triggered: boolean,
 *   missedStreak: number,
 *   lastCheckInDate: string | null,
 * }}
 */
export function detectBurlTrigger(checkIns, experimentStartDate, today = new Date()) {
  if (!experimentStartDate) {
    return { triggered: false, missedStreak: 0, lastCheckInDate: null };
  }

  const start = toDateOnly(new Date(experimentStartDate));
  const todayOnly = toDateOnly(today);

  const completedDates = Object.entries(checkIns)
    .filter(([, completed]) => completed)
    .map(([date]) => date)
    .sort();
  const lastCheckInDate = completedDates[completedDates.length - 1] ?? null;

  // Walk backward from today until we hit a completed check-in or the
  // experiment's start date, counting consecutive missed days.
  let missedStreak = 0;
  for (
    let cursor = todayOnly.getTime();
    cursor >= start.getTime();
    cursor -= DAY_MS
  ) {
    const cursorDate = new Date(cursor).toISOString().slice(0, 10);
    if (checkIns[cursorDate]) break;
    missedStreak += 1;
  }

  return {
    triggered: missedStreak >= MISSED_DAY_THRESHOLD,
    missedStreak,
    lastCheckInDate,
  };
}
