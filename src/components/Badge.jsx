import PropTypes from 'prop-types';

/**
 * Small pill used in two places:
 * 1. Status badge — e.g. "Active Phase" (with a leading dot)
 * 2. Tag — e.g. "#Mindfulness", "#UrgeSurfing" on journal entries
 *
 * Usage:
 *   <Badge dot>Active Phase</Badge>
 *   <Badge tone="tag">#Mindfulness</Badge>
 */
export default function Badge({ children, dot = false, tone = 'default' }) {
  const toneClass = {
    default: 'bg-white/5 text-text-secondary',
    tag: 'bg-accent-primary/15 text-accent-primary',
    success: 'bg-insight-green/15 text-insight-green',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  dot: PropTypes.bool,
  tone: PropTypes.oneOf(['default', 'tag', 'success']),
};
