/**
 * Service Requests Admin Types
 * TypeScript types aligned with backend Pydantic models (admin_routes.py)
 *
 * @module service-requests-admin/types
 * @author Claude Code
 * @date 2025-12-28
 */

// ============================================================================
// ENUMS
// ============================================================================

export type WorkflowType = 'standard' | 'direct_payment' | 'multi_phase'

export type DocumentConditionType =
  | 'always'
  | 'if_solicitud_type'
  | 'if_form_field'
  | 'if_document_exists'

export type TariffType = 'FIXED' | 'PERCENTAGE' | 'NOTA_INGRESO'

export type AppointmentPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface Workflow {
  code: string
  name_es: string
  description_es?: string | null
  category: string
  entity_code: string
  workflow_type: WorkflowType
  requires_agent_validation: boolean
  requires_appointment: boolean
  is_generic: boolean
  appointment_delay_days?: number | null
  appointment_entity_code?: string | null
  sla_hours: number
  max_processing_days?: number | null
  display_order: number
  icon?: string | null
  color?: string | null
  config?: Record<string, unknown> | null
  is_active: boolean
  // Computed fields
  documents_count?: number | null
  tariffs_count?: number | null
}

export interface WorkflowCreate {
  code: string
  name_es: string
  description_es?: string | null
  category: string
  entity_code: string
  workflow_type?: WorkflowType
  requires_agent_validation?: boolean
  requires_appointment?: boolean
  is_generic?: boolean
  appointment_delay_days?: number | null
  appointment_entity_code?: string | null
  sla_hours?: number
  max_processing_days?: number | null
  display_order?: number
  icon?: string | null
  color?: string | null
  config?: Record<string, unknown>
  is_active?: boolean
}

export interface WorkflowUpdate {
  name_es?: string
  description_es?: string | null
  workflow_type?: WorkflowType
  requires_agent_validation?: boolean
  requires_appointment?: boolean
  appointment_delay_days?: number | null
  appointment_entity_code?: string | null
  sla_hours?: number
  max_processing_days?: number | null
  display_order?: number
  icon?: string | null
  color?: string | null
  config?: Record<string, unknown>
  is_active?: boolean
}

export interface WorkflowFilters {
  category?: string
  entity_code?: string
  is_active?: boolean
  is_generic?: boolean
}

// ============================================================================
// DOCUMENT REQUIREMENT TYPES
// ============================================================================

export interface DocumentRequirement {
  id: string
  workflow_code: string
  document_code: string
  document_name_es: string
  document_template_id?: number | null
  condition_type: string
  condition_value?: Record<string, unknown> | null
  is_required: boolean
  display_order: number
  instructions_es?: string | null
  extraction_schema_key?: string | null
  is_active: boolean
}

export interface DocumentRequirementCreate {
  document_code: string
  document_name_es: string
  document_template_id?: number | null
  condition_type?: DocumentConditionType
  condition_value?: Record<string, unknown>
  is_required?: boolean
  display_order?: number
  instructions_es?: string | null
  extraction_schema_key?: string | null
  is_active?: boolean
}

export interface DocumentRequirementUpdate {
  document_name_es?: string
  document_template_id?: number | null
  condition_type?: DocumentConditionType
  condition_value?: Record<string, unknown>
  is_required?: boolean
  display_order?: number
  instructions_es?: string | null
  extraction_schema_key?: string | null
  is_active?: boolean
}

export interface DocumentReorderItem {
  document_code: string
  display_order: number
}

// ============================================================================
// TARIFF TYPES
// ============================================================================

export interface WorkflowTariff {
  id: number
  workflow_code: string
  solicitud_type: string
  tariff_type: string
  amount: number
  percentage_rate?: number | null
  currency: string
  legal_reference?: string | null
  effective_from: string
  effective_to?: string | null
  is_active: boolean
}

