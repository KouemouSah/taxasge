/**
 * Bundle Workflow API Client
 * Endpoints for BUNDLE_PAYMENT workflow (citizen-facing).
 * Uses shared apiClient (Axios) with automatic token refresh + Accept-Language.
 */

import apiClient from '@/core/api/client'
import { transformKeys, toSnakeCase } from '@/core/utils/api-transform'

import type {
  BundleInitiateResponse,
  BundleValidateSelectionResponse,
  BundlePaymentResult,
  MyCompaniesResponse,
  SearchCompanyResponse,
} from '../types'

const BASE = '/bundle-workflow'

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) searchParams.set(k, String(v))
    }
  }
  const query = searchParams.toString()
  const url = query ? `${BASE}${path}?${query}` : `${BASE}${path}`
  const { data } = await apiClient.get(url)
  return transformKeys<T>(data)
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post(
    `${BASE}${path}`,
    body ? toSnakeCase(body) : undefined,
  )
  return transformKeys<T>(data)
}

// ========== Bundle Workflow API ==========

export const bundleWorkflowApi = {
  /**
   * Get user's companies with pending obligation counts (max 5).
   * Sorted by urgency (pending obligations first).
   */
  getMyCompanies: (fiscalYear?: number): Promise<MyCompaniesResponse> =>
    get('/my-companies', { fiscal_year: fiscalYear }),

  /**
   * Search companies eligible for bundle payment.
   * Filters: regimen_fiscal='bundle', is_active=true.
   */
  searchCompany: (q: string, limit: number = 10): Promise<SearchCompanyResponse> =>
    get('/search-company', { q, limit }),

  /**
   * Verify company, find/create license, return obligations for review.
   * Main entry point after company identification.
   */
  initiate: (companyId: string, fiscalYear?: number): Promise<BundleInitiateResponse> =>
    post('/initiate', { companyId, fiscalYear }),

  /**
   * Create company from OCR extraction, classify, then initiate workflow.
   * Used when user uploads certificado padrón for a new company.
   */
  initiateFromUpload: (
    extraction: Record<string, unknown>,
    fiscalYear?: number,
  ): Promise<BundleInitiateResponse> =>
    post('/initiate-from-upload', { extraction, fiscalYear }),

  /**
   * Validate mode + obligation selection before payment.
   */
  validateSelection: (
    licenseId: string,
    processingMode: string,
    selectedObligationIds?: string[],
  ): Promise<BundleValidateSelectionResponse> =>
    post('/validate-selection', {
      licenseId,
      processingMode,
      selectedObligationIds,
    }),

  /**
   * Create service_request + service_payment + link obligations (atomic).
   * For mobile_money: returns redirect_url (BANGE).
   * For cash: returns payment reference for agent validation.
   */
  initiatePayment: (params: {
    licenseId: string
    processingMode: string
    paymentMethod: string
    selectedObligationIds: string[]
    phoneNumber?: string
    wizardSessionId?: string
  }): Promise<BundlePaymentResult> =>
    post('/initiate-payment', params),
}
