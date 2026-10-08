import { useState, useMemo } from "react";
import {
  Droplet,
  PersonStanding,
  Shield,
  Mountain,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import InsightCard from "../components/InsightCard";
import PhaseIconBadge from "../components/PhaseIconBadge";
import { useAppStore } from "../store/useAppStore";
import {
  selectRecentJournalEntries,
  forHabit,
} from "../store/slices/growthSlice";
import { computeGrowthInsights } from "../lib/psychology";
import { generateGrowthReflection, generateJournalFeedback } from "../lib/ai";

const METRIC_META = {
  consistency: { label: "Consistency", icon: Droplet, accent: "teal" },
  emotionalRegulation: {
    label: "Emotional Regulation",
    icon: PersonStanding,
    accent: "green",
  },
  selfControl: { label: "Self-Control", icon: Shield, accent: "purple" },
  facingChallenges: {
    label: "Facing Challenges",
    icon: Mountain,
    accent: "muted",
  },
};

const LEVEL_DESCRIPTIONS = {
  building: "Just getting started",
  steady: "Finding balance",
  flowing: "Flowing steady",
};

export default function GrowthPage() {
  const allEntries = useAppStore((s) => s.journalEntries);
  const activeHabit = useAppStore((s) => s.activeHabit);
  const language = useAppStore((s) => s.language);
  const addJournalEntry = useAppStore((s) => s.addJournalEntry);
  const setJournalFeedback = useAppStore((s) => s.setJournalFeedback);
  // Everything on this page is scoped to the ACTIVE habit — a new habit
  // starts with a clean evidence log and clean insight scores.
  const journalEntries = useMemo(
    () => forHabit(allEntries, activeHabit?.id),
    [allEntries, activeHabit],
  );
  const recentEntries = useMemo(
    () => selectRecentJournalEntries({ journalEntries }),
    [journalEntries],
  );

  const [text, setText] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [reflection, setReflection] = useState(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState(null);
  const [reflectionCrisisNotice, setReflectionCrisisNotice] = useState(null);
  const [pendingEntryId, setPendingEntryId] = useState(null);
  const [entryCrisisNotice, setEntryCrisisNotice] = useState(null);

  const insights = useMemo(
    () => computeGrowthInsights(journalEntries),
    [journalEntries],
  );

  // Compact, deterministic summary sent to the AI as FACTS. Levels only —
  // the model narrates them, it never recomputes them.
  function buildFacts(entries) {
    const ins = computeGrowthInsights(entries);
    return {
      entriesLast7Days: selectRecentJournalEntries({ journalEntries: entries })
        .length,
      consistency: ins.consistency.level,
      emotionalRegulation: ins.emotionalRegulation.level,
      selfControl: ins.selfControl.level,
      facingChallenges: ins.facingChallenges.level,
    };
  }

  async function handleSave() {
    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const entryText = text;
    const previous = recentEntries.slice(0, 3); // newest first, max 3
    const id = addJournalEntry({ text: entryText, tags });
    setText("");
    setTagsInput("");
    setEntryCrisisNotice(null);
    setPendingEntryId(id);

    try {
      const withNew = [
        { id, text: entryText, tags, createdAt: new Date().toISOString() },
        ...journalEntries,
      ];
      const result = await generateJournalFeedback({
        habit: activeHabit,
        language,
        text: entryText,
        tags,
        recentEntries: previous.map((e) => ({ text: e.text, tags: e.tags })),
        facts: buildFacts(withNew),
      });
      if (result.crisisDetected) {
        setEntryCrisisNotice(result); // entry itself stays saved locally
      } else if (result.reflection) {
        setJournalFeedback(id, {
          text: result.reflection,
          source: result.source,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setPendingEntryId(null);
    }
  }

  async function handleGetReflection() {
    const entriesText = recentEntries.map((e) => e.text).join("\n");
    if (!entriesText.trim()) {
      setReflectionError(
        "Log a few entries first so there's something to reflect on.",
      );
      return;
    }

    setIsLoadingReflection(true);
    setReflectionError(null);
    setReflectionCrisisNotice(null);
    try {
      // Only the last 7 days ever leave the device — see
      // selectRecentJournalEntries in growthSlice.js.
      const result = await generateGrowthReflection({
        habit: activeHabit,
        language,
        entriesText,
        facts: buildFacts(journalEntries),
      });
      if (result.crisisDetected) {
        setReflectionCrisisNotice(result);
        return;
      }
      setReflection(result.reflection);
    } catch (err) {
      console.error("generateGrowthReflection failed:", err);
      setReflectionError(
        "Couldn't generate a reflection right now — try again in a moment.",
      );
    } finally {
      setIsLoadingReflection(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-md">
        <PhaseIconBadge
          icon={TrendingUp}
          active
          layoutId="phase-icon-growth"
          size={56}
        />
        <h1 className="text-3xl font-bold text-text-primary">
          Phase 3: Growth
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Reflect on your progress. Every small victory is a step towards rewiring
        your habits.
      </p>

      <div className="mt-3xl grid grid-cols-1 gap-lg lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-lg">
          <Card className="flex flex-col gap-md">
            <h3 className="text-heading text-text-primary">
              Journal of Evidence
            </h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Record a moment of growth today… What did you overcome? How did you feel?"
              rows={4}
              className="w-full resize-none rounded-sm border border-subtle bg-navy-950/60 p-md text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#Mindfulness #UrgeSurfing"
              className="w-full rounded-sm border border-subtle bg-navy-950/60 px-md py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            {entryCrisisNotice && (
              <div className="rounded-sm border border-danger/40 bg-danger/10 p-md text-sm text-text-primary">
                <p>{entryCrisisNotice.message}</p>
                <p className="mt-2 font-medium">
                  {entryCrisisNotice.resourceLabel}
                </p>
                <p className="text-text-secondary">
                  {entryCrisisNotice.resourceContact}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!text.trim()}
              >
                Save Entry
              </Button>
            </div>
          </Card>

          <div>
            <h3 className="mb-md text-heading text-text-primary">
              Recent Evidence
            </h3>
            <div className="flex flex-col gap-sm">
              {journalEntries.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No entries yet — your first one starts the pattern.
                </p>
              )}
              {journalEntries.slice(0, 5).map((entry) => (
                <Card key={entry.id} padding="md">
                  <p className="text-xs text-text-secondary">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-text-primary">{entry.text}</p>
                  {pendingEntryId === entry.id && (
                    <p className="mt-2 text-xs text-text-secondary">
                      Reflecting…
                    </p>
                  )}
                  {entry.aiFeedback?.text && (
                    <p className="mt-2 border-l-2 border-accent-primary/40 pl-sm text-sm italic text-text-secondary">
                      {entry.aiFeedback.text}
                    </p>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs text-accent-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Card className="flex flex-col gap-md">
          <h3 className="text-heading text-text-primary">Insights Summary</h3>
          {!insights.hasEnoughData && (
            <p className="text-xs text-text-secondary">
              Log a few more entries to see your patterns emerge.
            </p>
          )}
          <div className="grid grid-cols-2 gap-md">
            {Object.entries(METRIC_META).map(([key, meta]) => (
              <InsightCard
                key={key}
                icon={meta.icon}
                label={meta.label}
                description={LEVEL_DESCRIPTIONS[insights[key].level]}
                accent={meta.accent}
                score={insights[key].score}
              />
            ))}
          </div>

          {/*
            This reflection is generative narrative ONLY — it never feeds
            back into the scores above. The scores are computed entirely by
            lib/psychology/growth.js before this ever runs. See the
            architectural note on generateGrowthReflection in geminiClient.js.
          */}
          <div className="border-t border-subtle pt-md">
            <Button
              variant="ghost"
              icon={Sparkles}
              className="!px-0"
              disabled={isLoadingReflection}
              onClick={handleGetReflection}
            >
              {isLoadingReflection
                ? "Reflecting…"
                : "Get an AI reflection on this"}
            </Button>

            {reflectionCrisisNotice && (
              <div className="mt-2 rounded-sm border border-danger/40 bg-danger/10 p-md text-sm text-text-primary">
                <p>{reflectionCrisisNotice.message}</p>
                <p className="mt-2 font-medium">
                  {reflectionCrisisNotice.resourceLabel}
                </p>
                <p className="text-text-secondary">
                  {reflectionCrisisNotice.resourceContact}
                </p>
              </div>
            )}

            {reflectionError && (
              <p className="mt-2 text-sm text-danger">{reflectionError}</p>
            )}

            {reflection && !reflectionCrisisNotice && (
              <p className="mt-2 text-sm italic text-text-secondary">
                &ldquo;{reflection}&rdquo;
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
