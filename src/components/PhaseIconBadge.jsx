import PropTypes from 'prop-types';
import { motion } from 'motion/react';

/**
 * Circular icon badge shared between PhaseCard (Journey Map) and each phase
 * page's header. Both use the SAME layoutId per phase — that's what lets
 * Motion morph the icon's size/position/color when navigating from the
 * Journey Map card into the phase page, instead of two separate animations
 * that merely happen to look similar.
 */
export default function PhaseIconBadge({ icon: Icon, active = false, layoutId, size = 56 }) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full ${
        active ? 'bg-accent-primary text-text-onAccent' : 'bg-white/5 text-text-secondary'
      }`}
      style={{ width: size, height: size }}
    >
      {Icon && <Icon size={size * 0.4} strokeWidth={2} aria-hidden="true" />}
    </motion.div>
  );
}

PhaseIconBadge.propTypes = {
  icon: PropTypes.elementType,
  active: PropTypes.bool,
  layoutId: PropTypes.string.isRequired,
  size: PropTypes.number,
};
