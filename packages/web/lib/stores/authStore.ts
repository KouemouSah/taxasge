import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'citizen';
  first_name?: string;
  last_name?: string;
}

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, access_token: string, refresh_token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, access_token, refresh_token) =>
        set({
          user,
          access_token,
          refresh_token,
          isAuthenticated: true
        }),

      clearAuth: () =>
        set({
          user: null,
          access_token: null,
          refresh_token: null,
          isAuthenticated: false
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'taxasge-auth-storage',
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user
      }),
    }
  )
);
