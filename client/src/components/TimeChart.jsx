// SVG column chart for the last N days. points = [{ _id: 'YYYY-MM-DD', count }] from the admin API.
export default function TimeChart({ points = [], days = 30 }) {
  const counts = new Map(points.map((p) => [p._id, p.count]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, count: counts.get(key) || 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.count));
  const W = 600; const H = 150; const bw = W / days;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="timechart" role="img" aria-label={`Rescue requests over the last ${days} days`}>
      <line x1="0" x2={W} y1={H} y2={H} className="timechart__axis" />
      {series.map((s, i) => {
        const h = (s.count / max) * (H - 8);
        return (
          <rect key={s.key} x={i * bw + 2} y={H - h} width={bw - 4} height={h} rx="2" className="timechart__bar">
            <title>{`${s.key}: ${s.count} request${s.count === 1 ? '' : 's'}`}</title>
          </rect>
        );
      })}
      <text x="0" y={H + 17} className="timechart__label">{series[0].key.slice(5)}</text>
      <text x={W} y={H + 17} textAnchor="end" className="timechart__label">{series[days - 1].key.slice(5)}</text>
      <text x={W} y="12" textAnchor="end" className="timechart__label">peak {max}</text>
    </svg>
  );
}
