// Small SVG trend chart. points: [{ label, value }]
export default function LineChart({ points = [], height = 180 }) {
  if (!points.length) return <p className="muted">No data yet</p>;
  const W = 600;
  const H = height;
  const P = 28;
  const max = Math.max(...points.map((p) => p.value), 1);
  const x = (i) => (points.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1));
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${H - P} L${x(0)},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="linechart" role="img" aria-label="Trend chart">
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="linechart__axis" />
      <path d={area} className="linechart__area" />
      <path d={line} className="linechart__line" fill="none" />
      {points.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.value)} r="3.5" className="linechart__dot"><title>{`${p.label}: ${p.value}`}</title></circle>
      ))}
      <text x={P} y={H - 8} className="linechart__text">{points[0].label}</text>
      <text x={W - P} y={H - 8} textAnchor="end" className="linechart__text">{points[points.length - 1].label}</text>
      <text x={P} y={14} className="linechart__text">max {max}</text>
    </svg>
  );
}
