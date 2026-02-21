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

export type ActionType = 'pending' | 'validation' | 'appointments' | 'history' | 'escalations';

export type SolicitudType = 'expedicion' | 'renovacion';

export type RenovacionMotivo = 'vencimiento' | 'perdida' | 'robo' | 'deterioro';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type SlaStatus = 'on_track' | 'at_risk' | 'violated';

/** Normalize backend SLA values (warning/breached) to canonical SlaStatus */
function normalizeSlaStatus(raw: string | null | undefined): SlaStatus {
  switch (raw) {
    case 'at_risk':
    case 'warning':
      return 'at_risk';
    case 'violated':
    case 'breached':
      return 'violated';
    default:
      return 'on_track';
  }
}

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
  // Batch context
  batchId?: string | null;
  batchReference?: string | null;
  // Escalation context (only populated for action=escalations)
  escalationReason?: string | null;
  escalatedAt?: string | null;
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
  status?: string;
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

// =============================================================================
// PREVIEW TYPES FOR SPLIT VIEW
// =============================================================================

/**
 * Extracted data is now dynamic — driven by workflow_display_config.list_columns.
 * The backend returns only the columns configured for the workflow,
 * with dot-notation keys for nested objects (e.g., "dip.natural_de").
 */
export type RequestPreviewExtractedData = Record<string, unknown>;

export interface RequestPreviewDocument {
  id: string;
  code: string;
  name: string;
  fileUrl?: string | null;
  mimeType?: string | null;  // For displaying image thumbnails
  validationStatus: string;
}

export interface RequestPreviewAppointment {
  date: string;
  time: string;
  locationName: string;
  locationAddress?: string | null;
}

export interface ServiceRequestPreview {
  id: string;
  reference: string;
  workflowCode: string;
  workflowLabel: string;
  solicitudType: string;
  motivo?: string | null;
  isMinor: boolean;
  status: string;
  priority: Priority;
  // SLA
  slaDeadline?: string | null;
  slaRemainingHours?: number | null;
  slaStatus: SlaStatus;
  // Extracted data
  extractedData: RequestPreviewExtractedData;
  // Documents
  documents: RequestPreviewDocument[];
  documentsCount: number;
  // Contact
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  // Appointment
  appointment?: RequestPreviewAppointment | null;
  // Metadata
  createdAt: string;
  submittedAt?: string | null;
  // Batch context
  batchId?: string | null;
  batchReference?: string | null;
  // Navigation
  listIndex?: number | null;
  listTotal?: number | null;
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
  batch_id?: string | null;
  batch_reference?: string | null;
  escalation_reason?: string | null;
  escalated_at?: string | null;
}

interface BackendServiceRequestListResponse {
  items: BackendServiceRequestListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Backend preview extracted_data is now a dynamic dict (snake_case keys with dot notation)
type BackendRequestPreviewExtractedData = Record<string, unknown>;

interface BackendRequestPreviewDocument {
  id: string;
  code: string;
  name: string;
  file_url?: string | null;
  mime_type?: string | null;
  validation_status: string;
}

interface BackendRequestPreviewAppointment {
  date: string;
  time: string;
  location_name: string;
  location_address?: string | null;
}

interface BackendServiceRequestPreview {
  id: string;
  reference: string;
  workflow_code: string;
  workflow_label: string;
  solicitud_type: string;
  motivo?: string | null;
  is_minor: boolean;
  status: string;
  priority: string;
  sla_deadline?: string | null;
  sla_remaining_hours?: number | null;
  sla_status: string;
  extracted_data: BackendRequestPreviewExtractedData;
  documents: BackendRequestPreviewDocument[];
  documents_count: number;
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  appointment?: BackendRequestPreviewAppointment | null;
  created_at: string;
  submitted_at?: string | null;
  batch_id?: string | null;
  batch_reference?: string | null;
  list_index?: number | null;
  list_total?: number | null;
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
    slaStatus: normalizeSlaStatus(item.sla_status),
    batchId: item.batch_id,
    batchReference: item.batch_reference,
    escalationReason: item.escalation_reason,
    escalatedAt: item.escalated_at,
  };
}

