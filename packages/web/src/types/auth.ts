/**
 * Authentication Types
 * 100% aligned with TaxasGE Backend Pydantic models
 * Source: packages/backend/app/models/user.py & auth_models.py
 */

// User Role Enum (aligned with user_role_enum from schema_taxage.sql)
export type UserRole = 'citizen' | 'business' | 'accountant' | 'admin' | 'dgi_agent';

// User Status Enum (aligned with backend UserStatus)
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

// User Profile (aligned with backend UserProfile)
export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  language: 'es' | 'fr' | 'en';
  avatar_url?: string;
}

// Citizen Profile (aligned with backend CitizenProfile)
export interface CitizenProfile extends UserProfile {
  national_id?: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  occupation?: string;
}

// Business Profile (aligned with backend BusinessProfile)
export interface BusinessProfile extends UserProfile {
  business_name: string;
  business_type: 'sole_proprietor' | 'corporation' | 'partnership' | 'cooperative' | 'ngo';
  tax_id?: string;
  registration_number?: string;
  industry?: string;
  employee_count?: number;
  annual_revenue?: number;
  website?: string;
}

// Company object (aligned with companies table in DATABASE_SCHEMA_REFERENCE.md)
export interface Company {
  id: string;
  tax_id: string; // NIF ou RC
  legal_name: string;
  trade_name?: string;
  primary_sector_id?: number;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

// User-Company relationship (aligned with user_company_roles table)
export interface UserCompanyRole {
  user_id: string;
  company_id: string;
  role: string;
  is_active?: boolean;
  assigned_at: string;
}

// User object returned from backend (aligned with users table in DATABASE_SCHEMA_REFERENCE.md)
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  first_name: string;
  last_name: string;
  full_name?: string;
  matricule?: string;
  phone_number?: string;
  document_type?: string;
  document_number?: string;
  preferred_language?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  address?: string;
  city?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  two_factor_enabled?: boolean;
  is_active: boolean;

  // For business users, include company information
  company?: Company;
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

// Register Request
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

// Token Response (when 2FA disabled)
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// 2FA Login Response (when 2FA enabled)
export interface TwoFactorLoginResponse {
  requires_2fa: boolean;
  temp_token: string;
  message: string;
}

// 2FA Verify Request
export interface TwoFactorVerifyRequest {
  temp_token: string;
  code: string;
}

// Session (aligned with backend Session)
export interface Session {
  id: string;
  user_id: string;
  device_info: Record<string, string>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

// Password Reset Request
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  email: string;
}

// Password Reset Confirm
export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

// Password Change (for authenticated users)
export interface PasswordChangeRequest {
  current_password: string;
}

export interface PasswordChangeResponse {
  message: string;
  email: string;
}

export interface PasswordChangeVerifyRequest {
  email: string;
  verification_code: string;
  new_password: string;
}

export interface PasswordChangeVerifyResponse {
  message: string;
}

// Email Verification
export interface EmailVerifyRequest {
  verification_code: string;
}

export interface EmailVerifyResponse {
  message: string;
}

export interface EmailResendResponse {
  message: string;
  email: string;
}

// Logout Request
export interface LogoutRequest {
  access_token: string;
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}

// Profile Update
export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  language?: 'es' | 'fr' | 'en';
}

// Auth Data stored in localStorage
export interface AuthData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// API Error Response
export interface ApiError {
  detail: string;
  status_code?: number;
}
