import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import StatisticsCard from '../components/StatisticsCard';
import StatusChart from '../components/StatusChart';
import TimeChart from '../components/TimeChart';
import RescueCard from '../components/RescueCard';
import EmptyState from '../components/EmptyState';
import useFetch from '../hooks/useFetch';
import { adminApi } from '../services/endpoints';

export const toStatusMap = (rows = []) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

export default function AdminDashboard() {
  const dash = useFetch(() => adminApi.dashboard());
  const queue = useFetch(() => adminApi.rescues({ status: 'Pending', limit: 4 }));

  if (dash.loading || queue.loading) return <Loader />;
  if (dash.error || queue.error) return <ErrorMessage message={dash.error || queue.error} onRetry={() => { dash.reload(); queue.reload(); }} />;

  const { totals, charts } = dash.data;
  return (
    <>
      <h1>Admin overview</h1>
      <div className="grid grid--4">
        <StatisticsCard icon="👥" label="Total users" value={totals.totalUsers} />
        <StatisticsCard icon="🤝" label="Volunteers" value={totals.totalVolunteers} tone="blue" />
        <StatisticsCard icon="🚨" label="Active requests" value={totals.activeRescues} tone="amber" />
        <StatisticsCard icon="✅" label="Completed rescues" value={totals.completedRescues} />
        <StatisticsCard icon="🪶" label="Birds rescued" value={totals.birdsRescued} />
        <StatisticsCard icon="🔍" label="Species identified" value={totals.speciesIdentified} tone="blue" />
        <StatisticsCard icon="🧭" label="Migration observations" value={totals.migrationObservations} tone="blue" />
      </div>

      <div className="grid grid--2 grid--top">
        <Card><h3>Requests, last 30 days</h3><TimeChart points={charts.rescuesOverTime} /></Card>
        <Card><h3>Status distribution</h3><StatusChart byStatus={toStatusMap(charts.statusDistribution)} /></Card>
      </div>

      <div className="row row--between"><h2>Waiting for a volunteer</h2><Button to="/admin/rescues" variant="ghost">Manage rescues</Button></div>
      {queue.data.items.length === 0 ? <EmptyState icon="🎉" title="Queue is clear" text="No pending requests." /> : (
        <div className="grid grid--4">{queue.data.items.map((r) => <RescueCard key={r._id} rescue={r} />)}</div>
      )}
    </>
  );
}
