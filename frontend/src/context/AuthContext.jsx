import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me').then(result => setUser(result.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const result = await api('/auth/login', { method: 'POST', body: credentials });
    setUser(result.user);
    return result.user;
  }

  async function register(details) {
    const result = await api('/auth/register', { method: 'POST', body: details });
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }

  async function refreshUser() {
    const result = await api('/auth/me');
    setUser(result.user);
    return result.user;
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
