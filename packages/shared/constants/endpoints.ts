/**
 * Constantes des endpoints API TaxasGE
 * URLs centralisées pour tous les packages
 */

// === CONFIGURATION BASE ===

export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://taxasge-dev.firebase.com',
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// === ENDPOINTS PUBLICS ===

export const PUBLIC_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/api/v1/public/auth/login',
    REGISTER: '/api/v1/public/auth/register',
    REFRESH: '/api/v1/public/auth/refresh',
    FORGOT_PASSWORD: '/api/v1/public/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/public/auth/reset-password',
    VERIFY_EMAIL: '/api/v1/public/auth/verify-email',
  },

  // Services fiscaux (lecture seule)
  FISCAL_SERVICES: {
    LIST: '/api/v1/public/fiscal-services',
    DETAIL: (id: string) => `/api/v1/public/fiscal-services/${id}`,
    SEARCH: '/api/v1/public/fiscal-services/search',
    CALCULATE: '/api/v1/public/fiscal-services/calculate',
    POPULAR: '/api/v1/public/fiscal-services/popular',
    RECENT: '/api/v1/public/fiscal-services/recent',
  },

  // Structures organisationnelles
  MINISTRIES: {
    LIST: '/api/v1/public/ministries',
    DETAIL: (id: string) => `/api/v1/public/ministries/${id}`,
    SERVICES: (id: string) => `/api/v1/public/ministries/${id}/services`,
  },

  SECTORS: {
    LIST: '/api/v1/public/sectors',
    DETAIL: (id: string) => `/api/v1/public/sectors/${id}`,
    BY_MINISTRY: (ministryId: string) => `/api/v1/public/sectors/ministry/${ministryId}`,
    SERVICES: (id: string) => `/api/v1/public/sectors/${id}/services`,
  },

  CATEGORIES: {
    LIST: '/api/v1/public/categories',
    DETAIL: (id: string) => `/api/v1/public/categories/${id}`,
    BY_SECTOR: (sectorId: string) => `/api/v1/public/categories/sector/${sectorId}`,
    SERVICES: (id: string) => `/api/v1/public/categories/${id}/services`,
  },

  // Utilitaires
  UTILS: {
    HEALTH: '/api/v1/public/health',
    VERSION: '/api/v1/public/version',
    CONTACT: '/api/v1/public/contact',
    FEEDBACK: '/api/v1/public/feedback',
  },
} as const;

// === ENDPOINTS AUTHENTIFIÉS ===

export const AUTHENTICATED_ENDPOINTS = {
  // Profil utilisateur
  PROFILE: {
    GET: '/api/v1/profile',
    UPDATE: '/api/v1/profile',
    AVATAR: '/api/v1/profile/avatar',
    DELETE: '/api/v1/profile',
    CHANGE_PASSWORD: '/api/v1/profile/change-password',
  },

  // Historique utilisateur
  HISTORY: {
    SEARCHES: '/api/v1/history/searches',
    CALCULATIONS: '/api/v1/history/calculations',
    PROCEDURES: '/api/v1/history/procedures',
    FAVORITES: '/api/v1/history/favorites',
  },

  // Procédures en cours
  PROCEDURES: {
    LIST: '/api/v1/procedures',
    CREATE: '/api/v1/procedures',
    DETAIL: (id: string) => `/api/v1/procedures/${id}`,
    UPDATE: (id: string) => `/api/v1/procedures/${id}`,
    CANCEL: (id: string) => `/api/v1/procedures/${id}/cancel`,
    DOCUMENTS: (id: string) => `/api/v1/procedures/${id}/documents`,
    STATUS: (id: string) => `/api/v1/procedures/${id}/status`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
    SETTINGS: '/api/v1/notifications/settings',
  },

  // Paiements
  PAYMENTS: {
    LIST: '/api/v1/payments',
    CREATE: '/api/v1/payments',
    DETAIL: (id: string) => `/api/v1/payments/${id}`,
    CONFIRM: (id: string) => `/api/v1/payments/${id}/confirm`,
    CANCEL: (id: string) => `/api/v1/payments/${id}/cancel`,
    RECEIPT: (id: string) => `/api/v1/payments/${id}/receipt`,
  },
} as const;

