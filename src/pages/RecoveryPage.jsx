import { useState, useMemo } from 'react';
import { ArrowRight, Bandage } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PhaseIconBadge from '../components/PhaseIconBadge';
import BurlVisualization from '../components/BurlVisualization';
import { useAppStore } from '../store/useAppStore';
import { computeRecoveryRate, detectBurlTrigger } from '../lib/psychology';
import { forHabit } from '../store/slices/growthSlice';
import { generateBurlFeedback } from '../lib/ai';

export default function RecoveryPage() {
  const allBurls = useAppStore((s) => s.burlEvents);
  const allEntries = useAppStore((s) => s.journalEntries);
  const activeHabit = useAppStore((s) => s.activeHabit);
  const language = useAppStore((s) => s.language);
  const experimentStartDate = useAppStore((s) => s.experimentStartDate);
  const checkIns = useAppStore((s) => s.checkIns);
  const logSetback = useAppStore((s) => s.logSetback);
  const setBurlFeedback = useAppStore((s) => s.setBurlFeedback);
  const [note, setNote] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [crisisNotice, setCrisisNotice] = useState(null);

  // Scoped to the ACTIVE habit so Recovery Rate never mixes two habits.
  const burlEvents = useMemo(() => forHabit(allBurls, activeHabit?.id), [allBurls, activeHabit]);
  const journalEntries = useMemo(() => forHabit(allEntries, activeHabit?.id), [allEntries, activeHabit]);
  const recovery = useMemo(() => computeRecoveryRate(burlEvents, checkIns), [burlEvents, checkIns]);
  const latestBurl = burlEvents[0] ?? null; // store keeps newest first

  // Data minimization: <=3 journal entries from the last 7 days, clipped by
  // the client. Numbers sent as FACTS come from lib/psychology only.
  async function requestFeedback(burl, burlsIncludingIt) {
    const rec = computeRecoveryRate(burlsIncludingIt, checkIns);
    const trig = detectBurlTrigger(checkIns, experimentStartDate);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentEntries = journalEntries
      .filter((e) => new Date(e.createdAt).getTime() >= cutoff)
      .slice(0, 3)
      .map((e) => ({ text: e.text }));

    setPendingId(burl.id);
    setCrisisNotice(null);
    try {
      const result = await generateBurlFeedback({
        habit: activeHabit,
        language,
        note: burl.note,
        recentEntries,
        deterministicMessage: rec.message,
        facts: {
          burlCount: burlsIncludingIt.length,
          missedDays: trig.missedStreak,
          latestRecoveryDays: rec.latestRecoveryDays,
          previousAverageDays: rec.previousAverageDays,
          fasterByDays: rec.deltaDays != null && rec.deltaDays > 0 ? rec.deltaDays : null,
          slowerByDays: rec.deltaDays != null && rec.deltaDays < 0 ? Math.abs(rec.deltaDays) : null,
        },
      });
      if (result.crisisDetected) {
        setCrisisNotice(result);
      } else if (result.reflection) {
        setBurlFeedback(burl.id, {
          text: result.reflection,
          source: result.source,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleSave() {
    const burl = logSetback({ note });
    setNote('');
    await requestFeedback(burl, [burl, ...burlEvents]);
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-md flex justify-center">
        <PhaseIconBadge icon={Bandage} active layoutId="phase-icon-recovery" size={56} />
      </div>

      <BurlVisualization className="mx-auto mb-lg h-40 w-40" />

      <h1 className="text-3xl font-bold text-text-primary">The Burl Effect</h1>

      <p className="mt-md text-text-secondary">
        {recovery.status === 'no-data' &&
          "Setbacks are burls — knots of strength where you've grown back stronger. When one happens, log it below; it's part of the process, not a failure."}
        {recovery.status !== 'no-data' && recovery.message}
      </p>

      <Card className="mt-3xl text-left" padding="lg">
        <h3 className="text-heading text-text-primary">Setback Log</h3>
        <p className="mt-1 text-sm text-text-secondary">What happened? This is part of the process.</p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="I noticed I was feeling…"
          rows={4}
          className="mt-md w-full resize-none rounded-sm border border-subtle bg-navy-950/60 p-md text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />

        {crisisNotice && (
          <div className="mt-md rounded-sm border border-danger/40 bg-danger/10 p-md text-sm text-text-primary">
            <p>{crisisNotice.message}</p>
            <p className="mt-2 font-medium">{crisisNotice.resourceLabel}</p>
            <p className="text-text-secondary">{crisisNotice.resourceContact}</p>
          </div>
        )}
        <div className="mt-md flex justify-end">
          <Button variant="secondary" icon={ArrowRight} onClick={handleSave} disabled={!note.trim() || pendingId !== null}>
            {pendingId ? 'Reflecting…' : 'Save Note'}
          </Button>
        </div>
      </Card>

      {latestBurl && (
        <Card className="mt-lg text-left" padding="lg">
          <h3 className="text-heading text-text-primary">Reflection</h3>
          {latestBurl.aiFeedback?.text ? (
            <p className="mt-2 text-sm italic text-text-secondary">{latestBurl.aiFeedback.text}</p>
          ) : (
            <p className="mt-2 text-sm text-text-secondary">No reflection yet for your latest setback.</p>
          )}
          {/* Re-run after the user has checked in again: facts now contain
              real recovery days, so the reflection can speak to them. */}
          <div className="mt-md flex justify-end">
            <Button variant="ghost" disabled={pendingId !== null} onClick={() => requestFeedback(latestBurl, burlEvents)}>
              Refresh reflection
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
