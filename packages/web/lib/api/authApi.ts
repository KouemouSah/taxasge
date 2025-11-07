/**
 * API Client pour l'authentification
 * Backend: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
 */

import axios from 'axios';
import type { LoginInput, RegisterInput } from '../validations/auth';

// URL du backend staging (override .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app';

const authClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes timeout
});

// Interface réponse backend (basée sur TASK-AUTH-FIX-003)
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'agent' | 'citizen' | 'business';
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
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
   * POST /auth/request-verification-code
   */
  requestVerificationCode: async (email: string): Promise<RequestVerificationCodeResponse> => {
    try {
      const response = await authClient.post<RequestVerificationCodeResponse>('/request-verification-code', {
        email,
      });
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
   * POST /auth/login
   */
  login: async (data: LoginInput): Promise<AuthResponse> => {
    try {
      const response = await authClient.post<AuthResponse>('/login', {
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
   * POST /auth/register
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

      const response = await authClient.post<AuthResponse>('/register', payload);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || "Erreur lors de l'inscription");
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },
};
