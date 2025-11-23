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

// === HOMEPAGE ===

export interface HomepageStats {
  total_services: number;
  total_ministries: number;
  total_categories: number;
  total_sectors: number;
  last_updated: string;
}

export interface CategoryWithServices {
  id: number;
  category_code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  service_count: number;
  ministry_name?: string;
  sector_name?: string;
}

export interface CategoryDirectory {
  total_categories: number;
  total_services: number;
  categories: CategoryWithServices[];
  last_updated: string;
}

// === UTILISATEURS ===

export type UserRole = 'citizen' | 'business' | 'dgi_agent' | 'admin' | 'super_admin';
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

// === DOCUMENTS ===

export type DocumentProcessingMode = 'server_processing' | 'lite_mode' | 'cloud_vision';
export type DocumentOCRStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentValidationStatus = 'pending' | 'validated' | 'rejected';
export type DocumentAccessLevel = 'private' | 'shared' | 'public';

export type DocumentType =
  | 'declaration_iva'
  | 'declaration_retencion'
  | 'declaration_cuota_minima'
  | 'declaration_productos_petroleros'
  | 'declaration_sueldos'
  | 'declaration_otros'
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'legal_document'
  | 'identity_document'
  | 'tax_certificate'
  | 'other';

export interface Document extends BaseEntity {
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  document_type?: DocumentType;
  document_subtype?: string;
  processing_mode: DocumentProcessingMode;
  ocr_status: DocumentOCRStatus;
  extraction_status: DocumentExtractionStatus;
  validation_status: DocumentValidationStatus;
  access_level: DocumentAccessLevel;
  ocr_text?: string;
  extracted_data?: Record<string, any>;
  validation_errors?: string[];
  metadata?: Record<string, any>;
}

export interface OCRResult {
  document_id: string;
  text: string;
  confidence: number;
  language: string;
  processing_time_ms: number;
}

export interface ExtractionResult {
  document_id: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  validation_status: DocumentValidationStatus;
}

// === DECLARATIONS ===

export type DeclarationStatus =
  | 'draft'
  | 'submitted'
  | 'processing'
  | 'accepted'
  | 'rejected'
  | 'amended';

export type DeclarationType =
  // IVA (90% volume)
  | 'iva_destajo'
  | 'iva_real'
  // IRPF (5% volume)
  | 'income_tax'
  | 'corporate_tax'
  // Pétrolifères (4% volume, gros montants)
  | 'retencion_3pct_petrolero'
  | 'retencion_5pct_petrolero'
  | 'retencion_10pct_petrolero'
  | 'petroleo_gas'
  | 'petroleo_diesel'
  | 'petroleo_essence'
  // Retenciones (1% volume)
  | 'retencion_3pct'
  | 'retencion_5pct'
  | 'retencion_10pct'
  // Autres types (<1% volume)
  | 'vat_declaration'
  | 'sales_tax'
  | 'property_tax'
  | 'payroll_tax'
  | 'excise_tax'
  | 'customs_declaration'
  | 'special_tax'
  | 'quarterly_return'
  | 'annual_return'
  | 'amended_return'
  | 'estimated_tax'
  | 'withholding_tax'
  | 'capital_gains'
  | 'inheritance_tax';

export interface Declaration extends BaseEntity {
  user_id: string;
  company_id?: string;
  declaration_type: DeclarationType;
  fiscal_year: number;
  fiscal_period?: string;
  declaration_deadline: string;
  status: DeclarationStatus;
  taxable_base?: number;
  calculated_tax?: number;
  deductions?: number;
  credits?: number;
  net_tax_due?: number;
  declared_data: Record<string, any>;
  supporting_documents?: string[];
  taxpayer_notes?: string;
  processor_notes?: string;
  rejection_reason?: string;
  digital_signature?: string;
  declaration_nature?: string; // 'original', 'rectificative', 'complementaire', 'annulation'
  original_declaration_id?: string;
  submitted_at?: string;
  processed_at?: string;
  processed_by?: string;
}

