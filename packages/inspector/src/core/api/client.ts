/**
 * Axios API Client for Facil Inspeccion App
 *
 * Configured for the Facil backend (FastAPI on Cloud Run) with:
 * - Automatic Bearer token injection from secure storage
 * - Accept-Language header from app locale
 * - Token refresh with request queuing (max 50, 10s timeout)
 * - Adaptive timeout (30s default, configurable)
 * - FastAPI error format extraction
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@core/auth/auth-storage';
import { appConfig } from '@core/config/app';
import { API_ENDPOINTS } from '@core/api/endpoints';

const MAX_QUEUE_SIZE = 50;
const REFRESH_TIMEOUT_MS = 10_000;

const apiClient: AxiosInstance = axios.create({
  baseURL: `${appConfig.api.baseUrl}/api/${appConfig.api.version}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: appConfig.api.timeout,
  withCredentials: false,
});

let currentLocale: string = 'es';

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (config.headers) {
      config.headers['Accept-Language'] = currentLocale;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

export function setApiLocale(locale: string): void {
  if (['es', 'fr', 'en'].includes(locale)) {
    currentLocale = locale;
  }
}

export function getApiLocale(): string {
  return currentLocale;
}

interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (reason: Error) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: Error | null, token: string | null = null): void {
  const queue = failedQueue;
  failedQueue = [];
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      if (failedQueue.length >= MAX_QUEUE_SIZE) {
        return Promise.reject(new Error('Too many pending requests during token refresh'));
      }
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        processQueue(new Error('No refresh token available'));
        isRefreshing = false;
        return Promise.reject(error);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

      const refreshResponse = await axios.post<{
        access_token: string;
        refresh_token: string;
      }>(
        `${appConfig.api.baseUrl}/api/${appConfig.api.version}${API_ENDPOINTS.auth.refresh}`,
        { refresh_token: refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          timeout: REFRESH_TIMEOUT_MS,
        },
      );

      clearTimeout(timeoutId);
      const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;
      await setTokens(access_token, newRefreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
      }

      processQueue(null, access_token);
      isRefreshing = false;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      processQueue(
        refreshError instanceof Error ? refreshError : new Error('Token refresh failed'),
      );
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  },
);

export function extractData<T>(response: AxiosResponse<T>): T {
  return response.data;
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progress: number) => void,
): Promise<T> {
  const response = await apiClient.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
    onUploadProgress: onUploadProgress
      ? (event) => { if (event.total) onUploadProgress(event.loaded / event.total); }
      : undefined,
  });
  return response.data;
}

export default apiClient;
export { appConfig };
