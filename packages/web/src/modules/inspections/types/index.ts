export type InspectionStatus =
  | 'in_progress'
  | 'completed'
  | 'mise_en_demeure'
  | 'seal_proposed'
  | 'seal_approved'
  | 'seal_rejected'
  | 'cancelled'

export type InspectionResult = 'conforme' | 'non_conforme' | 'pending'

export type SealReason =
  | 'non_paiement_apres_med'
  | 'activite_non_autorisee'
  | 'fraude_fiscale'
  | 'faux_documents'
  | 'refus_controle'
  | 'non_conformite_grave'
  | 'decision_judiciaire'
  | 'ordre_ministeriel'

export interface Inspection {
  id: string
  agent_id: string
  agent_profile_id: string
  entity_id: string
  entity_location_id: string
  license_id: string
  company_id: string
  inspection_date: string
  status: InspectionStatus
  result?: InspectionResult

  activity_conforme?: boolean
  activity_declared?: string
  activity_observed?: string

  unpaid_obligations_count: number
  unpaid_obligations_amount: number
  total_obligations_count: number

  photos: string[]
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  notes?: string

  mise_en_demeure_issued: boolean
  mise_en_demeure_deadline?: string
  mise_en_demeure_obligations?: string[]

  seal_applied: boolean
  seal_reason?: SealReason
  seal_notes?: string
  seal_photo?: string
  seal_proposed_at?: string
  seal_approved_by?: string
  seal_approved_at?: string
  seal_rejection_reason?: string

  payment_collected: boolean
  payment_id?: string
  payment_receipt_number?: string
  payment_amount?: number

  created_at: string
  updated_at: string

  company_name?: string
  company_nif?: string
  agent_name?: string
  entity_code?: string
}

export interface InspectionListItem {
  id: string
  inspection_date: string
  status: InspectionStatus
  result?: InspectionResult
  company_name?: string
  company_nif?: string
  unpaid_obligations_count: number
  unpaid_obligations_amount: number
  seal_applied: boolean
  mise_en_demeure_issued: boolean
  payment_collected: boolean
  agent_name?: string
  entity_code?: string
  created_at: string
}

export interface InspectionListResponse {
  items: InspectionListItem[]
  total: number
  page: number
  page_size: number
}

export interface InspectionStats {
  total: number
  conforme: number
  non_conforme: number
  mise_en_demeure: number
  seals_proposed: number
  seals_approved: number
  payments_collected: number
  total_collected_amount: number
  avg_duration_minutes?: number
}

export interface PendingSeal {
  id: string
  inspection_date: string
  company_name?: string
  company_nif?: string
  seal_reason?: string
  seal_notes?: string
  seal_photo?: string
  seal_proposed_at?: string
  agent_name?: string
  photos: string[]
  gps_latitude?: number
  gps_longitude?: number
  unpaid_obligations_amount: number
  unpaid_obligations_count: number
}

export interface SupervisorDashboard {
  today: InspectionStats
  week: InspectionStats
  pending_seals: PendingSeal[]
  overdue_med: number
  unreconciled_cash_amount: number
  unreconciled_cash_count: number
  recent_inspections: InspectionListItem[]
}

export interface ReconciliationItem {
  id: string
  inspection_date: string
  company_name?: string
  company_nif?: string
  payment_amount?: number
  payment_receipt_number?: string
  created_at: string
}

export interface ReconciliationResponse {
  items: ReconciliationItem[]
  total_amount: number
  total_count: number
}

export interface LicenseObligation {
  id: string
  fee_type: string
  amount: number
  penalty_amount: number
  due_date?: string
  status: string
  service_name?: string
  ministry_name?: string
}

export interface LicenseVerification {
  license_id: string
  company_id: string
  company_name?: string
  company_nif?: string
  company_registration_number?: string
  forma_juridica?: string
  commerce_type?: string
  zone_code?: string
  city_name?: string
  fiscal_year: number
  license_status: string
  total_amount: number
  amount_paid: number
  compliance_score?: number
  obligations: LicenseObligation[]
  previous_inspections: InspectionListItem[]
  active_mise_en_demeure?: Record<string, unknown>
  seal_history: Record<string, unknown>[]
}
