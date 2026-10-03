import Card from './Card';
import Badge from './Badge';
import { assetUrl } from '../utils/format';

export default function BirdCard({ bird }) {
  const img = assetUrl(bird.image);
  return (
    <Card className="bird-card">
      <div className="bird-card__img">{img ? <img src={img} alt={bird.commonName} loading="lazy" /> : <span aria-hidden="true">🦜</span>}</div>
      <h3>{bird.commonName}</h3>
      <small className="muted"><em>{bird.scientificName}</em></small>
      <p>{bird.description}</p>
      <Badge status={bird.conservationStatus === 'Least Concern' ? 'Completed' : 'Pending'}>{bird.conservationStatus}</Badge>
    </Card>
  );
}
