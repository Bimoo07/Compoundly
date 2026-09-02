import { useState, useMemo } from 'react';
import { ArrowRight, Bandage } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PhaseIconBadge from '../components/PhaseIconBadge';
import BurlVisualization from '../components/BurlVisualization';
import { useAppStore } from '../store/useAppStore';
import { computeRecoveryRate } from '../lib/psychology';

export default function RecoveryPage() {
  const burlEvents = useAppStore((s) => s.burlEvents);
  const checkIns = useAppStore((s) => s.checkIns);
  const logSetback = useAppStore((s) => s.logSetback);

  const [note, setNote] = useState('');

  const recovery = useMemo(() => computeRecoveryRate(burlEvents, checkIns), [burlEvents, checkIns]);

  function handleSave() {
    logSetback({ note });
    setNote('');
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

        <div className="mt-md flex justify-end">
          <Button variant="secondary" icon={ArrowRight} onClick={handleSave} disabled={!note.trim()}>
            Save Note
          </Button>
        </div>
      </Card>
    </div>
  );
}
