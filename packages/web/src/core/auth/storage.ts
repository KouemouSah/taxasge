/**
 * Token Storage Management
 * Handles JWT tokens and user data in localStorage + HTTP cookies
 * Cookies are needed for middleware authentication checks
 */

import type { AuthData, MenuConfig, DashboardConfig } from '@/types/auth';
import { APP_CONSTANTS } from '@/core/config/constants';
import { setAuthCookies, clearAuthCookies } from './cookies';

const STORAGE_KEY = APP_CONSTANTS.STORAGE_KEYS.AUTH_DATA;
const MENU_CONFIG_KEY = 'taxasge_menu_config';
const DASHBOARD_CONFIG_KEY = 'taxasge_dashboard_config';

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

// =============================================================================
// MENU CONFIGURATION STORAGE
// =============================================================================

/**
 * Get menu configuration from storage
 * Used for agent dashboards with dynamic menus
 */
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

/**
 * Save menu configuration to storage
 * Called when agent profile with menu config is loaded
 */
export function setMenuConfig(menuConfig: MenuConfig): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(MENU_CONFIG_KEY, JSON.stringify(menuConfig));
}

/**
 * Clear menu configuration from storage
 */
export function clearMenuConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(MENU_CONFIG_KEY);
}

// =============================================================================
// DASHBOARD CONFIGURATION STORAGE
// =============================================================================

/**
 * Get dashboard configuration from storage
 * Used for agent dashboards with configurable widgets
 */
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

/**
 * Save dashboard configuration to storage
 * Called when agent profile with dashboard config is loaded
 */
export function setDashboardConfig(dashboardConfig: DashboardConfig): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(dashboardConfig));
}

/**
 * Clear dashboard configuration from storage
 */
export function clearDashboardConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(DASHBOARD_CONFIG_KEY);
}

// =============================================================================
// COMBINED OPERATIONS
// =============================================================================

/**
 * Clear all authentication and configuration data
 * Used on logout to fully reset client state
 */
export function clearAllAuthData(): void {
  clearAuthData();
  clearMenuConfig();
  clearDashboardConfig();
}

/**
 * Update agent configuration in storage
 * Called when agent profile API response includes menu/dashboard config
 */
export function updateAgentConfig(
  menuConfig?: MenuConfig | null,
  dashboardConfig?: DashboardConfig | null
): void {
  if (menuConfig) {
    setMenuConfig(menuConfig);
  }
  if (dashboardConfig) {
    setDashboardConfig(dashboardConfig);
  }
}

// Legacy exports for backward compatibility
export { clearAuthData as clearAuth };
