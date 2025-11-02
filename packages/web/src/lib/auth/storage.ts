/**
 * Token Storage Management
 * Handles JWT tokens and user data in localStorage
 */

import type { AuthData } from '@/types/auth';

const STORAGE_KEY = 'taxasge_auth';

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
 */
export function setAuthData(authData: AuthData): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const authData = getAuthData();
  return authData !== null && authData.access_token !== '';
}

// Legacy exports for backward compatibility
export { clearAuthData as clearAuth };
