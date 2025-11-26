/**
 * Authentication API Client
 * All auth endpoints aligned with backend /api/v1/auth
 */

import apiClient from './client';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  TwoFactorLoginResponse,
  TwoFactorVerifyRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetConfirm,
  PasswordResetConfirmResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  PasswordChangeVerifyRequest,
  PasswordChangeVerifyResponse,
  EmailVerifyRequest,
  EmailVerifyResponse,
  EmailResendResponse,
  LogoutRequest,
  LogoutResponse,
  ApiError,
} from '@/types/auth';
import { AxiosError } from 'axios';

/**
 * Login user
 * POST /auth/login
 * Returns tokens if 2FA disabled, or temp_token if 2FA enabled
 */
export async function login(
  data: LoginRequest
): Promise<TokenResponse | TwoFactorLoginResponse> {
  try {
    const response = await apiClient.post<TokenResponse | TwoFactorLoginResponse>(
      '/auth/login',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Login failed');
    }
    throw new Error('Network error - Unable to contact server');
  }
}

/**
 * Verify 2FA code and complete login
 * POST /auth/login/2fa-verify
 */
export async function verify2FA(
  data: TwoFactorVerifyRequest
): Promise<TokenResponse> {
  try {
    const response = await apiClient.post<TokenResponse>(
      '/auth/login/2fa-verify',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || '2FA verification failed');
    }
    throw new Error('Network error - Unable to verify 2FA code');
  }
}

/**
 * Register new user
 * POST /auth/register
 */
export async function register(
  data: RegisterRequest
): Promise<TokenResponse> {
  try {
    const response = await apiClient.post<TokenResponse>(
      '/auth/register',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Registration failed');
    }
    throw new Error('Network error - Unable to register');
  }
}

/**
 * Logout user
 * POST /auth/logout
 */
export async function logout(
  data: LogoutRequest
): Promise<LogoutResponse> {
  try {
    const response = await apiClient.post<LogoutResponse>(
      '/auth/logout',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Logout failed');
    }
    throw new Error('Network error - Unable to logout');
  }
}

/**
 * Request password reset
 * POST /auth/password/reset/request
 */
export async function requestPasswordReset(
  data: PasswordResetRequest
): Promise<PasswordResetResponse> {
  try {
    const response = await apiClient.post<PasswordResetResponse>(
      '/auth/password/reset/request',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Password reset request failed');
    }
    throw new Error('Network error - Unable to request password reset');
  }
}

/**
 * Confirm password reset with token
 * POST /auth/password/reset/confirm
 */
export async function confirmPasswordReset(
  data: PasswordResetConfirm
): Promise<PasswordResetConfirmResponse> {
  try {
    const response = await apiClient.post<PasswordResetConfirmResponse>(
      '/auth/password/reset/confirm',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Password reset failed');
    }
    throw new Error('Network error - Unable to reset password');
  }
}

/**
 * Request password change (authenticated user)
 * POST /auth/password/change
 * Sends verification code to email
 */
export async function requestPasswordChange(
  data: PasswordChangeRequest
): Promise<PasswordChangeResponse> {
  try {
    const response = await apiClient.post<PasswordChangeResponse>(
      '/auth/password/change',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Password change request failed');
    }
    throw new Error('Network error - Unable to request password change');
  }
}

/**
 * Verify password change with code and new password
 * POST /auth/password/change/verify
 */
export async function verifyPasswordChange(
  data: PasswordChangeVerifyRequest
): Promise<PasswordChangeVerifyResponse> {
  try {
    const response = await apiClient.post<PasswordChangeVerifyResponse>(
      '/auth/password/change/verify',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Password change verification failed');
    }
    throw new Error('Network error - Unable to verify password change');
  }
}

/**
 * Verify email with code
 * POST /auth/email/verify
 */
export async function verifyEmail(
  data: EmailVerifyRequest
): Promise<EmailVerifyResponse> {
  try {
    const response = await apiClient.post<EmailVerifyResponse>(
      '/auth/email/verify',
      data
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Email verification failed');
    }
    throw new Error('Network error - Unable to verify email');
  }
}

/**
 * Resend email verification code
 * POST /auth/email/resend
 */
export async function resendEmailVerification(): Promise<EmailResendResponse> {
  try {
    const response = await apiClient.post<EmailResendResponse>(
      '/auth/email/resend'
    );
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      const apiError: ApiError = error.response.data;
      throw new Error(apiError.detail || 'Failed to resend verification email');
    }
    throw new Error('Network error - Unable to resend email');
  }
}

// Export all functions as authApi object
export const authApi = {
  login,
  verify2FA,
  register,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  requestPasswordChange,
  verifyPasswordChange,
  verifyEmail,
  resendEmailVerification,
};
