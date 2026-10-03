import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import VolunteerCard from '../components/VolunteerCard';
import useFetch from '../hooks/useFetch';
import { adminApi, volunteerApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';

const FILTERS = ['', 'pending', 'verified', 'rejected'];

export default function AdminVolunteers() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => adminApi.volunteers({ verificationStatus: filter || undefined, page, limit: 9 }), [filter, page]);

  const setStatus = async (v, verificationStatus) => {
    try { await volunteerApi.update(v._id, { verificationStatus }); toast.success(`Volunteer ${verificationStatus}`); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <h1>Volunteers</h1>
      <div className="tabs" role="tablist" aria-label="Filter by verification">
        {FILTERS.map((f) => (
          <button key={f || 'all'} role="tab" aria-selected={filter === f} className={`tab ${filter === f ? 'is-active' : ''}`} onClick={() => { setFilter(f); setPage(1); }}>{f || 'All'}</button>
        ))}
      </div>
      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? <EmptyState title="No volunteers found" /> : (
        <>
          <div className="grid grid--3">
            {data.items.map((v) => (
              <VolunteerCard key={v._id} volunteer={v}>
                <div className="row row--wrap">
                  {v.verificationStatus !== 'verified' && <Button variant="secondary" onClick={() => setStatus(v, 'verified')}>Verify</Button>}
                  {v.verificationStatus !== 'rejected' && <Button variant="ghost" onClick={() => setStatus(v, 'rejected')}>Reject</Button>}
                </div>
              </VolunteerCard>
            ))}
          </div>
          {data.pages > 1 && (
            <div className="row row--center">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
              <span className="muted">Page {data.page} of {data.pages}</span>
              <Button variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