export interface WorkflowTariffCreate {
  workflow_code: string
  solicitud_type?: string
  tariff_type?: TariffType
  amount: number
  percentage_rate?: number | null
  currency?: string
  legal_reference?: string | null
  effective_from: string
  effective_to?: string | null
  is_active?: boolean
}

export interface WorkflowTariffUpdate {
  solicitud_type?: string
  tariff_type?: TariffType
  amount?: number
  percentage_rate?: number | null
  currency?: string
  legal_reference?: string | null
  effective_to?: string | null
  is_active?: boolean
}

export interface TariffFilters {
  workflow_code?: string
  is_active?: boolean
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface AppointmentSlotConfig {
  id: string
  entity_code: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  max_appointments_per_slot: number
  location_name?: string | null
  location_address?: string | null
  is_active: boolean
}

export interface AppointmentSlotConfigCreate {
  entity_code: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes?: number
  max_appointments_per_slot?: number
  location_name?: string | null
  location_address?: string | null
  is_active?: boolean
}

export interface AppointmentSlotConfigUpdate {
  start_time?: string
  end_time?: string
  slot_duration_minutes?: number
  max_appointments_per_slot?: number
  location_name?: string | null
  location_address?: string | null
  is_active?: boolean
}

export interface SlotConfigFilters {
  entity_code?: string
  is_active?: boolean
}

export interface AppointmentBlockedDate {
  id: string
  entity_code?: string | null
  blocked_date: string
  reason?: string | null
  is_recurring: boolean
}

export interface AppointmentBlockedDateCreate {
  entity_code?: string | null
  blocked_date: string
  reason?: string | null
  is_recurring?: boolean
}

export interface BlockedDateFilters {
  entity_code?: string
  from_date?: string
  to_date?: string
}

export interface AppointmentDelayRule {
  id: string
  workflow_code?: string | null
  priority: string
  delay_business_days: number
  is_active: boolean
}

export interface AppointmentDelayRuleCreate {
  workflow_code?: string | null
  priority: AppointmentPriority
  delay_business_days?: number
  is_active?: boolean
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface WorkflowsAdminState {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  documents: DocumentRequirement[]
  tariffs: WorkflowTariff[]
  isLoading: boolean
  error: string | null
}

export interface AppointmentsAdminState {
  slotConfigs: AppointmentSlotConfig[]
  blockedDates: AppointmentBlockedDate[]
  delayRules: AppointmentDelayRule[]
  isLoading: boolean
  error: string | null
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

export const WORKFLOW_CATEGORIES = [
  'IDENTIDAD',
  'EXTRANJERIA',
  'VEHICULOS',
  'CONTRATOS',
  'CONDUCCION',
  'FUNCION_PUBLICA',
  'REGISTRO_CIVIL',
  'COMERCIO',
  'OTROS',
] as const

export const WORKFLOW_TYPES: { value: WorkflowType; label: string }[] = [
  { value: 'standard', label: 'Estándar (con validación)' },
  { value: 'direct_payment', label: 'Pago Directo (sin validación)' },
  { value: 'multi_phase', label: 'Multi-fase (Nota de Ingreso)' },
]

export const DOCUMENT_CONDITION_TYPES: { value: DocumentConditionType; label: string }[] = [
  { value: 'always', label: 'Siempre requerido' },
  { value: 'if_solicitud_type', label: 'Según tipo de solicitud' },
  { value: 'if_form_field', label: 'Según campo del formulario' },
  { value: 'if_document_exists', label: 'Si otro documento existe' },
]

export const TARIFF_TYPES: { value: TariffType; label: string }[] = [
  { value: 'FIXED', label: 'Monto Fijo' },
  { value: 'PERCENTAGE', label: 'Porcentaje' },
  { value: 'NOTA_INGRESO', label: 'Nota de Ingreso' },
]

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo',
}

export const PRIORITY_LABELS: Record<AppointmentPriority, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baja',
}
