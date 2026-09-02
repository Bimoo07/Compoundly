import PropTypes from "prop-types";

/**
 * Toggle switch — used throughout Settings (Dark Mode, reminder toggles).
 *
 * Usage:
 *   <Toggle checked={darkMode} onChange={setDarkMode} label="Dark Mode" />
 */
export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative h-6 w-11 rounded-full transition-colors duration-150
        ${checked ? "bg-accent-primary" : "bg-white/10"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150
          ${checked ? "translate-x-[22px]" : "translate-x-0.5"}
        `}
      />
    </button>
  );
}

Toggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
};
