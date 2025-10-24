import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API Base URL - Use environment variable or fallback to backend staging
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'business' | 'admin' | 'dgi_agent';
  verified: boolean;
  company?: string;
  phone?: string;
  avatar?: string;
  preferences: {
    language: 'es' | 'fr' | 'en';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'business';
  phone?: string;
  company?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) throw new Error('Login failed');

          const { user, token } = await response.json();

          // Store token
          localStorage.setItem('auth_token', token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) throw new Error('Registration failed');

          const { user, token } = await response.json();

          localStorage.setItem('auth_token', token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          isAuthenticated: false
        });
      },

      updateProfile: async (data) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error('Update failed');

          const updatedUser = await response.json();

          set({ user: { ...user, ...updatedUser } });
        } catch (error) {
          throw error;
        }
      },

      verifyEmail: async (token) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (!response.ok) throw new Error('Verification failed');

          const { user } = get();
          if (user) {
            set({ user: { ...user, verified: true } });
          }
        } catch (error) {
          throw error;
        }
      },

      resetPassword: async (email) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) throw new Error('Reset failed');
        } catch (error) {
          throw error;
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });

          if (!response.ok) throw new Error('Password update failed');
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
