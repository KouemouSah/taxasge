/**
 * Wizard Session Types - Cache-First Architecture
 *
 * Matches backend models in:
 *   packages/backend/app/modules/service_requests/models/wizard_session.py
 *
 * Backend responses use snake_case. These types use camelCase for frontend.
 *
 * @since v2.0 - Cache-first wizard migration
 * @see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum WizardSessionStatus {
  ACTIVE = 'active',
  DOCUMENTS_UPLOADED = 'documents_uploaded',
  READY_FOR_PAYMENT = 'ready_for_payment',
  PAYMENT_INITIATED = 'payment_initiated',
  PERSISTED = 'persisted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// ============================================================================
// BACKEND RESPONSE TYPES (snake_case - direct from API)
// ============================================================================

/** Matches WizardSessionResponse in wizard_session.py */
export interface BackendWizardSessionResponse {
  session_id: string
  workflow_code: string
  solicitud_type: string
  sub_type: string | null
  motivo: string | null
  is_minor: boolean

  status: WizardSessionStatus
  current_step: number
  current_step_id: string | null

  documents_count: number
  documents_uploaded: string[]

  form_data: Record<string, unknown>
  extracted_data: Record<string, unknown>

  tariff: TariffBreakdown | null

  created_at: string
  updated_at: string
  expires_at: string
  ttl_seconds: number

  required_documents: BackendRequiredDocument[]
}

export interface BackendRequiredDocument {
  code: string
  name_es: string
  is_required: boolean
  uploaded: boolean
}

/** Matches WizardDocumentPreviewResponse */
export interface BackendDocumentPreviewResponse {
  session_id: string
  document_code: string
  document_name: string | null
  file_name: string
  file_size: number

  extraction: Record<string, unknown>
  confidence: number
  processor: string
  extraction_status: string
  needs_correction: boolean

  risk_analysis: Record<string, unknown> | null
  cross_validation: Record<string, unknown> | null

  expires_at: string
  ttl_seconds: number
}

/** Matches WizardPreparePaymentResponse */
export interface BackendPreparePaymentResponse {
  session_id: string
  ready_for_payment: boolean

  tariff: TariffBreakdown
  total_amount: number
  currency: string

  validation_passed: boolean
  errors: ValidationItem[]
  warnings: ValidationItem[]

  all_documents_uploaded: boolean
  missing_documents: string[]
}

/** Matches WizardPersistResult */
export interface BackendPersistResult {
  success: boolean
  service_request_id: string | null
  reference: string | null
  payment_id: string | null
  error: string | null
  error_code: string | null
}

// ============================================================================
// FRONTEND TYPES (camelCase - used in components)
// ============================================================================

export interface WizardSession {
  sessionId: string
  workflowCode: string
  solicitudType: string
  subType: string | null
  motivo: string | null
  isMinor: boolean

  status: WizardSessionStatus
  currentStep: number
  currentStepId: string | null

  documentsCount: number
  documentsUploaded: string[]

  formData: Record<string, unknown>
  extractedData: Record<string, unknown>

  tariff: TariffBreakdown | null

  createdAt: string
  updatedAt: string
  expiresAt: string
  ttlSeconds: number

  requiredDocuments: RequiredDocument[]
}

export interface RequiredDocument {
  code: string
  nameEs: string
  isRequired: boolean
  uploaded: boolean
}

export interface DocumentPreview {
  sessionId: string
  documentCode: string
  documentName: string | null
  fileName: string
  fileSize: number

  extraction: Record<string, unknown>
  confidence: number
  processor: string
  extractionStatus: string
  needsCorrection: boolean

  riskAnalysis: Record<string, unknown> | null
  crossValidation: Record<string, unknown> | null

  expiresAt: string
  ttlSeconds: number
}

export interface PreparePaymentResult {
  sessionId: string
  readyForPayment: boolean

  tariff: TariffBreakdown
  totalAmount: number
  currency: string

  validationPassed: boolean
  errors: ValidationItem[]
  warnings: ValidationItem[]

  allDocumentsUploaded: boolean
  missingDocuments: string[]
}

