/**
 * Admin API Client - TaxasGE Frontend
 *
 * Handles admin operations (diagnostics, migrations, user management)
 * Backend: app/modules/admin/api/
 */

import axios, { AxiosInstance } from 'axios';
import { AUTHENTICATED_ENDPOINTS, ADMIN_ENDPOINTS } from '@taxasge/shared/constants/endpoints';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for admin API
const adminClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Longer timeout for admin operations
});

// Request interceptor to add auth token
adminClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    } else if (error.response?.status === 403) {
      // Forbidden - not admin
      console.error('Admin access required');
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  language: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  email_verified?: boolean;
  two_factor_enabled?: boolean;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface UserCreate {
  email: string;
  password: string;
  role: string;
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    city?: string;
    language?: string;
  };
  email_verified?: boolean;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  language?: string;
  status?: string;
  avatar_url?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  users_by_city: Record<string, number>;
}

export interface UserActivity {
  user_id: string;
  action: string;
  resource?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface DiagnosticsResponse {
  success: boolean;
  secrets_status: Record<string, any>;
  smtp_configuration: Record<string, any>;
  message: string;
}

export interface MigrationResponse {
  success: boolean;
  migration: string;
  users_grandfathered: number;
  message: string;
}

// Admin API methods
export const adminApi = {
  // ===== USER MANAGEMENT =====

  /**
   * Get list of users with pagination
   */
  getUsers: async (params?: {
    page?: number;
    page_size?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UserListResponse> => {
    const response = await adminClient.get<UserListResponse>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUser: async (userId: string): Promise<User> => {
    const response = await adminClient.get<User>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.DETAIL(userId)
    );
    return response.data;
  },

  /**
   * Create new user (admin only)
   */
  createUser: async (data: UserCreate): Promise<User> => {
    const response = await adminClient.post<User>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * Update user by ID (admin only)
   */
  updateUser: async (userId: string, data: UserUpdate): Promise<User> => {
    const response = await adminClient.put<User>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.UPDATE(userId),
      data
    );
    return response.data;
  },

  /**
   * Delete user by ID (admin only)
   */
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await adminClient.delete<{ message: string }>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.DELETE(userId)
    );
    return response.data;
  },

  /**
   * Search users
   */
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await adminClient.get<User[]>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.SEARCH,
      { params: { q: query } }
    );
    return response.data;
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role: string): Promise<User[]> => {
    const response = await adminClient.get<User[]>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.BY_ROLE(role)
    );
    return response.data;
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStats> => {
    const response = await adminClient.get<UserStats>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.STATS
    );
    return response.data;
  },

  /**
   * Get user activities
   */
  getUserActivities: async (userId: string): Promise<UserActivity[]> => {
    const response = await adminClient.get<UserActivity[]>(
      AUTHENTICATED_ENDPOINTS.ADMIN_USERS.ACTIVITIES(userId)
    );
    return response.data;
  },

  // ===== DIAGNOSTICS =====

  /**
   * Check secrets configuration (admin only)
   */
  checkSecrets: async (): Promise<DiagnosticsResponse> => {
    const response = await adminClient.get<DiagnosticsResponse>(
      ADMIN_ENDPOINTS.DIAGNOSTICS.SECRETS
    );
    return response.data;
  },

  // ===== MIGRATIONS =====

  /**
   * Run grandfather users migration (admin only)
   */
  runGrandfatherMigration: async (): Promise<MigrationResponse> => {
    const response = await adminClient.post<MigrationResponse>(
      ADMIN_ENDPOINTS.MIGRATIONS.GRANDFATHER_USERS
    );
    return response.data;
  },
};

export default adminApi;
