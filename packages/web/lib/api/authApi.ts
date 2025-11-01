/**
 * API Client pour l'authentification
 * Backend: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
 */

import axios from 'axios';
import type { LoginInput, RegisterInput } from '../validations/auth';

// URL du backend staging (override .env.local)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1';

const authClient = axios.create({
  baseURL: `${API_URL}/auth`,
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

export const authApi = {
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
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || 'Erreur de connexion');
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },

  /**
   * Inscription utilisateur
   * POST /auth/register
   */
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    try {
      const response = await authClient.post<AuthResponse>('/register', {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: data.role || 'citizen',
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const authError: AuthError = error.response.data;
        throw new Error(authError.detail || "Erreur lors de l'inscription");
      }
      throw new Error('Erreur réseau - Impossible de contacter le serveur');
    }
  },
};
