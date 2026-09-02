import PropTypes from 'prop-types';
import { motion } from 'motion/react';
import Card from './Card';
import Badge from './Badge';
import PhaseIconBadge from './PhaseIconBadge';

/**
 * Journey Map phase card — one of the 4 cards (Awareness / Action / Growth / Recovery).
 * The icon badge shares a layoutId with the matching phase page's header icon
 * (see AwarenessPage/ActionPage/GrowthPage/RecoveryPage), so clicking through
 * morphs the icon into place rather than just cross-fading two screens.
 */
export default function PhaseCard({ phaseKey, phaseNumber, icon: Icon, title, description, active = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <Card
        padding="lg"
        className={`flex flex-col items-center gap-md text-center transition-colors ${
          active ? 'border-accent-primary/40' : ''
        }`}
      >
        <PhaseIconBadge icon={Icon} active={active} layoutId={`phase-icon-${phaseKey}`} size={56} />

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-primary">
            Phase {phaseNumber}
          </span>
          <h3 className="text-heading text-text-primary">{title}</h3>
        </div>

        <p className="text-sm text-text-secondary">{description}</p>

        {active && <Badge dot>Active Phase</Badge>}
      </Card>
    </motion.div>
  );
}

PhaseCard.propTypes = {
  phaseKey: PropTypes.string.isRequired,
  phaseNumber: PropTypes.number.isRequired,
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  active: PropTypes.bool,
};
