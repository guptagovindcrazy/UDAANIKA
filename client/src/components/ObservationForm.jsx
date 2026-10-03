import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { birdApi, migrationApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { DIRECTIONS } from '../utils/constants';

const today = () => new Date().toISOString().slice(0, 10);

export default function ObservationForm({ onCreated }) {
  const birds = useFetch(() => birdApi.list({ limit: 50 }));
  const { values, setValues, handleChange } = useForm({ species: '', observationDate: today(), location: '', latitude: '', longitude: '', count: 1, direction: '', weather: '', notes: '' });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setValues((v) => ({ ...v, latitude: coords.latitude.toFixed(5), longitude: coords.longitude.toFixed(5) })),
      () => toast.error('Could not get your location'),
      { timeout: 10000 }
    );
  };

  const onImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setImage(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024) { e.target.value = ''; return toast.error('Use a JPG, PNG or WEBP image under 5 MB'); }
    setImage(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.species.trim()) next.species = 'Species is required';
    if (!values.location.trim()) next.location = 'Location is required';
    if (!values.observationDate || values.observationDate > today()) next.observationDate = 'Choose a date that is not in the future';
    if (!(Number(values.count) >= 1)) next.count = 'At least 1 bird';
    setErrors(next);
    if (Object.keys(next).length) return;

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (image) fd.append('image', image);
    setSubmitting(true);
    try {
      await migrationApi.create(fd);
      toast.success('Observation submitted. Thank you!');
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Input label="Species *" name="species" list="species-list" value={values.species} onChange={handleChange} error={errors.species} />
      <datalist id="species-list">{(birds.data?.items || []).map((b) => <option key={b._id} value={b.commonName} />)}</datalist>
      <div className="grid grid--2">
        <Input label="Date *" name="observationDate" type="date" max={today()} value={values.observationDate} onChange={handleChange} error={errors.observationDate} />
        <Input label="Number of birds *" name="count" type="number" min="1" value={values.count} onChange={handleChange} error={errors.count} />
      </div>
      <Input label="Location *" name="location" value={values.location} onChange={handleChange} error={errors.location} placeholder="Lake, park or area name" />
      <div className="grid grid--2">
        <Input label="Latitude" name="latitude" type="number" step="any" value={values.latitude} onChange={handleChange} />
        <Input label="Longitude" name="longitude" type="number" step="any" value={values.longitude} onChange={handleChange} />
      </div>
      <p><Button type="button" variant="secondary" onClick={locate}>📍 Use my location</Button></p>
      <div className="grid grid--2">
        <Select label="Direction of travel" name="direction" options={DIRECTIONS} value={values.direction} onChange={handleChange} placeholder="Unknown" />
        <Input label="Weather" name="weather" value={values.weather} onChange={handleChange} placeholder="Clear, foggy…" />
      </div>
      <Input textarea rows={2} label="Notes" name="notes" value={values.notes} onChange={handleChange} />
      <div className="field"><label htmlFor="obs-image">Photo (optional)</label><input id="obs-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} /></div>
      <Button type="submit" loading={submitting} className="btn--block">Submit observation</Button>
    </form>
  );
}
