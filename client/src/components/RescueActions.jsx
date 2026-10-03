import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from './Button';
import Card from './Card';
import Input from './Input';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { adminApi, rescueApi, volunteerApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { TRANSITIONS } from '../utils/constants';

const NEXT = { Assigned: 'In Progress', 'In Progress': 'Rescued', Rescued: 'Completed' };

function useAction(onChanged) {
  const [busy, setBusy] = useState(false);
  const run = async (fn, okMessage) => {
    setBusy(true);
    try { await fn(); toast.success(okMessage); onChanged?.(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return [busy, run];
}

function VolunteerPanel({ rescue, onChanged }) {
  const me = useFetch(() => volunteerApi.me());
  const [note, setNote] = useState('');
  const [busy, run] = useAction(() => { setNote(''); onChanged(); });
  const myId = me.data?.volunteer?._id;
  const mine = myId && rescue.assignedVolunteer?._id === myId;
  const next = NEXT[rescue.status];

  if (rescue.status === 'Pending') {
    return (
      <Card>
        <h3>This bird needs help</h3>
        <p className="muted">Accepting assigns the rescue to you. Please only accept if you can travel there soon.</p>
        <Button loading={busy} onClick={() => run(() => rescueApi.assign(rescue._id), 'Rescue accepted. Thank you!')}>Accept this rescue</Button>
      </Card>
    );
  }
  if (!mine) return null;
  if (!next && !['Assigned', 'In Progress'].includes(rescue.status)) return <Card><p className="muted">This rescue is {rescue.status.toLowerCase()}. No further action needed.</p></Card>;

  return (
    <Card>
      <h3>Update this rescue</h3>
      <Input textarea rows={3} label="Notes (visible to the reporter and admins)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Condition of the bird, treatment, rehabilitation plan…" />
      <div className="row row--wrap">
        {next && <Button loading={busy} onClick={() => run(() => rescueApi.updateStatus(rescue._id, next, note || undefined), `Marked as ${next}`)}>Mark as {next}</Button>}
        {['Assigned', 'In Progress'].includes(rescue.status) && (
          <Button variant="secondary" loading={busy} onClick={() => window.confirm('Cancel your involvement and close this rescue?') && run(() => rescueApi.updateStatus(rescue._id, 'Cancelled', note || 'Cancelled by volunteer'), 'Rescue cancelled')}>Cancel rescue</Button>
        )}
      </div>
    </Card>
  );
}

function AdminPanel({ rescue, onChanged }) {
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [busy, run] = useAction(() => { setNote(''); onChanged(); });
  const volunteers = useFetch(() => (rescue.status === 'Pending' ? adminApi.volunteers({ limit: 100 }) : Promise.resolve({ data: { data: { items: [] } } })), [rescue._id, rescue.status]);
  const options = (TRANSITIONS[rescue.status] || []).filter((s) => s !== 'Assigned');

  return (
    <Card>
      <h3>Admin controls</h3>
      {rescue.status === 'Pending' && (
        <div className="field">
          <label htmlFor="assign">Assign a volunteer</label>
          <div className="row">
            <select id="assign" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}>
              <option value="">Select volunteer…</option>
              {(volunteers.data?.items || []).map((v) => <option key={v._id} value={v._id}>{v.user?.name} · {v.serviceArea} ({v.availability})</option>)}
            </select>
            <Button disabled={!volunteerId} loading={busy} onClick={() => run(() => rescueApi.assign(rescue._id, volunteerId), 'Volunteer assigned')}>Assign</Button>
          </div>
        </div>
      )}
      {options.length > 0 && (
        <>
          <Input textarea rows={2} label="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row row--wrap">
            {options.map((s) => (
              <Button key={s} variant={['Cancelled', 'Rejected'].includes(s) ? 'secondary' : 'primary'} loading={busy}
                onClick={() => run(() => rescueApi.updateStatus(rescue._id, s, note || undefined), `Status set to ${s}`)}>{s}</Button>
            ))}
          </div>
        </>
      )}
      <hr />
      <Button variant="danger" loading={busy} onClick={() => window.confirm('Permanently delete this record?') && run(async () => { await rescueApi.remove(rescue._id); navigate('/admin/rescues'); }, 'Record deleted')}>Delete invalid record</Button>
    </Card>
  );
}

export default function RescueActions({ rescue, onChanged }) {
  const { user } = useAuth();
  if (user.role === 'volunteer') return <VolunteerPanel rescue={rescue} onChanged={onChanged} />;
  if (user.role === 'admin') return <AdminPanel rescue={rescue} onChanged={onChanged} />;
  return null;
}
