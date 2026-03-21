import apiClient from '@/core/api/client'
import type {
  Inspection,
  InspectionListResponse,
  InspectionStats,
  SupervisorDashboard,
  ReconciliationResponse,
  LicenseVerification,
} from '../types'

export const inspectionApi = {
  // ============================================================
  // CRUD
  // ============================================================

  create: (data: { license_id: string; company_id: string; notes?: string }) =>
    apiClient.post<Inspection>('/inspections/', data).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Inspection>(`/inspections/${id}`).then(r => r.data),

  update: (id: string, data: {
    activity_conforme?: boolean
    activity_declared?: string
    activity_observed?: string
    photos?: string[]
    gps_latitude?: number
    gps_longitude?: number
    gps_accuracy?: number
    notes?: string
  }) =>
    apiClient.put<Inspection>(`/inspections/${id}`, data).then(r => r.data),

  list: (params?: {
    inspection_date?: string
    status?: string
    page?: number
    page_size?: number
  }) => {
    const sp = new URLSearchParams()
    if (params?.inspection_date) sp.set('inspection_date', params.inspection_date)
    if (params?.status) sp.set('status', params.status)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const q = sp.toString()
    return apiClient
      .get<InspectionListResponse>(`/inspections${q ? `?${q}` : ''}`)
      .then(r => r.data)
  },

  // ============================================================
  // ACTIONS
  // ============================================================

  complete: (id: string, data?: { notes?: string }) =>
    apiClient.post<Inspection>(`/inspections/${id}/complete`, data || {}).then(r => r.data),

  miseEnDemeure: (id: string, data: {
    obligation_ids: string[]
    deadline_hours?: number
    notes?: string
  }) =>
    apiClient.post<Inspection>(`/inspections/${id}/mise-en-demeure`, data).then(r => r.data),

  proposeSeal: (id: string, data: {
    reason: string
    notes?: string
    photo?: string
  }) =>
    apiClient.post<Inspection>(`/inspections/${id}/seal`, data).then(r => r.data),

  approveSeal: (id: string, data: { approved: boolean; notes?: string }) =>
    apiClient.post<Inspection>(`/inspections/${id}/seal/approve`, data).then(r => r.data),

  collectPayment: (id: string, data: {
    obligation_ids: string[]
    method: 'cash' | 'mobile_money'
    amount: number
    phone_number?: string
    notes?: string
  }) =>
    apiClient.post(`/inspections/${id}/collect`, data).then(r => r.data),

  // ============================================================
  // STATS & DASHBOARD
  // ============================================================

  getStats: (params?: { date_from?: string; date_to?: string }) => {
    const sp = new URLSearchParams()
    if (params?.date_from) sp.set('date_from', params.date_from)
    if (params?.date_to) sp.set('date_to', params.date_to)
    const q = sp.toString()
    return apiClient
      .get<InspectionStats>(`/inspections/stats${q ? `?${q}` : ''}`)
      .then(r => r.data)
  },

  getSupervisorDashboard: () =>
    apiClient.get<SupervisorDashboard>('/inspections/supervisor/dashboard').then(r => r.data),

  getReconciliation: (targetDate?: string) => {
    const sp = new URLSearchParams()
    if (targetDate) sp.set('target_date', targetDate)
    const q = sp.toString()
    return apiClient
      .get<ReconciliationResponse>(`/inspections/reconcile${q ? `?${q}` : ''}`)
      .then(r => r.data)
  },

  // ============================================================
  // VERIFY LICENSE
  // ============================================================

  verifyLicense: (params: { license_id?: string; nif?: string }) => {
    const sp = new URLSearchParams()
    if (params.license_id) sp.set('license_id', params.license_id)
    if (params.nif) sp.set('nif', params.nif)
    return apiClient
      .get<LicenseVerification>(`/inspections/verify?${sp.toString()}`)
      .then(r => r.data)
  },
}
