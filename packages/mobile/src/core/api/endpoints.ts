/**
 * API Endpoint Constants
 *
 * Centralized endpoint definitions for the Facil backend API.
 * All endpoints are relative to the base URL configured in appConfig.
 *
 * Organized by module to match the backend router structure.
 * Dynamic segments use functions for type-safe URL generation.
 *
 * IMPORTANT: Keep in sync with packages/backend/app/main.py router registrations.
 */

export const API_ENDPOINTS = {
  // -------------------------------------------------------------------------
  // Authentication & Sessions
  // -------------------------------------------------------------------------
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    profile: '/auth/profile',
    requestVerificationCode: '/auth/request-verification-code',
    passwordResetRequest: '/auth/password/reset/request',
    passwordResetConfirm: '/auth/password/reset/confirm',
    passwordChange: '/users/profile/change-password',
    emailVerify: '/auth/email/verify',
    emailResend: '/auth/email/resend',
    sessions: '/auth/sessions',
    twoFactorEnable: '/auth/2fa/enable',
    twoFactorVerify: '/auth/2fa/verify',
    twoFactorDisable: '/auth/2fa/disable',
    twoFactorStatus: '/auth/2fa/status',
    /** Complete login when 2FA is required (separate from 2FA setup verify) */
    login2faVerify: '/auth/login/2fa-verify',
  },

  // -------------------------------------------------------------------------
  // User Profile
  // -------------------------------------------------------------------------
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/profile/change-password',
    uploadAvatar: '/users/profile/avatar',
    deleteAvatar: '/users/profile/avatar',
  },

  // -------------------------------------------------------------------------
  // Service Requests (Citizen view)
  // -------------------------------------------------------------------------
  serviceRequests: {
    list: '/service-requests/',
    detail: (id: string) => `/service-requests/${id}` as const,
    detailView: (id: string) => `/service-requests/${id}/detail-view` as const,
    summaryPdf: (id: string) => `/service-requests/${id}/summary/pdf` as const,
    dashboardSummary: '/service-requests/dashboard-summary',
    workflows: '/service-requests/workflows',
    workflowDetail: (code: string) => `/service-requests/workflows/${code}` as const,
  },

  // -------------------------------------------------------------------------
  // Wizard Sessions (Multi-step request creation)
  // -------------------------------------------------------------------------
  wizardSessions: {
    create: '/wizard-sessions',
    get: (id: string) => `/wizard-sessions/${id}` as const,
    formData: (id: string) => `/wizard-sessions/${id}/form-data` as const,
    formConfig: (id: string) => `/wizard-sessions/${id}/form-config` as const,
    documents: (id: string) => `/wizard-sessions/${id}/documents` as const,
    documentPreview: (id: string) => `/wizard-sessions/${id}/documents/preview` as const,
    documentDelete: (id: string, docId: string) =>
      `/wizard-sessions/${id}/documents/${docId}` as const,
    appointmentLocations: (id: string) =>
      `/wizard-sessions/${id}/appointment-locations` as const,
    appointmentDays: (id: string) =>
      `/wizard-sessions/${id}/appointment-days` as const,
    appointmentSlots: (id: string) =>
      `/wizard-sessions/${id}/appointment-slots` as const,
    appointment: (id: string) => `/wizard-sessions/${id}/appointment` as const,
    initiatePayment: (id: string) =>
      `/wizard-sessions/${id}/initiate-payment` as const,
    delete: (id: string) => `/wizard-sessions/${id}` as const,
  },

  // -------------------------------------------------------------------------
  // Fiscal Services Catalog
  // -------------------------------------------------------------------------
  fiscalServices: {
    list: '/fiscal-services',
    detail: (id: string) => `/fiscal-services/${id}` as const,
    details: (id: string) => `/fiscal-services/${id}/details` as const,
    search: '/fiscal-services/search',
    calculate: '/fiscal-services/calculate',
    popular: '/fiscal-services/popular/list',
    recent: '/fiscal-services/recent/list',
    ministries: '/fiscal-services/ministries',
    sectors: '/fiscal-services/sectors',
    categories: '/fiscal-services/categories',
  },

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------
  payments: {
    list: '/payments',
    detail: (id: string) => `/payments/${id}` as const,
    create: '/payments',
  },

  // -------------------------------------------------------------------------
  // AI Chatbot (RAG + Gemini)
  // -------------------------------------------------------------------------
  chatbot: {
    chat: '/chatbot/chat',
    stream: '/chatbot/chat/stream',
    search: '/chatbot/search',
    recommend: '/chatbot/recommend',
    guide: '/chatbot/guide',
    conversations: (id: string) => `/chatbot/conversations/${id}` as const,
  },

  // -------------------------------------------------------------------------
  // Support Tickets
  // -------------------------------------------------------------------------
  support: {
    tickets: '/support/tickets',
    myTickets: '/support/tickets/my',
    ticketDetail: (id: string) => `/support/tickets/${id}` as const,
    ticketClose: (id: string) => `/support/tickets/${id}/close` as const,
    ticketMessages: (id: string) => `/support/tickets/${id}/messages` as const,
    categories: '/support/categories',
  },

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------
  documents: {
    upload: '/documents/upload',
    list: '/documents/list',
    detail: (id: string) => `/documents/${id}` as const,
    download: (id: string) => `/documents/${id}/download` as const,
  },

  // -------------------------------------------------------------------------
  // Translations & i18n
  // -------------------------------------------------------------------------
  translations: {
    frontend: (lang: string) => `/frontend-translations/${lang}` as const,
    enums: '/translations/enums',
  },

  // -------------------------------------------------------------------------
  // Homepage / Public
  // -------------------------------------------------------------------------
  homepage: {
    data: '/homepage',
  },
} as const;

/**
 * Type helper: extracts the return type of an endpoint.
 * For static endpoints it's a string literal; for dynamic ones it's the function's return type.
 */
export type EndpointUrl<T> = T extends (...args: never[]) => infer R ? R : T;
