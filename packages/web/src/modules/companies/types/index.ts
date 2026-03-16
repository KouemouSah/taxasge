/**
 * Companies Types — ALIGNED WITH DB (Migration 218 Phase 1.3)
 *
 * @module companies/types
 */

// =============================================================================
// ENUMS
// =============================================================================

export type CompanyMemberRole =
  | 'company_owner'
  | 'company_admin'
  | 'company_accountant'
  | 'company_member'

export type RegimenFiscal = 'bundle' | 'declarativo' | 'mixto' | 'exento' | 'pendiente'

// =============================================================================
// COMPANY TYPES
// =============================================================================

export interface CompanyBase {
  // Required
  legal_name: string
  tax_id: string

  // Identity (OCR empresa)
  trade_name?: string | null
  nif?: string | null
  forma_juridica?: string | null
  nacionalidad?: string | null
  capital_social?: number | null
  registration_number?: string | null
  registration_date?: string | null

  // Activity (OCR actividad)
  sector_actividad?: string | null
  subsector_actividad?: string | null
  objeto_social?: string | null

  // Classification (LLM-derived)
  commerce_type?: string | null
  regimen_fiscal?: RegimenFiscal | null

  // Operational (OCR datos_operativos)
  employee_count?: number | null
  establishment_count?: number | null

  // Location
  address?: string | null
  phone?: string | null
  email?: string | null
  zone_id?: string | null
  city_id?: string | null

  // Status
  is_active?: boolean
  is_verified?: boolean
}

export interface CompanyCreate extends CompanyBase {}

export interface CompanyUpdate {
  legal_name?: string
  trade_name?: string | null
  nif?: string | null
  forma_juridica?: string | null
  nacionalidad?: string | null
  capital_social?: number | null
  registration_number?: string | null
  registration_date?: string | null
  sector_actividad?: string | null
  subsector_actividad?: string | null
  objeto_social?: string | null
  commerce_type?: string | null
  regimen_fiscal?: RegimenFiscal | null
  employee_count?: number | null
  establishment_count?: number | null
  address?: string | null
  phone?: string | null
  email?: string | null
  zone_id?: string | null
  city_id?: string | null
  is_active?: boolean
  is_verified?: boolean
}

export interface Company extends CompanyBase {
  id: string
  created_at: string
  updated_at: string

  // Related data (JOINs)
  owner_user_id?: string | null
  member_count?: number
  city_name?: string | null
  zone_code?: string | null
}

export interface PaginatedCompaniesResponse {
  companies: Company[]
  total: number
  page: number
  page_size: number
}

// =============================================================================
// MEMBER TYPES
// =============================================================================

export interface CompanyMember {
  user_id: string
  company_id: string
  role: CompanyMemberRole
  is_active?: boolean
  assigned_at?: string
  user_email?: string | null
  user_name?: string | null
}

export interface AddMemberRequest {
  member_user_id: string
  role: CompanyMemberRole
}

export interface UpdateMemberRoleRequest {
  role: CompanyMemberRole
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

export interface CompanyAdminListResponse {
  items: Company[]
  total: number
  page: number
  page_size: number
}

export interface CompanyStats {
  total: number
  active: number
  verified: number
  inactive: number
  with_licenses: number
  by_regimen: Record<string, number>
}

export interface CompanySearchResult {
  id: string
  legal_name: string
  tax_id: string
  nif?: string | null
  city_name?: string | null
  is_verified: boolean
}
