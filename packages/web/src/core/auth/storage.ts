/**
 * Token Storage Management
 * Handles JWT tokens and user data in localStorage + HTTP cookies
 * Cookies are needed for middleware authentication checks
 */

import type { AuthData } from '@/types/auth';
import { APP_CONSTANTS } from '@/core/config/constants';
import { setAuthCookies, clearAuthCookies } from './cookies';

const STORAGE_KEY = APP_CONSTANTS.STORAGE_KEYS.AUTH_DATA;

/**
 * Get authentication data from storage
 */
export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as AuthData;
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
}

/**
 * Save authentication data to storage
 * Also sets HTTP cookies for middleware authentication
 */
export function setAuthData(authData: AuthData): void {
  if (typeof window === 'undefined') return;

  // Store in localStorage for client-side access
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));

  // Also set HTTP cookies for middleware authentication
  // This allows middleware to verify auth before page loads
  if (authData.access_token && authData.user?.role) {
    setAuthCookies(authData.access_token, authData.user.role);
  }
}

/**
 * Clear all authentication data
 * Also clears HTTP cookies
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem(STORAGE_KEY);

  // Also clear HTTP cookies used by middleware
  clearAuthCookies();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const authData = getAuthData();
  return authData !== null && authData.access_token !== '';
}

/**
 * Update user's 2FA status in storage
 * Used after enabling/disabling 2FA to keep localStorage in sync
 */
export function update2FAStatus(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  const authData = getAuthData();
  if (!authData) return;

  // Update user object with new 2FA status
  authData.user.two_factor_enabled = enabled;

  // Save back to localStorage
  setAuthData(authData);
}

// Legacy exports for backward compatibility
export { clearAuthData as clearAuth };
