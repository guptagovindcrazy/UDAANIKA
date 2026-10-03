import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import useFetch from '../hooks/useFetch';
import { adminApi, rescueApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { STATUSES, TRANSITIONS } from '../utils/constants';
import { formatDay } from '../utils/format';

function AssignModal({ rescue, onClose, onDone }) {
  const vols = useFetch(() => adminApi.volunteers({ limit: 100 }));
  const [volunteerId, setVolunteerId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!volunteerId) return toast.error('Choose a volunteer');
    setBusy(true);
    try { await rescueApi.assign(rescue._id, volunteerId, note || undefined); toast.success('Volunteer assigned'); onDone(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const options = (vols.data?.items || []).filter((v) => v.verificationStatus !== 'rejected');
  return (
    <Modal title={`Assign volunteer · ${rescue.requestId}`} onClose={onClose}>
      {vols.loading ? <Loader /> : vols.error ? <ErrorMessage message={vols.error} /> : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="volunteer">Volunteer</label>
            <select id="volunteer" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}>
              <option value="">Select a volunteer…</option>
              {options.map((v) => <option key={v._id} value={v._id}>{v.user?.name} · {v.serviceArea || 'no area'} · {v.availability}{v.verificationStatus !== 'verified' ? ' (unverified)' : ''}</option>)}
            </select>
          </div>
          <Input textarea rows={2} label="Note (optional)" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" loading={busy}>Assign</Button>
        </form>
      )}
    </Modal>
  );
}

function StatusModal({ rescue, onClose, onDone }) {
  const options = TRANSITIONS[rescue.status].filter((s) => s !== 'Assigned');
  const [status, setStatus] = useState(options[0] || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await rescueApi.updateStatus(rescue._id, status, note); toast.success(`Status changed to ${status}`); onDone(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Change status · ${rescue.requestId}`} onClose={onClose}>
      {options.length === 0 ? <p className="muted">A {rescue.status.toLowerCase()} request cannot move to another status.</p> : (
        <form onSubmit={submit}>
          <p className="muted">Current status: <Badge status={rescue.status} /></p>
          <Select label="New status" options={options} value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Choose…" />
          <Input textarea rows={2} label="Admin note (optional)" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" loading={busy} disabled={!status}>Update status</Button>
        </form>
      )}
    </Modal>
  );
}

export default function AdminRescues() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: 'assign' | 'status', rescue }
  const { data, loading, error, reload } = useFetch(() => adminApi.rescues({ status: status || undefined, page, limit: 10 }), [status, page]);

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.requestId}? Use this only for invalid or duplicate records.`)) return;
    try { await rescueApi.remove(r._id); toast.success('Record deleted'); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const done = () => { setModal(null); reload(); };

  return (
    <>
      <h1>Rescue requests</h1>
      <div className="tabs" role="tablist" aria-label="Filter by status">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} role="tab" aria-selected={status === s} className={`tab ${status === s ? 'is-active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? <EmptyState title="No rescue requests" /> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>ID</th><th>Bird</th><th>Location</th><th>Severity</th><th>Status</th><th>Volunteer</th><th>Reported</th><th>Actions</th></tr></thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r._id}>
                    <td><Link to={`/rescues/${r._id}`}>{r.requestId}</Link></td>
                    <td>{r.birdSpecies || 'Unidentified'}</td>
                    <td>{r.locationName}</td>
                    <td><Badge status={r.severity} /></td>
                    <td><Badge status={r.status} /></td>
                    <td>{r.assignedVolunteer?.user?.name || '—'}</td>
                    <td>{formatDay(r.createdAt)}</td>
                    <td className="actions">
                      {r.status === 'Pending' && <button className="link-btn" onClick={() => setModal({ type: 'assign', rescue: r })}>Assign</button>}
                      <button className="link-btn" onClick={() => setModal({ type: 'status', rescue: r })}>Status</button>
                      <button className="link-btn link-btn--danger" onClick={() => remove(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      {modal?.type === 'assign' && <AssignModal rescue={modal.rescue} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'status' && <StatusModal rescue={modal.rescue} onClose={() => setModal(null)} onDone={done} />}
    </>
  );
}
