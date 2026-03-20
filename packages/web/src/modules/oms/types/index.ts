/**
 * OMS Types — Obligations Management System
 * Aligned with backend models: fiscal_services/models/licenses.py
 */

// =============================================================================
// ENUMS
// =============================================================================

export type LicenseStatus = 'open' | 'partial' | 'overdue' | 'complete' | 'cancelled'
export type ObligationStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'overdue' | 'cancelled'

// =============================================================================
// QUEUE TYPES (oms_agent_routes)
// =============================================================================

export interface AgentQueueItem {
  id: string
  license_id: string
  bundle_item_id: string
  fiscal_service_id: number
  ministry_id: number | null
  fee_type: string
  amount: number
  penalty_amount: number
  due_date: string | null
  status: string
  created_at: string
  // Enriched JOINs
  service_name: string | null
  service_code: string | null
  ministry_name: string | null
  company_name: string | null
  fiscal_year: number | null
  zone_code: string | null
  processing_mode: string | null
}

export interface AgentQueueResponse {
  items: AgentQueueItem[]
  total: number
  page: number
  page_size: number
}

export interface AgentQueueStats {
  pending_count: number
  completed_today: number
  total_amount_pending: number
  total_amount_completed_today: number
}

// =============================================================================
// LICENSE TYPES (license_routes)
// =============================================================================

export interface LicenseResponse {
  id: string
  company_id: string
  bundle_id: string | null
  zone_id: string | null
  fiscal_year: number
  total_amount: number
  amount_paid: number
  status: LicenseStatus
  created_at: string
  updated_at: string
  // Enriched
  company_name: string | null
  company_nif: string | null
  zone_code: string | null
  bundle_name: string | null
  obligations_count: number
  paid_count: number
  overdue_count: number
}

export interface LicenseListResponse {
  items: LicenseResponse[]
  total: number
  page: number
  page_size: number
}

export interface LicenseStats {
  total_licenses: number
  active_licenses: number
  overdue_licenses: number
  total_amount: number
  total_paid: number
  total_debt: number
  recovery_rate: number
}

// =============================================================================
// OBLIGATION TYPES
// =============================================================================

export interface ObligationResponse {
  id: string
  license_id: string
  bundle_item_id: string
  fiscal_service_id: number
  ministry_id: number | null
  fee_type: string
  amount: number
  penalty_amount: number
  due_date: string | null
  status: ObligationStatus
  paid_at: string | null
  processed_at: string | null
  processed_by: string | null
  notes: string | null
  created_at: string
  // Enriched
  service_name: string | null
  ministry_name: string | null
}

export interface ObligationListResponse {
  items: ObligationResponse[]
  total: number
  page: number
  page_size: number
}
