import { Link } from 'react-router-dom';

export default function Button({ variant = 'primary', loading = false, to, children, className = '', ...props }) {
  const cls = `btn btn--${variant} ${className}`.trim();
  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>;
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading && <span className="spinner spinner--sm" aria-hidden="true" />}
      {children}
    </button>
  );
}
