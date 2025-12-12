/**
 * Notification Template API Service
 * API calls for notification template management
 */

import apiClient from '@/core/api/client'
import type {
  NotificationTemplateCreate,
  NotificationTemplateUpdate,
  NotificationTemplateResponse,
  NotificationTemplateListResponse,
  NotificationTemplateListParams,
  NotificationPreviewRequest,
  NotificationPreviewResponse,
} from '../types/notification-template'

const BASE_URL = '/api/v1/communications/notification-templates'

export const notificationTemplateApi = {
  /**
   * Create a new notification template
   */
  async create(data: NotificationTemplateCreate): Promise<NotificationTemplateResponse> {
    const response = await apiClient.post<NotificationTemplateResponse>(BASE_URL, data)
    return response.data
  },

  /**
   * Get notification template by ID
   */
  async getById(id: number): Promise<NotificationTemplateResponse> {
    const response = await apiClient.get<NotificationTemplateResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Get notification template by code
   */
  async getByCode(code: string): Promise<NotificationTemplateResponse> {
    const response = await apiClient.get<NotificationTemplateResponse>(`${BASE_URL}/code/${code}`)
    return response.data
  },

  /**
   * List notification templates with pagination and filters
   */
  async list(params?: NotificationTemplateListParams): Promise<NotificationTemplateListResponse> {
    const response = await apiClient.get<NotificationTemplateListResponse>(BASE_URL, {
      params,
    })
    return response.data
  },

  /**
   * Update notification template
   */
  async update(id: number, data: NotificationTemplateUpdate): Promise<NotificationTemplateResponse> {
    const response = await apiClient.put<NotificationTemplateResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  /**
   * Delete notification template
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Preview notification with variable substitution
   */
  async preview(request: NotificationPreviewRequest): Promise<NotificationPreviewResponse> {
    const response = await apiClient.post<NotificationPreviewResponse>(
      `${BASE_URL}/preview`,
      request
    )
    return response.data
  },

  /**
   * Get all active notification templates
   */
  async getActive(): Promise<NotificationTemplateResponse[]> {
    const response = await apiClient.get<NotificationTemplateResponse[]>(`${BASE_URL}/active/list`)
    return response.data
  },
}
