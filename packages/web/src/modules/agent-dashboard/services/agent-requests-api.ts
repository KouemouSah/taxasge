/**
 * Agent Service Requests API
 * API client for agent dashboard service requests operations
 *
 * @module agent-dashboard/services/agent-requests-api
 * @date 2026-01-25
 */

import { getAuthData } from '@/core/auth/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// =============================================================================
// TYPES
// =============================================================================

export type ActionType = 'pending' | 'validation' | 'appointments' | 'history';

export type SolicitudType = 'expedicion' | 'renovacion';

export type RenovacionMotivo = 'vencimiento' | 'perdida' | 'robo' | 'deterioro';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type SlaStatus = 'on_track' | 'at_risk' | 'violated';

export interface ServiceRequestListItem {
  id: string;
  reference: string;
  workflowCode: string;
  solicitudType: string;
  motivo: string | null;
  status: string;
  priority: Priority;
  citizenName: string;
  citizenEmail: string | null;
  submittedAt: string | null;
  createdAt: string;
  assignedTo: string | null;
  slaDeadline: string | null;
  slaStatus: SlaStatus;
}

export interface ServiceRequestListResponse {
  items: ServiceRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceRequestFilters {
  action?: ActionType;
  workflowCode?: string;
  solicitudType?: SolicitudType;
  motivo?: RenovacionMotivo;
  search?: string;
  priority?: Priority;
  page?: number;
  pageSize?: number;
}

// Workflow schema types for agent detail view
export interface WorkflowSchemaField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'datetime' | 'email' | 'status';
  source?: 'request' | 'appointment' | 'form_data';
  default?: string;
}

export interface WorkflowSchemaSection {
  id: string;
  title: string;
  column: 'left' | 'right';
  fields: WorkflowSchemaField[];
}

export interface FormDisplaySchema {
  title: string;
  photoField?: string;
  layout: 'two-column' | 'single-column';
  sections: WorkflowSchemaSection[];
}

export interface AgentChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface WorkflowSchemaResponse {
  code: string;
  name: string;
  formDisplaySchema: FormDisplaySchema | null;
  agentChecklist: AgentChecklistItem[] | null;
}

export interface VerificationChecklistUpdate {
  checklist: Record<string, boolean>;
  verificationStatus?: 'pending' | 'in_progress' | 'verified' | 'partial_verification' | 'verification_failed';
  notes?: string;
}

export interface VerificationResponse {
  message: string;
  requestId: string;
  verificationStatus: string;
  checklistCompleted: number;
  checklistTotal: number;
}

// Backend response (snake_case)
interface BackendServiceRequestListItem {
  id: string;
  reference: string;
  workflow_code: string;
  solicitud_type: string;
  motivo: string | null;
  status: string;
  priority: string;
  citizen_name: string;
  citizen_email: string | null;
  submitted_at: string | null;
  created_at: string;
  assigned_to: string | null;
  sla_deadline: string | null;
  sla_status: string;
}

