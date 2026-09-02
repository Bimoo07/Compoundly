import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'motion/react';

// Maps each metric to its accent color. Keeping this in one place means
// all 4 cards share the exact same structure — fixing the earlier Figma
// inconsistency where each card was built with a different technique
// (gradient / mask group / SVG / dashed border).
const ACCENT_TEXT_CLASS = {
  teal: 'text-insight-teal',
  green: 'text-insight-green',
  purple: 'text-insight-purple',
  muted: 'text-insight-muted',
};

/**
 * Growth phase "Insight Stat Card".
 * Used for all 4 metrics: Consistency, Emotional Regulation, Self-Control, Facing Challenges.
 *
 * The ring around the icon is a real progress indicator — its fill reflects
 * `score` (0 to 1) from computeGrowthInsights(), animated in with Motion's
 * pathLength. It's not just decoration: an empty ring genuinely means "not
 * much evidence yet," a full ring means the pattern is strongly established.
 *
 * Usage:
 *   <InsightCard icon={DropletIcon} label="Consistency" description="Flowing steady" accent="teal" score={0.6} />
 */
export default function InsightCard({ icon: Icon, label, description, accent = 'purple', score = 0 }) {
  const colorClass = ACCENT_TEXT_CLASS[accent] ?? ACCENT_TEXT_CLASS.purple;
  const shouldReduceMotion = useReducedMotion();
  const clampedScore = Math.max(0, Math.min(1, score));

  return (
    <div className="flex flex-col items-center gap-sm rounded-md border border-white/5 bg-navy-900/60 p-md text-center">
      <div className={`relative flex h-14 w-14 items-center justify-center ${colorClass}`}>
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
          {/* Track — always full, faint */}
          <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
          {/* Progress — fills according to score */}
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clampedScore }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: 'easeOut', delay: 0.1 }}
          />
        </svg>
        {Icon && <Icon size={22} strokeWidth={2} aria-hidden="true" className="relative z-10" />}
      </div>
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <p className="text-xs text-text-secondary">{description}</p>
    </div>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accent: PropTypes.oneOf(['teal', 'green', 'purple', 'muted']),
  score: PropTypes.number,
};
