import { useState } from "react";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Toggle from "../components/Toggle";
import { useAppStore } from "../store/useAppStore";
import { getCrisisResponse } from "../lib/ai/guardrails";

function SectionHeading({ children }) {
  return <h3 className="text-heading text-text-primary">{children}</h3>;
}

function Row({ label, description, children }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-md">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  // NOTE (Sprint 5 decision): an "Account" section (email/login, change
  // password, delete account) was in the original design but is
  // deliberately NOT built — Compoundly has no auth/backend, so there's
  // nothing for it to manage. Revisit only if auth is ever added.
  const futureSelfNarrative = useAppStore((s) => s.futureSelfNarrative);
  const activeHabit = useAppStore((s) => s.activeHabit);
  const notifications = useAppStore((s) => s.notifications);
  const updateNotificationSetting = useAppStore(
    (s) => s.updateNotificationSetting,
  );
  // Still read from the store (defaults to 'en') so getCrisisResponse below
  // keeps working — only the user-facing picker was removed in Sprint 5.
  const language = useAppStore((s) => s.language);
  const journalEntries = useAppStore((s) => s.journalEntries);
  const resetExperiment = useAppStore((s) => s.resetExperiment);
  const experimentStartDate = useAppStore((s) => s.experimentStartDate);

  // activeHabit already carries its own label (whether curated or
  // AI-generated) — no lookup against habitOptions.mock.json needed here.
  const activeHabitLabel = activeHabit?.label ?? "None selected yet";

  const [deleteArmed, setDeleteArmed] = useState(false);
  const [openSection, setOpenSection] = useState(null); // 'disclaimer' | 'crisis' | null

  const crisisResource = getCrisisResponse(language);

  function handleDeleteAllData() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    localStorage.removeItem("compoundly-storage");
    window.location.reload();
  }

  function handleExportJournal() {
    const blob = new Blob([JSON.stringify(journalEntries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compoundly-journal.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
      <p className="mt-1 text-text-secondary">
        Manage your journey and preferences.
      </p>

      <div className="mt-3xl flex flex-col gap-lg">
        <Card>
          <SectionHeading>Profile & Goal</SectionHeading>
          <div className="mt-md border-t border-subtle pt-md">
            <p className="text-sm font-medium text-text-primary">
              Your Future Self Story
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {futureSelfNarrative ||
                "You haven't written your future self story yet."}
            </p>
          </div>
          <div className="mt-md border-t border-subtle pt-md">
            <Row label="Priority Habit" description={activeHabitLabel} />
          </div>
        </Card>

        <Card>
          <SectionHeading>Reminders</SectionHeading>
          <div className="divide-y divide-subtle">
            <Row
              label="Daily Reflection"
              description="Evening check-in on today's priority habit"
            >
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={notifications.dailyReflectionTime}
                  onChange={(e) =>
                    updateNotificationSetting(
                      "dailyReflectionTime",
                      e.target.value,
                    )
                  }
                  className="min-w-0 rounded-sm border border-subtle bg-navy-950/60 px-2 py-1 text-xs text-text-primary"
                />
                <Toggle
                  checked={notifications.dailyReflectionEnabled}
                  onChange={(v) =>
                    updateNotificationSetting("dailyReflectionEnabled", v)
                  }
                  label="Daily Reflection reminder"
                />
              </div>
            </Row>
            <Row
              label="7-Day Experiment Review"
              description="Weekly summary and intention setting"
            >
              <Toggle
                checked={notifications.experimentReviewEnabled}
                onChange={(v) =>
                  updateNotificationSetting("experimentReviewEnabled", v)
                }
                label="7-Day Experiment Review reminder"
              />
            </Row>
          </div>
        </Card>

        <Card>
          <SectionHeading>Appearance</SectionHeading>
          <Row
            label="Dark Mode"
            description="Compoundly is currently dark-theme only in this build — light mode is coming soon"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                Coming soon
              </span>
              {/* Forced to checked=true (not the darkMode store value) since
                  dark is the only theme that actually exists right now.
                  Disabled so it can't be toggled into a state with no
                  visual effect. Revisit once a light theme is implemented
                  in tailwind.config.js. */}
              <Toggle
                checked
                disabled
                onChange={() => {}}
                label="Dark mode (coming soon)"
              />
            </div>
          </Row>
        </Card>

        <Card>
          <SectionHeading>Privacy & Data</SectionHeading>
          <p className="mt-1 text-sm text-text-secondary">
            Your data is stored locally on this device for maximum privacy.
          </p>
          <div className="mt-md flex flex-wrap items-center gap-sm">
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportJournal}
            >
              Export Journal
            </Button>
            <Button
              variant="destructive"
              icon={Trash2}
              onClick={handleDeleteAllData}
            >
              {deleteArmed ? "Tap again to confirm" : "Delete All Data"}
            </Button>
            {deleteArmed && (
              <button
                type="button"
                onClick={() => setDeleteArmed(false)}
                className="text-xs text-text-secondary hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeading>Experiment History</SectionHeading>
          {experimentStartDate ? (
            <Row
              label="Current experiment"
              description={`Started ${experimentStartDate}`}
            >
              <Button variant="secondary" onClick={resetExperiment}>
                Reset Current Experiment
              </Button>
            </Row>
          ) : (
            <p className="mt-1 text-sm text-text-secondary">
              No experiment running yet.
            </p>
          )}
        </Card>

        <Card>
          <SectionHeading>Safety & Support</SectionHeading>
          <div className="mt-md flex flex-col divide-y divide-subtle text-sm">
            <button
              type="button"
              onClick={() =>
                setOpenSection(
                  openSection === "disclaimer" ? null : "disclaimer",
                )
              }
              className="flex items-center justify-between py-3 text-left text-accent-primary"
            >
              Disclaimer
              {openSection === "disclaimer" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {openSection === "disclaimer" && (
              <p className="pb-3 text-text-secondary">
                Compoundly is a tool for personal growth and habit formation. It
                is not a diagnostic tool, clinical predictor, or a substitute
                for professional mental health support.
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                setOpenSection(openSection === "crisis" ? null : "crisis")
              }
              className="flex items-center justify-between py-3 text-left text-accent-primary"
            >
              Crisis / Mental Health Support
              {openSection === "crisis" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {openSection === "crisis" && (
              <div className="pb-3 text-text-secondary">
                <p className="mb-2 rounded-sm border border-white/10 bg-white/5 p-2 text-xs italic">
                  This is an early version of Compoundly — the resources below
                  are not yet a complete or verified directory of support
                  options. Please also search for services specific to your
                  location, or contact local emergency services if you're in
                  immediate danger.
                </p>
                <p>{crisisResource.message}</p>
                <p className="mt-2 font-medium text-text-primary">
                  {crisisResource.resourceLabel}
                </p>
                <p>{crisisResource.resourceContact}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeading>About & Feedback</SectionHeading>
          <p className="mt-1 text-sm text-text-secondary">
            Version v0.5.0 (Sprint 5)
          </p>
        </Card>
      </div>
    </div>
  );
}
