"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Sentry from "@sentry/nextjs";
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

interface LoginResult {
  success: boolean;
  error?: string;
  /** Set when the user has 2FA enabled — frontend should redirect to /auth/otp. */
  otpRequired?: boolean;
  userId?: string;
  phoneMasked?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Used by /auth/otp page to finalize login after the SMS code is verified. */
  finalizeLoginFromVerify: (data: { token: string; user: User }) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  finalizeLoginFromVerify: () => {},
  logout: async () => {},
  updateUser: () => {},
});

/**
 * Tag every Sentry error with the current user + their org. Without
 * this, the dashboard shows "an error happened in /campaigns" with
 * no way to tell which tenant or operator hit it — diagnosis turns
 * into a guessing game.
 *
 * Strips PII to the minimum useful set: id + email + role + org id +
 * org name. We deliberately don't ship phone, last_active_at, or any
 * other field a Sentry support engineer doesn't need to reproduce
 * the bug.
 *
 * Pass null to clear (logout / failed-token paths) so the next user
 * on the same browser session doesn't inherit the prior identity.
 */
function syncSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org?.id ?? null,
      org_name: user.org?.name ?? null,
    });
  } else {
    Sentry.setUser(null);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mirror auth state into Sentry so every reported error carries
  // user + org tags. Runs on every user change including logout.
  useEffect(() => {
    syncSentryUser(user);
  }, [user]);

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

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await api.post(API.AUTH.LOGIN, { email, password });
      const data = res.data?.data ?? {};

      // SMS OTP gate: backend says credentials are good but user has 2FA on.
      // Don't store anything — the page will route to /auth/otp and the
      // verify step there will hand back a real token.
      if (data.otp_required) {
        return {
          success: false,
          otpRequired: true,
          userId: data.user_id,
          phoneMasked: data.phone_masked,
        };
      }

      const { token: newToken, user: userData } = data;
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

  /**
   * Persist token and user from the OTP verify response, mirroring what
   * login() does on a 2FA-off success. Kept separate so the OTP page
   * can stay decoupled from the login form.
   */
  const finalizeLoginFromVerify = useCallback((data: { token: string; user: User }) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
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
      finalizeLoginFromVerify,
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
