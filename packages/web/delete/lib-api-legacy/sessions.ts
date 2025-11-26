/**
 * Sessions API Client
 * User session management endpoints
 */

import apiClient from './client';
import type { Session, ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

/**
 * Get all active sessions for current user
 * GET /auth/sessions
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const response = await apiClient.get<Session[]>('/auth/sessions');
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Failed to fetch sessions');
    }
    throw new Error('Network error - Unable to fetch sessions');
  }
}

/**
 * Revoke a specific session
 * DELETE /auth/sessions/{session_id}
 */
export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/auth/sessions/${sessionId}`
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Failed to revoke session');
    }
    throw new Error('Network error - Unable to revoke session');
  }
}

export const sessionsApi = {
  getSessions,
  revokeSession,
};
