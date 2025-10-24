import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API Base URL - Use localhost for dev, fallback to staging
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  language: 'es' | 'fr' | 'en';
  avatar_url?: string;
  // Citizen-specific
  national_id?: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  occupation?: string;
  // Business-specific
  business_name?: string;
  business_type?: 'sole_proprietor' | 'corporation' | 'partnership' | 'cooperative' | 'ngo';
  tax_id?: string;
  registration_number?: string;
  industry?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'citizen' | 'business' | 'admin' | 'operator' | 'auditor' | 'support';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  profile: UserProfile;
  email_verified: boolean;
  phone_verified: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions
  login: (credentials: { email: string; password: string; remember_me?: boolean }) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshTokens: () => Promise<void>;

  // Profile actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Helper methods
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'citizen' | 'business';
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    country?: string;
    language?: 'es' | 'fr' | 'en';
    // Citizen
    national_id?: string;
    // Business
    business_name?: string;
    tax_id?: string;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            tokens: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_type: data.token_type,
              expires_in: data.expires_in,
            },
            isAuthenticated: true,
            isLoading: false,
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
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            tokens: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_type: data.token_type,
              expires_in: data.expires_in,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async (allDevices = false) => {
        const { tokens } = get();

        try {
          if (tokens?.refresh_token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.access_token}`,
              },
              body: JSON.stringify({
                refresh_token: tokens.refresh_token,
                all_devices: allDevices,
              }),
              credentials: 'include',
            });
          }
        } catch (error) {
          console.error('Logout request failed:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        }
      },

      refreshTokens: async () => {
        const { tokens } = get();

        if (!tokens?.refresh_token) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refresh_token: tokens.refresh_token,
            }),
            credentials: 'include',
          });

          if (!response.ok) {
            // Refresh token invalid or expired - logout user
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
            });
            throw new Error('Session expired. Please login again.');
          }

          const data = await response.json();

          set({
            tokens: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_type: data.token_type,
              expires_in: data.expires_in,
            },
          });
        } catch (error) {
          throw error;
        }
      },

      updateProfile: async (data) => {
        const { user, tokens } = get();
        if (!user || !tokens) throw new Error('Not authenticated');

        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.access_token}`,
            },
            body: JSON.stringify(data),
            credentials: 'include',
          });

          if (!response.ok) {
            // Try to refresh token if 401
            if (response.status === 401) {
              await get().refreshTokens();
              // Retry with new token
              return get().updateProfile(data);
            }
            throw new Error('Update failed');
          }

          const updatedUser = await response.json();

          set({ user: updatedUser });
        } catch (error) {
          throw error;
        }
      },

      getAccessToken: () => {
        const { tokens } = get();
        return tokens?.access_token || null;
      },

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens) return true;

        // Check if token is expired (with 1 minute buffer)
        const expirationTime = new Date().getTime() + (tokens.expires_in - 60) * 1000;
        return Date.now() >= expirationTime;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auto-refresh token interceptor
let refreshPromise: Promise<void> | null = null;

export async function getAuthenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const store = useAuthStore.getState();

  // Check if token needs refresh
  if (store.isTokenExpired() && !refreshPromise) {
    refreshPromise = store.refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }

  // Wait for refresh if in progress
  if (refreshPromise) {
    await refreshPromise;
  }

  const token = store.getAccessToken();

  if (!token) {
    throw new Error('No access token available');
  }

  // Add authorization header
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
