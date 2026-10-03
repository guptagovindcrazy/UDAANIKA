import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RescueCard from '../components/RescueCard';
import StatisticsCard from '../components/StatisticsCard';
import useFetch from '../hooks/useFetch';
import { rescueApi, volunteerApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { AVAILABILITY } from '../utils/constants';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const me = useFetch(() => volunteerApi.me());
  const open = useFetch(() => rescueApi.list({ status: 'Pending', limit: 6 }));
  const mine = useFetch(() => rescueApi.list({ status: 'Assigned,In Progress,Rescued', limit: 6 }));
  const [busy, setBusy] = useState(false);

  if (me.loading || open.loading || mine.loading) return <Loader />;
  const error = me.error || open.error || mine.error;
  if (error) return <div className="container section"><ErrorMessage message={error} onRetry={() => { me.reload(); open.reload(); mine.reload(); }} /></div>;

  const { volunteer, stats } = me.data;

  const setAvailability = async (value) => {
    setBusy(true);
    try { await volunteerApi.availability(volunteer._id, value); me.reload(); toast.success(`You are now ${value}`); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const accept = async (rescue) => {
    setBusy(true);
    try {
      await rescueApi.assign(rescue._id);
      toast.success('Rescue accepted. Please head to the location.');
      navigate(`/volunteer/rescues/${rescue._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      open.reload();
    } finally { setBusy(false); }
  };

  return (
    <div className="container section">
      <h1>Volunteer dashboard</h1>
      {volunteer.verificationStatus !== 'verified' && (
        <p className="notice notice--warn">Your volunteer profile is {volunteer.verificationStatus === 'rejected' ? 'not approved' : 'awaiting verification by an admin'}.</p>
      )}

      <div className="grid grid--4">
        <StatisticsCard icon="🆘" label="Open requests" value={open.data.total} tone="amber" />
        <StatisticsCard icon="📌" label="Assigned to you" value={stats.assigned} tone="blue" />
        <StatisticsCard icon="🚑" label="In progress" value={stats.inProgress} tone="blue" />
        <StatisticsCard icon="✅" label="Completed" value={stats.completed} />
      </div>

      <Card>
        <div className="row row--between row--wrap">
          <div><strong>Your availability</strong><p className="muted">Admins use this when assigning rescues.</p></div>
          <div className="tabs" role="group" aria-label="Availability">
            {AVAILABILITY.map((a) => (
              <button key={a} disabled={busy} className={`tab ${volunteer.availability === a ? 'is-active' : ''}`} aria-pressed={volunteer.availability === a} onClick={() => setAvailability(a)}>{a}</button>
            ))}
          </div>
        </div>
      </Card>

      <h2>Your active rescues</h2>
      {mine.data.items.length === 0 ? <EmptyState icon="🕊️" title="No active rescues" text="Accept a request below to get started." /> : (
        <div className="grid grid--3">{mine.data.items.map((r) => <RescueCard key={r._id} rescue={r} to={`/volunteer/rescues/${r._id}`} />)}</div>
      )}

      <div className="row row--between"><h2>Requests waiting for a volunteer</h2><Button to="/volunteer/rescues" variant="ghost">View all</Button></div>
      {open.data.items.length === 0 ? <EmptyState icon="🎉" title="No open requests" text="Every reported bird has a volunteer right now." /> : (
        <div className="grid grid--3">
          {open.data.items.map((r) => (
            <div key={r._id} className="stack">
              <RescueCard rescue={r} to={`/volunteer/rescues/${r._id}`} />
              <Button loading={busy} onClick={() => accept(r)}>Accept this rescue</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
