/**
 * User API Client - TaxasGE Frontend
 *
 * Handles user profile management operations (self-service)
 * Backend: app/modules/users/api/user_routes.py
 */

import axios, { AxiosInstance } from 'axios';
import { AUTHENTICATED_ENDPOINTS } from '@taxasge/shared/constants/endpoints';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for user API
const userClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
userClient.interceptors.request.use(
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
userClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface UserProfile {
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

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  language?: string;
  avatar_url?: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
}

// User API methods
export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await userClient.get<UserProfile>(
      AUTHENTICATED_ENDPOINTS.PROFILE.GET
    );
    return response.data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: UserUpdate): Promise<UserProfile> => {
    const response = await userClient.put<UserProfile>(
      AUTHENTICATED_ENDPOINTS.PROFILE.UPDATE,
      data
    );
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (data: PasswordChange): Promise<{ message: string }> => {
    const response = await userClient.post<{ message: string }>(
      AUTHENTICATED_ENDPOINTS.PROFILE.CHANGE_PASSWORD,
      data
    );
    return response.data;
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await userClient.post<UserProfile>(
      AUTHENTICATED_ENDPOINTS.PROFILE.AVATAR.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete user avatar
   */
  deleteAvatar: async (): Promise<UserProfile> => {
    const response = await userClient.delete<UserProfile>(
      AUTHENTICATED_ENDPOINTS.PROFILE.AVATAR.DELETE
    );
    return response.data;
  },
};

export default userApi;
