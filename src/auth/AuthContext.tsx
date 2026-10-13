import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api';
import type { User } from '../api';

interface Ctx {
  user: User | null;
  loading: boolean;
  login: (u: User, access: string, refresh: string) => void;
  logout: () => void;
}
const AuthCtx = createContext<Ctx>({ user: null, loading: true, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('vocab_user');
    if (raw && localStorage.getItem('vocab_access')) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (u: User, access: string, refresh: string) => {
    localStorage.setItem('vocab_user', JSON.stringify(u));
    localStorage.setItem('vocab_access', access);
    localStorage.setItem('vocab_refresh', refresh);
    setUser(u);
  };
  const logout = () => {
    authApi.logout();
    localStorage.removeItem('vocab_user');
    localStorage.removeItem('vocab_access');
    localStorage.removeItem('vocab_refresh');
    setUser(null);
    // Demo mode dùng HashRouter → redirect bằng hash để không cần SPA fallback.
    window.location.href = import.meta.env.VITE_DEMO === '1' ? '/#/login' : '/login';
  };
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
