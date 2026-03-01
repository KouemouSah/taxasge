import apiClient from '@/core/api/client'

// ============================================================================
// OPERATIONS CENTER TYPES
// ============================================================================

export interface PaymentEntityRow {
  entity_code: string
  pending_count: number
  pending_amount: number
  avg_wait_hours: number
  sla_violated_count: number
}

export interface OperationsDashboard {
  payments: {
    by_entity: PaymentEntityRow[]
    total_pending: number
    total_pending_amount: number
  }
  agents: {
    total_agents: number
    agents_available: number
    agents_overloaded: number
    agents_unavailable: number
    agents_inactive_48h: number
    avg_capacity: number
  }
  pipeline: {
    submitted: number
    under_review: number
    in_progress: number
    payment_phase: number
    paid: number
    active_escalations: number
    high_priority: number
    new_24h: number
    completed_24h: number
  }
  stale_locks: number
  pool: {
    max_size: number
    current_size: number
    free: number
    used: number
  } | null
  fetched_at: string
}

export interface IntegrationStatus {
  status: string
  type?: string
  enabled?: boolean
  response_ms?: number | null
}

export interface IntegrationsHealth {
  database: IntegrationStatus
  redis: IntegrationStatus
  bange: IntegrationStatus
  gemini: IntegrationStatus
  checked_at: string
}

export interface CronTriggerResult {
  job: string
  result: Record<string, unknown>
  triggered_by: string
  triggered_at: string
}

// ============================================================================
// LEGACY TYPES (kept for backward compatibility)
// ============================================================================

export interface SlowQuery {
  queryid: number
  query_preview: string
  calls: number
  total_exec_time_ms: number
  mean_exec_time_ms: number
  max_exec_time_ms: number
  stddev_exec_time_ms: number
  total_rows: number
  shared_blks_hit: number
  shared_blks_read: number
  cache_hit_ratio: number | null
}

export interface FrequentQuery {
  queryid: number
  query_preview: string
  calls: number
  total_exec_time_ms: number
  mean_exec_time_ms: number
  total_rows: number
  cache_hit_ratio: number | null
}

export interface PoolStats {
  min_size: number
  max_size: number
  current_size: number
  free_connections: number
  used_connections: number
}

export interface TableStat {
  table_name: string
  total_size: string
  data_size: string
  index_size: string
  row_estimate: number
}

export interface UnusedIndex {
  schemaname: string
  table_name: string
  index_name: string
  size: string
  scan_count: number
}

export interface LockCount {
  mode: string
  count: number
  granted: boolean
}

export interface ActiveConnection {
  pid: number
  state: string
  query: string
  query_seconds: number
  wait_event_type: string | null
  wait_event: string | null
}

// ============================================================================
// API METHODS
// ============================================================================

export const monitoringApi = {
  // --- Operations Center ---
  async getOperationsDashboard() {
    const response = await apiClient.get<OperationsDashboard>(
      '/admin/monitoring/operations/dashboard'
    )
    return response.data
  },

  async getIntegrationsHealth() {
    const response = await apiClient.get<IntegrationsHealth>(
      '/admin/monitoring/operations/integrations'
    )
    return response.data
  },

  async triggerCronJob(jobName: string) {
    const response = await apiClient.post<CronTriggerResult>(
      `/admin/monitoring/operations/trigger/${jobName}`
    )
    return response.data
  },

  // --- Legacy endpoints (kept as fallback) ---
  async getSlowQueries(limit = 20, minCalls = 5) {
    const response = await apiClient.get<{
      queries: SlowQuery[]
      total_tracked: number
    }>('/admin/monitoring/slow-queries', {
      params: { limit, min_calls: minCalls },
    })
    return response.data
  },

  async getFrequentQueries(limit = 20) {
    const response = await apiClient.get<{
      queries: FrequentQuery[]
    }>('/admin/monitoring/frequent-queries', { params: { limit } })
    return response.data
  },

  async getPoolStats() {
    const response = await apiClient.get<PoolStats>(
      '/admin/monitoring/connection-pool'
    )
    return response.data
  },

  async getDatabaseStats() {
    const response = await apiClient.get<{
      tables: TableStat[]
      unused_indexes: UnusedIndex[]
    }>('/admin/monitoring/database-stats')
    return response.data
  },

  async getLockStatus() {
    const response = await apiClient.get<{
      active_connections: ActiveConnection[]
      lock_counts: LockCount[]
    }>('/admin/monitoring/lock-status')
    return response.data
  },
}
