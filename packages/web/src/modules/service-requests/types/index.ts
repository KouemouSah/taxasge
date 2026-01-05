/**
 * Service Requests Module - Type Definitions
 * Matches backend workflow models
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * ServiceRequestStatus - Matches database service_request_status_enum
 * See DATABASE_SCHEMA_REFERENCE.md and migration 020
 */
export enum ServiceRequestStatus {
  // Phase initiale
  DRAFT = 'DRAFT',
  TIMBRES_PENDING = 'TIMBRES_PENDING',
  TIMBRES_PAID = 'TIMBRES_PAID',

  // Phase soumission
  SUBMITTED = 'SUBMITTED',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',

  // Phase validation
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOSSIER_VALIDE = 'DOSSIER_VALIDE',
  REJECTED = 'REJECTED',

  // Phase Nota de Ingreso
  PENDING_NOTA_INGRESO = 'PENDING_NOTA_INGRESO',
  NOTA_UPLOADED = 'NOTA_UPLOADED',

  // Phase paiement principal
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Phase finale
  CITA_SCHEDULED = 'CITA_SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum WorkflowCategory {
  IDENTIDAD = 'IDENTIDAD',
  EXTRANJERIA = 'EXTRANJERIA',
  VEHICULOS = 'VEHICULOS',
  CONTRATOS = 'CONTRATOS',
  CONDUCCION = 'CONDUCCION',
  FUNCION_PUBLICA = 'FUNCION_PUBLICA',
}

export enum StepType {
  IDENTITY_VERIFICATION = 'identity_verification',
  SUB_TYPE_SELECTION = 'sub_type_selection',
  DOCUMENT_UPLOAD = 'document_upload',
  FORM_REVIEW = 'form_review',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation',
  APPOINTMENT = 'appointment',
  CUSTOM = 'custom',
}

export enum DocumentConditionType {
  ALWAYS = 'always',
  IS_NEW = 'is_new',
  IS_RENEWAL = 'is_renewal',
  CUSTOM = 'custom',
}

export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  MANUAL_REVIEW = 'manual_review',
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * WorkflowStep - Configuration d'une étape de workflow
 * Les traductions (fr, en) sont gérées via le module translations
 */
export interface WorkflowStep {
  stepNumber: number
  stepId: string
  stepType: StepType
  titleEs: string
  descriptionEs?: string
  isInherited: boolean
  isOptional?: boolean
  config?: Record<string, unknown>
  documents?: DocumentRequirement[]
}

/**
 * DocumentRequirement - Document requis pour un workflow
 * Matches workflow_document_requirements table schema
 * Les traductions (fr, en) sont gérées via le module translations
 */
export interface DocumentRequirement {
  documentCode: string
  documentNameEs: string  // Seul champ dans la DB, traductions via module translations
  schemaKey?: string      // extraction_schema_key
  isRequired: boolean
  displayOrder: number
  conditionType: DocumentConditionType
  conditionValue?: Record<string, unknown>
  instructionsEs?: string  // Seul champ dans la DB
  acceptedFormats?: string[]
  facesRequired?: string[]
}

export interface WorkflowConfig {
  workflowCode: string
  category: WorkflowCategory
  entityCode: string
  serviceNameEs: string  // Traductions fr/en via module translations
  requiresNotaIngreso: boolean
  requiresAppointment: boolean
  requiresAgentReview: boolean
  allowedSubTypes: string[]
  steps: WorkflowStep[]
  tariffType: 'fixed' | 'rbc' | 'percentage' | 'nota_ingreso'
}

// ============================================================================
// SERVICE REQUEST TYPES
// ============================================================================

export interface ServiceRequest {
  id: string
  requestNumber: string
  userId: string
  workflowCode: string
  subType?: string
  status: ServiceRequestStatus
  currentStep: number
  formData: Record<string, unknown>
  extractedData?: Record<string, unknown>
  validationResults?: ValidationResult[]
  tariffAmount?: number
  paymentId?: string
  appointmentId?: string
  assignedAgentId?: string
  agentNotes?: string
  rejectionReason?: string
  createdAt: string
  updatedAt?: string
  submittedAt?: string
  completedAt?: string
  // Populated fields
  userName?: string
  userEmail?: string
  agentName?: string
  documentCount?: number
}

