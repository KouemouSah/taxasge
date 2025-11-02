/**
 * TaxasGE Authentication API Client
 * Aligns with backend /api/v1/auth endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_API_URL = `${API_BASE_URL}/api/v1/auth`

interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  role: 'citizen' | 'business'
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    role: string
    profile: {
      first_name: string
      last_name: string
      phone?: string
    }
  }
}

interface TwoFactorLoginResponse {
  requires_2fa: boolean
  temp_token: string
  message: string
}

interface TwoFactorVerifyRequest {
  temp_token: string
  code: string
}

interface PasswordResetRequestRequest {
  email: string
}

interface PasswordResetRequestResponse {
  message: string
  email: string
}

interface PasswordResetConfirmRequest {
  token: string
  new_password: string
}

interface PasswordResetConfirmResponse {
  message: string
}

interface EmailVerifyRequest {
  verification_code: string
}

interface EmailVerifyResponse {
  message: string
}

interface UserProfile {
  id: string
  email: string
  role: string
  email_verified: boolean
  two_factor_enabled: boolean
  profile: {
    first_name: string
    last_name: string
    phone?: string
  }
}

interface Session {
  id: string
  user_id: string
  device_info: string
  ip_address: string
  created_at: string
  last_activity: string
  is_current: boolean
}

interface LogoutRequest {
  access_token: string
  refresh_token: string
}

interface LogoutResponse {
  message: string
}

/**
 * Login endpoint - POST /auth/login
 * Returns tokens if no 2FA, or temp_token if 2FA enabled
 */
async function login(data: LoginRequest): Promise<TokenResponse | TwoFactorLoginResponse> {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

/**
 * Verify 2FA code - POST /auth/login/2fa-verify
 * Completes login after 2FA verification
 */
async function verify2FA(data: TwoFactorVerifyRequest): Promise<TokenResponse> {
  const response = await fetch(`${AUTH_API_URL}/login/2fa-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '2FA verification failed')
  }

  return response.json()
}

/**
 * Register endpoint - POST /auth/register
 */
async function register(data: RegisterRequest): Promise<TokenResponse> {
  const response = await fetch(`${AUTH_API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Registration failed')
  }

  return response.json()
}

/**
 * Refresh token endpoint - POST /auth/refresh
 */
async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${AUTH_API_URL}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Token refresh failed')
  }

  return response.json()
}

/**
 * Logout endpoint - POST /auth/logout
 */
async function logout(data: LogoutRequest): Promise<LogoutResponse> {
  const response = await fetch(`${AUTH_API_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Logout failed')
  }

  return response.json()
}

/**
 * Get current user profile - GET /auth/profile
 */
async function getProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${AUTH_API_URL}/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to fetch profile')
  }

  return response.json()
}

/**
 * Request password reset - POST /auth/password/reset/request
 */
async function requestPasswordReset(data: PasswordResetRequestRequest): Promise<PasswordResetRequestResponse> {
  const response = await fetch(`${AUTH_API_URL}/password/reset/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Password reset request failed')
  }

  return response.json()
}

/**
 * Confirm password reset - POST /auth/password/reset/confirm
 */
async function confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<PasswordResetConfirmResponse> {
  const response = await fetch(`${AUTH_API_URL}/password/reset/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Password reset confirmation failed')
  }

  return response.json()
}

/**
 * Verify email - POST /auth/email/verify
 */
async function verifyEmail(data: EmailVerifyRequest, accessToken: string): Promise<EmailVerifyResponse> {
  const response = await fetch(`${AUTH_API_URL}/email/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Email verification failed')
  }

  return response.json()
}

/**
 * Resend email verification - POST /auth/email/resend
 */
async function resendEmailVerification(accessToken: string): Promise<{ message: string; email: string }> {
  const response = await fetch(`${AUTH_API_URL}/email/resend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Resend email verification failed')
  }

  return response.json()
}

/**
 * Get active sessions - GET /auth/sessions
 */
async function getSessions(accessToken: string): Promise<Session[]> {
  const response = await fetch(`${AUTH_API_URL}/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to fetch sessions')
  }

  return response.json()
}

export const authApi = {
  login,
  verify2FA,
  register,
  refreshToken,
  logout,
  getProfile,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendEmailVerification,
  getSessions,
}

export type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  TwoFactorLoginResponse,
  TwoFactorVerifyRequest,
  UserProfile,
  Session,
  LogoutRequest,
  LogoutResponse,
  PasswordResetRequestRequest,
  PasswordResetRequestResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  EmailVerifyRequest,
  EmailVerifyResponse,
}

/**
 * Enable 2FA - POST /auth/2fa/enable
 * Returns QR code and backup codes for setup
 */
async function enable2FA(accessToken: string): Promise<{
  secret: string
  qr_code_svg: string
  backup_codes: string[]
}> {
  const response = await fetch(`${AUTH_API_URL}/2fa/enable`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to enable 2FA')
  }

  return response.json()
}

/**
 * Verify 2FA setup - POST /auth/2fa/verify
 * Confirms 2FA setup with TOTP code
 */
async function verify2FASetup(accessToken: string, data: { secret: string; code: string }): Promise<{
  message: string
  backup_codes: string[]
}> {
  const response = await fetch(`${AUTH_API_URL}/2fa/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to verify 2FA setup')
  }

  return response.json()
}

/**
 * Disable 2FA - POST /auth/2fa/disable
 * Requires password confirmation
 */
async function disable2FA(accessToken: string, password: string): Promise<{ message: string }> {
  const response = await fetch(`${AUTH_API_URL}/2fa/disable`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to disable 2FA')
  }

  return response.json()
}

/**
 * Get 2FA status - GET /auth/2fa/status
 */
async function get2FAStatus(accessToken: string): Promise<{
  two_factor_enabled: boolean
  enabled_at: string | null
}> {
  const response = await fetch(`${AUTH_API_URL}/2fa/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to fetch 2FA status')
  }

  return response.json()
}

// Update exports
export const authApi2FA = {
  enable: enable2FA,
  verifySetup: verify2FASetup,
  disable: disable2FA,
  getStatus: get2FAStatus,
}
