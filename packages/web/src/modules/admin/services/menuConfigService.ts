/**
 * Menu Configuration API Service
 * Handles workflow mappings and role menu configuration
 *
 * @module admin/services
 * @date 2026-01-19
 * @updated 2026-01-31 - Removed unused menu_templates endpoints
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/menu-config (from app/modules/menu_config/api/menu_config_routes.py)
 * - GET    /api/v1/menu-config/me                    → get_my_menu_config
 * - GET    /api/v1/menu-config/workflow-mappings     → list_workflow_mappings
 * - POST   /api/v1/menu-config/workflow-mappings     → create_workflow_mapping
 * - PUT    /api/v1/menu-config/workflow-mappings/{id} → update_workflow_mapping
 * - DELETE /api/v1/menu-config/workflow-mappings/{id} → delete_workflow_mapping
 */

import { fetchClient } from '@/core/api';
import type {
  WorkflowMenuMapping,
  WorkflowMenuMappingListResponse,
  AgentMenuConfigResponse,
} from '@/modules/agent-dashboard/types/menu-config';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MENU_CONFIG_BASE = '/menu-config';

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowMappingCreateRequest {
  workflow_pattern: string;
  menu_group_id: string;
  menu_title_key: string;
  menu_icon: string;
  display_order?: number;
  include_pending?: boolean;
  include_validation?: boolean;
  include_appointments?: boolean;
  include_history?: boolean;
  permission_prefix?: string;
}

export interface WorkflowMappingUpdateRequest {
  menu_title_key?: string;
  menu_icon?: string;
  display_order?: number;
  include_pending?: boolean;
  include_validation?: boolean;
  include_appointments?: boolean;
  include_history?: boolean;
  permission_prefix?: string;
  is_active?: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// =============================================================================
// MENU CONFIG API
// =============================================================================

export const menuConfigApi = {
  // ===========================================================================
  // AGENT MENU CONFIG
  // ===========================================================================

  /**
   * Get current agent's menu configuration
   * BACKEND: GET /api/v1/menu-config/me
   * PERMISSION: authenticated
   */
  getMyMenuConfig: async (): Promise<AgentMenuConfigResponse> => {
    return fetchClient.get<AgentMenuConfigResponse>(`${MENU_CONFIG_BASE}/me`);
  },

  // ===========================================================================
  // WORKFLOW MENU MAPPINGS
  // ===========================================================================

  /**
   * List all workflow menu mappings with pagination
   * BACKEND: GET /api/v1/menu-config/workflow-mappings
   * PERMISSION: menu.view_mappings
   */
  listWorkflowMappings: async (
    params?: PaginationParams
  ): Promise<WorkflowMenuMappingListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());

    const query = searchParams.toString();
    const url = query
      ? `${MENU_CONFIG_BASE}/workflow-mappings?${query}`
      : `${MENU_CONFIG_BASE}/workflow-mappings`;

    return fetchClient.get<WorkflowMenuMappingListResponse>(url);
  },

  /**
   * Get a single workflow mapping by ID
   * BACKEND: GET /api/v1/menu-config/workflow-mappings/{id}
   * PERMISSION: menu.view_mappings
   */
  getWorkflowMapping: async (id: number): Promise<WorkflowMenuMapping> => {
    return fetchClient.get<WorkflowMenuMapping>(
      `${MENU_CONFIG_BASE}/workflow-mappings/${id}`
    );
  },

  /**
   * Create a new workflow menu mapping
   * BACKEND: POST /api/v1/menu-config/workflow-mappings
   * PERMISSION: menu.create_mapping
   */
  createWorkflowMapping: async (
    data: WorkflowMappingCreateRequest
  ): Promise<WorkflowMenuMapping> => {
    return fetchClient.post<WorkflowMenuMapping>(
      `${MENU_CONFIG_BASE}/workflow-mappings`,
      data
    );
  },

  /**
   * Update an existing workflow mapping
   * BACKEND: PUT /api/v1/menu-config/workflow-mappings/{id}
   * PERMISSION: menu.update_mapping
   */
  updateWorkflowMapping: async (
    id: number,
    data: WorkflowMappingUpdateRequest
  ): Promise<WorkflowMenuMapping> => {
    return fetchClient.put<WorkflowMenuMapping>(
      `${MENU_CONFIG_BASE}/workflow-mappings/${id}`,
      data
    );
  },

  /**
   * Delete a workflow mapping
   * BACKEND: DELETE /api/v1/menu-config/workflow-mappings/{id}
   * PERMISSION: menu.delete_mapping
   */
  deleteWorkflowMapping: async (id: number): Promise<void> => {
    return fetchClient.delete(`${MENU_CONFIG_BASE}/workflow-mappings/${id}`);
  },

  // ===========================================================================
  // ROLE MENU CONFIG
  // ===========================================================================

  /**
   * Get menu config for a specific role
   * BACKEND: GET /api/v1/roles/{role_id}/menu-config
   * PERMISSION: roles.view
   */
  getRoleMenuConfig: async (
    roleId: string
  ): Promise<{ menu_config: Record<string, unknown>; dashboard_config: Record<string, unknown>; ui_config?: Record<string, unknown> }> => {
    return fetchClient.get(`/roles/${roleId}/menu-config`);
  },

  /**
   * Update menu config for a specific role
   * BACKEND: PUT /api/v1/roles/{role_id}/menu-config
   * PERMISSION: roles.update
   */
  updateRoleMenuConfig: async (
    roleId: string,
    data: {
      menu_config?: Record<string, unknown>;
      dashboard_config?: Record<string, unknown>;
      ui_config?: Record<string, unknown>;
    }
  ): Promise<void> => {
    return fetchClient.put(`/roles/${roleId}/menu-config`, data);
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default menuConfigApi;
