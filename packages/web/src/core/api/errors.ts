/**
 * Shared API error handling utilities.
 * Extracts meaningful messages from FastAPI/Axios errors.
 *
 * @module core/api/errors
 */

import { isAxiosError } from 'axios';

/**
 * Well-known HTTP status codes mapped to i18n-friendly error keys.
 * These are used as fallbacks when the backend doesn't provide a `detail` string.
 * The keys match `common.errors.*` in the i18n files.
 */
const STATUS_ERROR_KEYS: Record<number, string> = {
  400: 'badRequest',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validationError',
  429: 'tooManyRequests',
  500: 'serverError',
  502: 'serverError',
  503: 'serviceUnavailable',
};

export interface ApiErrorInfo {
  /** Human-readable message (from backend detail or fallback) */
  message: string;
  /** HTTP status code, if available */
  status?: number;
  /** i18n key for status-based fallback (e.g. "forbidden") */
  statusKey?: string;
}

/**
 * Extract structured error info from an unknown error (typically AxiosError).
 *
 * Priority:
 *  1. FastAPI `detail` string → most specific
 *  2. Pydantic validation array → first error msg
 *  3. Status-code-based i18n key → contextual fallback
 *  4. Generic Error.message → last resort
 */
export function getApiErrorInfo(err: unknown): ApiErrorInfo {
  if (isAxiosError(err) && err.response) {
    const status = err.response.status;
    const data = err.response.data as Record<string, unknown> | undefined;
    const statusKey = STATUS_ERROR_KEYS[status];

    // FastAPI { detail: "Error message" }
    if (data && typeof data.detail === 'string') {
      return { message: data.detail, status, statusKey };
    }

    // Pydantic validation { detail: [{ msg: "..." }] }
    if (data && Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0] as Record<string, unknown>;
      if (typeof first.msg === 'string') {
        return { message: first.msg, status, statusKey };
      }
    }

    // FastAPI { detail: { message: "..." } }
    if (data && typeof data.detail === 'object' && data.detail !== null) {
      const detailObj = data.detail as Record<string, unknown>;
      if (typeof detailObj.message === 'string') {
        return { message: detailObj.message, status, statusKey };
      }
    }

    // No usable detail — return status key for i18n lookup
    return { message: err.message, status, statusKey };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: String(err) };
}

/**
 * Get a user-friendly error message string.
 *
 * @param err - The caught error (unknown)
 * @param fallback - Fallback message if nothing useful can be extracted
 * @param t - Optional i18n translator function for `common.errors.*` keys
 */
export function getApiErrorMessage(
  err: unknown,
  fallback: string,
  t?: (key: string) => string
): string {
  const info = getApiErrorInfo(err);

  // If we got a real detail message from the backend, use it
  if (isAxiosError(err) && err.response?.data) {
    const data = err.response.data as Record<string, unknown>;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0] as Record<string, unknown>;
      if (typeof first.msg === 'string') return first.msg;
    }
  }

  // Try i18n status-based message
  if (t && info.statusKey) {
    try {
      const translated = t(`errors.${info.statusKey}`);
      // next-intl returns the key path if not found
      if (translated && !translated.includes('errors.')) return translated;
    } catch {
      // translator not available for this key
    }
  }

  // Fallback to generic Error.message (but NOT raw axios "Request failed with status code 409")
  if (info.message && !info.message.startsWith('Request failed with status code')) {
    return info.message;
  }

  return fallback;
}
