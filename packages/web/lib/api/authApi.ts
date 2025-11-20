/**
 * API Client pour l'authentification
 * Backend: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
 *
 * Uses shared endpoint constants from @taxasge/shared/constants/endpoints
 */

import axios from 'axios';
import type { LoginInput, RegisterInput } from '../validations/auth';
import { PUBLIC_ENDPOINTS } from '@taxasge/shared/constants/endpoints';

// URL du backend staging (override .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes timeout
});

// Interface réponse backend (basée sur UserResponse from backend/app/models/user.py)
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'operator' | 'auditor' | 'support' | 'citizen' | 'business';
    status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    city?: string;
    language: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
    last_login?: string;
    email_verified?: boolean;
    two_factor_enabled?: boolean;
    is_active: boolean;
  };
}

// Interface erreur backend
export interface AuthError {
  detail: string;
  status_code?: number;
}

// Interface pour la demande de code de vérification
export interface RequestVerificationCodeResponse {
  message: string;
  email: string;
  expires_in: number;
}

export const authApi = {
  /**
   * Demande de code de vérification (Step 1 of 2-step registration)
   * POST /api/v1/auth/request-verification-code
   */
  requestVerificationCode: async (email: string): Promise<RequestVerificationCodeResponse> => {
    try {
      const response = await authClient.post<RequestVerificationCodeResponse>(
        PUBLIC_ENDPOINTS.AUTH.REQUEST_VERIFICATION_CODE,
        { email }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || "Erreur lors de l'envoi du code de vérification");
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Connexion utilisateur
   * POST /api/v1/auth/login
   */
  login: async (data: LoginInput): Promise<AuthResponse> => {
    try {
      const response = await authClient.post<AuthResponse>(PUBLIC_ENDPOINTS.AUTH.LOGIN, {
        email: data.email,
        password: data.password,
        remember_me: data.remember_me || false,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur de connexion');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Inscription utilisateur (Step 2 of 2-step registration)
   * POST /api/v1/auth/register
   *
   * IMPORTANT: Aligned with schema_taxage.sql users table
   * All required fields per specification:
   * - phone: REQUIRED (222/555/551/333 + 6 digits)
   * - password: REQUIRED (min 8, uppercase, lowercase, digit, special char)
   * - role: REQUIRED (default: citizen)
   */
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    try {
      const payload = {
        email: data.email,
        verification_code: data.verification_code,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,  // REQUIRED
        role: data.role || 'citizen',  // REQUIRED (default)
        address: data.address || undefined,  // Optional
        city: data.city || undefined,  // Optional
      };

      const response = await authClient.post<AuthResponse>(PUBLIC_ENDPOINTS.AUTH.REGISTER, payload);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || "Erreur lors de l'inscription");
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Demande de réinitialisation de mot de passe
   * POST /api/v1/auth/forgot-password
   */
  requestPasswordReset: async (data: { email: string }): Promise<{ message: string }> => {
    try {
      const response = await authClient.post<{ message: string }>(
        PUBLIC_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur lors de la demande de réinitialisation');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Réinitialisation du mot de passe
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (data: { token: string; new_password: string }): Promise<{ message: string }> => {
    try {
      const response = await authClient.post<{ message: string }>(
        PUBLIC_ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur lors de la réinitialisation du mot de passe');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (refresh_token: string): Promise<{ access_token: string; token_type: string; expires_in: number }> => {
    try {
      const response = await authClient.post(PUBLIC_ENDPOINTS.AUTH.REFRESH, { refresh_token });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur lors du rafraîchissement du token');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  logout: async (access_token: string, refresh_token: string): Promise<{ message: string }> => {
    try {
      const response = await authClient.post(
        PUBLIC_ENDPOINTS.AUTH.LOGOUT,
        { refresh_token },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur lors de la déconnexion');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },
};
