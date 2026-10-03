// Schematic map: plots observations by latitude/longitude (no tiles, no external service).
export default function ObservationMap({ observations = [] }) {
  const pts = observations.filter((o) => Number.isFinite(o.latitude) && Number.isFinite(o.longitude));
  if (!pts.length) return <p className="muted">No located observations yet.</p>;

  const W = 640;
  const H = 340;
  const lats = pts.map((p) => p.latitude);
  const lons = pts.map((p) => p.longitude);
  let spanLon = Math.max(Math.max(...lons) - Math.min(...lons), 2) * 1.3;
  let spanLat = Math.max(Math.max(...lats) - Math.min(...lats), 2) * 1.3;
  const aspect = W / H;
  if (spanLon / spanLat < aspect) spanLon = spanLat * aspect; else spanLat = spanLon / aspect;
  const cLon = (Math.max(...lons) + Math.min(...lons)) / 2;
  const cLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const x = (lon) => ((lon - (cLon - spanLon / 2)) / spanLon) * W;
  const y = (lat) => (((cLat + spanLat / 2) - lat) / spanLat) * H;

  const step = [1, 2, 5, 10, 20].find((s) => spanLon / s <= 8) || 20;
  const gridLons = []; const gridLats = [];
  for (let v = Math.ceil((cLon - spanLon / 2) / step) * step; v <= cLon + spanLon / 2; v += step) gridLons.push(v);
  for (let v = Math.ceil((cLat - spanLat / 2) / step) * step; v <= cLat + spanLat / 2; v += step) gridLats.push(v);

  return (
    <figure className="obsmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of migration observations">
        {gridLons.map((v) => <line key={`lo${v}`} x1={x(v)} x2={x(v)} y1="0" y2={H} className="obsmap__grid" />)}
        {gridLats.map((v) => <line key={`la${v}`} y1={y(v)} y2={y(v)} x1="0" x2={W} className="obsmap__grid" />)}
        {pts.map((p) => (
          <circle key={p._id} cx={x(p.longitude)} cy={y(p.latitude)} r={5 + Math.sqrt(p.count || 1) * 0.8} className="obsmap__dot">
            <title>{`${p.species} · ${p.count} birds · ${p.location}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="muted">Schematic view, grid every {step}°. Hover a point for details; larger = more birds.</figcaption>
    </figure>
  );
}
