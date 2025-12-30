/**
 * Service Requests API Client
 * Follows the supportApi pattern for consistency
 */

import { getAuthData } from '@/core/auth/storage'
import type {
  ServiceRequest,
  ServiceRequestCreate,
  ServiceRequestUpdate,
  ServiceRequestDocument,
  ServiceRequestListResponse,
  ServiceRequestFilters,
  WorkflowConfig,
  WorkflowStep,
  WorkflowStartResponse,
  StepSubmitRequest,
  StepSubmitResponse,
  DocumentUploadResponse,
  TariffCalculation,
  ValidationResult,
} from '../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'
const ENDPOINT_BASE = '/service-requests'

// ============================================================================
// BACKEND RESPONSE TYPES (snake_case from Python)
// ============================================================================

interface BackendWorkflowStep {
  number: number
  id: string
  type: string
  title_es: string
  description_es?: string
  is_inherited: boolean
  is_optional?: boolean
  config?: Record<string, unknown>
}

interface BackendWorkflow {
  code: string
  category: string
  entity_code: string
  service_name_es: string
  requires_nota_ingreso: boolean
  requires_appointment: boolean
  requires_agent_review: boolean
  allowed_sub_types: string[]
  total_steps?: number
  steps?: BackendWorkflowStep[]
  tariff_type?: string
}

// ============================================================================
// TRANSFORMATION FUNCTIONS (snake_case -> camelCase)
// ============================================================================

function transformStep(backend: BackendWorkflowStep): WorkflowStep {
  return {
    stepNumber: backend.number,
    stepId: backend.id,
    stepType: backend.type as WorkflowStep['stepType'],
    titleEs: backend.title_es,
    descriptionEs: backend.description_es,
    isInherited: backend.is_inherited,
    isOptional: backend.is_optional,
    config: backend.config,
  }
}

function transformWorkflow(backend: BackendWorkflow): WorkflowConfig {
  return {
    workflowCode: backend.code,
    category: backend.category as WorkflowConfig['category'],
    entityCode: backend.entity_code,
    serviceNameEs: backend.service_name_es,
    requiresNotaIngreso: backend.requires_nota_ingreso,
    requiresAppointment: backend.requires_appointment,
    requiresAgentReview: backend.requires_agent_review,
    allowedSubTypes: backend.allowed_sub_types || [],
    steps: (backend.steps || []).map(transformStep),
    tariffType: (backend.tariff_type as WorkflowConfig['tariffType']) || 'fixed',
  }
}

class ServiceRequestsApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}${ENDPOINT_BASE}`
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    const authData = getAuthData()
    return authData?.access_token || null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `API Error: ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Upload Error: ${response.status}`)
    }

    return response.json()
  }

  // =========================================================================
  // WORKFLOW CONFIGURATION
  // =========================================================================

  /**
   * Get available workflows for a category
   */
  async getWorkflows(category?: string): Promise<WorkflowConfig[]> {
    const params = category ? `?category=${category}` : ''
    const workflows = await this.request<BackendWorkflow[]>(`/workflows${params}`)
    return workflows.map(transformWorkflow)
  }

  /**
   * Get workflow configuration by code
   */
  async getWorkflow(workflowCode: string): Promise<WorkflowConfig> {
    const workflow = await this.request<BackendWorkflow>(`/workflows/${workflowCode}`)
    return transformWorkflow(workflow)
  }

  /**
   * Get workflow steps configuration
   */
  async getWorkflowSteps(workflowCode: string, subType?: string): Promise<WorkflowConfig> {
    const params = subType ? `?sub_type=${subType}` : ''
    const workflow = await this.request<BackendWorkflow>(`/workflows/${workflowCode}/steps${params}`)
    return transformWorkflow(workflow)
  }

  // =========================================================================
  // SERVICE REQUEST CRUD
  // =========================================================================

  /**
   * Start a new service request workflow
   * Backend uses POST / to create, returns ServiceRequestResponse
   */
  async startWorkflow(data: ServiceRequestCreate): Promise<WorkflowStartResponse> {
    // Backend endpoint is POST / - convert to snake_case for backend
    const backendData = {
      workflow_code: data.workflowCode,
      solicitud_type: data.subType?.toLowerCase() || 'expedicion',
      form_data: data.formData || {},
    }
    const request = await this.request<ServiceRequest>('/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    })

    // Fetch workflow config to return complete response
    const workflow = await this.getWorkflow(request.workflowCode)
    const currentStepConfig = workflow.steps?.find(s => s.stepNumber === (request.currentStep || 1)) || null

    return {
      request,
      workflow,
      currentStepConfig,
    }
  }

  /**
   * Get service request by ID
   */
  async getRequest(requestId: string): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}`)
  }

  /**
   * List user's service requests with filters
   * Backend uses limit/offset pagination and returns array directly
   */
  async listMyRequests(
    page: number = 1,
    pageSize: number = 10,
    filters?: ServiceRequestFilters
  ): Promise<ServiceRequestListResponse> {
    // Convert page/pageSize to limit/offset for backend
    const limit = pageSize
    const offset = (page - 1) * pageSize

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    if (filters?.status) params.append('status', filters.status)
    if (filters?.workflowCode) params.append('workflow_code', filters.workflowCode)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom)
    if (filters?.dateTo) params.append('date_to', filters.dateTo)

    // Backend returns List[ServiceRequestResponse] directly (array), not wrapped
    const requests = await this.request<ServiceRequest[]>(`/?${params.toString()}`)

    // Wrap in expected response format for frontend hook compatibility
    return {
      requests: requests || [],
      total: requests?.length || 0,
      page,
      pageSize,
      totalPages: Math.ceil((requests?.length || 0) / pageSize),
    }
  }

  /**
   * Update service request form data
   */
  async updateRequest(
    requestId: string,
    data: ServiceRequestUpdate
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete/cancel a draft request
   */
  async deleteRequest(requestId: string): Promise<void> {
    return this.request<void>(`/${requestId}`, {
      method: 'DELETE',
    })
  }

  // =========================================================================
  // WORKFLOW STEP OPERATIONS
  // =========================================================================

  /**
   * Submit current step and advance
   */
  async submitStep(
    requestId: string,
    stepData: StepSubmitRequest
  ): Promise<StepSubmitResponse> {
    return this.request<StepSubmitResponse>(`/${requestId}/step`, {
      method: 'POST',
      body: JSON.stringify(stepData),
    })
  }

  /**
   * Go back to previous step
   */
  async previousStep(requestId: string): Promise<StepSubmitResponse> {
    return this.request<StepSubmitResponse>(`/${requestId}/step/previous`, {
      method: 'POST',
    })
  }

  /**
   * Save step data without advancing
   */
  async saveStepData(
    requestId: string,
    stepId: string,
    data: Record<string, unknown>
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/step/${stepId}/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // =========================================================================
  // DOCUMENT OPERATIONS
  // =========================================================================

  /**
   * Upload a document for extraction
   */
  async uploadDocument(
    requestId: string,
    documentCode: string,
    file: File,
    face?: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_code', documentCode)
    if (face) formData.append('face', face)

    return this.uploadRequest<DocumentUploadResponse>(
      `/${requestId}/documents`,
      formData
    )
  }

  /**
   * Get all documents for a request
   */
  async getDocuments(requestId: string): Promise<ServiceRequestDocument[]> {
    return this.request<ServiceRequestDocument[]>(`/${requestId}/documents`)
  }

  /**
   * Delete an uploaded document
   */
  async deleteDocument(requestId: string, documentId: string): Promise<void> {
    return this.request<void>(`/${requestId}/documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Retry extraction for a document
   */
  async retryExtraction(
    requestId: string,
    documentId: string
  ): Promise<ServiceRequestDocument> {
    return this.request<ServiceRequestDocument>(
      `/${requestId}/documents/${documentId}/retry-extraction`,
      { method: 'POST' }
    )
  }

  /**
   * Update extracted data manually
   */
  async updateExtractedData(
    requestId: string,
    documentId: string,
    data: Record<string, unknown>
  ): Promise<ServiceRequestDocument> {
    return this.request<ServiceRequestDocument>(
      `/${requestId}/documents/${documentId}/extracted-data`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  // =========================================================================
  // VALIDATION & TARIFF
  // =========================================================================

  /**
   * Validate current step data
   */
  async validateStep(
    requestId: string,
    stepId: string,
    data: Record<string, unknown>
  ): Promise<ValidationResult[]> {
    return this.request<ValidationResult[]>(`/${requestId}/validate/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Run cross-document validation
   */
  async validateDocuments(requestId: string): Promise<ValidationResult[]> {
    return this.request<ValidationResult[]>(`/${requestId}/validate-documents`, {
      method: 'POST',
    })
  }

  /**
   * Calculate tariff for request
   */
  async calculateTariff(
    requestId: string,
    formData?: Record<string, unknown>
  ): Promise<TariffCalculation> {
    return this.request<TariffCalculation>(`/${requestId}/tariff`, {
      method: 'POST',
      body: JSON.stringify(formData || {}),
    })
  }

  // =========================================================================
  // SUBMISSION & PAYMENT
  // =========================================================================

  /**
   * Submit request for processing
   */
  async submitRequest(requestId: string): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/submit`, {
      method: 'POST',
    })
  }

  /**
   * Initiate payment for request
   */
  async initiatePayment(
    requestId: string,
    paymentMethod: string,
    phoneNumber?: string
  ): Promise<{ paymentId: string; redirectUrl?: string }> {
    return this.request<{ paymentId: string; redirectUrl?: string }>(
      `/${requestId}/payment/initiate`,
      {
        method: 'POST',
        body: JSON.stringify({ payment_method: paymentMethod, phone_number: phoneNumber }),
      }
    )
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    requestId: string
  ): Promise<{ status: string; paid: boolean }> {
    return this.request<{ status: string; paid: boolean }>(
      `/${requestId}/payment/status`
    )
  }

  // =========================================================================
  // AGENT OPERATIONS (for agent dashboard)
  // =========================================================================

  /**
   * List all requests for agents (with filters)
   */
  async listAllRequests(
    page: number = 1,
    pageSize: number = 10,
    filters?: ServiceRequestFilters
  ): Promise<ServiceRequestListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })

    if (filters?.status) params.append('status', filters.status)
    if (filters?.workflowCode) params.append('workflow_code', filters.workflowCode)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom)
    if (filters?.dateTo) params.append('date_to', filters.dateTo)
    if (filters?.assignedAgentId) params.append('assigned_agent_id', filters.assignedAgentId)

    return this.request<ServiceRequestListResponse>(`/all?${params.toString()}`)
  }

  /**
   * Assign request to agent
   */
  async assignToAgent(
    requestId: string,
    agentId: string
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    })
  }

  /**
   * Approve request
   */
  async approveRequest(
    requestId: string,
    notes?: string
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  /**
   * Reject request
   */
  async rejectRequest(
    requestId: string,
    reason: string,
    notes?: string
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    })
  }

  /**
   * Request additional information
   */
  async requestAdditionalInfo(
    requestId: string,
    message: string,
    requiredDocuments?: string[]
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ message, required_documents: requiredDocuments }),
    })
  }

  /**
   * Schedule appointment
   */
  async scheduleAppointment(
    requestId: string,
    date: string,
    time: string,
    location: string
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/appointment`, {
      method: 'POST',
      body: JSON.stringify({ date, time, location }),
    })
  }

  /**
   * Add agent note
   */
  async addAgentNote(requestId: string, note: string): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/${requestId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
  }
}

// Export singleton instance
export const serviceRequestsApi = new ServiceRequestsApiClient()
