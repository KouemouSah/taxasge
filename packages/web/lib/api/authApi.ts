import axios from 'axios';
import type { LoginInput, RegisterInput } from '../validations/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const authClient = axios.create({
  baseURL: `${API_URL}/api/v1/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'agent' | 'citizen';
    first_name?: string;
    last_name?: string;
  };
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await authClient.post<AuthResponse>('/login', data);
    return response.data;
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await authClient.post<AuthResponse>('/register', data);
    return response.data;
  },

  logout: async (token: string): Promise<void> => {
    await authClient.post('/logout', null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
