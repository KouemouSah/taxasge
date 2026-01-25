/**
 * Menu Configuration API Service
 * Handles menu templates, workflow mappings, and role menu configuration
 *
 * @module admin/services
 * @date 2026-01-19
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/menu-config (from app/modules/menu_config/api/menu_config_routes.py)
 * - GET    /api/v1/menu-config/me                    → get_my_menu_config
 * - GET    /api/v1/menu-config/templates             → list_menu_templates
 * - POST   /api/v1/menu-config/templates             → create_menu_template
 * - GET    /api/v1/menu-config/templates/{id}        → get_menu_template
 * - PUT    /api/v1/menu-config/templates/{id}        → update_menu_template
 * - DELETE /api/v1/menu-config/templates/{id}        → delete_menu_template
 * - GET    /api/v1/menu-config/workflow-mappings     → list_workflow_mappings
 * - POST   /api/v1/menu-config/workflow-mappings     → create_workflow_mapping
 * - PUT    /api/v1/menu-config/workflow-mappings/{id} → update_workflow_mapping
 * - DELETE /api/v1/menu-config/workflow-mappings/{id} → delete_workflow_mapping
 */

import { fetchClient } from '@/core/api';
import type {
  MenuTemplate,
  MenuTemplateListResponse,
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

export interface MenuTemplateCreateRequest {
  code: string;
  name: string;
  description?: string;
  template_type: 'workflow' | 'module' | 'custom';
  entity_code?: string;
  menu_structure: Record<string, unknown>;
  dashboard_widgets?: Record<string, unknown>;
}

export interface MenuTemplateUpdateRequest {
  name?: string;
  description?: string;
  menu_structure?: Record<string, unknown>;
  dashboard_widgets?: Record<string, unknown>;
  is_active?: boolean;
}

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
  // MENU TEMPLATES
  // ===========================================================================

  /**
   * List all menu templates with pagination
   * BACKEND: GET /api/v1/menu-config/templates
   * PERMISSION: menu.view_templates
   */
  listTemplates: async (
    params?: PaginationParams
  ): Promise<MenuTemplateListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());

    const query = searchParams.toString();
    const url = query ? `${MENU_CONFIG_BASE}/templates?${query}` : `${MENU_CONFIG_BASE}/templates`;

    return fetchClient.get<MenuTemplateListResponse>(url);
  },

  /**
   * Get a single menu template by ID
   * BACKEND: GET /api/v1/menu-config/templates/{id}
   * PERMISSION: menu.view_templates
   */
  getTemplate: async (id: string): Promise<MenuTemplate> => {
    return fetchClient.get<MenuTemplate>(`${MENU_CONFIG_BASE}/templates/${id}`);
  },

  /**
   * Create a new menu template
   * BACKEND: POST /api/v1/menu-config/templates
   * PERMISSION: menu.create_template
   */
  createTemplate: async (
    data: MenuTemplateCreateRequest
  ): Promise<MenuTemplate> => {
    return fetchClient.post<MenuTemplate>(`${MENU_CONFIG_BASE}/templates`, data);
  },

  /**
   * Update an existing menu template
   * BACKEND: PUT /api/v1/menu-config/templates/{id}
   * PERMISSION: menu.update_template
   */
  updateTemplate: async (
    id: string,
    data: MenuTemplateUpdateRequest
  ): Promise<MenuTemplate> => {
    return fetchClient.put<MenuTemplate>(`${MENU_CONFIG_BASE}/templates/${id}`, data);
  },

  /**
   * Delete a menu template
   * BACKEND: DELETE /api/v1/menu-config/templates/{id}
   * PERMISSION: menu.delete_template
   */
  deleteTemplate: async (id: string): Promise<void> => {
    return fetchClient.delete(`${MENU_CONFIG_BASE}/templates/${id}`);
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
