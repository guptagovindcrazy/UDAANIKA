import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { values, handleChange } = useForm({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email';
    if (!values.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const u = await login(values);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth">
      <Card className="auth__card">
        <h1>Welcome back</h1>
        <form onSubmit={submit} noValidate>
          <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
          <Input label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={handleChange} error={errors.password} />
          <Button type="submit" loading={submitting} className="btn--block">Log in</Button>
        </form>
        <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      </Card>
    </div>
  );
}
