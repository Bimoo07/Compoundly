import PropTypes from 'prop-types';

/**
 * Base surface container — the dark bordered panel used everywhere:
 * Intention Builder, Journal of Evidence, Settings sections, Setback Log, etc.
 *
 * Usage:
 *   <Card><h3>Journal of Evidence</h3>...</Card>
 *   <Card padding="lg" className="flex flex-col gap-md">...</Card>
 */
export default function Card({ children, padding = 'lg', className = '' }) {
  const paddingClass = {
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
  }[padding];

  return (
    <div
      className={`rounded-md border border-subtle bg-navy-900/60 ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node,
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};
