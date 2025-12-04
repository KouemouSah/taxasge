/**
 * Shared Fetch-based API Client
 * For modules that don't use axios
 *
 * @module core/api
 * @author Claude Code
 * @date 2025-11-26
 *
 * Features:
 * - Standardized auth token retrieval via getAuthData()
 * - Automatic Content-Type headers
 * - Error handling with proper messages
 * - Support for all HTTP methods
 */

import { getAuthData } from '@/core/auth/storage'
import { appConfig } from '@/core/config/app'

// =============================================================================
// TYPES
// =============================================================================

export interface FetchClientOptions {
  baseUrl?: string
  defaultHeaders?: Record<string, string>
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

// =============================================================================
// FETCH CLIENT CLASS
// =============================================================================

export class FetchClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(options: FetchClientOptions = {}) {
    this.baseUrl = options.baseUrl || `${appConfig.api.baseUrl}/api/v1`
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    }
  }

  /**
   * Get auth token from storage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    const authData = getAuthData()
    return authData?.access_token || null
  }

  /**
   * Public getter for baseUrl (for multipart uploads)
   */
  public getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Public getter for auth token (for multipart uploads)
   */
  public getAuthToken(): string | null {
    return this.getToken()
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Make a request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, body, headers: customHeaders, ...fetchOptions } = options

    const url = this.buildUrl(endpoint, params)
    const token = this.getToken()

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Merge custom headers
    if (customHeaders) {
      const headersToMerge = customHeaders instanceof Headers
        ? Object.fromEntries(customHeaders.entries())
        : Array.isArray(customHeaders)
        ? Object.fromEntries(customHeaders)
        : customHeaders
      Object.assign(headers, headersToMerge)
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }))

        // Properly stringify error message - handle objects, arrays, and strings
        let errorMessage: string
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          // Handle FastAPI validation errors (array of objects) or nested error objects
          errorMessage = JSON.stringify(errorData.detail)
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, params })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const fetchClient = new FetchClient()

export default fetchClient
