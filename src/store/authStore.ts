// Zustand store for authentication state and role management.
//
// TOKEN PERSISTENCE NOTE:
// Auth state is intentionally NOT persisted to localStorage or sessionStorage.
// On page refresh, the user must re-authenticate. This is by design for security:
// - No token ever touches persistent browser storage (XSS-safe)
// - In production, a backend-issued HttpOnly refresh token cookie would allow
//   silent re-authentication on page load via POST /api/v1/auth/refresh.
//   The client would call this on mount; on success, the new access token is
//   stored in memory. On failure (expired/invalid), the user is redirected to /login.

import { create } from 'zustand';
import { login as apiLogin } from '@/api/authApi';
import { setToken, clearToken } from '@/utils/tokenManager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await apiLogin(credentials);
      setToken(token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({ error: error?.message ?? 'Login failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),
}));
