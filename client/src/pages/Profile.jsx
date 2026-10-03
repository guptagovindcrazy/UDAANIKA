import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Badge from '../components/Badge';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { assetUrl } from '../utils/format';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { values, setValues, handleChange } = useForm({
    name: user.name, phone: user.phone || '', location: user.location || '', currentPassword: '', newPassword: '',
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Name cannot be empty';
    if (values.newPassword && values.newPassword.length < 8) next.newPassword = 'Use at least 8 characters';
    if (values.newPassword && !values.currentPassword) next.currentPassword = 'Enter your current password';
    setErrors(next);
    if (Object.keys(next).length) return;

    const fd = new FormData();
    ['name', 'phone', 'location'].forEach((k) => fd.append(k, values[k]));
    if (values.newPassword) { fd.append('currentPassword', values.currentPassword); fd.append('newPassword', values.newPassword); }
    if (image) fd.append('profileImage', image);

    setSaving(true);
    try {
      await userApi.updateProfile(fd);
      await refresh();
      setValues((v) => ({ ...v, currentPassword: '', newPassword: '' }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const avatar = assetUrl(user.profileImage);
  return (
    <div className="container section section--narrow">
      <h1>Your profile</h1>
      <Card>
        <div className="row">
          <div className="avatar">{avatar ? <img src={avatar} alt="Your profile" /> : user.name[0]}</div>
          <div><strong>{user.email}</strong><p><Badge status={user.role}>{user.role}</Badge></p></div>
        </div>
        <form onSubmit={submit} noValidate>
          <Input label="Full name" name="name" value={values.name} onChange={handleChange} error={errors.name} />
          <div className="grid grid--2">
            <Input label="Phone" name="phone" type="tel" value={values.phone} onChange={handleChange} />
            <Input label="City" name="location" value={values.location} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="profileImage">Profile photo</label>
            <input id="profileImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </div>
          <h3>Change password</h3>
          <div className="grid grid--2">
            <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={values.currentPassword} onChange={handleChange} error={errors.currentPassword} />
            <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={values.newPassword} onChange={handleChange} error={errors.newPassword} />
          </div>
          <Button type="submit" loading={saving}>Save changes</Button>
        </form>
      </Card>
      {user.role === 'user' && (
        <Card className="banner"><strong>Become a rescue volunteer</strong><p className="muted">Help injured birds in your area.</p><Button to="/volunteer/register" variant="secondary">Register as volunteer</Button></Card>
      )}
    </div>
  );
}
