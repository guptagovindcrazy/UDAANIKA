import api from './api';

export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  updateProfile: (formData) => api.put('/users/profile', formData),
};

export const rescueApi = {
  create: (formData) => api.post('/rescues', formData),
  list: (params) => api.get('/rescues', { params }),
  get: (id) => api.get(`/rescues/${id}`),
  stats: () => api.get('/rescues/stats'),
  assign: (id, volunteerId, note) => api.patch(`/rescues/${id}/assign`, { volunteerId, note }),
  updateStatus: (id, status, note) => api.patch(`/rescues/${id}/status`, { status, note: note || undefined }),
  remove: (id) => api.delete(`/rescues/${id}`),
};

export const volunteerApi = {
  me: () => api.get('/volunteers/me'),
  create: (body) => api.post('/volunteers', body),
  update: (id, body) => api.put(`/volunteers/${id}`, body),
  availability: (id, availability) => api.patch(`/volunteers/${id}/availability`, { availability }),
};

export const birdApi = {
  identify: (formData) => api.post('/birds/identify', formData),
  list: (params) => api.get('/birds', { params }),
};

export const migrationApi = {
  list: (params) => api.get('/migrations', { params }),
  create: (formData) => api.post('/migrations', formData),
  remove: (id) => api.delete(`/migrations/${id}`),
  analytics: () => api.get('/migrations/analytics'),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  volunteers: (params) => api.get('/admin/volunteers', { params }),
  rescues: (params) => api.get('/admin/rescues', { params }),
};

export const statsApi = { public: () => api.get('/stats') };
