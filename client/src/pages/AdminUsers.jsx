import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import useFetch from '../hooks/useFetch';
import { adminApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { formatDay } from '../utils/format';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => adminApi.users({ q: search || undefined, role: role || undefined, page, limit: 10 }), [search, role, page]);

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try { await adminApi.deleteUser(u._id); toast.success('User deleted'); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <h1>Users</h1>
      <form className="row row--wrap searchbar" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input aria-label="Search users" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option><option value="user">Users</option><option value="volunteer">Volunteers</option><option value="admin">Admins</option>
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? <EmptyState title="No users found" /> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td><td>{u.email}</td><td><Badge status={u.role}>{u.role}</Badge></td><td>{u.location || '—'}</td><td>{formatDay(u.createdAt)}</td>
                    <td>{u.role !== 'admin' && <button className="link-btn" onClick={() => remove(u)}>Delete</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">{data.total} user{data.total === 1 ? '' : 's'}</p>
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
