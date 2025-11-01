/**
 * Module de gestion du stockage des tokens JWT
 * Stockage local (localStorage) pour les tokens d'authentification
 */

const ACCESS_TOKEN_KEY = 'taxasge_access_token';
const REFRESH_TOKEN_KEY = 'taxasge_refresh_token';
const USER_KEY = 'taxasge_user';

export interface StoredUser {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'citizen' | 'business';
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Stocke les tokens d'authentification
 */
export function setTokens(access_token: string, refresh_token: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

/**
 * Récupère le token d'accès
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Récupère le token de rafraîchissement
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Stocke les informations utilisateur
 */
export function setUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Récupère les informations utilisateur
 */
export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;

  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as StoredUser;
  } catch (error) {
    console.error('Erreur parsing user data:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Supprime tous les tokens et données utilisateur (logout)
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Stocke les données complètes d'authentification
 */
export function setAuthData(access_token: string, refresh_token: string, user: StoredUser): void {
  setTokens(access_token, refresh_token);
  setUser(user);
}
