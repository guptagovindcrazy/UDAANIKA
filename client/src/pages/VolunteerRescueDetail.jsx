import { useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import LocationMap from '../components/LocationMap';
import StatusTimeline from '../components/StatusTimeline';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { rescueApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { assetUrl, formatDate } from '../utils/format';

const NEXT = {
  Assigned: ['In Progress', 'Start rescue (on my way)'],
  'In Progress': ['Rescued', 'Mark as rescued'],
  Rescued: ['Completed', 'Complete rescue'],
};

export default function VolunteerRescueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => rescueApi.get(id), [id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader />;
  if (error) return <div className="container section"><ErrorMessage message={error} onRetry={reload} /></div>;

  const { rescue } = data;
  const mine = rescue.assignedVolunteer?.user?._id === user._id;
  const next = mine ? NEXT[rescue.status] : null;
  const img = assetUrl(rescue.imageUrl);

  const act = async (fn, message) => {
    setBusy(true);
    try { await fn(); toast.success(message); setNote(''); reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const move = (status, message) => act(() => rescueApi.updateStatus(id, status, note.trim()), message);
  const confirmMove = (status, question, message) => window.confirm(question) && move(status, message);

  return (
    <div className="container section">
      <div className="row row--between row--wrap">
        <div><small className="muted">{rescue.requestId}</small><h1>{rescue.birdSpecies || 'Unidentified bird'}</h1></div>
        <Badge status={rescue.status} />
      </div>

      <div className="grid grid--2 grid--top">
        <div className="stack">
          <Card>
            {img && <img className="detail-img" src={img} alt={rescue.birdSpecies || 'Injured bird'} />}
            <dl className="details">
              <dt>Injury</dt><dd>{rescue.injuryType}</dd>
              <dt>Severity</dt><dd><Badge status={rescue.severity} /></dd>
              <dt>Location</dt><dd>{rescue.locationName}</dd>
              <dt>Reported</dt><dd>{formatDate(rescue.createdAt)}</dd>
              <dt>Reporter</dt>
              <dd>{rescue.reportedBy?.name}{rescue.contactNumber && <> · <a href={`tel:${rescue.contactNumber}`}>{rescue.contactNumber}</a></>}</dd>
            </dl>
            <h3>Description</h3>
            <p className="pre-wrap">{rescue.description}</p>
            <LocationMap latitude={rescue.latitude} longitude={rescue.longitude} />
          </Card>
          {rescue.volunteerNotes && <Card><h3>Rescue notes</h3><p className="pre-wrap">{rescue.volunteerNotes}</p></Card>}
        </div>

        <div className="stack">
          <Card><h2>Progress</h2><StatusTimeline history={rescue.statusHistory} status={rescue.status} /></Card>

          <Card>
            <h2>Actions</h2>
            {rescue.status === 'Pending' && (
              <>
                <p className="muted">No volunteer is assigned yet.</p>
                <Button loading={busy} onClick={() => act(() => rescueApi.assign(id), 'Rescue accepted')}>Accept this rescue</Button>
              </>
            )}
            {mine && next && (
              <>
                <Input textarea rows={3} label="Add a note (optional)" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
                  placeholder={rescue.status === 'Rescued' ? 'Rehabilitation details, treatment, release plan…' : 'What did you find? Any update for the reporter?'} />
                <div className="row row--wrap">
                  <Button loading={busy} onClick={() => move(next[0], `Status updated to ${next[0]}`)}>{next[1]}</Button>
                  {rescue.status === 'Assigned' && (
                    <Button variant="secondary" disabled={busy} onClick={() => confirmMove('Pending', 'Release this rescue so another volunteer can take it?', 'Released back to the pool')}>Release</Button>
                  )}
                  {rescue.status !== 'Rescued' && (
                    <Button variant="danger" disabled={busy} onClick={() => confirmMove('Cancelled', 'Cancel this rescue? Use this if the bird cannot be found.', 'Rescue cancelled')}>Cancel</Button>
                  )}
                </div>
              </>
            )}
            {!mine && rescue.status !== 'Pending' && <p className="muted">This rescue is {rescue.status.toLowerCase()} and is not assigned to you.</p>}
            {mine && !next && <p className="muted">This rescue is {rescue.status.toLowerCase()}. No further actions.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
