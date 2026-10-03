import { Link, Navigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RescueCard from '../components/RescueCard';
import StatisticsCard from '../components/StatisticsCard';
import StatusChart from '../components/StatusChart';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { rescueApi } from '../services/endpoints';

const ACTIONS = [
  ['/report-rescue', '🆘', 'Report Injured Bird'],
  ['/identify', '🔍', 'Identify Bird'],
  ['/my-rescues', '📍', 'Track Rescue'],
  ['/migration', '🧭', 'Submit Observation'],
];

function UserDashboard() {
  const { user } = useAuth();
  const stats = useFetch(() => rescueApi.stats());
  const recent = useFetch(() => rescueApi.list({ limit: 4 }));

  if (stats.loading || recent.loading) return <Loader />;
  if (stats.error || recent.error) return <div className="container section"><ErrorMessage message={stats.error || recent.error} onRetry={() => { stats.reload(); recent.reload(); }} /></div>;

  const by = stats.data.byStatus;
  const active = (by.Assigned || 0) + (by['In Progress'] || 0) + (by.Rescued || 0);

  return (
    <div className="container section">
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <p className="muted">Here is an overview of your rescue activity.</p>

      <div className="grid grid--4">
        <StatisticsCard icon="📋" label="Total reports" value={stats.data.total} />
        <StatisticsCard icon="⏳" label="Pending" value={by.Pending || 0} tone="amber" />
        <StatisticsCard icon="🚑" label="Active rescues" value={active} tone="blue" />
        <StatisticsCard icon="✅" label="Completed" value={by.Completed || 0} />
      </div>

      <h2>Quick actions</h2>
      <div className="grid grid--4">
        {ACTIONS.map(([to, icon, label]) => (
          <Card key={to} as={Link} to={to} className="action">
            <span aria-hidden="true">{icon}</span><strong>{label}</strong>
          </Card>
        ))}
      </div>

      <Card>
        <div className="row row--between row--wrap">
          <div><strong>Want to help in the field?</strong><p className="muted">Register as a rescue volunteer and respond to nearby requests.</p></div>
          <Button to="/become-volunteer" variant="secondary">Become a volunteer</Button>
        </div>
      </Card>

      <Card className="row row--between row--wrap banner">
        <div><strong>Want to do more for birds?</strong><p className="muted">Join our network of rescue volunteers and help injured birds near you.</p></div>
        <Button to="/volunteer/register" variant="secondary">Become a volunteer</Button>
      </Card>

      <div className="grid grid--2 grid--top">
        <div>
          <h2>Rescue status</h2>
          <Card><StatusChart byStatus={by} /></Card>
        </div>
        <div>
          <div className="row row--between"><h2>Recent requests</h2><Button to="/my-rescues" variant="ghost">View all</Button></div>
          {recent.data.items.length === 0 ? (
            <EmptyState title="No reports yet" text="When you report an injured bird it will appear here." action={<Button to="/report-rescue">Report a bird</Button>} />
          ) : (
            <div className="stack">{recent.data.items.map((r) => <RescueCard key={r._id} rescue={r} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <UserDashboard />;
}
