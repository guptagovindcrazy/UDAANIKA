import { useState } from 'react';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RescueCard from '../components/RescueCard';
import useFetch from '../hooks/useFetch';
import { rescueApi } from '../services/endpoints';
import { STATUSES } from '../utils/constants';

export default function MyRescues() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => rescueApi.list({ status: status || undefined, page, limit: 9 }), [status, page]);

  const pick = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="container section">
      <div className="row row--between row--wrap">
        <h1>My rescue requests</h1>
        <Button to="/report-rescue">+ New report</Button>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} role="tab" aria-selected={status === s} className={`tab ${status === s ? 'is-active' : ''}`} onClick={() => pick(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? (
        <EmptyState title="Nothing here yet" text={status ? `No requests with status “${status}”.` : 'Report an injured bird to get started.'} action={<Button to="/report-rescue">Report a bird</Button>} />
      ) : (
        <>
          <div className="grid grid--3">{data.items.map((r) => <RescueCard key={r._id} rescue={r} />)}</div>
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
