/**
 * API Exports - TaxasGE Frontend
 *
 * Centralized exports for all API clients
 */

export { authApi, default as auth } from './authApi';
export { userApi, default as user } from './userApi';
export { adminApi, default as admin } from './adminApi';

// Re-export types
export type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  SessionInfo,
  RequestVerificationCodeResponse,
} from './authApi';

export type {
  UserProfile,
  UserUpdate,
  PasswordChange,
} from './userApi';

export type {
  User,
  UserListResponse,
  UserCreate,
  UserStats,
  UserActivity,
  DiagnosticsResponse,
  MigrationResponse,
} from './adminApi';
