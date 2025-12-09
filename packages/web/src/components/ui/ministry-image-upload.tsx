'use client'

/**
 * Ministry Image Upload Component
 * Upload, preview, modify and delete ministry images
 *
 * Features:
 * - Drag & drop or click to upload
 * - Preview thumbnail
 * - Auto resize to 800x600
 * - Upload to Firebase Storage
 * - Modify/delete existing images
 *
 * @module components/ui/ministry-image-upload
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from './button'
import { Label } from './label'
import { cn } from '@/lib/utils'
import {
  uploadMinistryImage,
  deleteMinistryImage,
  getMinistryImageUrl,
  checkMinistryImageExists,
} from '@/lib/firebase-storage'
import {
  Upload,
  X,
  Trash2,
  RefreshCw,
  ImageIcon,
  AlertCircle,
} from 'lucide-react'

interface MinistryImageUploadProps {
  ministryCode: string
  onUploadSuccess?: (url: string) => void
  onUploadError?: (error: string) => void
  onDelete?: () => void
  disabled?: boolean
  className?: string
  labels?: {
    upload?: string
    change?: string
    delete?: string
    preview?: string
    dimensions?: string
    uploading?: string
    dropHere?: string
    orClickToSelect?: string
    error?: string
  }
}

export function MinistryImageUpload({
  ministryCode,
  onUploadSuccess,
  onUploadError,
  onDelete,
  disabled = false,
  className,
  labels = {},
}: MinistryImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasExistingImage, setHasExistingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Default labels
  const {
    upload = 'Subir imagen',
    change = 'Cambiar imagen',
    delete: deleteLabel = 'Eliminar',
    preview = 'Vista previa',
    dimensions = '800 x 600 px',
    uploading = 'Subiendo...',
    dropHere = 'Arrastra la imagen aquí',
    orClickToSelect = 'o haz clic para seleccionar',
    error: errorLabel = 'Error',
  } = labels

  // Check for existing image on mount and when ministry code changes
  useEffect(() => {
    if (ministryCode) {
      const checkExisting = async () => {
        const exists = await checkMinistryImageExists(ministryCode)
        setHasExistingImage(exists)
        if (exists) {
          setPreviewUrl(getMinistryImageUrl(ministryCode))
          setImageLoadError(false)
        }
      }
      checkExisting()
    }
  }, [ministryCode])

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!ministryCode) {
        setError('Ministry code is required')
        onUploadError?.('Ministry code is required')
        return
      }

      setError(null)
      setIsUploading(true)

      // Create local preview first
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)
      setImageLoadError(false)

      try {
        const result = await uploadMinistryImage(file, ministryCode)

        if (result.success && result.url) {
          setPreviewUrl(result.url)
          setHasExistingImage(true)
          onUploadSuccess?.(result.url)
        } else {
          setError(result.error || 'Upload failed')
          setPreviewUrl(null)
          onUploadError?.(result.error || 'Upload failed')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        setPreviewUrl(null)
        onUploadError?.(errorMessage)
      } finally {
        setIsUploading(false)
        // Cleanup local preview URL
        URL.revokeObjectURL(localPreview)
      }
    },
    [ministryCode, onUploadSuccess, onUploadError]
  )

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!ministryCode) return

    setIsUploading(true)
    setError(null)

    try {
      const result = await deleteMinistryImage(ministryCode)

      if (result.success) {
        setPreviewUrl(null)
        setHasExistingImage(false)
        onDelete?.()
      } else {
        setError(result.error || 'Delete failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle click on upload area
  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{preview}</Label>

      {/* Upload area / Preview */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          'aspect-[4/3] overflow-hidden',
          isDragOver && 'border-primary bg-primary/5',
          !isDragOver && !previewUrl && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          previewUrl && 'border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !previewUrl && 'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!previewUrl ? handleClick : undefined}
      >
        {/* Preview Image */}
        {previewUrl && !imageLoadError ? (
          <Image
            src={previewUrl}
            alt={preview}
            fill
            className="object-cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          /* Upload placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {isUploading ? (
              <>
                <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">{uploading}</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{dropHere}</p>
                <p className="text-xs text-muted-foreground mt-1">{orClickToSelect}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <ImageIcon className="inline h-3 w-3 mr-1" />
                  {dimensions}
                </p>
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && previewUrl && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{errorLabel}: {error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isUploading || !ministryCode}
        >
          {isUploading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {hasExistingImage ? change : upload}
        </Button>

        {hasExistingImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={disabled || isUploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteLabel}
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Ministry code hint */}
      {!ministryCode && (
        <p className="text-xs text-muted-foreground">
          Ingresa el código del ministerio primero
        </p>
      )}
    </div>
  )
}
