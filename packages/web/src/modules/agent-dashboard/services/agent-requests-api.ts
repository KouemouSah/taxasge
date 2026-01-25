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
}

// Export singleton instance
export const agentRequestsApi = new AgentRequestsApiClient();
