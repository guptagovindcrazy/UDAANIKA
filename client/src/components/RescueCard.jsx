import { Link } from 'react-router-dom';
import Badge from './Badge';
import { assetUrl, formatDay } from '../utils/format';

export default function RescueCard({ rescue, basePath = '/rescues' }) {
  const img = assetUrl(rescue.imageUrl);
  return (
    <Link to={`${basePath}/${rescue._id}`} className="card rescue-card">
      <div className="rescue-card__img">
        {img ? <img src={img} alt={rescue.birdSpecies || 'Injured bird'} loading="lazy" /> : <span aria-hidden="true">🪶</span>}
      </div>
      <div className="rescue-card__body">
        <div className="row row--between">
          <small className="muted">{rescue.requestId}</small>
          <Badge status={rescue.status} />
        </div>
        <h3>{rescue.birdSpecies || 'Unidentified bird'}</h3>
        <p className="muted">{rescue.injuryType} · <Badge status={rescue.severity} /></p>
        <p className="muted">📍 {rescue.locationName}</p>
        <small className="muted">Reported {formatDay(rescue.createdAt)}</small>
      </div>
    </Link>
  );
}
