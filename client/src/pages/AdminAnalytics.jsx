import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import BarList from '../components/BarList';
import StatusChart from '../components/StatusChart';
import TimeChart from '../components/TimeChart';
import useFetch from '../hooks/useFetch';
import { adminApi, migrationApi } from '../services/endpoints';
import { toStatusMap } from './AdminDashboard';

export default function AdminAnalytics() {
  const dash = useFetch(() => adminApi.dashboard());
  const mig = useFetch(() => migrationApi.analytics());

  if (dash.loading || mig.loading) return <Loader />;
  if (dash.error || mig.error) return <ErrorMessage message={dash.error || mig.error} onRetry={() => { dash.reload(); mig.reload(); }} />;

  const { charts } = dash.data;
  const rows = (list, key = 'count') => list.map((x) => ({ label: x._id, value: x[key] }));

  return (
    <>
      <h1>Analytics</h1>
      <h2>Rescues</h2>
      <div className="grid grid--2 grid--top">
        <Card><h3>Requests over time (30 days)</h3><TimeChart points={charts.rescuesOverTime} /></Card>
        <Card><h3>Status distribution</h3><StatusChart byStatus={toStatusMap(charts.statusDistribution)} /></Card>
        <Card><h3>Most reported species</h3><BarList items={rows(charts.topSpecies)} empty="No species recorded yet" /></Card>
        <Card><h3>Rescue locations</h3><BarList items={rows(charts.topLocations)} /></Card>
      </div>
      <h2>Migration observations</h2>
      <div className="grid grid--3 grid--top">
        <Card><h3>Frequently observed species</h3><BarList items={rows(mig.data.topSpecies, 'observations')} /></Card>
        <Card><h3>Observations by month</h3><BarList items={rows(mig.data.byMonth, 'observations')} /></Card>
        <Card><h3>Observation hotspots</h3><BarList items={rows(mig.data.topLocations, 'observations')} /></Card>
      </div>
    </>
  );
}
