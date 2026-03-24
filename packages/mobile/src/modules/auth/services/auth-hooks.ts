/**
 * Auth React Query Hooks
 *
 * useMutation wrappers for all auth operations.
 * useQuery wrappers for sessions and 2FA status.
 *
 * These hooks provide:
 * - Loading/error/success states
 * - Automatic cache invalidation
 * - Type-safe API calls
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as authApi from './auth-api';
import type {
  PasswordChangeVerifyRequest,
  TwoFactorSetupVerifyRequest,
} from '@core/config/types';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const AUTH_QUERY_KEYS = {
  sessions: ['auth', 'sessions'] as const,
  twoFactorStatus: ['auth', '2fa-status'] as const,
} as const;

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export function useRequestVerificationCode() {
  return useMutation({
    mutationFn: (email: string) => authApi.requestVerificationCode(email),
  });
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: (email: string) => authApi.passwordResetRequest(email),
  });
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.passwordResetConfirm(token, newPassword),
  });
}

// ---------------------------------------------------------------------------
// Password Change (2-step)
// ---------------------------------------------------------------------------

export function usePasswordChangeRequest() {
  return useMutation({
    mutationFn: (currentPassword: string) =>
      authApi.passwordChangeRequest(currentPassword),
  });
}

export function usePasswordChangeVerify() {
  return useMutation({
    mutationFn: (data: PasswordChangeVerifyRequest) =>
      authApi.passwordChangeVerify(data),
  });
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export function useEmailVerify() {
  return useMutation({
    mutationFn: (code: string) => authApi.emailVerify(code),
  });
}

export function useEmailResend() {
  return useMutation({
    mutationFn: () => authApi.emailResend(),
  });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.sessions,
    queryFn: () => authApi.getSessions(),
    enabled,
    staleTime: 30_000, // 30s — sessions can change frequently
  });
}

// ---------------------------------------------------------------------------
// Two-Factor Authentication
// ---------------------------------------------------------------------------

export function use2FAStatus(enabled = true) {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.twoFactorStatus,
    queryFn: () => authApi.get2FAStatus(),
    enabled,
    staleTime: 60_000, // 1 min
  });
}

export function useEnable2FA() {
  return useMutation({
    mutationFn: () => authApi.enable2FA(),
  });
}

export function useVerify2FASetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TwoFactorSetupVerifyRequest) =>
      authApi.verify2FASetup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.twoFactorStatus });
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => authApi.disable2FA(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.twoFactorStatus });
    },
  });
}
