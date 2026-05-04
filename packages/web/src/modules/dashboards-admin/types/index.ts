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

/**
 * Provider type for the embed iframe.
 * Mirrors backend `DashboardProvider` (mig 319).
 */
export type DashboardProvider = 'looker_studio' | 'grafana'

export interface DashboardReportEntry {
  dashboard_id: string
  label: string
  description: string
  rls_mode: DashboardRlsMode
  /** Active provider — looker_studio (default) or grafana. */
  provider: DashboardProvider
  /** Looker Studio fields. Null when provider != looker_studio or unset. */
  looker_report_id: string | null
  looker_page_id: string | null
  /** Grafana fields. Null when provider != grafana or unset. */
  grafana_dashboard_uid: string | null
  grafana_org_id: number
  /**
   * Backend-computed iframe URL. The frontend should use this directly;
   * fallback to local URL builders only if this is null (legacy).
   */
  embed_url: string | null
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

  /** Active provider — looker_studio (default) or grafana. */
  provider: DashboardProvider

  /** Looker Studio fields. Used when provider == 'looker_studio'. */
  looker_report_id: string | null
  looker_page_id: string | null

  /** Grafana fields. Used when provider == 'grafana'. */
  grafana_dashboard_uid: string | null
  grafana_org_id: number

  is_active: boolean
  source: DashboardConfigSource

  /** Backend-computed iframe URL for the active provider. */
  embed_url: string | null

  /** UUID of the admin who last updated this row (null when source != "db"). */
  updated_by: string | null
  /** ISO datetime string. */
  updated_at: string | null
  created_at: string | null
}

/**
 * PUT body for /api/v1/dashboards/admin/configs/{dashboard_id}.
 * Regex constraints match the BD CHECK constraints (migrations 317 + 319):
 *   - looker_report_id     : ^[a-zA-Z0-9_-]{8,64}$  (required if provider=looker_studio)
 *   - looker_page_id       : ^[a-zA-Z0-9_]{1,32}$   (optional)
 *   - grafana_dashboard_uid: ^[a-zA-Z0-9_-]{4,40}$  (required if provider=grafana)
 *   - grafana_org_id       : 1..999
 */
export interface DashboardConfigUpdateRequest {
  provider: DashboardProvider
  looker_report_id?: string | null
  looker_page_id?: string | null
  grafana_dashboard_uid?: string | null
  grafana_org_id?: number
  is_active: boolean
}

export interface DashboardConfigsListResponse {
  configs: DashboardConfigDTO[]
}