// === COMPANIES ===

export type CompanyType = 'individual' | 'sme' | 'large_enterprise' | 'public_sector';
export type CompanyStatus = 'active' | 'inactive' | 'suspended';

export interface Company extends BaseEntity {
  name: string;
  tax_id: string;
  company_type: CompanyType;
  status: CompanyStatus;
  registration_date: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  owner_user_id: string;
  employee_count?: number;
  annual_revenue?: number;
}

// === AGENTS DGI ===

export type AgentAvailability =
  | 'available'
  | 'on_leave'
  | 'sick_leave'
  | 'training'
  | 'mission'
  | 'temporarily_unavailable';

export interface Agent extends BaseEntity {
  user_id: string;
  ministry_id: number;
  agent_role: string; // Free text, not enum (e.g., "revisor", "analista", "supervisor")
  can_approve_unlimited: boolean;
  max_approval_amount?: number;
  can_escalate: boolean;
  can_assign_tasks: boolean;
  is_active: boolean;
  is_backup_agent: boolean;
  backup_for_agent_id?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: string[];
  assigned_at: string;
  assigned_by?: string;
}

// === PAYMENTS ===

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'bange_mobile' | 'card' | 'bank_transfer' | 'cash';

export interface Payment extends BaseEntity {
  user_id: string;
  declaration_id?: string;
  service_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  bange_reference?: string;
  receipt_url?: string;
  paid_at?: string;
  metadata?: Record<string, any>;
}

// === PERMISSIONS (RBAC) ===

export interface Permission extends BaseEntity {
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  is_system: boolean;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface UserPermission {
  user_id: string;
  role_id?: string;
  permission_id?: string;
  granted_at: string;
  granted_by: string;
}

// === ASSIGNMENTS ===

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'reassigned'
  | 'cancelled'
  | 'rejected';

export type AssignmentMethod = 'auto' | 'manual' | 'self_assigned' | 'escalated';

export type ReassignmentReason =
  | 'workload_imbalance'
  | 'agent_unavailable'
  | 'specialization_mismatch'
  | 'quality_issue'
  | 'deadline_missed'
  | 'agent_request'
  | 'supervisor_decision'
  | 'complexity_change';

export interface Assignment extends BaseEntity {
  declaration_id: string;
  declaration_type: string;
  agent_id: string;
  assigned_by?: string;
  assignment_method: AssignmentMethod;
  status: AssignmentStatus;
  notes?: string;
  auto_assignment_score?: number;
  score_breakdown?: Record<string, any>;
  rule_applied_id?: string;
  deadline?: string;
  priority_level?: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  processing_duration_hours?: number;
  deadline_met?: boolean;
  reassigned_to?: string;
  reassigned_at?: string;
  reassignment_reason?: ReassignmentReason;
  reassignment_notes?: string;
  validation_status?: string;
  quality_score?: number;
}

// === CHATBOT / AI ===

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  session_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  related_services?: FiscalService[];
  suggestions?: string[];
}

// === COMMUNICATIONS ===

export type CommunicationType = 'email' | 'sms' | 'push_notification';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface Communication extends BaseEntity {
  user_id: string;
  type: CommunicationType;
  subject?: string;
  content: string;
  status: CommunicationStatus;
  sent_at?: string;
  delivered_at?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

// === TRANSLATIONS ===

export type TranslationEntity =
  | 'fiscal_service'
  | 'ministry'
  | 'sector'
  | 'category'
  | 'document_type'
  | 'enum'
  | 'ui'
  | 'form'
  | 'message'
  | 'email_template';

export interface Translation {
  entity_type: TranslationEntity;
  entity_id: string;
  field_name: string;
  language: 'es' | 'fr' | 'en';
  translation: string;
  created_at: string;
  updated_at: string;
}

// === WEBHOOKS ===

export type WebhookEventType =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'declaration.submitted'
  | 'document.processed';

export interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

export interface PaymentWebhook {
  transaction_id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
  timestamp: string;
}