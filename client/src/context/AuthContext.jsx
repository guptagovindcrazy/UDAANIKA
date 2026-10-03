import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/endpoints';
import { clearToken, getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return undefined;
    authApi.me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const finishAuth = (res) => {
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const value = {
    user,
    loading,
    login: async (credentials) => finishAuth(await authApi.login(credentials)),
    register: async (details) => finishAuth(await authApi.register(details)),
    logout: () => { clearToken(); setUser(null); },
    refresh: async () => { const res = await authApi.me(); setUser(res.data.data.user); },
    updateUser: setUser,
    refreshUser: async () => { const res = await authApi.me(); setUser(res.data.data.user); return res.data.data.user; },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