interface BackendServiceRequestListResponse {
  items: BackendServiceRequestListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

function transformServiceRequestItem(item: BackendServiceRequestListItem): ServiceRequestListItem {
  return {
    id: item.id,
    reference: item.reference,
    workflowCode: item.workflow_code,
    solicitudType: item.solicitud_type,
    motivo: item.motivo,
    status: item.status,
    priority: (item.priority || 'NORMAL') as Priority,
    citizenName: item.citizen_name,
    citizenEmail: item.citizen_email,
    submittedAt: item.submitted_at,
    createdAt: item.created_at,
    assignedTo: item.assigned_to,
    slaDeadline: item.sla_deadline,
    slaStatus: (item.sla_status || 'on_track') as SlaStatus,
  };
}

// =============================================================================
// API CLIENT
// =============================================================================

class AgentRequestsApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}/agent/service-requests`;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const authData = getAuthData();
    return authData?.access_token || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[AgentRequestsApi] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `API Error: ${response.status}`;
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : errorData.detail.message || JSON.stringify(errorData.detail);
      }
      console.error(`[AgentRequestsApi] Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get service requests for an entity with filters
   */
  async getEntityRequests(
    entityCode: string,
    filters: ServiceRequestFilters = {}
  ): Promise<ServiceRequestListResponse> {
    const params = new URLSearchParams();

    if (filters.action) params.append('action', filters.action);
    if (filters.workflowCode) params.append('workflow_code', filters.workflowCode);
    if (filters.solicitudType) params.append('solicitud_type', filters.solicitudType);
    if (filters.motivo) params.append('motivo', filters.motivo);
    if (filters.search) params.append('search', filters.search);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());

    const queryString = params.toString();
    const endpoint = `/entity/${entityCode}/requests${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<BackendServiceRequestListResponse>(endpoint);

    return {
      items: response.items.map(transformServiceRequestItem),
      total: response.total,
      page: response.page,
      pageSize: response.page_size,
      totalPages: response.total_pages,
    };
  }

  /**
   * Get a single service request for agent review
   */
  async getRequest(requestId: string): Promise<unknown> {
    return this.request(`/${requestId}`);
  }

  /**
   * Make decision on a service request (approve, reject, request_documents)
   */
  async makeDecision(
    requestId: string,
    decision: 'approve' | 'reject' | 'request_documents',
    options: {
      comments?: string;
      rejectionReason?: string;
      requestedDocuments?: string[];
    } = {}
  ): Promise<{ message: string; new_status: string }> {
    return this.request(`/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        comments: options.comments,
        rejection_reason: options.rejectionReason,
        requested_documents: options.requestedDocuments,
      }),
    });
  }

  /**
   * Escalate a service request
   */
  async escalate(
    requestId: string,
    reason: string,
    priorityBoost: number = 10
  ): Promise<{ message: string }> {
    return this.request(`/${requestId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        priority_boost: priorityBoost,
      }),
    });
  }

  /**
   * Get workflow display schema for agent view
   * Returns form layout schema and agent checklist items
   */
  async getWorkflowSchema(workflowCode: string): Promise<WorkflowSchemaResponse> {
    interface BackendResponse {
      code: string;
      name: string;
      formDisplaySchema: FormDisplaySchema | null;
      agentChecklist: AgentChecklistItem[] | null;
    }

    const response = await this.request<BackendResponse>(`/workflows/${workflowCode}/schema`);

    return {
      code: response.code,
      name: response.name,
      formDisplaySchema: response.formDisplaySchema,
      agentChecklist: response.agentChecklist,
    };
  }

  /**
   * Update verification checklist for a service request
   * Saves checklist state to service_requests.verification_details
   */
  async updateVerification(
    requestId: string,
    data: VerificationChecklistUpdate
  ): Promise<VerificationResponse> {
    interface BackendResponse {
      message: string;
      request_id: string;
      verification_status: string;
      checklist_completed: number;
      checklist_total: number;
    }

    const response = await this.request<BackendResponse>(`/${requestId}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({
        checklist: data.checklist,
        verification_status: data.verificationStatus,
        notes: data.notes,
      }),
    });

    return {
      message: response.message,
      requestId: response.request_id,
      verificationStatus: response.verification_status,
      checklistCompleted: response.checklist_completed,
      checklistTotal: response.checklist_total,
    };
  }

  /**
   * Get service request detail for agent view (includes full form_data)
   */
  async getRequestDetail(requestId: string): Promise<ServiceRequestDetail> {
    interface BackendResponse {
      id: string;
      reference: string;
      workflow_code: string;
      solicitud_type: string;
      status: string;
      priority: string;
      form_data: Record<string, unknown>;
      extracted_data?: Record<string, unknown>;
      verification_status?: string;
      verification_details?: {
        checklist?: Record<string, boolean>;
        notes?: string;
        last_updated_by?: string;
        last_updated_at?: string;
      };
      user_id: string;
      user_name?: string;
      user_email?: string;
      user_phone?: string;
      created_at: string;
      submitted_at?: string;
      cita_date?: string;
      cita_time?: string;
      cita_location?: string;
      provided_documents?: Array<{
        id: string;
        document_code: string;
        document_name: string;
        file_path: string;
        file_name: string;
        mime_type: string;
        validation_status?: string;
      }>;
    }

    const response = await this.request<BackendResponse>(`/${requestId}`);

    return {
      id: response.id,
      reference: response.reference,
      workflowCode: response.workflow_code,
      solicitudType: response.solicitud_type,
      status: response.status,
      priority: response.priority as Priority,
      formData: response.form_data,
      extractedData: response.extracted_data,
      verificationStatus: response.verification_status,
      verificationDetails: response.verification_details ? {
        checklist: response.verification_details.checklist,
        notes: response.verification_details.notes,
        lastUpdatedBy: response.verification_details.last_updated_by,
        lastUpdatedAt: response.verification_details.last_updated_at,
      } : undefined,
      userId: response.user_id,
      userName: response.user_name,
      userEmail: response.user_email,
      userPhone: response.user_phone,
      createdAt: response.created_at,
      submittedAt: response.submitted_at,
      citaDate: response.cita_date,
      citaTime: response.cita_time,
      citaLocation: response.cita_location,
      providedDocuments: response.provided_documents?.map(doc => ({
        id: doc.id,
        documentCode: doc.document_code,
        documentName: doc.document_name,
        filePath: doc.file_path,
        fileName: doc.file_name,
        mimeType: doc.mime_type,
        validationStatus: doc.validation_status,
      })),
    };
  }
}

// Service request detail type
export interface ServiceRequestDetail {
  id: string;
  reference: string;
  workflowCode: string;
  solicitudType: string;
  status: string;
  priority: Priority;
  formData: Record<string, unknown>;
  extractedData?: Record<string, unknown>;
  verificationStatus?: string;
  verificationDetails?: {
    checklist?: Record<string, boolean>;
    notes?: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
  };
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt: string;
  submittedAt?: string;
  citaDate?: string;
  citaTime?: string;
  citaLocation?: string;
  providedDocuments?: Array<{
    id: string;
    documentCode: string;
    documentName: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    validationStatus?: string;
  }>;
}

// Export singleton instance
export const agentRequestsApi = new AgentRequestsApiClient();
