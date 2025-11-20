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
  // Authentification (Module: app/modules/auth)
  AUTH: {
    // Login & Registration
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REQUEST_VERIFICATION_CODE: '/api/v1/auth/request-verification-code',

    // Token Management
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',

    // Password Management
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    VERIFY_RESET_TOKEN: '/api/v1/auth/verify-reset-token',

    // Email Verification
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification',

    // Two-Factor Authentication (2FA)
    TWO_FACTOR: {
      SETUP: '/api/v1/auth/2fa/setup',
      ENABLE: '/api/v1/auth/2fa/enable',
      VERIFY: '/api/v1/auth/2fa/verify',
      DISABLE: '/api/v1/auth/2fa/disable',
      LOGIN_VERIFY: '/api/v1/auth/login/2fa-verify',
      STATUS: '/api/v1/auth/2fa/status',
    },

    // Session Management
    SESSIONS: {
      LIST: '/api/v1/auth/sessions',
      CURRENT: '/api/v1/auth/sessions/current',
      REVOKE: (sessionId: string) => `/api/v1/auth/sessions/${sessionId}`,
      REVOKE_ALL: '/api/v1/auth/sessions/revoke-all',
    },
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
  // Profil utilisateur (Module: app/api/v1/users)
  PROFILE: {
    GET: '/api/v1/users/profile',
    UPDATE: '/api/v1/users/profile',
    AVATAR: '/api/v1/users/profile/avatar',
    DELETE: '/api/v1/users/profile',
    CHANGE_PASSWORD: '/api/v1/users/profile/change-password',
  },

  // Gestion utilisateurs
  USERS: {
    LIST: '/api/v1/users',
    CREATE: '/api/v1/users',
    DETAIL: (id: string) => `/api/v1/users/${id}`,
    UPDATE: (id: string) => `/api/v1/users/${id}`,
    DELETE: (id: string) => `/api/v1/users/${id}`,
    SEARCH: '/api/v1/users/search',
    BY_ROLE: (role: string) => `/api/v1/users/role/${role}`,
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

  // Permissions (Module: app/modules/permissions)
  PERMISSIONS: {
    LIST: '/api/v1/permissions',
    CREATE: '/api/v1/permissions',
    DETAIL: (id: string) => `/api/v1/permissions/${id}`,
    UPDATE: (id: string) => `/api/v1/permissions/${id}`,
    DELETE: (id: string) => `/api/v1/permissions/${id}`,
    SYNC: '/api/v1/permissions/sync',
  },

  // Rôles (Module: app/modules/permissions)
  ROLES: {
    LIST: '/api/v1/roles',
    CREATE: '/api/v1/roles',
    DETAIL: (id: string) => `/api/v1/roles/${id}`,
    UPDATE: (id: string) => `/api/v1/roles/${id}`,
    DELETE: (id: string) => `/api/v1/roles/${id}`,
    PERMISSIONS: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
    ASSIGN_PERMISSION: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
    REMOVE_PERMISSION: (roleId: string, permissionId: string) =>
      `/api/v1/roles/${roleId}/permissions/${permissionId}`,
  },

  // User Permissions (Module: app/modules/permissions)
  USER_PERMISSIONS: {
    GET: (userId: string) => `/api/v1/user-permissions/${userId}`,
    ASSIGN: (userId: string) => `/api/v1/user-permissions/${userId}`,
    REVOKE: (userId: string, permissionId: string) =>
      `/api/v1/user-permissions/${userId}/${permissionId}`,
    CHECK: (userId: string, permissionId: string) =>
      `/api/v1/user-permissions/${userId}/check/${permissionId}`,
  },

  // Assignments (Module: app/modules/assignment)
  ASSIGNMENTS: {
    LIST: '/api/v1/assignments',
    CREATE: '/api/v1/assignments',
    DETAIL: (id: string) => `/api/v1/assignments/${id}`,
    UPDATE: (id: string) => `/api/v1/assignments/${id}`,
    DELETE: (id: string) => `/api/v1/assignments/${id}`,
    BY_USER: (userId: string) => `/api/v1/assignments/user/${userId}`,
    BY_ASSIGNEE: (assigneeId: string) => `/api/v1/assignments/assignee/${assigneeId}`,
    STATISTICS: '/api/v1/assignments/statistics',
  },

  // Supervisors (Module: app/modules/assignment)
  SUPERVISORS: {
    LIST: '/api/v1/supervisors',
    CREATE: '/api/v1/supervisors',
    DETAIL: (id: string) => `/api/v1/supervisors/${id}`,
    UPDATE: (id: string) => `/api/v1/supervisors/${id}`,
    DELETE: (id: string) => `/api/v1/supervisors/${id}`,
    HIERARCHY: '/api/v1/supervisors/hierarchy',
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

  // Diagnostics et Migrations (Module: app/modules/admin/api/admin_routes.py)
  DIAGNOSTICS: {
    SECRETS: '/api/v1/admin/diagnostic/secrets',
  },

  MIGRATIONS: {
    GRANDFATHER_USERS: '/api/v1/admin/migrate/grandfather-users',
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