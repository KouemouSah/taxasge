/**
 * Firebase Storage Utilities
 * Upload, delete, and resize images for ministries
 * Uses backend API for authenticated operations with signed URLs
 *
 * @module lib/firebase-storage
 */

import { appConfig } from '@/core/config/app'
import { getAuthData } from '@/core/auth/storage'

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const FISCAL_SERVICES_API_URL = `${appConfig.api.baseUrl}/api/${appConfig.api.version}/fiscal-services`

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const authData = getAuthData()
  return authData?.access_token || null
}

/**
 * Upload ministry image via backend API
 * Backend resizes to 800x600 and saves as {ministry_code}.jpg
 * @param file - Image file to upload
 * @param ministryId - Ministry numeric ID
 */
export async function uploadMinistryImage(
  file: File,
  ministryId: number
): Promise<UploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      }
    }

    // Get auth token
    const token = getAuthToken()
    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)

    // Upload via backend API
    const response = await fetch(
      `${FISCAL_SERVICES_API_URL}/admin/ministries/${ministryId}/image`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.detail || 'Upload failed',
      }
    }

    return {
      success: true,
      url: data.url,
    }
  } catch (error) {
    console.error('Error uploading ministry image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete ministry image via backend API
 * @param ministryId - Ministry numeric ID
 */
export async function deleteMinistryImage(ministryId: number): Promise<UploadResult> {
  try {
    // Get auth token
    const token = getAuthToken()
    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const response = await fetch(
      `${FISCAL_SERVICES_API_URL}/admin/ministries/${ministryId}/image`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.detail || 'Delete failed',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting ministry image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Get ministry image URL via backend API (public endpoint)
 * Returns signed URL that works without authentication
 * @param ministryId - Ministry numeric ID
 */
export async function getMinistryImageUrl(ministryId: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${FISCAL_SERVICES_API_URL}/ministries/${ministryId}/image`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success && data.url ? data.url : null
  } catch {
    return null
  }
}

/**
 * Get ministry image URL with auth token (admin endpoint)
 * Returns signed URL for authenticated users
 * @param ministryId - Ministry numeric ID
 */
export async function getMinistryImageWithToken(ministryId: number): Promise<string | null> {
  try {
    const token = getAuthToken()
    if (!token) {
      // Fall back to public endpoint
      return getMinistryImageUrl(ministryId)
    }

    const response = await fetch(
      `${FISCAL_SERVICES_API_URL}/admin/ministries/${ministryId}/image`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      // Fall back to public endpoint
      return getMinistryImageUrl(ministryId)
    }

    const data = await response.json()
    return data.success && data.url ? data.url : null
  } catch {
    return null
  }
}

/**
 * Check if ministry image exists
 * @param ministryId - Ministry numeric ID
 */
export async function checkMinistryImageExists(ministryId: number): Promise<boolean> {
  const url = await getMinistryImageUrl(ministryId)
  return url !== null
}