export interface ServiceRequestDocument {
  id: string
  requestId: string
  documentCode: string
  documentNameEs: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  extractionStatus: ExtractionStatus
  extractedData?: Record<string, unknown>
  extractionConfidence?: number
  validationErrors?: string[]
  uploadedAt: string
  processedAt?: string
}

export interface ValidationResult {
  ruleId: string
  isValid: boolean
  severity: 'error' | 'warning' | 'info'
  messageEs: string  // Traductions fr/en via module translations
  field?: string
  documentCode?: string  // The document being validated (if applicable)
}

export interface TariffCalculation {
  baseAmount: number
  additionalFees: TariffFee[]
  totalAmount: number
  currency: string
  breakdown: string
}

export interface TariffFee {
  code: string
  nameEs: string
  amount: number
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ServiceRequestCreate {
  workflowCode: string
  subType?: string
  formData?: Record<string, unknown>
}

export interface ServiceRequestUpdate {
  formData?: Record<string, unknown>
  currentStep?: number
}

export interface DocumentUploadResponse {
  document: ServiceRequestDocument
  extractedData?: Record<string, unknown>
  validationErrors?: string[]
}

export interface ServiceRequestListResponse {
  requests: ServiceRequest[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface WorkflowStartResponse {
  request: ServiceRequest
  workflow: WorkflowConfig
  currentStepConfig: WorkflowStep | null
}

export interface StepSubmitRequest {
  stepId: string
  data: Record<string, unknown>
}

export interface StepSubmitResponse {
  request: ServiceRequest
  nextStep?: WorkflowStep
  validationResults?: ValidationResult[]
  isComplete: boolean
}

// ============================================================================
// FILTER & PAGINATION TYPES
// ============================================================================

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus | string
  workflowCode?: string
  category?: WorkflowCategory
  search?: string
  dateFrom?: string
  dateTo?: string
  assignedAgentId?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface WizardState {
  request: ServiceRequest | null
  workflow: WorkflowConfig | null
  currentStep: WorkflowStep | null
  documents: ServiceRequestDocument[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  validationErrors: ValidationResult[]
}

export interface ServiceRequestsState {
  requests: ServiceRequest[]
  currentRequest: ServiceRequest | null
  documents: ServiceRequestDocument[]
  isLoading: boolean
  error: string | null
  filters: ServiceRequestFilters
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}


// ============================================================================
// DOCUMENT PREVIEW/VALIDATE TYPES (TWO-STEP FLOW)
// ============================================================================

/**
 * FieldIndicator - Per-field confidence indicator for UI
 */
export interface FieldIndicator {
  fieldName: string
  value?: unknown
  confidence: number // 0.0 - 1.0
  status: 'ok' | 'warning' | 'error' | 'missing'
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  riskMessage?: string
  requiresAttention: boolean
  suggestion?: string
}

/**
 * IdentityMismatch - Represents a mismatch in identity data between documents
 * Used for blocking when documents belong to different people
 */
export interface IdentityMismatchData {
  field_name: string
  field_label: {
    es: string
    fr: string
    en: string
  }
  is_blocking: boolean
  source_document: {
    code: string
    value: string
  }
  compared_document: {
    code: string
    value: string
  }
  risk_code: string
  severity: string
}

/**
 * RiskAnalysisResult - Complete risk analysis from Gemini
 */
export interface RiskAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number // 0-100
  riskFactors: Array<{
    type: string
    severity: string
    description: string
  }>
  recommendations: string[]
  requiresRejection: boolean
  requiresReview: boolean
  factorsCount: Record<string, number>
  // New: Identity mismatch data for blocking
  identityMismatches?: IdentityMismatchData[]
  hasBlockingMismatches?: boolean
}

/**
 * DocumentExtractionPreview - Response from preview endpoint
 * Document is NOT saved yet - user must validate first
 */
export interface DocumentExtractionPreview {
  previewId: string
  documentCode: string
  documentName: string
  fileName: string
  fileSize: number
  mimeType: string
  extraction: Record<string, unknown>
  confidence: number // 0.0 - 1.0
  processor: 'gemini' | 'tesseract' | 'hybrid'
  fieldIndicators: FieldIndicator[]
  riskAnalysis?: RiskAnalysisResult
  extractionStatus: 'success' | 'pending_validation' | 'low_confidence' | 'requires_review' | 'rejected'
  needsCorrection: boolean
  detectedDocumentType?: string
  documentTypeMatch: boolean
  expectedFields: Array<{
    key: string
    label: string
    type: string
    required: boolean
  }>
  expiresAt: string // ISO date - preview is temporary (30 min)
  processingTimeMs?: number
}

/**
 * DocumentValidationRequest - User confirms or corrects extracted data
 */
export interface DocumentValidationRequest {
  previewId: string
  confirmedData: Record<string, unknown>
  userNotes?: string
}

/**
 * DocumentValidationResponse - Response after validation and upload
 */
export interface DocumentValidationResponse {
  documentId: string
  documentCode: string
  documentName: string
  filePath: string // Firebase Storage path
  extractionData: Record<string, unknown>
  extractionConfidence: number
  isValidated: boolean
  validatedAt: string
}

// ============================================================================
// FORM DATA AND CITIZEN SUMMARY TYPES
// ============================================================================

/**
 * FormDataResponse - Pre-filled form data from document extraction
 */
export interface FormDataResponse {
  formData: Record<string, unknown>
  extractedData: Record<string, unknown>
  formSchema?: Record<string, unknown>
  requiresReview: boolean
  completionPercentage: number // 0-100
  missingFields: string[]
}

/**
 * CitizenSummaryResponse - Summary for citizen confirmation ("formulaire récapitulatif")
 */
export interface CitizenSummaryResponse {
  requestId: string
  reference: string
  workflowCode: string
  workflowNameEs: string
  solicitudType: string
  subType?: string
  personalData: Record<string, unknown>
  documentsUploaded: Array<{
    documentCode: string
    documentName: string
    fileName: string
    extractionConfidence: number
    isValidated: boolean
  }>
  documentsComplete: boolean
  tariffSummary?: {
    baseAmount: number
    supplements: Array<{ name: string; amount: number }>
    total: number
    currency: string
  }
  validationPassed: boolean
  validationWarnings: string[]
  canSubmit: boolean
  blockers: string[]
}

// ============================================================================
// STEP EXECUTION TYPES
// ============================================================================

/**
 * StepInfo - Basic step information
 */
export interface StepInfo {
  number: number
  id: string
  type: string
  titleEs: string
}

/**
 * StepExecutionResponse - Response from executing a workflow step
 */
export interface StepExecutionResponse {
  stepNumber: number
  stepId: string
  stepType: string
  success: boolean
  // Step-specific results
  options?: string[]
  selection?: string
  documentsRequired?: Array<Record<string, unknown>>
  missingDocuments?: Array<Record<string, unknown>>
  formData?: Record<string, unknown>
  extractedData?: Record<string, unknown>
  requiresReview?: boolean
  validationComplete?: boolean
  hasErrors?: boolean
  errors?: Array<Record<string, unknown>>
  warnings?: Array<Record<string, unknown>>
  amount?: number
  tariffBreakdown?: Record<string, unknown>
  paymentMethods?: string[]
  // Navigation
  nextStep?: StepInfo
  error?: string
}

// HELPER FUNCTIONS
// ============================================================================

export function getStatusColor(status: ServiceRequestStatus | string): string {
  const colors: Record<string, string> = {
    // Phase initiale
    [ServiceRequestStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [ServiceRequestStatus.TIMBRES_PENDING]: 'bg-yellow-100 text-yellow-800',
    [ServiceRequestStatus.TIMBRES_PAID]: 'bg-blue-100 text-blue-800',
    // Phase soumission
    [ServiceRequestStatus.SUBMITTED]: 'bg-cyan-100 text-cyan-800',
    [ServiceRequestStatus.DOCUMENTS_REQUIRED]: 'bg-orange-100 text-orange-800',
    // Phase validation
    [ServiceRequestStatus.UNDER_REVIEW]: 'bg-teal-100 text-teal-800',
    [ServiceRequestStatus.DOSSIER_VALIDE]: 'bg-indigo-100 text-indigo-800',
    [ServiceRequestStatus.REJECTED]: 'bg-red-100 text-red-800',
    // Phase Nota de Ingreso
    [ServiceRequestStatus.PENDING_NOTA_INGRESO]: 'bg-purple-100 text-purple-800',
    [ServiceRequestStatus.NOTA_UPLOADED]: 'bg-violet-100 text-violet-800',
    // Phase paiement
    [ServiceRequestStatus.PAYMENT_PENDING]: 'bg-amber-100 text-amber-800',
    [ServiceRequestStatus.PAYMENT_PROCESSING]: 'bg-yellow-100 text-yellow-800',
    [ServiceRequestStatus.PAID]: 'bg-emerald-100 text-emerald-800',
    [ServiceRequestStatus.PAYMENT_FAILED]: 'bg-red-100 text-red-800',
    // Phase finale
    [ServiceRequestStatus.CITA_SCHEDULED]: 'bg-sky-100 text-sky-800',
    [ServiceRequestStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [ServiceRequestStatus.COMPLETED]: 'bg-green-200 text-green-900',
    [ServiceRequestStatus.CANCELLED]: 'bg-gray-200 text-gray-600',
    [ServiceRequestStatus.EXPIRED]: 'bg-gray-300 text-gray-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: ServiceRequestStatus | string, locale: 'es' | 'fr' | 'en' = 'es'): string {
  const labels: Record<string, Record<string, string>> = {
    // Phase initiale
    [ServiceRequestStatus.DRAFT]: { es: 'Borrador', fr: 'Brouillon', en: 'Draft' },
    [ServiceRequestStatus.TIMBRES_PENDING]: { es: 'Timbres Pendientes', fr: 'Timbres en attente', en: 'Stamps Pending' },
    [ServiceRequestStatus.TIMBRES_PAID]: { es: 'Timbres Pagados', fr: 'Timbres payés', en: 'Stamps Paid' },
    // Phase soumission
    [ServiceRequestStatus.SUBMITTED]: { es: 'Enviada', fr: 'Soumise', en: 'Submitted' },
    [ServiceRequestStatus.DOCUMENTS_REQUIRED]: { es: 'Documentos Requeridos', fr: 'Documents requis', en: 'Documents Required' },
    // Phase validation
    [ServiceRequestStatus.UNDER_REVIEW]: { es: 'En Revisión', fr: 'En révision', en: 'Under Review' },
    [ServiceRequestStatus.DOSSIER_VALIDE]: { es: 'Dossier Validado', fr: 'Dossier validé', en: 'Dossier Validated' },
    [ServiceRequestStatus.REJECTED]: { es: 'Rechazada', fr: 'Rejetée', en: 'Rejected' },
    // Phase Nota de Ingreso
    [ServiceRequestStatus.PENDING_NOTA_INGRESO]: { es: 'Nota de Ingreso Pendiente', fr: 'Note d\'entrée en attente', en: 'Entry Note Pending' },
    [ServiceRequestStatus.NOTA_UPLOADED]: { es: 'Nota Cargada', fr: 'Note téléchargée', en: 'Note Uploaded' },
    // Phase paiement
    [ServiceRequestStatus.PAYMENT_PENDING]: { es: 'Pago Pendiente', fr: 'Paiement en attente', en: 'Payment Pending' },
    [ServiceRequestStatus.PAYMENT_PROCESSING]: { es: 'Procesando Pago', fr: 'Traitement du paiement', en: 'Payment Processing' },
    [ServiceRequestStatus.PAID]: { es: 'Pagada', fr: 'Payée', en: 'Paid' },
    [ServiceRequestStatus.PAYMENT_FAILED]: { es: 'Pago Fallido', fr: 'Paiement échoué', en: 'Payment Failed' },
    // Phase finale
    [ServiceRequestStatus.CITA_SCHEDULED]: { es: 'Cita Programada', fr: 'Rendez-vous programmé', en: 'Appointment Scheduled' },
    [ServiceRequestStatus.IN_PROGRESS]: { es: 'En Proceso', fr: 'En cours', en: 'In Progress' },
    [ServiceRequestStatus.COMPLETED]: { es: 'Completada', fr: 'Terminée', en: 'Completed' },
    [ServiceRequestStatus.CANCELLED]: { es: 'Cancelada', fr: 'Annulée', en: 'Cancelled' },
    [ServiceRequestStatus.EXPIRED]: { es: 'Expirada', fr: 'Expirée', en: 'Expired' },
  }
  return labels[status]?.[locale] || status
}

export function isRequestEditable(request: ServiceRequest): boolean {
  const editableStatuses = [
    ServiceRequestStatus.DRAFT,
    ServiceRequestStatus.TIMBRES_PENDING,
    ServiceRequestStatus.DOCUMENTS_REQUIRED,
  ]
  return editableStatuses.includes(request.status as ServiceRequestStatus)
}

export function canUploadDocuments(request: ServiceRequest): boolean {
  const uploadStatuses = [
    ServiceRequestStatus.DRAFT,
    ServiceRequestStatus.TIMBRES_PAID,
    ServiceRequestStatus.DOCUMENTS_REQUIRED,
    ServiceRequestStatus.SUBMITTED,
  ]
  return uploadStatuses.includes(request.status as ServiceRequestStatus)
}

export function getStepTypeIcon(stepType: StepType): string {
  const icons: Record<StepType, string> = {
    [StepType.IDENTITY_VERIFICATION]: 'user-check',
    [StepType.SUB_TYPE_SELECTION]: 'list',
    [StepType.DOCUMENT_UPLOAD]: 'upload',
    [StepType.FORM_REVIEW]: 'file-text',
    [StepType.PAYMENT]: 'credit-card',
    [StepType.CONFIRMATION]: 'check-circle',
    [StepType.APPOINTMENT]: 'calendar',
    [StepType.CUSTOM]: 'settings',
  }
  return icons[stepType] || 'circle'
}

// ============================================================================
// APPOINTMENT TYPES (Citizen-First Flow)
// ============================================================================

/**
 * EntityLocation - Physical location for appointments
 * NOTE: Data comes from appointment_slot_configs table (DISTINCT ON city, location_name)
 * The entity_locations table was planned but NOT created. Fields like phone/email are always null.
 */
export interface EntityLocation {
  id: string
  entityCode: string
  locationCode: string
  locationName: string
  city: string
  province?: string
  region?: string
  address?: string
  phone?: string
  email?: string
  isMainOffice: boolean
}

/**
 * AvailableSlot - Available appointment slot for selection
 */
export interface AvailableSlot {
  slotDate: string // ISO date string
  slotTime: string // HH:mm:ss format
  locationName: string
  locationAddress?: string
  slotsRemaining: number
  city?: string // Malabo or Bata (from appointment_slot_configs.city)
}

/**
 * HoldSlotRequest - Request to hold an appointment slot before payment
 */
export interface HoldSlotRequest {
  locationId?: string
  locationName: string
  locationAddress?: string
  appointmentDate: string // ISO date string
  appointmentTime: string // HH:mm:ss format
}

/**
 * HoldSlotResponse - Response after holding a slot
 */
export interface HoldSlotResponse {
  success: boolean
  holdId?: string
  locationName?: string
  city?: string // Malabo or Bata (from appointment_holds.city)
  appointmentDate?: string
  appointmentTime?: string
  expiresAt?: string // ISO datetime
  expiresInSeconds: number
  error?: string
}

/**
 * AppointmentHoldStatus - Current status of an appointment hold
 */
export interface AppointmentHoldStatus {
  hasHold: boolean
  status?: 'held' | 'confirmed' | 'expired' | 'released' | 'fallback'
  locationName?: string
  city?: string // Malabo or Bata (from appointment_holds.city)
  appointmentDate?: string
  appointmentTime?: string
  expiresAt?: string
  isExpired: boolean
}

/**
 * AppointmentLocationsResponse - List of locations for an entity
 */
export interface AppointmentLocationsResponse {
  entityCode: string
  locations: EntityLocation[]
  count: number
}

/**
 * AppointmentSlotsResponse - List of available slots for a location
 */
export interface AppointmentSlotsResponse {
  entityCode: string
  locationName: string
  fromDate: string
  slots: AvailableSlot[]
  count: number
  hasAvailability: boolean
}

/**
 * SubmitWithoutAppointmentRequest - Fallback when no slots available
 */
export interface SubmitWithoutAppointmentRequest {
  preferredLocation: string
}

/**
 * SubmitWithoutAppointmentResponse - Response for fallback submission
 */
export interface SubmitWithoutAppointmentResponse {
  success: boolean
  locationName?: string
  message: string
  error?: string
}

/**
 * ConfirmHoldResponse - Response after confirming hold (payment webhook)
 */
export interface ConfirmHoldResponse {
  success: boolean
  appointmentDate?: string
  appointmentTime?: string
  locationName?: string
  city?: string // Malabo or Bata (from confirm_appointment_hold function)
  error?: string
}

// ============================================================================
// PASSPORT WORKFLOW CONSTANTS
// Shared between wizard/page.tsx and [id]/page.tsx
// ============================================================================

/**
 * SolicitudType - Type de demande de passeport
 */
export type PassportSolicitudType = 'EXPEDICION' | 'RENOVACION'

/**
 * RenovacionMotivo - Motif de renouvellement
 */
export type PassportRenovacionMotivo = 'VENCIMIENTO' | 'PERDIDA' | 'ROBO' | 'DETERIORO'

/**
 * PassportWizardStep - Step definition for passport workflow
 */
export interface PassportWizardStep {
  id: string
  number: number
  titleKey: string
  labelEs: string
  labelFr: string
  labelEn: string
  isConditional?: boolean // true if step depends on previous selection
}

/**
 * PASSPORT_WIZARD_STEPS - Step definitions for PASAPORTE workflow
 * Used in wizard/page.tsx and [id]/page.tsx for consistent step display
 */
export const PASSPORT_WIZARD_STEPS: PassportWizardStep[] = [
  { id: 'is_minor', number: 0, titleKey: 'wizard.step_minor', labelEs: 'Solicitante', labelFr: 'Demandeur', labelEn: 'Applicant' },
  { id: 'select_type', number: 1, titleKey: 'wizard.step_type', labelEs: 'Tipo', labelFr: 'Type', labelEn: 'Type' },
  { id: 'select_motivo', number: 1.5, titleKey: 'wizard.step_motivo', labelEs: 'Motivo', labelFr: 'Motif', labelEn: 'Reason', isConditional: true },
  { id: 'upload_documents', number: 2, titleKey: 'wizard.step_documents', labelEs: 'Documentos', labelFr: 'Documents', labelEn: 'Documents' },
  { id: 'form_review_1', number: 3, titleKey: 'wizard.step_form_1', labelEs: 'Datos 1', labelFr: 'Données 1', labelEn: 'Data 1' },
  { id: 'form_review_2', number: 4, titleKey: 'wizard.step_form_2', labelEs: 'Datos 2', labelFr: 'Données 2', labelEn: 'Data 2' },
  { id: 'validation', number: 5, titleKey: 'wizard.step_validation', labelEs: 'Validación', labelFr: 'Validation', labelEn: 'Validation' },
  { id: 'payment', number: 6, titleKey: 'wizard.step_payment', labelEs: 'Pago', labelFr: 'Paiement', labelEn: 'Payment' },
  { id: 'appointment', number: 7, titleKey: 'wizard.step_appointment', labelEs: 'Cita', labelFr: 'RDV', labelEn: 'Appt' },
  { id: 'confirmation', number: 8, titleKey: 'wizard.step_confirmation', labelEs: 'Confirmación', labelFr: 'Confirmation', labelEn: 'Confirmation' },
]

/**
 * PASSPORT_TARIFFS - Tariff amounts for passport services
 */
export const PASSPORT_TARIFFS: Record<string, number> = {
  EXPEDICION: 7500,
  VENCIMIENTO: 5000,
  PERDIDA: 10000,
  ROBO: 10000,
  DETERIORO: 7500,
}

/**
 * getPassportStepIndex - Get current step index based on form data and status
 */
export function getPassportStepIndex(
  status: string,
  formData?: Record<string, unknown>
): number {
  // If not in draft, map status to step
  if (status !== 'DRAFT' && status !== 'DOCUMENTS_REQUIRED') {
    const statusToStep: Record<string, number> = {
      'SUBMITTED': 6,
      'UNDER_REVIEW': 6,
      'DOSSIER_VALIDE': 6,
      'PAYMENT_PENDING': 7,
      'PAYMENT_PROCESSING': 7,
      'PAID': 8,
      'CITA_SCHEDULED': 8,
      'IN_PROGRESS': 9,
      'COMPLETED': 9,
      'REJECTED': 9,
      'CANCELLED': 9,
    }
    return statusToStep[status] || 0
  }

  // In DRAFT/DOCUMENTS_REQUIRED, determine step from form_data
  if (!formData) return 0

  const isMinor = formData.is_minor
  const solicitudType = formData.solicitud_type
  const motivo = formData.motivo

  if (isMinor === undefined || isMinor === null) return 0
  if (!solicitudType) return 1
  if (solicitudType === 'RENOVACION' && !motivo) return 2
  if (status === 'DOCUMENTS_REQUIRED') return 3
  return 3 // Documents step
}

/**
 * getVisiblePassportSteps - Get visible steps based on solicitud type
 * Filters out the 'select_motivo' step if not RENOVACION
 */
export function getVisiblePassportSteps(
  solicitudType?: string
): PassportWizardStep[] {
  const isRenovacion = solicitudType === 'RENOVACION'
  return PASSPORT_WIZARD_STEPS.filter(step => !step.isConditional || isRenovacion)
}
