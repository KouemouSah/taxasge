/**
 * Auth Provider - Facil Inspeccion
 *
 * Manages authentication state with inspector role verification.
 * After login, verifies the user has inspection permissions.
 * Rejects login if user is not an inspection agent/supervisor.
 */

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { apiGet, apiPost } from '@core/api/client';
import { API_ENDPOINTS } from '@core/api/endpoints';
import {
  clearAllAuthData,
  getAccessToken,
  getRefreshToken,
  getUserProfile,
  setTokens,
  setUserProfile,
} from '@core/auth/auth-storage';
import {
  clearBiometricCredentials,
  saveBiometricToken,
  updateBiometricToken,
} from '@core/security/biometric-login';
import type {
  LogoutRequest,
  LogoutResponse,
  TokenRefreshResponse,
  TokenResponse,
  TwoFactorLoginResponse,
  UserProfile,
} from '@core/config/types';

const INSPECTION_PERMISSIONS = [
  'inspection.create',
  'inspection.view_own',
  'inspection.view_entity',
];

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupervisor: boolean;
  signIn: (email: string, password: string) => Promise<{ requires2fa?: boolean; tempToken?: string }>;
  signInWithBiometric: (refreshToken: string, email: string) => Promise<void>;
  verify2fa: (tempToken: string, code: string) => Promise<void>;
  signOut: (allSessions?: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getUserProfile);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isSupervisor = useMemo(() => {
    if (!user?.permissions) return false;
    return user.permissions.includes('inspection.seal_approve') ||
      user.permissions.includes('inspection.view_entity');
  }, [user?.permissions]);

  // Bootstrap: check stored tokens on mount
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (!cancelled) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const profile = await apiGet<UserProfile>(API_ENDPOINTS.users.profile);

          if (!cancelled) {
            // Verify inspection permissions
            const perms = profile.permissions ?? [];
            const hasInspection = perms.some((p) => INSPECTION_PERMISSIONS.includes(p));
            if (!hasInspection) {
              await clearAllAuthData();
              setUser(null);
            } else {
              setUserProfile(profile);
              setUser(profile);
            }
          }
        } catch {
          // Network timeout or error - use cached profile if available
          if (!cancelled) {
            const cached = getUserProfile();
            if (cached) {
              setUser(cached);
            } else {
              setUser(null);
            }
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiPost<TokenResponse | TwoFactorLoginResponse>(
      API_ENDPOINTS.auth.login,
      { email, password },
    );

    if ('requires_2fa' in response && response.requires_2fa) {
      return { requires2fa: true, tempToken: response.temp_token };
    }

    const tokenResponse = response as TokenResponse;
    const profile = tokenResponse.user;

    // Check inspection permissions
    const perms = profile.permissions ?? [];
    const hasInspection = perms.some((p) => INSPECTION_PERMISSIONS.includes(p));
    if (!hasInspection) {
      throw new Error('Su cuenta no tiene permisos de inspeccion. Contacte al administrador.');
    }

    await setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
    setUserProfile(profile);
    setUser(profile);

    // Save refresh token for biometric login (not password)
    await saveBiometricToken(email, tokenResponse.refresh_token);

    return {};
  }, []);

  const signInWithBiometric = useCallback(async (refreshToken: string, email: string) => {
    // Use stored refresh token to get new access + refresh tokens
    const response = await apiPost<TokenRefreshResponse>(
      API_ENDPOINTS.auth.refresh,
      { refresh_token: refreshToken },
    );

    const newAccessToken = response.access_token;
    const newRefreshToken = response.refresh_token;

    await setTokens(newAccessToken, newRefreshToken);

    // Fetch full profile with permissions
    const profile = response.user ?? await apiGet<UserProfile>(API_ENDPOINTS.users.profile);

    const perms = profile.permissions ?? [];
    const hasInspection = perms.some((p) => INSPECTION_PERMISSIONS.includes(p));
    if (!hasInspection) {
      await clearAllAuthData();
      await clearBiometricCredentials();
      throw new Error('Su cuenta no tiene permisos de inspeccion. Contacte al administrador.');
    }

    setUserProfile(profile);
    setUser(profile);

    // Update biometric stored token with the new refresh token
    await updateBiometricToken(newRefreshToken);
  }, []);

  const verify2fa = useCallback(async (tempToken: string, code: string) => {
    const response = await apiPost<TokenResponse>(
      API_ENDPOINTS.auth.login2faVerify,
      { temp_token: tempToken, code },
    );

    const profile = response.user;
    const perms = profile.permissions ?? [];
    const hasInspection = perms.some((p) => INSPECTION_PERMISSIONS.includes(p));
    if (!hasInspection) {
      throw new Error('Su cuenta no tiene permisos de inspeccion. Contacte al administrador.');
    }

    await setTokens(response.access_token, response.refresh_token);
    setUserProfile(profile);
    setUser(profile);
  }, []);

  const signOut = useCallback(async (allSessions = false) => {
    try {
      const refreshToken = await getRefreshToken();
      const body: LogoutRequest = {
        refresh_token: refreshToken ?? undefined,
        all_sessions: allSessions,
      };
      await apiPost<LogoutResponse>(API_ENDPOINTS.auth.logout, body).catch(() => {});
    } finally {
      await clearBiometricCredentials();
      await clearAllAuthData();
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiGet<UserProfile>(API_ENDPOINTS.users.profile);
      setUserProfile(profile);
      setUser(profile);
    } catch {
      // Silent fail - keep current profile
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated,
    isLoading,
    isSupervisor,
    signIn,
    signInWithBiometric,
    verify2fa,
    signOut,
    refreshProfile,
  }), [user, isAuthenticated, isLoading, isSupervisor, signIn, signInWithBiometric, verify2fa, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
