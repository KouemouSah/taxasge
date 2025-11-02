/**
 * Profile API Client
 * User profile management endpoints
 */

import apiClient from './client';
import type { User, ProfileUpdateRequest, ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

/**
 * Get current user profile
 * GET /auth/profile
 */
export async function getProfile(): Promise<User> {
  try {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Failed to fetch profile');
    }
    throw new Error('Network error - Unable to fetch profile');
  }
}

/**
 * Update user profile
 * PUT /auth/profile
 */
export async function updateProfile(
  data: ProfileUpdateRequest
): Promise<User> {
  try {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Failed to update profile');
    }
    throw new Error('Network error - Unable to update profile');
  }
}

export const profileApi = {
  getProfile,
  updateProfile,
};
