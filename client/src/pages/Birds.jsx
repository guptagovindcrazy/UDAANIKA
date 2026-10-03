import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import BirdCard from '../components/BirdCard';
import Pagination from '../components/Pagination';
import useFetch from '../hooks/useFetch';
import { birdApi } from '../services/endpoints';
import { CONSERVATION } from '../utils/constants';

export default function Birds() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { const t = setTimeout(() => { setSearch(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useFetch(() => birdApi.list({ q: search || undefined, conservationStatus: status || undefined, page, limit: 12 }), [search, status, page]);

  return (
    <div className="container section">
      <h1>Bird directory</h1>
      <div className="row row--wrap filters">
        <input type="search" placeholder="Search by name" aria-label="Search birds" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Conservation status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All conservation statuses</option>
          {CONSERVATION.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? <EmptyState title="No birds match" text="Try a different search." /> : (
        <>
          <div className="grid grid--4">{data.items.map((b) => <BirdCard key={b._id} bird={b} />)}</div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
