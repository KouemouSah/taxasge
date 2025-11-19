/**
 * Assignments Admin API Service
 * Handles all API calls to the backend assignments endpoints
 *
 * @module assignments-admin/services
 * @author Claude Code
 * @date 2025-11-19
 */

import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  PaginatedAssignmentsResponse,
  AssignmentStatus,
} from "../types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_VERSION = "/api/v1";

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get auth token
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Merge with provided headers
    if (options.headers) {
      const headersToMerge = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : options.headers;
      Object.assign(headers, headersToMerge);
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || "API request failed");
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const client = new ApiClient(API_BASE_URL + API_VERSION);

// =============================================================================
// ASSIGNMENTS API
// =============================================================================

export const assignmentsApi = {
  /**
   * Get all assignments with optional filters
   */
  getAll: async (params?: {
    status?: AssignmentStatus;
    assignee_id?: string;
    declaration_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<Assignment[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.assignee_id) queryParams.append("assignee_id", params.assignee_id);
    if (params?.declaration_id) queryParams.append("declaration_id", params.declaration_id);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const query = queryParams.toString();
    const response = await client.get<PaginatedAssignmentsResponse>(
      `/assignments${query ? `?${query}` : ""}`
    );

    // Extract assignments array from paginated response
    return response.items || [];
  },

  /**
   * Get assignment by ID
   */
  getById: async (id: string): Promise<Assignment> => {
    return client.get<Assignment>(`/assignments/${id}`);
  },

  /**
   * Create new assignment
   */
  create: async (data: CreateAssignmentRequest): Promise<Assignment> => {
    return client.post<Assignment>("/assignments", data);
  },

  /**
   * Update assignment
   */
  update: async (id: string, data: UpdateAssignmentRequest): Promise<Assignment> => {
    return client.put<Assignment>(`/assignments/${id}`, data);
  },

  /**
   * Delete assignment
   */
  delete: async (id: string): Promise<void> => {
    return client.delete<void>(`/assignments/${id}`);
  },

  /**
   * Update assignment status
   */
  updateStatus: async (id: string, status: AssignmentStatus): Promise<Assignment> => {
    return client.patch<Assignment>(`/assignments/${id}`, { status });
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default assignmentsApi;
