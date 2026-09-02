import PropTypes from 'prop-types';
import { motion } from 'motion/react';

/**
 * Sidebar navigation item.
 * Mirrors the Figma component "Sidebar Nav Item" (variants: State=Default / State=Active).
 *
 * The active background is a separate layoutId'd element ("sidebar-active-pill")
 * so that when the active item changes, Motion slides the pill from the old
 * position to the new one instead of the highlight just teleporting/blinking.
 *
 * Usage:
 *   <SidebarNavItem icon={MapIcon} label="Journey Map" active={currentPhase === 'journey'} onClick={...} />
 */
export default function SidebarNavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="relative w-full rounded-sm px-md py-3 text-left text-label transition-colors duration-150 hover:bg-white/5"
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-sm bg-accent-primary"
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        />
      )}
      <span
        className={`relative z-10 flex items-center gap-3 ${
          active ? 'text-text-onAccent' : 'text-text-secondary'
        }`}
      >
        {Icon && <Icon size={18} strokeWidth={2} aria-hidden="true" />}
        <span>{label}</span>
      </span>
    </button>
  );
}

SidebarNavItem.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};
