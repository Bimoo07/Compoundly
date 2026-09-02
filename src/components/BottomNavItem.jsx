import PropTypes from 'prop-types';

/**
 * Bottom tab bar item for mobile — icon-over-label, compact.
 * Not a variant of SidebarNavItem because the layout direction is
 * fundamentally different (vertical stack vs horizontal row), not just style.
 */
export default function BottomNavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
        active ? 'text-accent-primary' : 'text-text-secondary'
      }`}
    >
      {Icon && <Icon size={20} strokeWidth={2} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}

BottomNavItem.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};
