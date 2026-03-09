/**
 * Token Storage Management — Security Hardened
 *
 * Strategy:
 * - access_token: in-memory variable (NOT localStorage — XSS-safe)
 * - refresh_token: HttpOnly cookie set by backend (browser auto-sends, JS cannot read)
 * - user profile: localStorage (non-sensitive, needed for UI rendering)
 * - middleware auth cookie: HttpOnly taxasge_auth_token set by backend (XSS-safe, readable by Edge middleware)
 *
 * On page refresh: access_token is lost → triggers refresh via HttpOnly cookie → restored
 */

import type { AuthData, MenuConfig, DashboardConfig } from '@/types/auth';
import { APP_CONSTANTS } from '@/core/config/constants';
import { setAuthCookies, clearAuthCookies } from './cookies';
import { broadcastAuthEvent } from './broadcast';

const STORAGE_KEY = APP_CONSTANTS.STORAGE_KEYS.AUTH_DATA;
const MENU_CONFIG_KEY = 'taxasge_menu_config';
const DASHBOARD_CONFIG_KEY = 'taxasge_dashboard_config';

// ============================================================================
// IN-MEMORY TOKEN STORE (XSS-safe — not accessible via localStorage)
// ============================================================================

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

/** Get access token from memory */
export function getAccessToken(): string | null {
  return _accessToken;
}

/** Set access token in memory only */
export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

/** Get refresh token from memory (fallback for legacy code) */
export function getRefreshToken(): string | null {
  return _refreshToken;
}

/** Set refresh token in memory (backend also sets HttpOnly cookie) */
export function setRefreshToken(token: string | null): void {
  _refreshToken = token;
}

// ============================================================================
// AUTH DATA (localStorage stores ONLY user profile, NOT tokens)
// ============================================================================

/**
 * Get authentication data from storage.
 * Reconstructs AuthData from localStorage (user) + memory (tokens).
 */
export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const stored = JSON.parse(data);
    // Reconstruct full AuthData: tokens from memory ONLY (never from localStorage)
    return {
      ...stored,
      access_token: _accessToken || '',
      refresh_token: _refreshToken || '',
    } as AuthData;
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
}

/**
 * Save authentication data.
 * Tokens go to memory; user profile goes to localStorage.
 * Also sets middleware cookies.
 */
export function setAuthData(authData: AuthData): void {
  if (typeof window === 'undefined') return;

  // Tokens → memory only (XSS-safe)
  _accessToken = authData.access_token;
  _refreshToken = authData.refresh_token;

  // User profile → localStorage (non-sensitive, needed for UI)
  // Strip tokens from localStorage copy
  const storageData = {
    ...authData,
    access_token: '', // Don't persist tokens in localStorage
    refresh_token: '', // Backend sets HttpOnly cookie for refresh
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

  // Set middleware cookies (for Next.js middleware route protection)
  if (authData.access_token && authData.user?.role) {
    setAuthCookies(authData.access_token, authData.user.role);
  }

  // Broadcast login event to other tabs
  broadcastAuthEvent('login');
}

/**
 * Clear all authentication data (memory + localStorage + cookies)
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  // Clear in-memory tokens
  _accessToken = null;
  _refreshToken = null;

  // Clear localStorage
  localStorage.removeItem(STORAGE_KEY);

  // Clear middleware cookies
  clearAuthCookies();

  // Broadcast logout event to other tabs
  broadcastAuthEvent('logout');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  // Check in-memory token first, fallback to localStorage (page refresh case)
  if (_accessToken) return true;
  const authData = getAuthData();
  return authData !== null && !!authData.user;
}

/**
 * Update user's 2FA status in storage
 */
export function update2FAStatus(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  const authData = getAuthData();
  if (!authData) return;

  authData.user.two_factor_enabled = enabled;
  setAuthData(authData);
}

// =============================================================================
// MENU CONFIGURATION STORAGE
// =============================================================================

export function getMenuConfig(): MenuConfig | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(MENU_CONFIG_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as MenuConfig;
  } catch (error) {
    console.error('Error parsing menu config:', error);
    return null;
  }
}

export function setMenuConfig(menuConfig: MenuConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MENU_CONFIG_KEY, JSON.stringify(menuConfig));
}

export function clearMenuConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MENU_CONFIG_KEY);
}

// =============================================================================
// DASHBOARD CONFIGURATION STORAGE
// =============================================================================

export function getDashboardConfig(): DashboardConfig | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(DASHBOARD_CONFIG_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as DashboardConfig;
  } catch (error) {
    console.error('Error parsing dashboard config:', error);
    return null;
  }
}

export function setDashboardConfig(dashboardConfig: DashboardConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(dashboardConfig));
}

export function clearDashboardConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DASHBOARD_CONFIG_KEY);
}

// =============================================================================
// COMBINED OPERATIONS
// =============================================================================

export function clearAllAuthData(): void {
  clearAuthData();
  clearMenuConfig();
  clearDashboardConfig();
}

export function updateAgentConfig(
  menuConfig?: MenuConfig | null,
  dashboardConfig?: DashboardConfig | null
): void {
  if (menuConfig) setMenuConfig(menuConfig);
  if (dashboardConfig) setDashboardConfig(dashboardConfig);
}

// Legacy exports for backward compatibility
export { clearAuthData as clearAuth };
