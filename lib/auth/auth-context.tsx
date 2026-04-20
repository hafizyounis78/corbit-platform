"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/client';
import { API } from '../api/endpoints';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  avatar: string | null;
  online: boolean;
  status: string;
  team: string | null;
  teamId: string | null;
  org: {
    id: string;
    name: string;
    logo: string | null;
    timezone: string;
    currency: string;
    language: string;
  } | null;
  '2fa': boolean;
  lastActive: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      api.get(API.AUTH.ME)
        .then((res) => {
          setUser(res.data.data);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post(API.AUTH.LOGIN, { email, password });
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      if (userData?.mustChangePassword) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/change-password';
        }
      }
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e.response?.data?.message || 'فشل تسجيل الدخول',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post(API.AUTH.LOGOUT);
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...data } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
