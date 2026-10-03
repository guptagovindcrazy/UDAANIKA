import Card from './Card';
import Badge from './Badge';

export default function VolunteerCard({ volunteer, children }) {
  const user = volunteer.user || {};
  return (
    <Card className="volunteer-card">
      <div className="row row--between">
        <h3>{user.name || 'Volunteer'}</h3>
        <Badge status={volunteer.availability} />
      </div>
      <p className="muted">📍 {volunteer.serviceArea || 'Area not set'}</p>
      {volunteer.specialization?.length > 0 && (
        <p>{volunteer.specialization.map((s) => <span key={s} className="chip">{s}</span>)}</p>
      )}
      {volunteer.experience && <p className="muted">{volunteer.experience}</p>}
      <p className="muted">
        <Badge status={volunteer.verificationStatus} /> · {volunteer.rescuesCompleted || 0} rescues completed
      </p>
      {user.phone && <p><a href={`tel:${user.phone}`}>{user.phone}</a></p>}
      {children}
    </Card>
  );
}
