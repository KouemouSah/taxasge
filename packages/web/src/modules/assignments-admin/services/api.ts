/**
 * Assignments Admin API Service
 * Handles all API calls to the backend assignments endpoints
 *
 * @module assignments-admin/services
 * @author Claude Code
 * @date 2025-11-19
 */

import { fetchClient } from '@/core/api'
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  PaginatedAssignmentsResponse,
  AssignmentStatus,
} from "../types";

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
    const response = await fetchClient.get<PaginatedAssignmentsResponse>('/assignments', {
      status: params?.status,
      assignee_id: params?.assignee_id,
      declaration_id: params?.declaration_id,
      page: params?.page,
      page_size: params?.page_size,
    });

    // Extract assignments array from paginated response
    return response.items || [];
  },

  /**
   * Get assignment by ID
   */
  getById: async (id: string): Promise<Assignment> => {
    return fetchClient.get<Assignment>(`/assignments/${id}`);
  },

  /**
   * Create new assignment
   */
  create: async (data: CreateAssignmentRequest): Promise<Assignment> => {
    return fetchClient.post<Assignment>("/assignments", data);
  },

  /**
   * Update assignment
   */
  update: async (id: string, data: UpdateAssignmentRequest): Promise<Assignment> => {
    return fetchClient.put<Assignment>(`/assignments/${id}`, data);
  },

  /**
   * Delete assignment
   */
  delete: async (id: string): Promise<void> => {
    return fetchClient.delete<void>(`/assignments/${id}`);
  },

  /**
   * Update assignment status
   */
  updateStatus: async (id: string, status: AssignmentStatus): Promise<Assignment> => {
    return fetchClient.patch<Assignment>(`/assignments/${id}`, { status });
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default assignmentsApi;
