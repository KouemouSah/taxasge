/**
 * OMS API Service — Obligations Management System
 *
 * Uses authenticated apiClient (Axios with token refresh).
 * Two base paths:
 *   /oms    — Agent queue operations
 *   /licenses — License CRUD + obligations
 */

import apiClient from '@/core/api/client'
import type {
  AgentQueueResponse, AgentQueueStats,
  LicenseListResponse, LicenseResponse, LicenseStats,
  ObligationResponse, ObligationListResponse,
  ComplianceSummaryResponse,
  TeamPerformanceResponse,
} from '../types'

// ========== Queue API (agent processing) ==========

export const omsQueueApi = {
  getQueue: (params?: { status?: string; fee_type?: string; search?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams()
    if (params?.status) sp.set('status', params.status)
    if (params?.fee_type) sp.set('fee_type', params.fee_type)
    if (params?.search) sp.set('search', params.search)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const q = sp.toString()
    return apiClient.get<AgentQueueResponse>(`/oms/queue${q ? `?${q}` : ''}`).then(r => r.data)
  },

  getStats: () =>
    apiClient.get<AgentQueueStats>('/oms/queue/stats').then(r => r.data),

  processObligation: (id: string, data?: { issued_document_id?: string; notes?: string }) =>
    apiClient.post<ObligationResponse>(`/oms/obligations/${id}/process`, data || {}).then(r => r.data),

  rejectObligation: (id: string, data: { reason: string }) =>
    apiClient.post<ObligationResponse>(`/oms/obligations/${id}/reject`, data).then(r => r.data),

  batchProcess: (ids: string[], issued_document_id?: string) =>
    apiClient.post('/oms/obligations/batch-process', { obligation_ids: ids, issued_document_id }).then(r => r.data),

  getObligation: (id: string) =>
    apiClient.get<ObligationResponse>(`/oms/obligations/${id}`).then(r => r.data),

  getObligationEvents: (id: string, page = 1) =>
    apiClient.get(`/oms/obligations/${id}/events?page=${page}`).then(r => r.data),

  getTeamPerformance: (params?: { period_days?: number; fiscal_year?: number }) => {
    const sp = new URLSearchParams()
    if (params?.period_days) sp.set('period_days', String(params.period_days))
    if (params?.fiscal_year) sp.set('fiscal_year', String(params.fiscal_year))
    const q = sp.toString()
    return apiClient.get<TeamPerformanceResponse>(`/oms/team/performance${q ? `?${q}` : ''}`).then(r => r.data)
  },
}

// ========== Licenses API ==========
//
// Cold-start tolerance (Bug 2 fix 2026-05-13):
// `Licencias > Vista General` was reporting "error al cargar licencias"
// after redeploys. Same root cause as the homepage cold-start issue:
// Cloud Run scales to zero on staging during quiet windows, the first
// hit after idle takes 5-15s to boot, and the default 30s axios timeout
// races the boot. Read endpoints are idempotent — safe to retry.
const LICENSES_TIMEOUT_MS = 45_000;
const LICENSES_RETRY_DELAYS = [2_000, 5_000];

function isAxiosTimeout(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return e.code === 'ECONNABORTED' || (e.message?.includes('timeout') ?? false);
}

async function withRetryOnTimeout<T>(attempt: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= LICENSES_RETRY_DELAYS.length; i++) {
    try { return await attempt(); }
    catch (err) {
      lastErr = err;
      if (i >= LICENSES_RETRY_DELAYS.length || !isAxiosTimeout(err)) throw err;
      await new Promise(r => setTimeout(r, LICENSES_RETRY_DELAYS[i]));
    }
  }
  throw lastErr;
}

export const omsLicensesApi = {
  list: (params?: { company_id?: string; bundle_id?: string; fiscal_year?: number; status?: string; search?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams()
    if (params?.company_id) sp.set('company_id', params.company_id)
    if (params?.bundle_id) sp.set('bundle_id', params.bundle_id)
    if (params?.fiscal_year) sp.set('fiscal_year', String(params.fiscal_year))
    if (params?.status) sp.set('status', params.status)
    if (params?.search) sp.set('search', params.search)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const q = sp.toString()
    return withRetryOnTimeout(() =>
      apiClient.get<LicenseListResponse>(`/licenses${q ? `?${q}` : ''}`, {
        timeout: LICENSES_TIMEOUT_MS,
      })
    ).then(r => r.data)
  },

  getStats: (fiscal_year?: number) => {
    const q = fiscal_year ? `?fiscal_year=${fiscal_year}` : ''
    return withRetryOnTimeout(() =>
      apiClient.get<LicenseStats>(`/licenses/stats${q}`, {
        timeout: LICENSES_TIMEOUT_MS,
      })
    ).then(r => r.data)
  },

  get: (id: string) =>
    apiClient.get<LicenseResponse>(`/licenses/${id}`).then(r => r.data),

  getObligations: (id: string, params?: { fee_type?: string; status?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams()
    if (params?.fee_type) sp.set('fee_type', params.fee_type)
    if (params?.status) sp.set('status', params.status)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const q = sp.toString()
    return apiClient.get<ObligationListResponse>(`/licenses/${id}/obligations${q ? `?${q}` : ''}`).then(r => r.data)
  },

  getSummary: (id: string) =>
    apiClient.get(`/licenses/${id}/obligations/summary`).then(r => r.data),

  getEvents: (id: string, page = 1) =>
    apiClient.get(`/licenses/${id}/events?page=${page}`).then(r => r.data),

  downloadPDF: (id: string, lang = 'es') =>
    apiClient.get(`/licenses/${id}/download-pdf?language=${lang}`, { responseType: 'blob' }).then(r => r.data),

  renew: (id: string, data: { fiscal_year: number }) =>
    apiClient.post<LicenseResponse>(`/licenses/${id}/renew`, data).then(r => r.data),

  getComplianceSummary: (fiscal_year: number) =>
    withRetryOnTimeout(() =>
      apiClient.get<ComplianceSummaryResponse>(
        `/licenses/compliance-summary?fiscal_year=${fiscal_year}`,
        { timeout: LICENSES_TIMEOUT_MS },
      )
    ).then(r => r.data),
}
