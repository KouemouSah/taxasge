/**
 * Authentication Cookie Management
 * Manages cookies for auth tokens used by middleware
 */

import Cookies from 'js-cookie';
import { APP_CONSTANTS as _APP_CONSTANTS } from '@/core/config/constants';

/**
 * Set authentication cookies after successful login
 * These cookies are used by middleware for route protection
 */
export function setAuthCookies(accessToken: string, userRole: string) {
  // Set auth token cookie (httpOnly would be better, but set by backend)
  Cookies.set('taxasge_auth_token', accessToken, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Set user role cookie for middleware access control
  Cookies.set('taxasge_user_role', userRole, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/**
 * Clear authentication cookies on logout
 */
export function clearAuthCookies() {
  Cookies.remove('taxasge_auth_token');
  Cookies.remove('taxasge_user_role');
}

/**
 * Get auth token from cookie
 */
export function getAuthTokenFromCookie(): string | undefined {
  return Cookies.get('taxasge_auth_token');
}

/**
 * Get user role from cookie
 */
export function getUserRoleFromCookie(): string | undefined {
  return Cookies.get('taxasge_user_role');
}

/**
 * Check if user is authenticated based on cookies
 */
export function isAuthenticatedFromCookie(): boolean {
  return !!Cookies.get('taxasge_auth_token');
}
