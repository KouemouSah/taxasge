/**
 * Audit Logs Admin API Service
 * Handles all API calls to the backend audit logs endpoints
 *
 * @module audit-logs-admin/services
 * @author Claude Code
 * @date 2025-11-19
 */

import type {
  AuditLog,
  PaginatedAuditLogsResponse,
  AuditAction,
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
}

const client = new ApiClient(API_BASE_URL + API_VERSION);

// =============================================================================
// AUDIT LOGS API
// =============================================================================

export const auditLogsApi = {
  /**
   * Get all audit logs with optional filters
   */
  getAll: async (params?: {
    action?: AuditAction;
    user_id?: string;
    resource_type?: string;
    success?: boolean;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<AuditLog[]> => {
    const queryParams = new URLSearchParams();
    if (params?.action) queryParams.append("action", params.action);
    if (params?.user_id) queryParams.append("user_id", params.user_id);
    if (params?.resource_type) queryParams.append("resource_type", params.resource_type);
    if (params?.success !== undefined)
      queryParams.append("success", String(params.success));
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const query = queryParams.toString();
    const response = await client.get<PaginatedAuditLogsResponse>(
      `/audit-logs${query ? `?${query}` : ""}`
    );

    // Extract audit logs array from paginated response
    return response.items || [];
  },

  /**
   * Get audit log by ID
   */
  getById: async (id: string): Promise<AuditLog> => {
    return client.get<AuditLog>(`/audit-logs/${id}`);
  },

  /**
   * Get audit logs for a specific user
   */
  getByUser: async (userId: string, params?: {
    action?: AuditAction;
    page?: number;
    page_size?: number;
  }): Promise<AuditLog[]> => {
    const queryParams = new URLSearchParams();
    if (params?.action) queryParams.append("action", params.action);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const query = queryParams.toString();
    const response = await client.get<PaginatedAuditLogsResponse>(
      `/users/${userId}/audit-logs${query ? `?${query}` : ""}`
    );

    return response.items || [];
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default auditLogsApi;
