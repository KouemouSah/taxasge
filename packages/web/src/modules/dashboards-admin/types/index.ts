/**
 * Types for the dashboards-admin module — mirrors backend
 * app.modules.dashboards.models.DashboardReportEntry / DashboardReportsConfigResponse.
 *
 * Keep in sync with packages/backend/app/modules/dashboards/models/dashboards.py.
 */

export type DashboardRlsMode = 'entity' | 'agent_via_join' | 'admin_only' | 'public'

export interface DashboardReportEntry {
  dashboard_id: string
  label: string
  description: string
  /** null when the operator has not yet built a Looker report for this dashboard. */
  looker_report_id: string | null
  looker_page_id: string | null
  rls_mode: DashboardRlsMode
}

export interface DashboardReportsConfigResponse {
  reports: DashboardReportEntry[]
}
