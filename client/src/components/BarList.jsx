// Generic horizontal bar chart: items = [{ label, value }]
export default function BarList({ items = [], empty = 'No data yet' }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="barlist">
      {items.map((i) => (
        <li key={i.label}>
          <span className="barlist__label" title={i.label}>{i.label}</span>
          <span className="barlist__track"><span className="barlist__bar" style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <span className="barlist__value">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}
