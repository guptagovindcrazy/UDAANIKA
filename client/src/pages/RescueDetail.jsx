import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import LocationMap from '../components/LocationMap';
import StatusTimeline from '../components/StatusTimeline';
import RescueActions from '../components/RescueActions';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { rescueApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { assetUrl, formatDate, percent } from '../utils/format';

export default function RescueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => rescueApi.get(id), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader />;
  if (error) return <div className="container section"><ErrorMessage message={error} onRetry={reload} /></div>;

  const { rescue } = data;
  const isOwner = rescue.reportedBy?._id === user._id;
  const canCancel = isOwner && ['Pending', 'Assigned'].includes(rescue.status);
  const canDelete = isOwner && rescue.status === 'Pending';
  const volunteer = rescue.assignedVolunteer?.user;
  const img = assetUrl(rescue.imageUrl);

  const run = async (fn, okMessage) => {
    setBusy(true);
    try { await fn(); toast.success(okMessage); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const cancel = () => window.confirm('Cancel this rescue request?') &&
    run(async () => { await rescueApi.updateStatus(id, 'Cancelled', 'Cancelled by reporter'); reload(); }, 'Request cancelled');
  const remove = () => window.confirm('Delete this request permanently?') &&
    run(async () => { await rescueApi.remove(id); navigate('/my-rescues'); }, 'Request deleted');

  return (
    <div className="container section">
      <div className="row row--between row--wrap">
        <div>
          <small className="muted">{rescue.requestId}</small>
          <h1>{rescue.birdSpecies || 'Unidentified bird'}</h1>
        </div>
        <Badge status={rescue.status} />
      </div>

      <div className="grid grid--2 grid--top">
        <div className="stack">
          <Card>
            {img && <img className="detail-img" src={img} alt={rescue.birdSpecies || 'Injured bird'} />}
            <dl className="details">
              <dt>Injury</dt><dd>{rescue.injuryType}</dd>
              <dt>Severity</dt><dd><Badge status={rescue.severity} /></dd>
              {rescue.birdIdentificationConfidence != null && (<><dt>AI confidence</dt><dd>{percent(rescue.birdIdentificationConfidence)}</dd></>)}
              <dt>Location</dt><dd>{rescue.locationName}</dd>
              <dt>Reported by</dt><dd>{rescue.reportedBy?.name || '—'}</dd>
              <dt>Reported on</dt><dd>{formatDate(rescue.createdAt)}</dd>
              {rescue.completedAt && (<><dt>Completed</dt><dd>{formatDate(rescue.completedAt)}</dd></>)}
            </dl>
            <h3>Description</h3>
            <p className="pre-wrap">{rescue.description}</p>
            <LocationMap latitude={rescue.latitude} longitude={rescue.longitude} />
          </Card>

          <Card>
            <h3>Assigned volunteer</h3>
            {volunteer ? (
              <p><strong>{volunteer.name}</strong><br />{volunteer.phone && <a href={`tel:${volunteer.phone}`}>{volunteer.phone}</a>}</p>
            ) : (
              <p className="muted">No volunteer yet. Nearby volunteers can see this request.</p>
            )}
            {rescue.volunteerNotes && (<><h3>Volunteer notes</h3><p className="pre-wrap">{rescue.volunteerNotes}</p></>)}
            {user.role === 'admin' && rescue.adminNotes && (<><h3>Admin notes</h3><p className="pre-wrap">{rescue.adminNotes}</p></>)}
          </Card>
        </div>

        <div className="stack">
          <Card>
            <h2>Rescue progress</h2>
            <StatusTimeline history={rescue.statusHistory} status={rescue.status} />
          </Card>
          {user.role !== 'user' && <RescueActions rescue={rescue} onChanged={reload} />}
          {(canCancel || canDelete) && (
            <Card>
              <h3>Manage request</h3>
              <div className="row row--wrap">
                {canCancel && <Button variant="secondary" loading={busy} onClick={cancel}>Cancel request</Button>}
                {canDelete && <Button variant="danger" loading={busy} onClick={remove}>Delete</Button>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
