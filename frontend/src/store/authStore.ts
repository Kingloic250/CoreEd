import { create } from 'zustand';
import { login as apiLogin } from '@/api/authApi';
import { setToken, clearToken, getToken } from '@/utils/tokenManager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  verified: boolean;
}

const USER_STORAGE_KEY = 'auth_user';

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setVerified: () => void;
  clearError: () => void;
}

const storedUser = loadStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  isAuthenticated: !!storedUser && !!getToken(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await apiLogin(credentials);
      setToken(token);
      saveStoredUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({ error: error?.message ?? 'Login failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    saveStoredUser(null);
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => {
    saveStoredUser(user);
    set({ user });
  },

  setVerified: () => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, verified: true };
      saveStoredUser(updated);
      return { user: updated };
    });
  },

  clearError: () => set({ error: null }),
}));
