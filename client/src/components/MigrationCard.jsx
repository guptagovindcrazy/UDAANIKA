import Card from './Card';
import { assetUrl, formatDay } from '../utils/format';

export default function MigrationCard({ observation: o, onDelete }) {
  const img = assetUrl(o.image);
  const hasCoords = o.latitude != null && o.longitude != null;
  return (
    <Card className="bird-card">
      {img && <img className="migration-img" src={img} alt={o.species} loading="lazy" />}
      <div className="row row--between">
        <h3>{o.species}</h3>
        <strong title="Birds counted">×{o.count}</strong>
      </div>
      <p className="muted">📍 {o.location}</p>
      <p className="muted">🗓 {formatDay(o.observationDate)}{o.direction ? ` · heading ${o.direction}` : ''}{o.weather ? ` · ${o.weather}` : ''}</p>
      {o.notes && <p>{o.notes}</p>}
      <small className="muted">Observed by {o.observer?.name || 'a community member'}</small>
      <div className="row row--between">
        {hasCoords ? <a href={`https://www.openstreetmap.org/?mlat=${o.latitude}&mlon=${o.longitude}#map=10/${o.latitude}/${o.longitude}`} target="_blank" rel="noreferrer">View on map ↗</a> : <span />}
        {onDelete && <button className="link-btn" onClick={() => onDelete(o)}>Delete</button>}
      </div>
    </Card>
  );
}
