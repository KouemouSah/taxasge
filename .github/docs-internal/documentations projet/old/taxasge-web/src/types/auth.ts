// Types pour l'authentification TaxasGE

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  phone?: string
  address?: string
  city?: string
  country: string
  language: 'es' | 'fr' | 'en'
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  preferences: UserPreferences
  profile: UserProfile
}

export type UserRole = 'citizen' | 'business' | 'admin' | 'operator' | 'auditor' | 'support'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

export interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  language: 'es' | 'fr' | 'en'
  theme: 'light' | 'dark' | 'system'
  currency: 'XAF' | 'EUR' | 'USD'
  timezone: string
}

export interface UserProfile {
  // Profil citoyen
  nationalId?: string
  birthDate?: string
  gender?: 'M' | 'F' | 'O'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  occupation?: string
  
  // Profil entreprise (si role = 'business')
  businessName?: string
  businessType?: 'sole_proprietor' | 'corporation' | 'partnership' | 'cooperative' | 'ngo'
  taxId?: string
  registrationNumber?: string
  industry?: string
  employeeCount?: number
  annualRevenue?: number
  website?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  acceptTerms: boolean
  profile?: Partial<UserProfile>
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  preferences?: Partial<UserPreferences>
  profile?: Partial<UserProfile>
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Types pour les sessions et sécurité
export interface Session {
  id: string
  userId: string
  deviceInfo: DeviceInfo
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivity: string
  isActive: boolean
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  location?: string
}

export interface SecurityEvent {
  id: string
  userId: string
  eventType: 'login' | 'logout' | 'password_change' | 'failed_login' | 'suspicious_activity'
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  riskLevel: 'low' | 'medium' | 'high'
}

// Types pour les permissions et rôles
export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'admin'
}

export interface Role {
  id: string
  name: UserRole
  displayName: string
  description: string
  permissions: Permission[]
  isDefault: boolean
}

// Types pour l'audit et logs
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  success: boolean
  errorMessage?: string
}

// Types pour les notifications
export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  readAt?: string
  createdAt: string
  expiresAt?: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  id: string
  label: string
  action: string
  url?: string
  style: 'primary' | 'secondary' | 'destructive'
}

// Types pour l'authentification externe
export interface ExternalAuthProvider {
  id: string
  name: string
  type: 'oauth' | 'saml' | 'ldap'
  enabled: boolean
  config: Record<string, any>
}

export interface ExternalAuthResponse {
  provider: string
  externalId: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  accessToken: string
  refreshToken?: string
}