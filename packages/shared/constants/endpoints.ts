/**
 * Constantes des endpoints API TaxasGE
 * URLs centralisées pour tous les packages
 */

// === CONFIGURATION BASE ===

export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://taxasge-dev.web.app',
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

  // Homepage (Module: app/modules/homepage)
  HOMEPAGE: {
    INFO: '/api/v1/homepage',
    STATS: '/api/v1/homepage/stats',
    CATEGORIES: '/api/v1/homepage/categories',
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
  // Profil utilisateur (Module: app/modules/users/api/user_routes.py)
  PROFILE: {
    GET: '/api/v1/users/profile',
    UPDATE: '/api/v1/users/profile',
    CHANGE_PASSWORD: '/api/v1/users/profile/change-password',
    AVATAR: {
      UPLOAD: '/api/v1/users/profile/avatar',
      DELETE: '/api/v1/users/profile/avatar',
    },
  },

  // Gestion utilisateurs (Admin only - Module: app/modules/admin/api/user_management_routes.py)
  ADMIN_USERS: {
    LIST: '/api/v1/admin/users',
    CREATE: '/api/v1/admin/users',
    DETAIL: (id: string) => `/api/v1/admin/users/${id}`,
    UPDATE: (id: string) => `/api/v1/admin/users/${id}`,
    DELETE: (id: string) => `/api/v1/admin/users/${id}`,
    SEARCH: '/api/v1/admin/users/search',
    BY_ROLE: (role: string) => `/api/v1/admin/users/role/${role}`,
    STATS: '/api/v1/admin/users/stats',
    ACTIVITIES: (id: string) => `/api/v1/admin/users/${id}/activities`,
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

  // Documents (Module: app/modules/documents)
  DOCUMENTS: {
    INFO: '/api/v1/documents',
    UPLOAD: '/api/v1/documents/upload',
    LIST: '/api/v1/documents/list',
    DETAIL: (id: string) => `/api/v1/documents/${id}`,
    DOWNLOAD: (id: string) => `/api/v1/documents/${id}/download`,
    UPDATE: (id: string) => `/api/v1/documents/${id}`,
    DELETE: (id: string) => `/api/v1/documents/${id}`,
    PROCESS: (id: string) => `/api/v1/documents/${id}/process`,
    OCR: (id: string) => `/api/v1/documents/${id}/ocr`,
    EXTRACT: (id: string) => `/api/v1/documents/${id}/extract`,
    VALIDATE: (id: string) => `/api/v1/documents/${id}/validate`,
    RETRY: (id: string) => `/api/v1/documents/${id}/retry`,
    SEARCH: '/api/v1/documents/search',
    STATS: '/api/v1/documents/stats',
  },

  // Declarations (Module: app/modules/declarations)
  DECLARATIONS: {
    LIST: '/api/v1/declarations',
    CREATE: '/api/v1/declarations',
    DETAIL: (id: string) => `/api/v1/declarations/${id}`,
    UPDATE: (id: string) => `/api/v1/declarations/${id}`,
    DELETE: (id: string) => `/api/v1/declarations/${id}`,
    SUBMIT: (id: string) => `/api/v1/declarations/${id}/submit`,
    VALIDATE: (id: string) => `/api/v1/declarations/${id}/validate`,
    STATS: '/api/v1/declarations/stats',
  },

  // Companies (Module: app/modules/companies)
  COMPANIES: {
    LIST: '/api/v1/companies',
    CREATE: '/api/v1/companies',
    DETAIL: (id: string) => `/api/v1/companies/${id}`,
    UPDATE: (id: string) => `/api/v1/companies/${id}`,
    DELETE: (id: string) => `/api/v1/companies/${id}`,
    SEARCH: '/api/v1/companies/search',
    STATS: '/api/v1/companies/stats',
  },

  // Agents DGI (Module: app/modules/agents)
  AGENTS: {
    LIST: '/api/v1/agents',
    CREATE: '/api/v1/agents',
    DETAIL: (id: string) => `/api/v1/agents/${id}`,
    UPDATE: (id: string) => `/api/v1/agents/${id}`,
    DELETE: (id: string) => `/api/v1/agents/${id}`,
    STATS: '/api/v1/agents/stats',
  },

  // AI Chatbot (Module: app/modules/chatbot)
  CHATBOT: {
    CHAT: '/api/v1/ai/chat',
    HISTORY: '/api/v1/ai/history',
    CLEAR_HISTORY: '/api/v1/ai/history/clear',
  },

  // Communications (Module: app/modules/communications)
  COMMUNICATIONS: {
    SEND_EMAIL: '/api/v1/communications/email',
    SEND_SMS: '/api/v1/communications/sms',
    SEND_PUSH: '/api/v1/communications/push',
    TEMPLATES: '/api/v1/communications/templates',
  },

  // Translations (Module: app/modules/translations)
  TRANSLATIONS: {
    LIST: '/api/v1/translations',
    BY_LANGUAGE: (language: string) => `/api/v1/translations/${language}`,
    UPDATE: '/api/v1/translations',
    SYNC: '/api/v1/translations/sync',
  },

  // Webhooks (Module: app/modules/webhooks)
  WEBHOOKS: {
    BANGE_PAYMENT: '/api/v1/webhooks/bange/payment',
    BANGE_STATUS: '/api/v1/webhooks/bange/status',
  },
} as const;

// === ENDPOINTS ADMIN API (REST) ===
// Note: Admin dashboard HTML (backend/admin/) was archived as incomplete POC
// Only REST API endpoints from app/modules/admin/ are documented here

export const ADMIN_API_ENDPOINTS = {
  // Admin Diagnostics (Module: app/modules/admin/api/admin_routes.py)
  DIAGNOSTICS: {
    SECRETS: '/api/v1/admin/diagnostic/secrets',
  },

  // Admin Migrations (Module: app/modules/admin/api/admin_routes.py)
  MIGRATIONS: {
    GRANDFATHER_USERS: '/api/v1/admin/migrate/grandfather-users',
  },
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
export type AdminApiEndpointKey = keyof typeof ADMIN_API_ENDPOINTS;