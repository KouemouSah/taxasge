/**
 * Service Requests Module - Type Definitions
 * Matches backend workflow models
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ServiceRequestStatus {
  DRAFT = 'draft',
  DOCUMENTS_PENDING = 'documents_pending',
  DOCUMENTS_UPLOADED = 'documents_uploaded',
  EXTRACTION_PENDING = 'extraction_pending',
  EXTRACTION_COMPLETE = 'extraction_complete',
  VALIDATION_PENDING = 'validation_pending',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_COMPLETED = 'payment_completed',
  SUBMITTED = 'submitted',
  AGENT_REVIEW = 'agent_review',
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

export interface WorkflowStep {
  stepNumber: number
  stepId: string
  stepType: StepType
  titleEs: string
  titleFr?: string
  descriptionEs?: string
  descriptionFr?: string
  isInherited: boolean
  isOptional?: boolean
  config?: Record<string, unknown>
  documents?: DocumentRequirement[]
}

export interface DocumentRequirement {
  documentCode: string
  documentNameEs: string
  documentNameFr?: string
  schemaKey?: string
  isRequired: boolean
  displayOrder: number
  conditionType: DocumentConditionType
  conditionValue?: Record<string, unknown>
  instructionsEs?: string
  instructionsFr?: string
  acceptedFormats?: string[]
  facesRequired?: string[]
}

export interface WorkflowConfig {
  workflowCode: string
  category: WorkflowCategory
  entityCode: string
  serviceNameEs: string
  serviceNameFr?: string
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
  messageEs: string
  messageFr?: string
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
    [ServiceRequestStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [ServiceRequestStatus.DOCUMENTS_PENDING]: 'bg-yellow-100 text-yellow-800',
    [ServiceRequestStatus.DOCUMENTS_UPLOADED]: 'bg-blue-100 text-blue-800',
    [ServiceRequestStatus.EXTRACTION_PENDING]: 'bg-purple-100 text-purple-800',
    [ServiceRequestStatus.EXTRACTION_COMPLETE]: 'bg-indigo-100 text-indigo-800',
    [ServiceRequestStatus.VALIDATION_PENDING]: 'bg-orange-100 text-orange-800',
    [ServiceRequestStatus.PAYMENT_PENDING]: 'bg-amber-100 text-amber-800',
    [ServiceRequestStatus.PAYMENT_COMPLETED]: 'bg-emerald-100 text-emerald-800',
    [ServiceRequestStatus.SUBMITTED]: 'bg-cyan-100 text-cyan-800',
    [ServiceRequestStatus.AGENT_REVIEW]: 'bg-teal-100 text-teal-800',
    [ServiceRequestStatus.ADDITIONAL_INFO_REQUIRED]: 'bg-rose-100 text-rose-800',
    [ServiceRequestStatus.APPOINTMENT_SCHEDULED]: 'bg-sky-100 text-sky-800',
    [ServiceRequestStatus.APPROVED]: 'bg-green-100 text-green-800',
    [ServiceRequestStatus.REJECTED]: 'bg-red-100 text-red-800',
    [ServiceRequestStatus.COMPLETED]: 'bg-green-200 text-green-900',
    [ServiceRequestStatus.CANCELLED]: 'bg-gray-200 text-gray-600',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: ServiceRequestStatus | string, locale: 'es' | 'fr' | 'en' = 'es'): string {
  const labels: Record<string, Record<string, string>> = {
    [ServiceRequestStatus.DRAFT]: { es: 'Borrador', fr: 'Brouillon', en: 'Draft' },
    [ServiceRequestStatus.DOCUMENTS_PENDING]: { es: 'Documentos Pendientes', fr: 'Documents en attente', en: 'Documents Pending' },
    [ServiceRequestStatus.DOCUMENTS_UPLOADED]: { es: 'Documentos Cargados', fr: 'Documents chargés', en: 'Documents Uploaded' },
    [ServiceRequestStatus.EXTRACTION_PENDING]: { es: 'Extracción Pendiente', fr: 'Extraction en attente', en: 'Extraction Pending' },
    [ServiceRequestStatus.EXTRACTION_COMPLETE]: { es: 'Extracción Completa', fr: 'Extraction terminée', en: 'Extraction Complete' },
    [ServiceRequestStatus.VALIDATION_PENDING]: { es: 'Validación Pendiente', fr: 'Validation en attente', en: 'Validation Pending' },
    [ServiceRequestStatus.PAYMENT_PENDING]: { es: 'Pago Pendiente', fr: 'Paiement en attente', en: 'Payment Pending' },
    [ServiceRequestStatus.PAYMENT_COMPLETED]: { es: 'Pago Completado', fr: 'Paiement effectué', en: 'Payment Completed' },
    [ServiceRequestStatus.SUBMITTED]: { es: 'Enviada', fr: 'Soumise', en: 'Submitted' },
    [ServiceRequestStatus.AGENT_REVIEW]: { es: 'En Revisión', fr: 'En révision', en: 'Under Review' },
    [ServiceRequestStatus.ADDITIONAL_INFO_REQUIRED]: { es: 'Info. Adicional Requerida', fr: 'Info. supplémentaire requise', en: 'Additional Info Required' },
    [ServiceRequestStatus.APPOINTMENT_SCHEDULED]: { es: 'Cita Programada', fr: 'Rendez-vous programmé', en: 'Appointment Scheduled' },
    [ServiceRequestStatus.APPROVED]: { es: 'Aprobada', fr: 'Approuvée', en: 'Approved' },
    [ServiceRequestStatus.REJECTED]: { es: 'Rechazada', fr: 'Rejetée', en: 'Rejected' },
    [ServiceRequestStatus.COMPLETED]: { es: 'Completada', fr: 'Terminée', en: 'Completed' },
    [ServiceRequestStatus.CANCELLED]: { es: 'Cancelada', fr: 'Annulée', en: 'Cancelled' },
  }
  return labels[status]?.[locale] || status
}

export function isRequestEditable(request: ServiceRequest): boolean {
  const editableStatuses = [
    ServiceRequestStatus.DRAFT,
    ServiceRequestStatus.DOCUMENTS_PENDING,
    ServiceRequestStatus.DOCUMENTS_UPLOADED,
    ServiceRequestStatus.ADDITIONAL_INFO_REQUIRED,
  ]
  return editableStatuses.includes(request.status as ServiceRequestStatus)
}

export function canUploadDocuments(request: ServiceRequest): boolean {
  const uploadStatuses = [
    ServiceRequestStatus.DRAFT,
    ServiceRequestStatus.DOCUMENTS_PENDING,
    ServiceRequestStatus.DOCUMENTS_UPLOADED,
    ServiceRequestStatus.ADDITIONAL_INFO_REQUIRED,
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
