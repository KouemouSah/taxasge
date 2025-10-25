/**
 * Types partagés pour l'API TaxasGE
 * Interfaces communes entre frontend, backend et mobile
 */

// === TYPES DE BASE ===

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// === SERVICES FISCAUX ===

export interface Ministry extends BaseEntity {
  code: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
  is_active: boolean;
}

export interface Sector extends BaseEntity {
  code: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  ministry_id: string;
  ministry?: Ministry;
  is_active: boolean;
}

export interface Category extends BaseEntity {
  code: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  sector_id: string;
  sector?: Sector;
  is_active: boolean;
}

export type ServiceType = 'Certificate' | 'License' | 'Permit' | 'Registration' | 'Declaration' | 'Other';
export type CalculationMethod = 'Fixed' | 'Formula-based' | 'Both';

export interface FiscalService extends BaseEntity {
  code: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  description_es: string;
  description_fr: string;
  description_en: string;
  ministry_id: string;
  sector_id: string;
  category_id: string;
  service_type: ServiceType;
  base_cost: number;
  calculation_method: CalculationMethod;
  processing_time_days: number;
  is_online_available: boolean;
  is_active: boolean;

  // Relations
  ministry?: Ministry;
  sector?: Sector;
  category?: Category;
  required_documents?: RequiredDocument[];
  procedures?: ServiceProcedure[];
  keywords?: ServiceKeyword[];
}

export interface RequiredDocument extends BaseEntity {
  service_id: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
  is_mandatory: boolean;
  document_format?: string;
  template_url?: string;
}

export interface ServiceProcedure extends BaseEntity {
  service_id: string;
  step_number: number;
  title_es: string;
  title_fr: string;
  title_en: string;
  description_es: string;
  description_fr: string;
  description_en: string;
  estimated_duration_hours?: number;
  location?: string;
  required_documents?: string[];
}

export interface ServiceKeyword extends BaseEntity {
  service_id: string;
  keyword_es: string;
  keyword_fr: string;
  keyword_en: string;
  relevance_score: number;
}

// === UTILISATEURS ===

export type UserRole = 'citizen' | 'business' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface User extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  preferred_language: 'es' | 'fr' | 'en';
  last_login?: string;
  profile_picture?: string;
}

export interface UserProfile extends User {
  business_name?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  country: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'Other';
}

// === AUTHENTIFICATION ===

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  preferred_language: 'es' | 'fr' | 'en';
  accept_terms: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

// === RECHERCHE ET FILTRES ===

export interface SearchFilters {
  query?: string;
  ministry_id?: string;
  sector_id?: string;
  category_id?: string;
  service_type?: ServiceType;
  calculation_method?: CalculationMethod;
  max_cost?: number;
  is_online_available?: boolean;
  max_processing_time?: number;
}

export interface SearchResult {
  services: FiscalService[];
  total_count: number;
  search_time_ms: number;
  suggestions?: string[];
  filters_applied: SearchFilters;
}

// === CALCULATEUR ===

export interface CalculationRequest {
  service_id: string;
  calculation_type: 'expedition' | 'renewal';
  custom_parameters?: Record<string, any>;
  user_inputs?: Record<string, any>;
}

export interface CalculationResult {
  service_id: string;
  base_cost: number;
  additional_fees: Record<string, number>;
  total_cost: number;
  currency: string;
  calculation_breakdown: {
    component: string;
    amount: number;
    description: string;
  }[];
  estimated_processing_time: number;
  valid_until: string;
}

// === ANALYTICS ADMIN ===

export interface ServiceUsageStats {
  service_id: string;
  service_name: string;
  total_searches: number;
  total_calculations: number;
  total_procedures_started: number;
  total_procedures_completed: number;
  average_completion_time_days: number;
  revenue_generated: number;
  last_30_days_trend: number; // percentage change
}

export interface PlatformStats {
  total_users: number;
  active_users_last_30_days: number;
  total_services: number;
  total_searches_today: number;
  total_calculations_today: number;
  revenue_current_month: number;
  revenue_last_month: number;
  top_services: ServiceUsageStats[];
  user_growth_rate: number;
  service_completion_rate: number;
}

// === ERREURS ===

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}