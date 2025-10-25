export interface User {
  id: string
  email: string
  role: 'admin' | 'agent' | 'citizen'
  status?: string
  country?: string
  language?: string
  profile?: UserProfile
  // Compatibility aliases
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  first_name?: string
  last_name?: string
  phone?: string
  country?: string
  language?: 'es' | 'fr' | 'en'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: 'admin' | 'agent' | 'citizen'
  first_name: string
  last_name: string
  phone?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export interface Session {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  created_at: string
  last_activity: string
  is_active: boolean
}
