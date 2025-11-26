/**
 * Audit Logs Admin API Service
 * Handles all API calls to the backend audit logs endpoints
 *
 * @module audit-logs-admin/services
 * @author Claude Code
 * @date 2025-11-19
 */

import { fetchClient } from '@/core/api'
import type {
  AuditLog,
  PaginatedAuditLogsResponse,
  AuditAction,
} from "../types";

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
    const response = await fetchClient.get<PaginatedAuditLogsResponse>('/audit-logs', {
      action: params?.action,
      user_id: params?.user_id,
      resource_type: params?.resource_type,
      success: params?.success,
      start_date: params?.start_date,
      end_date: params?.end_date,
      search: params?.search,
      page: params?.page,
      page_size: params?.page_size,
    });

    // Extract audit logs array from paginated response
    return response.items || [];
  },

  /**
   * Get audit log by ID
   */
  getById: async (id: string): Promise<AuditLog> => {
    return fetchClient.get<AuditLog>(`/audit-logs/${id}`);
  },

  /**
   * Get audit logs for a specific user
   */
  getByUser: async (userId: string, params?: {
    action?: AuditAction;
    page?: number;
    page_size?: number;
  }): Promise<AuditLog[]> => {
    const response = await fetchClient.get<PaginatedAuditLogsResponse>(
      `/users/${userId}/audit-logs`,
      {
        action: params?.action,
        page: params?.page,
        page_size: params?.page_size,
      }
    );

    return response.items || [];
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default auditLogsApi;
