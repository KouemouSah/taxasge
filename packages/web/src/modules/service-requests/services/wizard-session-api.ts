/**
 * Wizard Session API Client - Cache-First Architecture
 *
 * Follows the ServiceRequestsApiClient pattern for consistency.
 * All endpoints target /api/v1/wizard-sessions.
 *
 * @since v2.0 - Cache-first wizard migration
 * @see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
 */

import { getAuthData } from '@/core/auth/storage'
import type {
  BackendWizardSessionResponse,
  BackendDocumentPreviewResponse,
  BackendPreparePaymentResponse,
  BackendPersistResult,
  BackendInitiatePaymentResponse,
  WizardSession,
  DocumentPreview,
  PreparePaymentResult,
  PersistResult,
  InitiatePaymentResult,
  WizardSessionCreateRequest,
  DocumentConfirmRequest,
  FormDataSaveRequest,
} from '../types/wizard-session'
import type { FormConfigResponse } from '../types/form-config'
import {
  transformSession,
  transformDocumentPreview,
  transformPreparePayment,
  transformPersistResult,
  transformInitiatePayment,
} from '../types/wizard-session'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'
const ENDPOINT_BASE = '/wizard-sessions'

// ============================================================================
// WIZARD SESSION API CLIENT
// ============================================================================

class WizardSessionApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}${ENDPOINT_BASE}`
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    const authData = getAuthData()
    return authData?.access_token || null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(`[WizardSession] ${options.method || 'GET'} ${url}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`[WizardSession] Response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `API Error: ${response.status}`
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (typeof errorData.detail === 'object') {
            const locale =
              typeof window !== 'undefined'
                ? document.documentElement.lang || 'es'
                : 'es'
            errorMessage =
              (locale === 'es'
                ? errorData.detail.message_es
                : locale === 'fr'
                  ? errorData.detail.message_fr
                  : errorData.detail.message_en) ||
              errorData.detail.message ||
              errorData.detail.msg ||
              JSON.stringify(errorData.detail)
          }
        }
        console.error(`[WizardSession] Error: ${errorMessage}`)
        throw new Error(errorMessage)
      }

      if (response.status === 204) {
        return {} as T
      }

      const data = await response.json()
      console.log(`[WizardSession] Success`)
      return data
    } catch (error) {
      console.error(`[WizardSession] Fetch error:`, error)
      throw error
    }
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(`[WizardSession] UPLOAD ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      let errorMessage = `Upload Error: ${response.status}`
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (typeof errorData.detail === 'object') {
          const locale =
            typeof window !== 'undefined'
              ? document.documentElement.lang || 'es'
              : 'es'
          errorMessage =
            (locale === 'es'
              ? errorData.detail.message_es
              : locale === 'fr'
                ? errorData.detail.message_fr
                : errorData.detail.message_en) ||
            errorData.detail.message ||
            errorData.detail.msg ||
            JSON.stringify(errorData.detail)
        }
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // ==========================================================================
  // SESSION LIFECYCLE
  // ==========================================================================

  /**
   * Start a new wizard session (cache only, no DB write).
   * POST /wizard-sessions
   */
  async createSession(
    data: WizardSessionCreateRequest
  ): Promise<WizardSession> {
    const raw = await this.request<BackendWizardSessionResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return transformSession(raw)
  }

  /**
   * Get existing wizard session state.
   * GET /wizard-sessions/{sessionId}
   */
  async getSession(sessionId: string): Promise<WizardSession> {
    const raw = await this.request<BackendWizardSessionResponse>(
      `/${sessionId}`
    )
    return transformSession(raw)
  }

  /**
   * Cancel and delete a wizard session.
   * DELETE /wizard-sessions/{sessionId}
   */
  async cancelSession(sessionId: string, reason?: string): Promise<void> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    await this.request<Record<string, never>>(`/${sessionId}${params}`, {
      method: 'DELETE',
    })
  }

  // ==========================================================================
  // DOCUMENT OPERATIONS
  // ==========================================================================

  /**
   * Upload and preview document extraction.
   * POST /wizard-sessions/{sessionId}/documents/preview?document_code=xxx
   */
  async previewDocument(
    sessionId: string,
    documentCode: string,
    file: File
  ): Promise<DocumentPreview> {
    const formData = new FormData()
    formData.append('file', file)

    const raw = await this.uploadRequest<BackendDocumentPreviewResponse>(
      `/${sessionId}/documents/preview?document_code=${encodeURIComponent(documentCode)}`,
      formData
    )
    return transformDocumentPreview(raw)
  }

  /**
   * Confirm document extraction with optional corrections.
   * POST /wizard-sessions/{sessionId}/documents/confirm
   */
  async confirmDocument(
    sessionId: string,
    data: DocumentConfirmRequest
  ): Promise<WizardSession> {
    const raw = await this.request<BackendWizardSessionResponse>(
      `/${sessionId}/documents/confirm`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
    return transformSession(raw)
  }

  /**
   * Delete a document from wizard session.
   * DELETE /wizard-sessions/{sessionId}/documents/{documentCode}
   */
  async deleteDocument(
    sessionId: string,
    documentCode: string
  ): Promise<WizardSession> {
    const raw = await this.request<BackendWizardSessionResponse>(
      `/${sessionId}/documents/${encodeURIComponent(documentCode)}`,
      { method: 'DELETE' }
    )
    return transformSession(raw)
  }

  // ==========================================================================
  // FORM DATA
  // ==========================================================================

  /**
   * Save form data to session.
   * PUT /wizard-sessions/{sessionId}/form-data
   */
  async saveFormData(
    sessionId: string,
    data: FormDataSaveRequest
  ): Promise<WizardSession> {
    const raw = await this.request<BackendWizardSessionResponse>(
      `/${sessionId}/form-data`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    )
    return transformSession(raw)
  }

  // ==========================================================================
  // FORM CONFIG (Dynamic rendering)
  // ==========================================================================

  /**
   * Get dynamic form configuration for a session step.
   * GET /wizard-sessions/{sessionId}/form-config/{stepId}
   */
  async getFormConfig(
    sessionId: string,
    stepId: string
  ): Promise<FormConfigResponse> {
    return this.request<FormConfigResponse>(
      `/${sessionId}/form-config/${encodeURIComponent(stepId)}`
    )
  }

  // ==========================================================================
  // PAYMENT FLOW
  // ==========================================================================

  /**
   * Validate session and calculate tariff for payment.
   * POST /wizard-sessions/{sessionId}/prepare-payment
   */
  async preparePayment(
    sessionId: string
  ): Promise<PreparePaymentResult> {
    const raw = await this.request<BackendPreparePaymentResponse>(
      `/${sessionId}/prepare-payment`,
      { method: 'POST' }
    )
    return transformPreparePayment(raw)
  }

  /**
   * Persist session to database (atomic transaction).
   * POST /wizard-sessions/{sessionId}/persist
   */
  async persistSession(
    sessionId: string,
    paymentId?: string
  ): Promise<PersistResult> {
    const params = paymentId
      ? `?payment_id=${encodeURIComponent(paymentId)}`
      : ''
    const raw = await this.request<BackendPersistResult>(
      `/${sessionId}/persist${params}`,
      { method: 'POST' }
    )
    return transformPersistResult(raw)
  }

  /**
   * Atomically persist session + initiate payment (single endpoint).
   * POST /wizard-sessions/{sessionId}/initiate-payment
   *
   * Replaces the two-call pattern (persist + initiate-payment) with
   * a single atomic operation. On failure, session stays in cache for retry.
   */
  async initiatePayment(
    sessionId: string,
    paymentMethod: string,
    phoneNumber?: string,
  ): Promise<InitiatePaymentResult> {
    const raw = await this.request<BackendInitiatePaymentResponse>(
      `/${sessionId}/initiate-payment`,
      {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          phone_number: phoneNumber || null,
        }),
      }
    )
    return transformInitiatePayment(raw)
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const wizardSessionApi = new WizardSessionApiClient()
