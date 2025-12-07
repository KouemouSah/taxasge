/**
 * Axios API Client Configuration
 * Configured for TaxasGE Backend API with automatic token refresh
 * Aligned with Cloud Run deployment
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthData, setAuthData, clearAuthData } from '@/core/auth/storage';
import { appConfig } from '@/core/config/app';

// Create axios instance with Cloud Run backend
const apiClient: AxiosInstance = axios.create({
  baseURL: `${appConfig.api.baseUrl}/api/${appConfig.api.version}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: appConfig.api.timeout,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authData = getAuthData();

    if (authData?.access_token && config.headers) {
      config.headers.Authorization = `Bearer ${authData.access_token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authData = getAuthData();

      if (!authData?.refresh_token) {
        clearAuthData();
        if (typeof window !== 'undefined') {
          // Extract locale from current URL path (e.g., /es/dashboard -> es)
          const pathParts = window.location.pathname.split('/');
          const locale = pathParts[1] && ['es', 'fr', 'en'].includes(pathParts[1]) ? pathParts[1] : 'es';
          window.location.href = `/${locale}/auth`;
        }
        return Promise.reject(error);
      }

      try {
        // Refresh token
        const response = await axios.post(
          `${appConfig.api.baseUrl}/api/${appConfig.api.version}/auth/refresh`,
          { refresh_token: authData.refresh_token },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token, refresh_token } = response.data;

        // Update stored tokens
        setAuthData({
          ...authData,
          access_token,
          refresh_token,
        });

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearAuthData();

        if (typeof window !== 'undefined') {
          // Extract locale from current URL path (e.g., /es/dashboard -> es)
          const pathParts = window.location.pathname.split('/');
          const locale = pathParts[1] && ['es', 'fr', 'en'].includes(pathParts[1]) ? pathParts[1] : 'es';
          window.location.href = `/${locale}/auth`;
        }

        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { appConfig };
