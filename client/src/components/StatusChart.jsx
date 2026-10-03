import { STATUSES, slug } from '../utils/constants';

// Dependency-free horizontal bar chart of rescues per status.
export default function StatusChart({ byStatus = {} }) {
  const rows = STATUSES.map((s) => [s, byStatus[s] || 0]);
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <ul className="chart" aria-label="Rescues by status">
      {rows.map(([status, count]) => (
        <li key={status}>
          <span className="chart__label">{status}</span>
          <span className="chart__track"><span className={`chart__bar badge--${slug(status)}`} style={{ width: `${(count / max) * 100}%` }} /></span>
          <span className="chart__count">{count}</span>
        </li>
      ))}
    </ul>
  );
}