function transformServiceRequestPreview(data: BackendServiceRequestPreview): ServiceRequestPreview {
  return {
    id: data.id,
    reference: data.reference,
    workflowCode: data.workflow_code,
    workflowLabel: data.workflow_label,
    solicitudType: data.solicitud_type,
    motivo: data.motivo,
    isMinor: data.is_minor,
    status: data.status,
    priority: (data.priority || 'NORMAL') as Priority,
    slaDeadline: data.sla_deadline,
    slaRemainingHours: data.sla_remaining_hours,
    slaStatus: normalizeSlaStatus(data.sla_status),
    // Dynamic pass-through: backend already returns only configured columns
    extractedData: data.extracted_data ?? {},
    documents: data.documents.map(doc => ({
      id: doc.id,
      code: doc.code,
      name: doc.name,
      fileUrl: doc.file_url,
      mimeType: doc.mime_type,
      validationStatus: doc.validation_status,
    })),
    documentsCount: data.documents_count,
    contactName: data.contact_name,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    appointment: data.appointment ? {
      date: data.appointment.date,
      time: data.appointment.time,
      locationName: data.appointment.location_name,
      locationAddress: data.appointment.location_address,
    } : null,
    createdAt: data.created_at,
    submittedAt: data.submitted_at,
    batchId: data.batch_id,
    batchReference: data.batch_reference,
    listIndex: data.list_index,
    listTotal: data.list_total,
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
    options: RequestInit = {},
    absoluteUrl: boolean = false,
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = absoluteUrl ? endpoint : `${this.baseUrl}${endpoint}`;

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
    if (filters.status) params.append('status', filters.status);
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
   * Get service request preview for split view
   */
  async getPreview(
    entityCode: string,
    requestId: string,
    options?: { listIndex?: number; listTotal?: number }
  ): Promise<ServiceRequestPreview> {
    const params = new URLSearchParams();
    if (options?.listIndex !== undefined) params.append('list_index', options.listIndex.toString());
    if (options?.listTotal !== undefined) params.append('list_total', options.listTotal.toString());

    const queryString = params.toString();
    const endpoint = `/entity/${entityCode}/requests/${requestId}/preview${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<BackendServiceRequestPreview>(endpoint);
    return transformServiceRequestPreview(response);
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
   * Resolve (de-escalate) a service request
   */
  async resolveEscalation(requestId: string): Promise<{ message: string }> {
    return this.request(`/${requestId}/resolve-escalation`, {
      method: 'POST',
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

  // ─── Agent Batch Endpoints ──────────────────────────────────

  async getEntityBatches(
    entityCode: string,
    filters?: { status?: string; search?: string; page?: number; pageSize?: number }
  ): Promise<AgentBatchListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('page_size', String(filters.pageSize));
    const qs = params.toString();
    const url = `${API_BASE_URL}${API_VERSION}/batch-requests/agent/entity/${entityCode}${qs ? `?${qs}` : ''}`;
    return this.request(url, {}, true);
  }

  async getEntityBatchDetail(
    entityCode: string,
    batchId: string
  ): Promise<AgentBatchDetail> {
    const url = `${API_BASE_URL}${API_VERSION}/batch-requests/agent/entity/${entityCode}/${batchId}`;
    return this.request(url, {}, true);
  }

  async bulkDecision(
    entityCode: string,
    batchId: string,
    body: { decision: 'approve' | 'reject'; itemIds?: string[]; comments?: string; rejectionReason?: string }
  ): Promise<BulkDecisionResult> {
    const url = `${API_BASE_URL}${API_VERSION}/batch-requests/agent/entity/${entityCode}/${batchId}/bulk-decision`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({
        decision: body.decision,
        item_ids: body.itemIds,
        comments: body.comments,
        rejection_reason: body.rejectionReason,
      }),
    }, true);
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

// ─── Agent Batch Types ──────────────────────────────────────

export interface AgentBatchListResponse {
  batches: AgentBatchSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AgentBatchSummary {
  id: string;
  reference: string | null;
  workflow_code: string;
  solicitud_type: string;
  total_items: number;
  items_ready: number;
  items_submitted: number;
  items_completed: number;
  status: string;
  total_amount: number | null;
  currency: string;
  created_at: string;
  submitted_at: string | null;
}

export interface AgentBatchDetail extends AgentBatchSummary {
  items: AgentBatchItem[];
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  shared_documents: Array<{ document_code: string; file_path: string; file_name: string }>;
  notes: string | null;
}

export interface AgentBatchItem {
  id: string;
  batch_id: string;
  beneficiary_name: string;
  beneficiary_identifier: string | null;
  status: string;
  service_request_id: string | null;
  sr_status: string | null;
  sr_reference: string | null;
  sr_assigned_to: string | null;
  sr_payment_status: string | null;
  item_order: number;
  created_at: string;
}

export interface BulkDecisionResult {
  processed: number;
  failed: number;
  errors: Array<{ item_id: string; beneficiary: string; error: string }>;
  batch_completed: boolean;
}

// Export singleton instance
export const agentRequestsApi = new AgentRequestsApiClient();

// ============================================================================
// DOCUMENT URL HELPER
// ============================================================================

/**
 * Get signed download URL for a document
 * Uses the service-requests endpoint (not agent endpoint)
 */
export async function getDocumentDownloadUrl(
  requestId: string,
  documentCode: string
): Promise<string> {
  const token = typeof window !== 'undefined'
    ? getAuthData()?.access_token
    : null;

  const url = `${API_BASE_URL}${API_VERSION}/service-requests/${requestId}/documents/${documentCode}/url`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get document URL: ${response.status}`);
  }

  const data = await response.json();
  return data.download_url;
}
