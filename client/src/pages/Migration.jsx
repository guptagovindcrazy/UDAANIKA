import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import BarList from '../components/BarList';
import StatisticsCard from '../components/StatisticsCard';
import MigrationCard from '../components/MigrationCard';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { migrationApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { DIRECTIONS } from '../utils/constants';

const EMPTY = { species: '', observationDate: '', location: '', latitude: '', longitude: '', count: '1', direction: '', weather: '', notes: '' };

function ObservationForm({ onDone, onClose }) {
  const { values, setValues, handleChange } = useForm(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const locate = () => navigator.geolocation?.getCurrentPosition(
    ({ coords }) => setValues((v) => ({ ...v, latitude: coords.latitude.toFixed(5), longitude: coords.longitude.toFixed(5) })),
    () => toast.error('Could not get your location')
  );

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.species.trim()) next.species = 'Species is required';
    if (!values.observationDate) next.observationDate = 'Pick the date you saw them';
    if (!values.location.trim()) next.location = 'Location is required';
    if (!(Number(values.count) >= 1)) next.count = 'At least 1';
    setErrors(next);
    if (Object.keys(next).length) return;

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (image) fd.append('image', image);
    setSubmitting(true);
    try {
      await migrationApi.create(fd);
      toast.success('Observation submitted. Thank you!');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Submit an observation" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Input label="Bird species *" name="species" value={values.species} onChange={handleChange} error={errors.species} />
        <div className="grid grid--2">
          <Input label="Date *" name="observationDate" type="date" max={today} value={values.observationDate} onChange={handleChange} error={errors.observationDate} />
          <Input label="Number of birds *" name="count" type="number" min="1" value={values.count} onChange={handleChange} error={errors.count} />
        </div>
        <Input label="Location *" name="location" value={values.location} onChange={handleChange} error={errors.location} />
        <div className="grid grid--2">
          <Input label="Latitude" name="latitude" type="number" step="any" value={values.latitude} onChange={handleChange} />
          <Input label="Longitude" name="longitude" type="number" step="any" value={values.longitude} onChange={handleChange} />
        </div>
        <Button type="button" variant="ghost" onClick={locate}>📍 Use my coordinates</Button>
        <div className="grid grid--2">
          <Select label="Flight direction" name="direction" options={DIRECTIONS} value={values.direction} onChange={handleChange} />
          <Input label="Weather" name="weather" value={values.weather} onChange={handleChange} placeholder="Clear, foggy…" />
        </div>
        <Input textarea rows={3} label="Notes" name="notes" value={values.notes} onChange={handleChange} />
        <div className="field">
          <label htmlFor="obs-image">Photo (optional)</label>
          <input id="obs-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </div>
        <Button type="submit" loading={submitting} className="btn--block">Submit observation</Button>
      </form>
    </Modal>
  );
}

export default function Migration() {
  const { user } = useAuth();
  const [species, setSpecies] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const analytics = useFetch(() => migrationApi.analytics());
  const list = useFetch(() => migrationApi.list({ species: query || undefined, page, limit: 9 }), [query, page]);

  const search = (e) => { e.preventDefault(); setPage(1); setQuery(species.trim()); };
  const remove = async (o) => {
    if (!window.confirm('Delete this observation?')) return;
    try { await migrationApi.remove(o._id); toast.success('Observation deleted'); list.reload(); analytics.reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const done = () => { setShowForm(false); list.reload(); analytics.reload(); };
  const a = analytics.data;

  return (
    <div className="container section">
      <div className="row row--between row--wrap">
        <div>
          <h1>Bird migration</h1>
          <p className="muted">Community sightings of migratory birds across India.</p>
        </div>
        {user ? <Button onClick={() => setShowForm(true)}>+ Submit observation</Button> : <Button to="/login" variant="secondary">Log in to contribute</Button>}
      </div>

      <div className="grid grid--3">
        <StatisticsCard icon="🧭" label="Observations" value={a?.totalObservations} loading={analytics.loading} />
        <StatisticsCard icon="🪶" label="Birds counted" value={a?.totalBirds} loading={analytics.loading} tone="blue" />
        <StatisticsCard icon="📍" label="Hotspots" value={a?.topLocations.length} loading={analytics.loading} />
      </div>

      {!analytics.loading && !analytics.error && (
        <div className="grid grid--3 grid--top">
          <Card><h3>Frequently observed species</h3><BarList items={a.topSpecies.map((s) => ({ label: s._id, value: s.observations }))} /></Card>
          <Card><h3>Seasonal trend (by month)</h3><BarList items={a.byMonth.map((m) => ({ label: m._id, value: m.observations }))} /></Card>
          <Card><h3>High-activity locations</h3><BarList items={a.topLocations.map((l) => ({ label: l._id, value: l.observations }))} /></Card>
        </div>
      )}

      <h2>Recent observations</h2>
      <form onSubmit={search} className="row row--wrap searchbar">
        <input aria-label="Filter by species" placeholder="Filter by species…" value={species} onChange={(e) => setSpecies(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
        {query && <Button type="button" variant="ghost" onClick={() => { setSpecies(''); setQuery(''); setPage(1); }}>Clear</Button>}
      </form>

      {list.loading ? <Loader /> : list.error ? <ErrorMessage message={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? (
        <EmptyState icon="🧭" title="No observations found" text="Be the first to log a sighting." />
      ) : (
        <>
          <div className="grid grid--3">
            {list.data.items.map((o) => (
              <MigrationCard key={o._id} observation={o} onDelete={user && (user.role === 'admin' || o.observer?._id === user._id) ? remove : undefined} />
            ))}
          </div>
          {list.data.pages > 1 && (
            <div className="row row--center">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
              <span className="muted">Page {list.data.page} of {list.data.pages}</span>
              <Button variant="secondary" disabled={page >= list.data.pages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}
      {showForm && <ObservationForm onDone={done} onClose={() => setShowForm(false)} />}
    </div>
  );
}
