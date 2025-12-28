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
  currentStepConfig: WorkflowStep
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
