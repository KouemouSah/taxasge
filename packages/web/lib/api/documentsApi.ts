/**
 * Documents API Client - TaxasGE Frontend
 *
 * Handles document management operations (upload, OCR, extraction, validation)
 * Backend: app/modules/documents/api/document_routes.py
 */

import axios, { AxiosInstance } from 'axios';
import { AUTHENTICATED_ENDPOINTS } from '@taxasge/shared/constants/endpoints';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for documents API
const documentsClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for OCR/processing operations
});

// Request interceptor to add auth token
documentsClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
documentsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  download_url?: string;
  processing_mode: 'auto' | 'manual' | 'batch';
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  validation_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_text?: string;
  extracted_data?: Record<string, any>;
  validation_results?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  file_size: number;
  download_url: string;
  processing_started: boolean;
  message: string;
}

export interface DocumentProcessRequest {
  mode?: 'auto' | 'manual';
  run_ocr?: boolean;
  run_extraction?: boolean;
  run_validation?: boolean;
}

export interface OCRResponse {
  document_id: string;
  ocr_text: string;
  ocr_status: string;
  confidence_score?: number;
  language_detected?: string;
  processing_time_ms?: number;
}

export interface ExtractionResponse {
  document_id: string;
  extracted_data: Record<string, any>;
  extraction_status: string;
  template_used?: string;
  confidence_score?: number;
}

export interface ValidationResponse {
  document_id: string;
  validation_results: {
    is_valid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
  };
  validation_status: string;
}

export interface DocumentStats {
  total_documents: number;
  by_status: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  by_type: Record<string, number>;
  processing_times: {
    avg_ocr_time_ms: number;
    avg_extraction_time_ms: number;
    avg_total_time_ms: number;
  };
}

export interface DocumentSearchFilter {
  filename?: string;
  mime_type?: string;
  ocr_status?: string;
  extraction_status?: string;
  validation_status?: string;
  created_after?: string;
  created_before?: string;
  search_query?: string;
}

// Documents API methods
export const documentsApi = {
  /**
   * Get documents API information
   */
  getInfo: async (): Promise<Record<string, any>> => {
    const response = await documentsClient.get(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.INFO
    );
    return response.data;
  },

  /**
   * Upload document
   */
  upload: async (
    file: File,
    options?: {
      auto_process?: boolean;
      processing_mode?: 'auto' | 'manual' | 'batch';
      metadata?: Record<string, any>;
    }
  ): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.auto_process !== undefined) {
      formData.append('auto_process', String(options.auto_process));
    }
    if (options?.processing_mode) {
      formData.append('processing_mode', options.processing_mode);
    }
    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const response = await documentsClient.post<DocumentUploadResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get list of documents
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    ocr_status?: string;
  }): Promise<DocumentListResponse> => {
    const response = await documentsClient.get<DocumentListResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Get document by ID
   */
  getById: async (documentId: string): Promise<Document> => {
    const response = await documentsClient.get<Document>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.DETAIL(documentId)
    );
    return response.data;
  },

  /**
   * Download document
   */
  download: async (documentId: string): Promise<Blob> => {
    const response = await documentsClient.get(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId),
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Update document metadata
   */
  update: async (
    documentId: string,
    data: {
      filename?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Document> => {
    const response = await documentsClient.put<Document>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.UPDATE(documentId),
      data
    );
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (documentId: string): Promise<{ message: string }> => {
    const response = await documentsClient.delete<{ message: string }>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.DELETE(documentId)
    );
    return response.data;
  },

  /**
   * Process document (OCR + extraction + validation)
   */
  process: async (
    documentId: string,
    options?: DocumentProcessRequest
  ): Promise<{ message: string; processing_started: boolean }> => {
    const response = await documentsClient.post<{
      message: string;
      processing_started: boolean;
    }>(AUTHENTICATED_ENDPOINTS.DOCUMENTS.PROCESS(documentId), options || {});
    return response.data;
  },

  /**
   * Run OCR on document
   */
  runOCR: async (documentId: string): Promise<OCRResponse> => {
    const response = await documentsClient.post<OCRResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.OCR(documentId)
    );
    return response.data;
  },

  /**
   * Extract structured data from document
   */
  extract: async (
    documentId: string,
    options?: {
      template?: string;
      force_reprocess?: boolean;
    }
  ): Promise<ExtractionResponse> => {
    const response = await documentsClient.post<ExtractionResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.EXTRACT(documentId),
      options || {}
    );
    return response.data;
  },

  /**
   * Validate document
   */
  validate: async (documentId: string): Promise<ValidationResponse> => {
    const response = await documentsClient.post<ValidationResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.VALIDATE(documentId)
    );
    return response.data;
  },

  /**
   * Retry failed processing
   */
  retry: async (
    documentId: string
  ): Promise<{ message: string; processing_started: boolean }> => {
    const response = await documentsClient.post<{
      message: string;
      processing_started: boolean;
    }>(AUTHENTICATED_ENDPOINTS.DOCUMENTS.RETRY(documentId));
    return response.data;
  },

  /**
   * Search documents
   */
  search: async (
    filters: DocumentSearchFilter
  ): Promise<DocumentListResponse> => {
    const response = await documentsClient.post<DocumentListResponse>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.SEARCH,
      filters
    );
    return response.data;
  },

  /**
   * Get processing statistics
   */
  getStats: async (): Promise<DocumentStats> => {
    const response = await documentsClient.get<DocumentStats>(
      AUTHENTICATED_ENDPOINTS.DOCUMENTS.STATS
    );
    return response.data;
  },
};

export default documentsApi;
