/**
 * Treasury API Service
 * API calls for Treasury Agent dashboard
 *
 * @module treasury/services
 *
 * BACKEND ALIGNMENT:
 * Treasury Routes: /api/v1/admin/service-requests/treasury/*
 * Webhook Routes: /api/v1/webhooks/*
 */

import { fetchClient } from '@/core/api';
import type {
  PendingPayment,
  PendingPaymentsListResponse,
  PendingPaymentsParams,
  PaymentLockRequest,
  PaymentValidationRequest,
  PaymentRejectionRequest,
  PaymentActionResponse,
  BankTransaction,
  BankTransactionListResponse,
  BankTransactionParams,
  ReconcileRequest,
  BankConfiguration,
  BankConfigurationCreate,
  BankConfigurationUpdate,
  TreasuryStats,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TREASURY_BASE = '/admin/service-requests/treasury';
const WEBHOOKS_BASE = '/webhooks';

// =============================================================================
// HELPERS
// =============================================================================

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

function transformPayment(data: Record<string, unknown>): PendingPayment {
  return toCamelCase<PendingPayment>(data);
}

function transformTransaction(data: Record<string, unknown>): BankTransaction {
  return toCamelCase<BankTransaction>(data);
}

function transformBankConfig(data: Record<string, unknown>): BankConfiguration {
  return toCamelCase<BankConfiguration>(data);
}

// =============================================================================
// TREASURY PAYMENTS API
// =============================================================================

export const treasuryApi = {
  // -------------------------------------------------------------------------
  // Pending Payments
  // -------------------------------------------------------------------------

  /**
   * Get pending payments for validation
   * BACKEND: GET /api/v1/admin/service-requests/treasury/payments/pending
   */
  getPendingPayments: async (
    params: PendingPaymentsParams = {}
  ): Promise<PendingPaymentsListResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page || 1,
      limit: params.pageSize || 20,
    };

    if (params.paymentMethod) {
      queryParams.payment_method = params.paymentMethod;
    }
    if (params.workflowStatus) {
      queryParams.workflow_status = params.workflowStatus;
    }

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/pending`,
      queryParams
    );

    const payments = (response.payments as Record<string, unknown>[]) || [];
    return {
      payments: payments.map(transformPayment),
      total: (response.total as number) || 0,
      page: (response.page as number) || 1,
      pageSize: (response.page_size as number) || 20,
    };
  },

  /**
   * Get single payment details
   */
  getPaymentDetails: async (paymentId: string): Promise<PendingPayment> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}`
    );
    return transformPayment(response);
  },

  // -------------------------------------------------------------------------
  // Payment Actions
  // -------------------------------------------------------------------------

  /**
   * Lock payment for review
   * BACKEND: POST /api/v1/admin/service-requests/treasury/payments/{id}/lock
   */
  lockPayment: async (
    paymentId: string,
    request: PaymentLockRequest = {}
  ): Promise<PaymentActionResponse> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}/lock`,
      { duration_minutes: request.durationMinutes || 15 }
    );
    return toCamelCase<PaymentActionResponse>(response);
  },

  /**
   * Validate (approve) payment
   * BACKEND: POST /api/v1/admin/service-requests/treasury/payments/{id}/validate
   */
  validatePayment: async (
    paymentId: string,
    request: PaymentValidationRequest = {}
  ): Promise<PaymentActionResponse> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}/validate`,
      { comment: request.comment }
    );
    return toCamelCase<PaymentActionResponse>(response);
  },

  /**
   * Reject payment
   * BACKEND: POST /api/v1/admin/service-requests/treasury/payments/{id}/reject
   */
  rejectPayment: async (
    paymentId: string,
    request: PaymentRejectionRequest
  ): Promise<PaymentActionResponse> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}/reject`,
      { reason: request.reason }
    );
    return toCamelCase<PaymentActionResponse>(response);
  },

  /**
   * Unlock payment
   * BACKEND: POST /api/v1/admin/service-requests/treasury/payments/{id}/unlock
   */
  unlockPayment: async (paymentId: string): Promise<PaymentActionResponse> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}/unlock`,
      {}
    );
    return toCamelCase<PaymentActionResponse>(response);
  },

  // -------------------------------------------------------------------------
  // Bank Transactions (Reconciliation)
  // -------------------------------------------------------------------------

  /**
   * Get unreconciled transactions
   * BACKEND: GET /api/v1/webhooks/transactions/unreconciled
   */
  getUnreconciledTransactions: async (
    params: BankTransactionParams = {}
  ): Promise<BankTransactionListResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page || 1,
      page_size: params.pageSize || 20,
    };

    const response = await fetchClient.get<Record<string, unknown>>(
      `${WEBHOOKS_BASE}/transactions/unreconciled`,
      queryParams
    );

    const transactions = (response.transactions as Record<string, unknown>[]) || [];
    return {
      transactions: transactions.map(transformTransaction),
      total: (response.total as number) || 0,
      page: (response.page as number) || 1,
      pageSize: (response.page_size as number) || 20,
    };
  },

  /**
   * Get single transaction
   * BACKEND: GET /api/v1/webhooks/transactions/{id}
   */
  getTransaction: async (transactionId: string): Promise<BankTransaction> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${WEBHOOKS_BASE}/transactions/${transactionId}`
    );
    return transformTransaction(response);
  },

  /**
   * Manual reconciliation
   * BACKEND: POST /api/v1/webhooks/transactions/reconcile
   */
  reconcileTransaction: async (
    request: ReconcileRequest
  ): Promise<BankTransaction> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${WEBHOOKS_BASE}/transactions/reconcile`,
      {
        bank_transaction_id: request.bankTransactionId,
        payment_id: request.paymentId,
      }
    );
    return transformTransaction(response);
  },

  // -------------------------------------------------------------------------
  // Bank Configurations
  // -------------------------------------------------------------------------

  /**
   * List bank configurations
   * BACKEND: GET /api/v1/webhooks/bank-configurations
   */
  getBankConfigurations: async (
    activeOnly: boolean = true
  ): Promise<BankConfiguration[]> => {
    const response = await fetchClient.get<Record<string, unknown>[]>(
      `${WEBHOOKS_BASE}/bank-configurations`,
      { active_only: activeOnly }
    );
    return response.map(transformBankConfig);
  },

  /**
   * Create bank configuration
   * BACKEND: POST /api/v1/webhooks/bank-configurations
   */
  createBankConfiguration: async (
    config: BankConfigurationCreate
  ): Promise<BankConfiguration> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${WEBHOOKS_BASE}/bank-configurations`,
      {
        bank_code: config.bankCode,
        bank_name: config.bankName,
        api_endpoint: config.apiEndpoint,
        api_version: config.apiVersion,
        api_key_encrypted: config.apiKeyEncrypted,
        webhook_secret: config.webhookSecret,
        treasury_account_number: config.treasuryAccountNumber,
        is_active: config.isActive ?? true,
        supports_webhooks: config.supportsWebhooks ?? false,
        supports_direct_integration: config.supportsDirectIntegration ?? false,
      }
    );
    return transformBankConfig(response);
  },

  /**
   * Update bank configuration
   * BACKEND: PUT /api/v1/webhooks/bank-configurations/{id}
   */
  updateBankConfiguration: async (
    configId: number,
    update: BankConfigurationUpdate
  ): Promise<BankConfiguration> => {
    const payload: Record<string, unknown> = {};
    if (update.bankName !== undefined) payload.bank_name = update.bankName;
    if (update.apiEndpoint !== undefined) payload.api_endpoint = update.apiEndpoint;
    if (update.apiVersion !== undefined) payload.api_version = update.apiVersion;
    if (update.apiKeyEncrypted !== undefined) payload.api_key_encrypted = update.apiKeyEncrypted;
    if (update.webhookSecret !== undefined) payload.webhook_secret = update.webhookSecret;
    if (update.treasuryAccountNumber !== undefined) payload.treasury_account_number = update.treasuryAccountNumber;
    if (update.isActive !== undefined) payload.is_active = update.isActive;
    if (update.supportsWebhooks !== undefined) payload.supports_webhooks = update.supportsWebhooks;
    if (update.supportsDirectIntegration !== undefined) payload.supports_direct_integration = update.supportsDirectIntegration;

    const response = await fetchClient.put<Record<string, unknown>>(
      `${WEBHOOKS_BASE}/bank-configurations/${configId}`,
      payload
    );
    return transformBankConfig(response);
  },

  // -------------------------------------------------------------------------
  // Dashboard Stats
  // -------------------------------------------------------------------------

  /**
   * Get treasury dashboard stats
   * Aggregates multiple calls
   */
  getDashboardStats: async (): Promise<TreasuryStats> => {
    // Get pending count
    const pendingResponse = await treasuryApi.getPendingPayments({ pageSize: 1 });

    // Get unreconciled count
    const unreconciledResponse = await treasuryApi.getUnreconciledTransactions({ pageSize: 1 });

    return {
      pendingValidationCount: pendingResponse.total,
      unreconciledCount: unreconciledResponse.total,
      todayValidatedCount: 0, // TODO: Add backend endpoint
      todayValidatedAmount: 0, // TODO: Add backend endpoint
      currency: 'XAF',
    };
  },
};

export default treasuryApi;
