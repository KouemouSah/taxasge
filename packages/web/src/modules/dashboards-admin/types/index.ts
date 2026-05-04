/**
 * Types for the dashboards-admin module — mirrors backend
 * app.modules.dashboards.models.{DashboardReportEntry, DashboardConfigDTO, ...}.
 *
 * Keep in sync with:
 *   packages/backend/app/modules/dashboards/models/dashboards.py
 *   packages/backend/app/modules/dashboards/models/dashboard_config.py
 */

export type DashboardRlsMode = 'entity' | 'agent_via_join' | 'admin_only' | 'public'

/**
 * Source of the looker_report_id surfaced to the admin UI.
 * - "db"           → row exists in dashboard_registrations (migration 317)
 * - "env_fallback" → no row, but LOOKER_REPORTS_<id>_REPORT_ID env var is set
 * - "unset"        → no row, no env var (UI prompts admin to configure)
 */
export type DashboardConfigSource = 'db' | 'env_fallback' | 'unset'

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

/**
 * Full admin view of one dashboard config. Includes provenance label
 * + audit fields. Returned by GET /api/v1/dashboards/admin/configs.
 */
export interface DashboardConfigDTO {
  dashboard_id: string
  label: string
  description: string
  rls_mode: DashboardRlsMode
  looker_report_id: string | null
  looker_page_id: string | null
  is_active: boolean
  source: DashboardConfigSource
  /** UUID of the admin who last updated this row (null when source != "db"). */
  updated_by: string | null
  /** ISO datetime string. */
  updated_at: string | null
  created_at: string | null
}

/**
 * PUT body for /api/v1/dashboards/admin/configs/{dashboard_id}.
 * Regex constraints match the BD CHECK constraints (migration 317):
 *   - looker_report_id: ^[a-zA-Z0-9_-]{8,64}$
 *   - looker_page_id  : ^[a-zA-Z0-9_]{1,32}$ (optional)
 */
export interface DashboardConfigUpdateRequest {
  looker_report_id: string
  looker_page_id?: string | null
  is_active: boolean
}

export interface DashboardConfigsListResponse {
  configs: DashboardConfigDTO[]
}
