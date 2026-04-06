/**
 * useDocumentUpload - Hook for document upload with progress tracking and dedup detection
 *
 * Features:
 * - Client-side validation (file size, MIME type)
 * - Per-file progress tracking
 * - Duplicate detection (backend returns status: 'duplicate')
 * - Single and bulk upload (max 5 for bulk)
 * - Automatic cache invalidation on success
 *
 * @module user-documents/hooks
 * @date 2026-04-05
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userDocumentsApi } from '../services/api';
import { userDocumentKeys } from './useUserDocuments';
import type { UploadResult, DocumentCategory } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum file size: 50 MB */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Maximum number of files for bulk upload */
const MAX_BULK_FILES = 5;

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// =============================================================================
// TYPES
// =============================================================================

export interface UploadFileState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate';
  progress: number; // 0-100
  result?: UploadResult;
  error?: string;
}

export interface UploadOptions {
  documentTypeHint?: string;
  notes?: string;
}

export interface UseDocumentUploadReturn {
  /** Upload a single document */
  uploadDocument: (file: File, options?: UploadOptions) => Promise<UploadResult | null>;
  /** Upload multiple documents (max 5) */
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<UploadResult[]>;
  /** Whether any upload is in progress */
  isUploading: boolean;
  /** Per-file upload state (keyed by file name) */
  fileStates: Map<string, UploadFileState>;
  /** Global error message (validation, etc.) */
  error: string | null;
  /** Reset all upload state */
  reset: () => void;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

interface ValidationError {
  fileName: string;
  reason: string;
}

function validateFile(file: File): ValidationError | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      fileName: file.name,
      reason: `File too large (${sizeMB} MB). Maximum: 50 MB.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      fileName: file.name,
      reason: `Unsupported file type: ${file.type || 'unknown'}. Allowed: PDF, JPG, PNG, TIFF, WEBP, DOC, DOCX.`,
    };
  }

  return null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDocumentUpload(): UseDocumentUploadReturn {
  const queryClient = useQueryClient();
  const [fileStates, setFileStates] = useState<Map<string, UploadFileState>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);
  const uploadingCountRef = useRef(0);
  const [isUploading, setIsUploading] = useState(false);

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  const updateFileState = useCallback(
    (key: string, update: Partial<UploadFileState>) => {
      setFileStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        if (existing) {
          next.set(key, { ...existing, ...update });
        }
        return next;
      });
    },
    []
  );

  const addFileState = useCallback((file: File) => {
    const key = `${file.name}_${file.size}_${file.lastModified}`;
    setFileStates((prev) => {
      const next = new Map(prev);
      next.set(key, {
        file,
        status: 'pending',
        progress: 0,
      });
      return next;
    });
    return key;
  }, []);

  // ---------------------------------------------------------------------------
  // Single Upload
  // ---------------------------------------------------------------------------

  const uploadDocument = useCallback(
    async (
      file: File,
      options?: UploadOptions
    ): Promise<UploadResult | null> => {
      setError(null);

      // Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError.reason);
        return null;
      }

      const key = addFileState(file);
      uploadingCountRef.current += 1;
      setIsUploading(true);

      updateFileState(key, { status: 'uploading', progress: 10 });

      try {
        // Progress simulation: jump to 30% on request start
        updateFileState(key, { progress: 30 });

        const result = await userDocumentsApi.upload(
          file,
          options?.documentTypeHint,
          options?.notes
        );

        // Progress: 100% on completion
        const isDuplicate = result.status === 'duplicate';
        updateFileState(key, {
          status: isDuplicate ? 'duplicate' : 'success',
          progress: 100,
          result,
        });

        // Invalidate document lists and stats so they reflect the new upload
        queryClient.invalidateQueries({ queryKey: userDocumentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: userDocumentKeys.stats() });
        queryClient.invalidateQueries({ queryKey: userDocumentKeys.alerts() });

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed';
        updateFileState(key, { status: 'error', progress: 0, error: message });
        setError(message);
        return null;
      } finally {
        uploadingCountRef.current -= 1;
        if (uploadingCountRef.current <= 0) {
          uploadingCountRef.current = 0;
          setIsUploading(false);
        }
      }
    },
    [addFileState, updateFileState, queryClient]
  );

  // ---------------------------------------------------------------------------
  // Bulk Upload
  // ---------------------------------------------------------------------------

  const uploadMultiple = useCallback(
    async (
      files: File[],
      options?: UploadOptions
    ): Promise<UploadResult[]> => {
      setError(null);

      if (files.length === 0) {
        setError('No files selected.');
        return [];
      }

      if (files.length > MAX_BULK_FILES) {
        setError(
          `Too many files. Maximum ${MAX_BULK_FILES} files per batch.`
        );
        return [];
      }

      // Validate all files upfront
      const validationErrors: ValidationError[] = [];
      for (const file of files) {
        const ve = validateFile(file);
        if (ve) validationErrors.push(ve);
      }

      if (validationErrors.length > 0) {
        setError(
          validationErrors.map((e) => `${e.fileName}: ${e.reason}`).join('\n')
        );
        return [];
      }

      // Upload files sequentially to avoid overwhelming the backend
      const results: UploadResult[] = [];

      for (const file of files) {
        const result = await uploadDocument(file, options);
        if (result) {
          results.push(result);
        }
      }

      return results;
    },
    [uploadDocument]
  );

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    setFileStates(new Map());
    setError(null);
    uploadingCountRef.current = 0;
    setIsUploading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    uploadDocument,
    uploadMultiple,
    isUploading,
    fileStates,
    error,
    reset,
  };
}
