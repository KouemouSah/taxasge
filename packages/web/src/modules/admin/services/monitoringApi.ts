import apiClient from '@/core/api/client'

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

export const monitoringApi = {
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
