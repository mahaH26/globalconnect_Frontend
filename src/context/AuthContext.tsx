import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadTokens, saveTokens, setAuthLostHandler } from '@/lib/api';

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  role: 'employee' | 'admin';
  position: string | null;
  attendance_points?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthLostHandler(() => setUser(null));
    (async () => {
      try {
        if (await loadTokens()) setUser(await api<User>('/me'));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => setAuthLostHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/login',
      { method: 'POST', body: { email: email.trim(), password } }
    );
    await saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await saveTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