// === ENDPOINTS ADMIN ===

export const ADMIN_ENDPOINTS = {
  // Dashboard admin (intégré)
  DASHBOARD: '/admin',
  LOGIN: '/admin/login',
  LOGOUT: '/admin/logout',

  // Gestion services fiscaux
  FISCAL_SERVICES: {
    LIST: '/admin/fiscal-services',
    CREATE: '/admin/fiscal-services/create',
    DETAIL: (id: string) => `/admin/fiscal-services/${id}`,
    EDIT: (id: string) => `/admin/fiscal-services/${id}/edit`,
    DELETE: (id: string) => `/admin/fiscal-services/${id}/delete`,
    BULK_UPDATE: '/admin/fiscal-services/bulk-update',
    EXPORT: '/admin/fiscal-services/export',
    IMPORT: '/admin/fiscal-services/import',
  },

  // Gestion utilisateurs
  USERS: {
    LIST: '/admin/users',
    CREATE: '/admin/users/create',
    DETAIL: (id: string) => `/admin/users/${id}`,
    EDIT: (id: string) => `/admin/users/${id}/edit`,
    SUSPEND: (id: string) => `/admin/users/${id}/suspend`,
    ACTIVATE: (id: string) => `/admin/users/${id}/activate`,
    DELETE: (id: string) => `/admin/users/${id}/delete`,
    EXPORT: '/admin/users/export',
  },

  // Analytics et rapports
  ANALYTICS: {
    OVERVIEW: '/admin/analytics',
    SERVICES: '/admin/analytics/services',
    USERS: '/admin/analytics/users',
    REVENUE: '/admin/analytics/revenue',
    REPORTS: '/admin/analytics/reports',
    EXPORT: '/admin/analytics/export',
  },

  // Configuration système
  SETTINGS: {
    GENERAL: '/admin/settings',
    SECURITY: '/admin/settings/security',
    EMAIL: '/admin/settings/email',
    PAYMENTS: '/admin/settings/payments',
    INTEGRATIONS: '/admin/settings/integrations',
    BACKUP: '/admin/settings/backup',
  },

  // API pour AJAX
  API: {
    SECTORS_BY_MINISTRY: (ministryId: string) => `/admin/fiscal-services/api/sectors/${ministryId}`,
    CATEGORIES_BY_SECTOR: (sectorId: string) => `/admin/fiscal-services/api/categories/${sectorId}`,
    VALIDATE_SERVICE_CODE: '/admin/fiscal-services/api/validate-code',
    SEARCH_USERS: '/admin/users/api/search',
    USAGE_STATS: '/admin/analytics/api/usage-stats',
  },
} as const;

// === ENDPOINTS GATEWAY ===

export const GATEWAY_ENDPOINTS = {
  // Santé et monitoring
  HEALTH: '/gateway/health',
  METRICS: '/gateway/metrics',
  ROUTES: '/gateway/routes',
  STATS: '/gateway/stats',
  CONFIG: '/gateway/config',

  // Documentation
  DOCS: '/gateway/docs',
  REDOC: '/gateway/redoc',
  OPENAPI: '/gateway/openapi.json',
} as const;

// === HELPERS ===

export const buildUrl = (endpoint: string, baseUrl: string = API_CONFIG.BASE_URL): string => {
  return `${baseUrl}${endpoint}`;
};

export const buildAdminUrl = (endpoint: string, baseUrl: string = API_CONFIG.BASE_URL): string => {
  return `${baseUrl}${endpoint}`;
};

export const getApiUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${path}`;
};

// === TYPES POUR AUTOCOMPLÉTION ===

export type PublicEndpointKey = keyof typeof PUBLIC_ENDPOINTS;
export type AuthenticatedEndpointKey = keyof typeof AUTHENTICATED_ENDPOINTS;
export type AdminEndpointKey = keyof typeof ADMIN_ENDPOINTS;