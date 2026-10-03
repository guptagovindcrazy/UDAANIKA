import { useState } from 'react';
import Loader from '../components/Loader';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RescueCard from '../components/RescueCard';
import useFetch from '../hooks/useFetch';
import { rescueApi } from '../services/endpoints';

const TABS = [
  ['Available', 'Pending'],
  ['My active rescues', 'Assigned,In Progress,Rescued'],
  ['History', 'Completed,Cancelled'],
];

export default function VolunteerRescues() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => rescueApi.list({ status: TABS[tab][1], page, limit: 9 }), [tab, page]);

  return (
    <div className="container section">
      <h1>Rescues</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([label], i) => (
          <button key={label} role="tab" aria-selected={tab === i} className={`tab ${tab === i ? 'is-active' : ''}`} onClick={() => { setTab(i); setPage(1); }}>{label}</button>
        ))}
      </div>
      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? (
        <EmptyState title="Nothing here" text="No rescues in this list right now." />
      ) : (
        <>
          <div className="grid grid--3">{data.items.map((r) => <RescueCard key={r._id} rescue={r} to={`/volunteer/rescues/${r._id}`} />)}</div>
          {data.pages > 1 && (
            <div className="row row--center">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
              <span className="muted">Page {data.page} of {data.pages}</span>
              <Button variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