export interface PersistResult {
  success: boolean
  serviceRequestId: string | null
  reference: string | null
  paymentId: string | null
  error: string | null
  errorCode: string | null
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface TariffBreakdown {
  base_amount: number
  supplements: TariffSupplement[]
  total_amount: number
  currency: string
  source?: string
}

export interface TariffSupplement {
  code: string
  label_es: string
  amount: number
}

export interface ValidationItem {
  rule_id: string
  message_es: string
  field: string | null
}

// ============================================================================
// REQUEST TYPES (sent to backend)
// ============================================================================

export interface WizardSessionCreateRequest {
  workflow_code: string
  solicitud_type?: string
  sub_type?: string | null
  motivo?: string | null
  is_minor?: boolean
}

export interface DocumentConfirmRequest {
  document_code: string
  confirmed_data: Record<string, unknown>
  user_notes?: string | null
}

export interface FormDataSaveRequest {
  form_data: Record<string, unknown>
  step_id?: string | null
}

// ============================================================================
// TRANSFORM FUNCTIONS (Backend snake_case → Frontend camelCase)
// ============================================================================

export function transformSession(
  backend: BackendWizardSessionResponse
): WizardSession {
  return {
    sessionId: backend.session_id,
    workflowCode: backend.workflow_code,
    solicitudType: backend.solicitud_type,
    subType: backend.sub_type,
    motivo: backend.motivo,
    isMinor: backend.is_minor,
    status: backend.status,
    currentStep: backend.current_step,
    currentStepId: backend.current_step_id,
    documentsCount: backend.documents_count,
    documentsUploaded: backend.documents_uploaded,
    formData: backend.form_data,
    extractedData: backend.extracted_data,
    tariff: backend.tariff,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
    expiresAt: backend.expires_at,
    ttlSeconds: backend.ttl_seconds,
    requiredDocuments: (backend.required_documents || []).map(transformRequiredDocument),
  }
}

function transformRequiredDocument(
  backend: BackendRequiredDocument
): RequiredDocument {
  return {
    code: backend.code,
    nameEs: backend.name_es,
    isRequired: backend.is_required,
    uploaded: backend.uploaded,
  }
}

export function transformDocumentPreview(
  backend: BackendDocumentPreviewResponse
): DocumentPreview {
  return {
    sessionId: backend.session_id,
    documentCode: backend.document_code,
    documentName: backend.document_name,
    fileName: backend.file_name,
    fileSize: backend.file_size,
    extraction: backend.extraction,
    confidence: backend.confidence,
    processor: backend.processor,
    extractionStatus: backend.extraction_status,
    needsCorrection: backend.needs_correction,
    riskAnalysis: backend.risk_analysis,
    crossValidation: backend.cross_validation,
    expiresAt: backend.expires_at,
    ttlSeconds: backend.ttl_seconds,
  }
}

export function transformPreparePayment(
  backend: BackendPreparePaymentResponse
): PreparePaymentResult {
  return {
    sessionId: backend.session_id,
    readyForPayment: backend.ready_for_payment,
    tariff: backend.tariff,
    totalAmount: backend.total_amount,
    currency: backend.currency,
    validationPassed: backend.validation_passed,
    errors: backend.errors,
    warnings: backend.warnings,
    allDocumentsUploaded: backend.all_documents_uploaded,
    missingDocuments: backend.missing_documents,
  }
}

export function transformPersistResult(
  backend: BackendPersistResult
): PersistResult {
  return {
    success: backend.success,
    serviceRequestId: backend.service_request_id,
    reference: backend.reference,
    paymentId: backend.payment_id,
    error: backend.error,
    errorCode: backend.error_code,
  }
}

// ============================================================================
// UI HELPERS
// ============================================================================

export function getSessionStatusColor(status: WizardSessionStatus): string {
  switch (status) {
    case WizardSessionStatus.ACTIVE:
      return 'blue'
    case WizardSessionStatus.DOCUMENTS_UPLOADED:
      return 'cyan'
    case WizardSessionStatus.READY_FOR_PAYMENT:
      return 'green'
    case WizardSessionStatus.PAYMENT_INITIATED:
      return 'orange'
    case WizardSessionStatus.PERSISTED:
      return 'green'
    case WizardSessionStatus.EXPIRED:
      return 'red'
    case WizardSessionStatus.CANCELLED:
      return 'gray'
    default:
      return 'gray'
  }
}
