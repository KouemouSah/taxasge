/**
 * Dashboards admin API service.
 *
 * Aligned with packages/backend/app/modules/dashboards/api/dashboards_routes.py.
 * - GET  /dashboards/reports-config         → public landing (dashboards.view_business)
 * - GET  /dashboards/admin/configs          → admin only (dashboards.manage)
 * - PUT  /dashboards/admin/configs/{id}     → admin only (dashboards.manage)
 */

import { fetchClient } from '@/core/api'
import type {
  DashboardConfigDTO,
  DashboardConfigUpdateRequest,
  DashboardConfigsListResponse,
  DashboardReportsConfigResponse,
} from '../types'

export const dashboardsAdminApi = {
  /**
   * GET /dashboards/reports-config — list of Looker reports the caller
   * is allowed to embed. Backend gates on dashboards.view_business
   * permission; a user without it gets 403.
   */
  getReportsConfig: async (): Promise<DashboardReportsConfigResponse> => {
    return fetchClient.get<DashboardReportsConfigResponse>('/dashboards/reports-config')
  },

  /**
   * GET /dashboards/admin/configs — admin-only list of dashboard configs
   * with source provenance + audit fields.
   * Returns 403 if the caller lacks `dashboards.manage`.
   */
  listAdminConfigs: async (): Promise<DashboardConfigsListResponse> => {
    return fetchClient.get<DashboardConfigsListResponse>('/dashboards/admin/configs')
  },

  /**
   * PUT /dashboards/admin/configs/{dashboard_id} — UPSERT one dashboard's
   * Looker config. Backend invalidates the /reports-config cache on success.
   *
   * Errors:
   *   - 403: missing `dashboards.manage` permission
   *   - 404: dashboard_id not in registry
   *   - 422: regex validation failed (frontend Zod should catch first)
   *   - 429: rate limit (10 PUT/min/user)
   */
  updateAdminConfig: async (
    dashboardId: string,
    body: DashboardConfigUpdateRequest,
  ): Promise<DashboardConfigDTO> => {
    return fetchClient.put<DashboardConfigDTO>(
      `/dashboards/admin/configs/${dashboardId}`,
      body,
    )
  },
}
