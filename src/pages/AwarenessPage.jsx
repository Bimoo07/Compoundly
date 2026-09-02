import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import PhaseIconBadge from "../components/PhaseIconBadge";
import { useAppStore } from "../store/useAppStore";
import { suggestHabitsFromNarrative } from "../lib/ai";
import habitOptionsData from "../mocks/data/habitOptions.mock.json";
import scenarioData from "../mocks/data/behavioralScenario.mock.json";

// Curated habits get the same { id, label, source } shape as AI-generated
// ones, tagged 'curated' instead of 'ai'. This is what lets the rest of the
// component treat both kinds identically — no branching on where a habit
// came from.
const curatedHabits = habitOptionsData.habitOptions.map((h) => ({
  ...h,
  source: "curated",
}));

function findScenario(sliderValue) {
  return scenarioData.scenarios.find(
    (s) => sliderValue >= s.sliderRange[0] && sliderValue <= s.sliderRange[1],
  );
}

export default function AwarenessPage() {
  const futureSelfNarrative = useAppStore((s) => s.futureSelfNarrative);
  const setFutureSelfNarrative = useAppStore((s) => s.setFutureSelfNarrative);
  const activeHabit = useAppStore((s) => s.activeHabit);
  const selectHabit = useAppStore((s) => s.selectHabit);
  const setView = useAppStore((s) => s.setView);

  const [sliderValue, setSliderValue] = useState(75);
  // Holds whatever suggestHabitsFromNarrative returned — full habit
  // objects, not ids. null until the user asks for suggestions.
  const [suggestedHabits, setSuggestedHabits] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [crisisNotice, setCrisisNotice] = useState(null);
  const [aiError, setAiError] = useState(null);

  const scenario = findScenario(sliderValue);

  // Before the user asks for AI suggestions, show the curated list so the
  // screen isn't empty. Once suggestions come back, show those instead —
  // they're already full objects, so no filtering/lookup needed here.
  const habitsToShow = suggestedHabits ?? curatedHabits;

  async function handleGetSuggestions() {
    setIsLoadingSuggestions(true);
    setCrisisNotice(null);
    setAiError(null);

    try {
      const result = await suggestHabitsFromNarrative(futureSelfNarrative);

      if (result.crisisDetected) {
        setCrisisNotice(result);
        return;
      }
      setSuggestedHabits(result.habits);
    } catch (err) {
      // suggestHabitsFromNarrative already rethrows a user-safe message
      // (see geminiClient.js), so this is fine to show directly.
      setAiError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      // finally guarantees this runs whether the try block succeeded,
      // hit the crisis branch's early return, or threw.
      setIsLoadingSuggestions(false);
    }
  }

  function handleSelectHabit(habit) {
    // habit is the full { id, label, source } object now, not a bare id —
    // selectHabit stores the whole thing so no other slice/page ever needs
    // to look it up against habitOptions.mock.json again.
    selectHabit(habit);
    setView("journey");
  }

  return (
    <div>
      <div className="flex items-center gap-md">
        <PhaseIconBadge
          icon={Eye}
          active
          layoutId="phase-icon-awareness"
          size={56}
        />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-primary">
            Phase 1 Simulator
          </span>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">
            Future Self Simulator
          </h1>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Visualize your trajectory. Understanding where your current
        micro-choices lead is the first step toward meaningful growth.
      </p>

      <div className="mt-3xl grid grid-cols-1 gap-lg lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-md">
          <div>
            <h3 className="text-heading text-text-primary">
              Write your future story.
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              What does your life look like in 6 months? Focus on feelings,
              routines, and clarity.
            </p>
          </div>

          <textarea
            value={futureSelfNarrative}
            onChange={(e) => setFutureSelfNarrative(e.target.value)}
            placeholder="I wake up feeling rested, reaching for water instead of my phone…"
            rows={5}
            className="w-full resize-none rounded-sm border border-subtle bg-navy-950/60 p-md text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />

          {crisisNotice && (
            <div className="rounded-sm border border-danger/40 bg-danger/10 p-md text-sm text-text-primary">
              <p>{crisisNotice.message}</p>
              <p className="mt-2 font-medium">{crisisNotice.resourceLabel}</p>
              <p className="text-text-secondary">
                {crisisNotice.resourceContact}
              </p>
            </div>
          )}

          {aiError && (
            <div className="rounded-sm border border-danger/40 bg-danger/10 p-md text-sm text-text-primary">
              <p>{aiError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={Sparkles}
              disabled={!futureSelfNarrative.trim() || isLoadingSuggestions}
              onClick={handleGetSuggestions}
            >
              {isLoadingSuggestions
                ? "Thinking…"
                : "Suggest habits from my story"}
            </Button>
          </div>

          <div className="mt-lg border-t border-subtle pt-lg">
            <h3 className="text-sm font-semibold text-text-primary">
              Choose your priority habit
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {suggestedHabits
                ? "Generated from your narrative. Select one to focus on."
                : "Based on your narrative, these small shifts can anchor your vision. Select one to focus on."}
            </p>
            <div className="mt-md flex flex-col gap-2">
              {habitsToShow.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleSelectHabit(habit)}
                  className={`
                    flex items-center gap-2 rounded-sm border px-md py-3 text-left text-sm transition-colors
                    ${
                      activeHabit?.id === habit.id
                        ? "border-accent-primary bg-accent-primary/15 text-text-primary"
                        : "border-subtle text-text-secondary hover:bg-white/5"
                    }
                  `}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${activeHabit?.id === habit.id ? "bg-accent-primary" : "bg-white/20"}`}
                  />
                  {habit.label}
                  {habit.source === "ai" && (
                    <span className="ml-auto text-xs uppercase tracking-wide text-accent-primary/70">
                      AI
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-md">
          <div>
            <h3 className="text-heading text-text-primary">
              Behavioral Trajectory
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Slide to preview potential outcomes based on your daily
              micro-choices.
            </p>
          </div>

          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-text-secondary">
              <span>Avoidance</span>
              <span>Steady Path</span>
            </div>
          </div>

          {scenario && (
            <div className="rounded-sm border border-subtle bg-navy-950/60 p-md">
              <p className="text-sm font-semibold text-text-primary">
                {scenario.label}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {scenario.narrative}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
