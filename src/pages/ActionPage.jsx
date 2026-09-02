import { useState } from "react";
import { Check, AlertCircle, Zap } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import PhaseIconBadge from "../components/PhaseIconBadge";
import { useAppStore } from "../store/useAppStore";
import { detectBurlTrigger } from "../lib/psychology";

const DAY_MS = 24 * 60 * 60 * 1000;
const todayISO = () => new Date().toISOString().slice(0, 10);

function buildSevenDayWindow(experimentStartDate) {
  if (!experimentStartDate) return [];
  const start = new Date(experimentStartDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    return d.toISOString().slice(0, 10);
  });
}

export default function ActionPage() {
  const intention = useAppStore((s) => s.intention);
  const setIntention = useAppStore((s) => s.setIntention);
  const experimentStartDate = useAppStore((s) => s.experimentStartDate);
  const startExperiment = useAppStore((s) => s.startExperiment);
  const checkIns = useAppStore((s) => s.checkIns);
  const logCheckIn = useAppStore((s) => s.logCheckIn);
  const resetExperiment = useAppStore((s) => s.resetExperiment);
  const setView = useAppStore((s) => s.setView);

  const [trigger, setTrigger] = useState(intention.trigger);
  const [action, setAction] = useState(intention.action);

  const today = todayISO();
  const days = buildSevenDayWindow(experimentStartDate);
  const dayIndex = days.indexOf(today); // -1 if outside the 7-day window
  const todayCompleted = Boolean(checkIns[today]);
  const isCompleted = Boolean(experimentStartDate) && dayIndex === -1;

  const burlStatus = detectBurlTrigger(checkIns, experimentStartDate);

  function handleSave() {
    setIntention({ trigger, action });
    startExperiment(); // no-op if already running
  }

  return (
    <div>
      <div className="flex items-center gap-md">
        <PhaseIconBadge
          icon={Zap}
          active
          layoutId="phase-icon-action"
          size={56}
        />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-primary">
            Phase 2: Action
          </span>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">
            Your 7-Day Experiment
          </h1>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Small shifts create lasting change. Design a tiny, manageable habit and
        commit to it for just one week. No pressure, just observation.
      </p>

      {burlStatus.triggered && (
        <Card
          className="mt-lg flex items-start gap-3 border-accent-primary/40"
          padding="md"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0 text-accent-primary"
          />
          <div className="flex-1">
            <p className="text-sm text-text-primary">
              It's been {burlStatus.missedStreak} days since your last check-in.
              That's okay — this is part of the process, not a failure.
            </p>
            <Button
              variant="ghost"
              onClick={() => setView("recovery")}
              className="mt-1 !px-0"
            >
              Log what happened in Recovery →
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-3xl grid grid-cols-1 gap-lg lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-md">
          <h3 className="text-heading text-text-primary">Intention Builder</h3>
          <p className="text-sm italic text-text-secondary">
            &ldquo;If [Trigger], then I will [Action].&rdquo;
          </p>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            If I…
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g., feel overwhelmed during work"
              className="rounded-sm border border-subtle bg-navy-950/60 px-md py-3 text-sm font-normal normal-case text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-insight-green">
            Then I will…
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g., take 3 slow, deep breaths"
              className="rounded-sm border border-subtle bg-navy-950/60 px-md py-3 text-sm font-normal normal-case text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </label>

          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={Check}
              onClick={handleSave}
              disabled={!trigger.trim() || !action.trim()}
            >
              Save Experiment
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h3 className="text-heading text-text-primary">
              Experiment Progress
            </h3>
            {experimentStartDate && !isCompleted && (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-text-secondary">
                Day {Math.max(dayIndex, 0) + 1}/7
              </span>
            )}
          </div>

          {!experimentStartDate && (
            <p className="text-sm text-text-secondary">
              Save your intention to start Day 1 of your experiment.
            </p>
          )}

          {isCompleted && (
            <>
              <p className="text-sm text-text-primary">
                Your 7-day experiment is complete — you checked in on{" "}
                <strong>
                  {days.filter((d) => checkIns[d]).length} of 7 days
                </strong>
                .
                {days.filter((d) => checkIns[d]).length > 0
                  ? " Every logged day is real evidence of change."
                  : " That's okay — the days you noticed still count."}
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  resetExperiment();
                  setTrigger("");
                  setAction("");
                }}
              >
                Start a New Experiment
              </Button>
              <Button
                variant="ghost"
                className="!px-0"
                onClick={() => setView("growth")}
              >
                Reflect on it in Growth →
              </Button>
            </>
          )}

          {experimentStartDate && !isCompleted && (
            <>
              <div className="flex justify-between gap-1 overflow-x-auto sm:gap-0">
                {days.map((date, i) => {
                  const isToday = date === today;
                  const isDayCompleted = Boolean(checkIns[date]);
                  const isFuture = i > dayIndex;
                  return (
                    <div
                      key={date}
                      className="flex flex-shrink-0 flex-col items-center gap-1"
                    >
                      <div
                        className={`
                          flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium sm:h-9 sm:w-9
                          ${isDayCompleted ? "border-insight-green bg-insight-green/15 text-insight-green" : ""}
                          ${isToday && !isDayCompleted ? "border-accent-primary text-accent-primary" : ""}
                          ${!isDayCompleted && !isToday ? "border-white/15 text-text-secondary" : ""}
                        `}
                      >
                        {isDayCompleted ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-[10px] ${isFuture ? "text-text-secondary/50" : "text-text-secondary"}`}
                      >
                        {isToday ? "Today" : `D${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-md border-t border-subtle pt-md">
                <p className="mb-sm text-sm text-text-secondary">
                  Did you try it today?
                </p>
                <Button
                  variant={todayCompleted ? "secondary" : "primary"}
                  disabled={todayCompleted || dayIndex === -1}
                  onClick={() => logCheckIn(today, true)}
                >
                  {todayCompleted ? "Logged for today" : "Yes, I experimented"}
                </Button>
                <p className="mt-2 text-xs text-text-secondary">
                  No pressure. Observation is progress.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
