import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { volunteerApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { AVAILABILITY } from '../utils/constants';

export default function VolunteerRegister() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const { values, handleChange } = useForm({ serviceArea: user.location || '', specialization: '', experience: '', availability: 'available', emergencyContact: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!values.serviceArea.trim()) return setErrors({ serviceArea: 'Tell us where you can help' });
    setErrors({});
    setSubmitting(true);
    try {
      await volunteerApi.create(values);
      await refresh();
      toast.success('You are registered as a volunteer!');
      navigate('/volunteer', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section section--narrow">
      <h1>Become a rescue volunteer</h1>
      <p className="muted">An admin will verify your profile. Then you can accept rescue requests near you.</p>
      <Card>
        <form onSubmit={submit} noValidate>
          <Input label="Service area *" name="serviceArea" value={values.serviceArea} onChange={handleChange} error={errors.serviceArea} placeholder="City or region you can reach" />
          <Input label="Specialization" name="specialization" value={values.specialization} onChange={handleChange} placeholder="Raptors, waterbirds (comma separated)" />
          <Input textarea rows={3} label="Experience" name="experience" value={values.experience} onChange={handleChange} placeholder="Past rescue, veterinary or NGO experience" />
          <div className="grid grid--2">
            <Select label="Availability" name="availability" options={AVAILABILITY} value={values.availability} onChange={handleChange} placeholder="Choose…" />
            <Input label="Emergency contact" name="emergencyContact" type="tel" value={values.emergencyContact} onChange={handleChange} />
          </div>
          <Button type="submit" loading={submitting}>Register as volunteer</Button>
        </form>
      </Card>
    </div>
  );
}
