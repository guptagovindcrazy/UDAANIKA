import axios from 'axios';

const TOKEN_KEY = 'udaanika_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Single place where the API base URL, auth header and error handling live.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message || (error?.code === 'ECONNABORTED' ? 'The request timed out' : null) ||
  (error?.request && !error.response ? 'Cannot reach the server. Is the API running?' : error?.message) || 'Something went wrong';

export default api;
