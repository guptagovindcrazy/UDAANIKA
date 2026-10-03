import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LocationPicker from '../components/LocationPicker';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { birdApi, rescueApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { INJURY_TYPES, SEVERITIES } from '../utils/constants';
import { percent } from '../utils/format';

const MAX_IMAGE = 5 * 1024 * 1024;

export default function ReportRescue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { values, setValues, handleChange } = useForm({
    birdSpecies: '', injuryType: '', severity: '', description: '', notes: '',
    contactNumber: user?.phone || '', locationName: '', latitude: '', longitude: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [identify, setIdentify] = useState({ state: 'idle' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Please choose a JPG, PNG or WEBP image');
    if (file.size > MAX_IMAGE) return toast.error('Image must be under 5 MB');
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setIdentify({ state: 'idle' });
  };

  const runIdentify = async () => {
    const fd = new FormData();
    fd.append('image', image);
    setIdentify({ state: 'loading' });
    try {
      const res = await birdApi.identify(fd);
      const data = res.data.data;
      setIdentify({ state: 'done', ...data });
      if (data.species && !values.birdSpecies) setValues((v) => ({ ...v, birdSpecies: data.species }));
    } catch (err) {
      setIdentify({ state: 'error', message: getErrorMessage(err) });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.injuryType) next.injuryType = 'Select the type of injury';
    if (!values.severity) next.severity = 'Select how severe it looks';
    if (values.description.trim().length < 10) next.description = 'Please describe the situation (at least 10 characters)';
    if (!values.locationName.trim()) next.locationName = 'Tell us where the bird is';
    if (!/^[+\d][\d\s-]{6,}$/.test(values.contactNumber.trim())) next.contactNumber = 'Enter a valid phone number';
    setErrors(next);
    if (Object.keys(next).length) return toast.error('Please fix the highlighted fields');

    const fd = new FormData();
    const description = values.notes.trim() ? `${values.description.trim()}\n\nAdditional notes: ${values.notes.trim()}` : values.description.trim();
    fd.append('description', description);
    ['birdSpecies', 'injuryType', 'severity', 'locationName', 'contactNumber', 'latitude', 'longitude'].forEach((k) => {
      if (values[k] !== '') fd.append(k, values[k]);
    });
    // Only keep the AI confidence if the reporter kept the detected species.
    if (identify.species && values.birdSpecies === identify.species) fd.append('birdIdentificationConfidence', identify.confidence);
    if (image) fd.append('image', image);

    setSubmitting(true);
    try {
      const res = await rescueApi.create(fd);
      toast.success('Rescue request submitted. A volunteer will be notified.');
      navigate(`/rescues/${res.data.data.rescue._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section section--narrow">
      <h1>Report an injured bird</h1>
      <p className="muted">The more detail you give, the faster a volunteer can help. Keep the bird warm, quiet and away from pets.</p>

      <form onSubmit={submit} noValidate className="stack">
        <Card>
          <h2>1. Photo</h2>
          <div className="field">
            <label htmlFor="image">Bird image (JPG, PNG or WEBP, max 5 MB)</label>
            <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} />
          </div>
          {preview && (
            <div className="preview">
              <img src={preview} alt="Selected bird preview" />
              <div>
                <Button type="button" variant="secondary" loading={identify.state === 'loading'} onClick={runIdentify}>🔍 Identify species from photo</Button>
                {identify.state === 'done' && (
                  <dl className="identify">
                    <dt>Detected species</dt><dd>{identify.species || 'Not identified'}</dd>
                    <dt>Confidence</dt><dd>{percent(identify.confidence)}</dd>
                    <dt>Status</dt><dd><Badge status={identify.species ? 'Completed' : 'Pending'}>{identify.species ? 'Identified' : 'Low confidence'}</Badge></dd>
                  </dl>
                )}
                {identify.state === 'done' && !identify.species && <p className="muted">We couldn’t identify this bird confidently. If you know the species, enter it below, or leave it blank.</p>}
                {identify.demo && <p className="notice notice--warn">Demo mode: this result is simulated, not a real identification.</p>}
                {identify.state === 'error' && <p className="field__error">{identify.message}</p>}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2>2. About the bird</h2>
          <Input label="Bird species (optional)" name="birdSpecies" value={values.birdSpecies} onChange={handleChange} placeholder="e.g. Indian Peafowl" />
          <div className="grid grid--2">
            <Select label="Injury type *" name="injuryType" options={INJURY_TYPES} value={values.injuryType} onChange={handleChange} error={errors.injuryType} />
            <Select label="Severity *" name="severity" options={SEVERITIES} value={values.severity} onChange={handleChange} error={errors.severity} />
          </div>
          <Input textarea rows={4} label="Description *" name="description" value={values.description} onChange={handleChange} error={errors.description} placeholder="What happened? Can the bird move, fly or eat?" />
          <Input textarea rows={2} label="Additional notes (optional)" name="notes" value={values.notes} onChange={handleChange} placeholder="Access instructions, nearby landmarks…" />
        </Card>

        <Card>
          <h2>3. Where is it?</h2>
          <LocationPicker values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} error={errors.locationName} />
          <Input label="Contact number *" name="contactNumber" type="tel" value={values.contactNumber} onChange={handleChange} error={errors.contactNumber} />
        </Card>

        <Button type="submit" loading={submitting} className="btn--block">Submit rescue request</Button>
      </form>
    </div>
  );
}
