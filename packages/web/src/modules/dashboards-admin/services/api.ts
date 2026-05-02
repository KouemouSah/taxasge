/**
 * Dashboards admin API service.
 *
 * Aligned with packages/backend/app/modules/dashboards/api/dashboards_routes.py
 * — specifically GET /api/v1/dashboards/reports-config which the landing
 * page calls to know which Looker reports are wired (and which still
 * need operator setup).
 */

import { fetchClient } from '@/core/api'
import type { DashboardReportsConfigResponse } from '../types'

export const dashboardsAdminApi = {
  /**
   * GET /dashboards/reports-config — list of Looker reports the caller
   * is allowed to embed. Backend gates on dashboards.view_business
   * permission; a user without it gets 403.
   */
  getReportsConfig: async (): Promise<DashboardReportsConfigResponse> => {
    // fetchClient.get<T>() returns T directly, not an axios { data: T } wrapper.
    return fetchClient.get<DashboardReportsConfigResponse>('/dashboards/reports-config')
  },
}
