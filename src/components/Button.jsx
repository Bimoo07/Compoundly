import PropTypes from 'prop-types';
import { motion } from 'motion/react';

const VARIANT_CLASSES = {
  // "Daily Reflection", "Save Experiment", "I Understand, Let's Begin"
  primary: 'bg-accent-primary text-text-onAccent shadow-none hover:shadow-[0_0_20px_-4px_var(--tw-shadow-color)] shadow-accent-primary/50',
  // "Change Habit", "Export Journal", "Reset Current Experiment"
  secondary: 'bg-white/5 text-text-primary border border-muted hover:bg-white/10',
  // "Edit Narrative", subtle inline actions
  ghost: 'bg-transparent text-accent-primary hover:bg-white/5',
  // "Delete Account", "Delete All Data"
  destructive: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
};

/**
 * Usage:
 *   <Button variant="primary" onClick={...}>Save Experiment</Button>
 *   <Button variant="destructive" onClick={...}>Delete Account</Button>
 *
 * Hover/tap feedback is a soft spring "pop" — noticeable but not jarring.
 * Respects prefers-reduced-motion automatically via Motion's built-in handling
 * of whileHover/whileTap (disabled when the OS setting is on).
 */
export default function Button({ children, variant = 'primary', icon: Icon, disabled = false, onClick, type = 'button', className = '' }) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.04, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-sm px-lg py-3
        text-label font-medium transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANT_CLASSES[variant]} ${className}
      `}
    >
      <span>{children}</span>
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
    </motion.button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'destructive']),
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};
