import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const { values, handleChange } = useForm({ name: '', email: '', phone: '', location: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email';
    if (values.password.length < 8) next.password = 'Use at least 8 characters';
    if (values.confirm !== values.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { confirm, ...payload } = values;
      await register(payload);
      toast.success('Account created. Welcome to Udaanika!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth">
      <Card className="auth__card">
        <h1>Create your account</h1>
        <form onSubmit={submit} noValidate>
          <Input label="Full name" name="name" autoComplete="name" value={values.name} onChange={handleChange} error={errors.name} />
          <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
          <div className="grid grid--2">
            <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={handleChange} />
            <Input label="City (optional)" name="location" value={values.location} onChange={handleChange} />
          </div>
          <Input label="Password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={handleChange} error={errors.password} />
          <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={handleChange} error={errors.confirm} />
          <Button type="submit" loading={submitting} className="btn--block">Sign up</Button>
        </form>
        <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
      </Card>
    </div>
  );
}
