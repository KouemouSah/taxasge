/**
 * Firebase Storage Utilities
 * Upload, delete, and resize images for ministries
 *
 * @module lib/firebase-storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

// Constants
const MINISTRIES_FOLDER = 'application-attachments/ministerios'
const TARGET_WIDTH = 800
const TARGET_HEIGHT = 600
const IMAGE_QUALITY = 0.85
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Resize image to target dimensions (800x600) maintaining aspect ratio
 * Uses canvas API for client-side resizing
 */
export async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Set canvas dimensions to target size
      canvas.width = TARGET_WIDTH
      canvas.height = TARGET_HEIGHT

      // Calculate scaling to cover the target dimensions (crop if needed)
      const sourceAspect = img.width / img.height
      const targetAspect = TARGET_WIDTH / TARGET_HEIGHT

      let sourceX = 0
      let sourceY = 0
      let sourceWidth = img.width
      let sourceHeight = img.height

      if (sourceAspect > targetAspect) {
        // Image is wider - crop horizontally
        sourceWidth = img.height * targetAspect
        sourceX = (img.width - sourceWidth) / 2
      } else {
        // Image is taller - crop vertically
        sourceHeight = img.width / targetAspect
        sourceY = (img.height - sourceHeight) / 2
      }

      // Draw the image with cropping
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, TARGET_WIDTH, TARGET_HEIGHT
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/jpeg',
        IMAGE_QUALITY
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load image from file
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload ministry image to Firebase Storage
 * Resizes to 800x600 and saves as {ministry_code}.jpg
 */
export async function uploadMinistryImage(
  file: File,
  ministryCode: string
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

    // Check if storage is available
    if (!storage) {
      return {
        success: false,
        error: 'Firebase Storage not initialized',
      }
    }

    // Resize image
    const resizedBlob = await resizeImage(file)

    // Create reference with ministry code as filename
    const fileName = `${ministryCode}.jpg`
    const storageRef = ref(storage, `${MINISTRIES_FOLDER}/${fileName}`)

    // Upload
    await uploadBytes(storageRef, resizedBlob, {
      contentType: 'image/jpeg',
    })

    // Get download URL
    const url = await getDownloadURL(storageRef)

    return {
      success: true,
      url,
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
 * Delete ministry image from Firebase Storage
 */
export async function deleteMinistryImage(ministryCode: string): Promise<UploadResult> {
  try {
    if (!storage) {
      return {
        success: false,
        error: 'Firebase Storage not initialized',
      }
    }

    const fileName = `${ministryCode}.jpg`
    const storageRef = ref(storage, `${MINISTRIES_FOLDER}/${fileName}`)

    await deleteObject(storageRef)

    return {
      success: true,
    }
  } catch (error) {
    // If file doesn't exist, consider it a success
    if (error instanceof Error && error.message.includes('object-not-found')) {
      return {
        success: true,
      }
    }

    console.error('Error deleting ministry image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Get ministry image URL
 * Returns the Firebase Storage public URL format
 */
export function getMinistryImageUrl(ministryCode: string): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'taxasge-dev.firebasestorage.app'
  const encodedPath = encodeURIComponent(`${MINISTRIES_FOLDER}/${ministryCode}.jpg`)
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`
}

/**
 * Check if ministry image exists
 */
export async function checkMinistryImageExists(ministryCode: string): Promise<boolean> {
  try {
    if (!storage) return false

    const fileName = `${ministryCode}.jpg`
    const storageRef = ref(storage, `${MINISTRIES_FOLDER}/${fileName}`)

    await getDownloadURL(storageRef)
    return true
  } catch {
    return false
  }
}
