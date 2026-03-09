/**
 * Authentication Cookie Management
 * Manages cookies for middleware route protection
 *
 * SECURITY: `taxasge_auth_token` is now set as HttpOnly by the backend.
 * JS can only read/write the `taxasge_user_role` cookie (non-sensitive).
 * The access token cookie is NOT readable by JavaScript (XSS-safe).
 */

import Cookies from 'js-cookie';

/**
 * Set authentication cookies after successful login.
 * Only sets the role cookie — the auth token is set as HttpOnly by the backend.
 */
export function setAuthCookies(_accessToken: string, userRole: string) {
  // taxasge_auth_token is now set as HttpOnly cookie by the backend (auth_routes.py)
  // JS cannot and should not write it — this prevents XSS token theft

  // Set user role cookie for middleware access control (non-sensitive)
  Cookies.set('taxasge_user_role', userRole, {
    expires: 35 / (24 * 60), // 35 minutes aligned with JWT lifetime
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * Clear authentication cookies on logout.
 * The HttpOnly auth_token cookie is cleared by the backend on logout.
 */
export function clearAuthCookies() {
  // taxasge_auth_token HttpOnly cookie is cleared by backend _clear_refresh_cookie()
  Cookies.remove('taxasge_user_role', { path: '/' });
}

/**
 * Get user role from cookie
 */
export function getUserRoleFromCookie(): string | undefined {
  return Cookies.get('taxasge_user_role');
}

/**
 * Check if user is authenticated based on cookies.
 * Checks the role cookie as a proxy since the auth token is HttpOnly.
 */
export function isAuthenticatedFromCookie(): boolean {
  return !!Cookies.get('taxasge_user_role');
}
