import { Eye, Zap, TrendingUp, Bandage } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import PhaseCard from "../components/PhaseCard";
import { useAppStore } from "../store/useAppStore";

const PHASES = [
  {
    phaseKey: "awareness",
    phaseNumber: 1,
    icon: Eye,
    title: "Awareness",
    description:
      "Understand your current habits and choose a path toward your long-term vision.",
  },
  {
    phaseKey: "action",
    phaseNumber: 2,
    icon: Zap,
    title: "Action",
    description:
      "Implement a tiny, manageable habit and commit to it for one week.",
  },
  {
    phaseKey: "growth",
    phaseNumber: 3,
    icon: TrendingUp,
    title: "Growth",
    description:
      "Log qualitative evidence of your progress and identify emerging growth patterns.",
  },
  {
    phaseKey: "recovery",
    phaseNumber: 4,
    icon: Bandage,
    title: "Recovery",
    description:
      "Reframe setbacks as points of strength and measure your resilience.",
  },
];

export default function JourneyMapPage() {
  const activeHabit = useAppStore((s) => s.activeHabit);
  const experimentStartDate = useAppStore((s) => s.experimentStartDate);
  const setView = useAppStore((s) => s.setView);
  const shouldReduceMotion = useReducedMotion();

  // Derived "current phase" for the journey map highlight — never stored
  // directly, always computed from real progress so it can't drift out
  // of sync with what the user has actually done.
  const activePhaseKey = !activeHabit
    ? "awareness"
    : !experimentStartDate
      ? "action"
      : "growth";

  return (
    <div className="relative">
      {/*
        Ambient glow — a slow, near-imperceptible breathing effect behind the
        hero copy, using the accent/glow token sampled from the original
        design (previously unused in code). Purely decorative: aria-hidden,
        no pointer events, and skipped entirely under reduced-motion.
      */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-8 h-72 w-72 rounded-full bg-accent-glow blur-3xl sm:left-16"
        animate={
          shouldReduceMotion
            ? { opacity: 0.15 }
            : { opacity: [0.12, 0.28, 0.12] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div className="relative">
        <h1 className="text-3xl font-bold text-text-primary">
          Your Journey Map
        </h1>
        <p className="mt-2 text-text-secondary">
          Trace your path through the phases of personal growth and habit
          building.
        </p>

        {!activeHabit && (
          <p className="mt-md text-sm text-accent-primary">
            Start in Awareness to choose your first priority habit.
          </p>
        )}

        <div className="mt-3xl grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase, i) => (
            <motion.button
              key={phase.phaseKey}
              type="button"
              onClick={() => setView(phase.phaseKey)}
              className="text-left"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
            >
              <PhaseCard
                {...phase}
                active={phase.phaseKey === activePhaseKey}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
