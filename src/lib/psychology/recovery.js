const DAY_MS = 24 * 60 * 60 * 1000;
const dateOf = (isoString) => new Date(isoString);

/**
 * Extracts the sorted list of dates on which the user actually completed
 * a check-in (checkIns[date] === true), from actionSlice's checkIns map.
 */
function getCompletedCheckInDates(checkIns) {
  return Object.entries(checkIns)
    .filter(([, completed]) => completed)
    .map(([date]) => date)
    .sort();
}

/**
 * For a single burl (setback) event, finds how many days it took the user
 * to log their next completed check-in afterward. Returns null if they
 * haven't recovered yet (no check-in after this burl).
 */
function daysToRecoverFrom(burlCreatedAt, completedDates) {
  const burlTime = dateOf(burlCreatedAt).getTime();
  const nextCheckIn = completedDates
    .map((d) => dateOf(d).getTime())
    .filter((t) => t > burlTime)
    .sort((a, b) => a - b)[0];

  if (nextCheckIn === undefined) return null;
  return Math.round((nextCheckIn - burlTime) / DAY_MS);
}

/**
 * Computes Recovery Rate: how many days it took to bounce back from each
 * setback, and whether the most recent recovery was faster than before.
 *
 * @param {{ id: string, note: string, createdAt: string }[]} burlEvents
 * @param {Record<string, boolean>} checkIns - from actionSlice
 * @returns {{
 *   status: 'no-data' | 'awaiting-recovery' | 'insufficient-history' | 'ok',
 *   recoveries: { burlId: string, days: number | null }[],
 *   latestRecoveryDays: number | null,
 *   previousAverageDays: number | null,
 *   deltaDays: number | null,   // positive = recovered faster than before
 *   message: string | null,     // ready-to-display copy, e.g. for the Recovery screen
 * }}
 */
export function computeRecoveryRate(burlEvents, checkIns) {
  if (!burlEvents || burlEvents.length === 0) {
    return {
      status: 'no-data',
      recoveries: [],
      latestRecoveryDays: null,
      previousAverageDays: null,
      deltaDays: null,
      message: null,
    };
  }

  const completedDates = getCompletedCheckInDates(checkIns);

  // Oldest first, so "latest" is unambiguous.
  const chronological = [...burlEvents].sort(
    (a, b) => dateOf(a.createdAt) - dateOf(b.createdAt)
  );

  const recoveries = chronological.map((burl) => ({
    burlId: burl.id,
    days: daysToRecoverFrom(burl.createdAt, completedDates),
  }));

  const latest = recoveries[recoveries.length - 1];

  if (latest.days === null) {
    return {
      status: 'awaiting-recovery',
      recoveries,
      latestRecoveryDays: null,
      previousAverageDays: null,
      deltaDays: null,
      message: "This is part of the process. Log a check-in when you're ready to continue.",
    };
  }

  const previous = recoveries.slice(0, -1).filter((r) => r.days !== null);
  if (previous.length === 0) {
    return {
      status: 'insufficient-history',
      recoveries,
      latestRecoveryDays: latest.days,
      previousAverageDays: null,
      deltaDays: null,
      message: `You returned to your intention in ${latest.days} day${latest.days === 1 ? '' : 's'}.`,
    };
  }

  const previousAverageDays =
    previous.reduce((sum, r) => sum + r.days, 0) / previous.length;
  const deltaDays = Math.round(previousAverageDays - latest.days);

  let message;
  if (deltaDays > 0) {
    message = `Your recovery rate is up: you returned to your intention ${deltaDays} day${deltaDays === 1 ? '' : 's'} faster than before.`;
  } else if (deltaDays < 0) {
    message = `You returned to your intention ${Math.abs(deltaDays)} day${Math.abs(deltaDays) === 1 ? '' : 's'} slower than before — that's alright, showing up again is what counts.`;
  } else {
    message = 'You returned to your intention at a steady, consistent pace.';
  }

  return {
    status: 'ok',
    recoveries,
    latestRecoveryDays: latest.days,
    previousAverageDays: Math.round(previousAverageDays * 10) / 10,
    deltaDays,
    message,
  };
}
