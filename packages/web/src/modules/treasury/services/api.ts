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
  PaymentMethodConfig,
  PaymentMethodConfigCreate,
  PaymentMethodConfigUpdate,
  PaymentMethodReorderRequest,
  // Phase 1A - Audit
  AuditEntry,
  AuditListResponse,
  AuditParams,
  PaymentAuditDetail,
  // Phase 1B - SLA
  SLAStats,
  // Phase 2A - Anomalies
  Anomaly,
  AnomalyListResponse,
  AnomalyParams,
  AnomalyCreateRequest,
  AnomalyStatusUpdateRequest,
  AnomalyAction,
  // Phase 2B - Exports
  TreasuryExport,
  ExportListResponse,
  ExportParams,
  ExportCreateRequest,
  ExportTemplate,
  ExportDownloadResponse,
  // Phase 4 - KPIs
  KPIResponse,
  PaymentMethodKPI,
  MinistryKPI,
  DailyTrend,
  PeriodComparison,
  AgentPerformanceResponse,
  AgentStats,
} from '../types';
import type {
  // Phase 5 - Analytics
  StatisticsResponse,
  CorrelationMatrix,
  TrendsResponse,
  AnomaliesResponse,
  PredictionsResponse,
  AnalyticsReport,
  ExploreResponse,
  AnalyticsParams,
  ReportParams,
  PredictionParams,
  ExploreParams,
} from '../types/analytics';

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
  const transformed = toCamelCase<PendingPayment & { paymentId?: string }>(data);
  // Backend returns payment_id -> paymentId, but PendingPayment interface expects id
  if (transformed.paymentId && !transformed.id) {
    transformed.id = transformed.paymentId;
  }
  return transformed as PendingPayment;
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
   * BACKEND: GET /api/v1/admin/service-requests/treasury/stats/dashboard
   */
  getDashboardStats: async (): Promise<TreasuryStats> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/stats/dashboard`
    );

    return {
      pendingValidationCount: (response.pending_validation_count as number) || 0,
      unreconciledCount: (response.unreconciled_count as number) || 0,
      todayValidatedCount: (response.today_validated_count as number) || 0,
      todayValidatedAmount: (response.today_validated_amount as number) || 0,
      currency: (response.currency as string) || 'XAF',
    };
  },

  // -------------------------------------------------------------------------
  // Payment Method Configurations
  // -------------------------------------------------------------------------

  /**
   * List payment method configurations
   * BACKEND: GET /api/v1/admin/service-requests/payment-methods
   */
  getPaymentMethods: async (activeOnly: boolean = false): Promise<PaymentMethodConfig[]> => {
    const response = await fetchClient.get<Record<string, unknown>[]>(
      `${TREASURY_BASE}/payment-methods`,
      { active_only: activeOnly }
    );
    return response.map((item) => toCamelCase<PaymentMethodConfig>(item));
  },

  /**
   * Get single payment method
   * BACKEND: GET /api/v1/admin/service-requests/payment-methods/{code}
   */
  getPaymentMethod: async (code: string): Promise<PaymentMethodConfig> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/payment-methods/${code}`
    );
    return toCamelCase<PaymentMethodConfig>(response);
  },

  /**
   * Create payment method configuration
   * BACKEND: POST /api/v1/admin/service-requests/payment-methods
   * Note: Translations (FR/EN) are managed via entity_translations table
   */
  createPaymentMethod: async (config: PaymentMethodConfigCreate): Promise<PaymentMethodConfig> => {
    const payload: Record<string, unknown> = {
      code: config.code,
      label_es: config.labelEs,
    };
    if (config.processorType !== undefined) payload.processor_type = config.processorType;
    if (config.requiresPhone !== undefined) payload.requires_phone = config.requiresPhone;
    if (config.requiresRedirect !== undefined) payload.requires_redirect = config.requiresRedirect;
    if (config.requiresAgentValidation !== undefined) payload.requires_agent_validation = config.requiresAgentValidation;
    if (config.isActive !== undefined) payload.is_active = config.isActive;
    if (config.displayOrder !== undefined) payload.display_order = config.displayOrder;
    if (config.icon !== undefined) payload.icon = config.icon;
    if (config.minAmount !== undefined) payload.min_amount = config.minAmount;
    if (config.maxAmount !== undefined) payload.max_amount = config.maxAmount;
    if (config.feesPercentage !== undefined) payload.fees_percentage = config.feesPercentage;
    if (config.feesFixed !== undefined) payload.fees_fixed = config.feesFixed;

    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/payment-methods`,
      payload
    );
    return toCamelCase<PaymentMethodConfig>(response);
  },

  /**
   * Update payment method configuration
   * BACKEND: PUT /api/v1/admin/service-requests/payment-methods/{code}
   * Note: Translations (FR/EN) are managed via entity_translations table
   */
  updatePaymentMethod: async (
    code: string,
    update: PaymentMethodConfigUpdate
  ): Promise<PaymentMethodConfig> => {
    const payload: Record<string, unknown> = {};
    if (update.labelEs !== undefined) payload.label_es = update.labelEs;
    if (update.processorType !== undefined) payload.processor_type = update.processorType;
    if (update.requiresPhone !== undefined) payload.requires_phone = update.requiresPhone;
    if (update.requiresRedirect !== undefined) payload.requires_redirect = update.requiresRedirect;
    if (update.requiresAgentValidation !== undefined) payload.requires_agent_validation = update.requiresAgentValidation;
    if (update.isActive !== undefined) payload.is_active = update.isActive;
    if (update.displayOrder !== undefined) payload.display_order = update.displayOrder;
    if (update.icon !== undefined) payload.icon = update.icon;
    if (update.minAmount !== undefined) payload.min_amount = update.minAmount;
    if (update.maxAmount !== undefined) payload.max_amount = update.maxAmount;
    if (update.feesPercentage !== undefined) payload.fees_percentage = update.feesPercentage;
    if (update.feesFixed !== undefined) payload.fees_fixed = update.feesFixed;

    const response = await fetchClient.put<Record<string, unknown>>(
      `${TREASURY_BASE}/payment-methods/${code}`,
      payload
    );
    return toCamelCase<PaymentMethodConfig>(response);
  },

  /**
   * Delete payment method configuration
   * BACKEND: DELETE /api/v1/admin/service-requests/payment-methods/{code}
   */
  deletePaymentMethod: async (code: string): Promise<void> => {
    await fetchClient.delete(`${TREASURY_BASE}/payment-methods/${code}`);
  },

  /**
   * Reorder payment methods
   * BACKEND: PATCH /api/v1/admin/service-requests/payment-methods/reorder
   */
  reorderPaymentMethods: async (request: PaymentMethodReorderRequest): Promise<PaymentMethodConfig[]> => {
    const response = await fetchClient.patch<Record<string, unknown>[]>(
      `${TREASURY_BASE}/payment-methods/reorder`,
      { order: request.order }
    );
    return response.map((item) => toCamelCase<PaymentMethodConfig>(item));
  },

  // -------------------------------------------------------------------------
  // Audit & Traçabilité (Phase 1A)
  // -------------------------------------------------------------------------

  /**
   * Get audit entries (global or filtered)
   * BACKEND: GET /api/v1/admin/service-requests/treasury/audit
   */
  getAuditEntries: async (params: AuditParams = {}): Promise<AuditListResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page || 1,
      page_size: params.pageSize || 20,
    };

    if (params.paymentId) queryParams.payment_id = params.paymentId;
    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.action) queryParams.action = params.action;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/audit`,
      queryParams
    );

    const entries = (response.entries as Record<string, unknown>[]) || [];
    return {
      entries: entries.map((e) => toCamelCase<AuditEntry>(e)),
      total: (response.total as number) || 0,
      page: (response.page as number) || 1,
      pageSize: (response.page_size as number) || 20,
    };
  },

  /**
   * Get complete audit history for a specific payment
   * BACKEND: GET /api/v1/admin/service-requests/treasury/payments/{id}/audit
   */
  getPaymentAuditHistory: async (paymentId: string): Promise<PaymentAuditDetail> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/payments/${paymentId}/audit`
    );

    const timeline = (response.timeline as Record<string, unknown>[]) || [];
    return {
      paymentId: (response.payment_id as string) || paymentId,
      paymentReference: (response.payment_reference as string) || '',
      serviceRequestId: response.service_request_id as string | undefined,
      serviceRequestReference: response.service_request_reference as string | undefined,
      workflowCode: response.workflow_code as string | undefined,
      currentStatus: response.current_status as string || 'submitted',
      createdAt: (response.created_at as string) || '',
      timeline: timeline.map((e) => toCamelCase<AuditEntry>(e)),
      totalProcessingMinutes: response.total_processing_minutes as number | undefined,
      lockCount: (response.lock_count as number) || 0,
    } as PaymentAuditDetail;
  },

  // -------------------------------------------------------------------------
  // SLA Stats (Phase 1B)
  // -------------------------------------------------------------------------

  /**
   * Get SLA statistics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/stats/sla
   */
  getSLAStats: async (paymentMethod?: string): Promise<SLAStats> => {
    const queryParams: Record<string, string | undefined> = {};
    if (paymentMethod) queryParams.payment_method = paymentMethod;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/stats/sla`,
      queryParams
    );

    // Transform by_payment_method nested snake_case to camelCase
    let byPaymentMethod: SLAStats['byPaymentMethod'] = undefined;
    const rawByMethod = response.by_payment_method as Record<string, Record<string, number>> | undefined;
    if (rawByMethod) {
      byPaymentMethod = {};
      for (const [method, stats] of Object.entries(rawByMethod)) {
        byPaymentMethod[method] = {
          total: stats.total || 0,
          onTime: stats.on_time || 0,
          warning: stats.warning || 0,
          critical: stats.critical || 0,
          breached: stats.breached || 0,
        };
      }
    }

    return {
      totalPending: (response.total_pending as number) || 0,
      onTime: (response.on_time as number) || 0,
      warning: (response.warning as number) || 0,
      critical: (response.critical as number) || 0,
      breached: (response.breached as number) || 0,
      avgProcessingMinutes: response.avg_processing_minutes as number | undefined,
      maxProcessingMinutes: response.max_processing_minutes as number | undefined,
      slaRespectRate: (response.sla_respect_rate as number) || 100,
      byPaymentMethod,
    };
  },

  // -------------------------------------------------------------------------
  // Anomalies (Phase 2A)
  // -------------------------------------------------------------------------

  /**
   * Get anomalies list with filters
   * BACKEND: GET /api/v1/admin/service-requests/treasury/anomalies
   */
  getAnomalies: async (params: AnomalyParams = {}): Promise<AnomalyListResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page || 1,
      page_size: params.pageSize || 20,
    };

    if (params.status) queryParams.status = params.status;
    if (params.severity) queryParams.severity = params.severity;
    if (params.anomalyType) queryParams.anomaly_type = params.anomalyType;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies`,
      queryParams
    );

    const anomalies = (response.anomalies as Record<string, unknown>[]) || [];
    const summary = response.summary as Record<string, number> | undefined;

    return {
      anomalies: anomalies.map((a) => toCamelCase<Anomaly>(a)),
      total: (response.total as number) || 0,
      summary: {
        open: summary?.open || 0,
        investigating: summary?.investigating || 0,
        resolved: summary?.resolved || 0,
        falsePositive: summary?.false_positive || 0,
        escalated: summary?.escalated || 0,
        total: summary?.total || 0,
      },
    };
  },

  /**
   * Get single anomaly details
   * BACKEND: GET /api/v1/admin/service-requests/treasury/anomalies/{id}
   */
  getAnomaly: async (anomalyId: string): Promise<Anomaly> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies/${anomalyId}`
    );
    return toCamelCase<Anomaly>(response);
  },

  /**
   * Create manual anomaly
   * BACKEND: POST /api/v1/admin/service-requests/treasury/anomalies
   */
  createAnomaly: async (request: AnomalyCreateRequest): Promise<Anomaly> => {
    const payload: Record<string, unknown> = {
      entity_type: request.entityType,
      entity_id: request.entityId,
      anomaly_type: request.anomalyType,
      severity: request.severity,
      title: request.title,
    };
    if (request.description) payload.description = request.description;
    if (request.affectedAmount) payload.affected_amount = request.affectedAmount;
    if (request.relatedEntities) payload.related_entities = request.relatedEntities;

    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies`,
      payload
    );
    return toCamelCase<Anomaly>(response);
  },

  /**
   * Update anomaly status
   * BACKEND: PATCH /api/v1/admin/service-requests/treasury/anomalies/{id}/status
   */
  updateAnomalyStatus: async (
    anomalyId: string,
    request: AnomalyStatusUpdateRequest
  ): Promise<Anomaly> => {
    const payload: Record<string, unknown> = {
      new_status: request.newStatus,
    };
    if (request.comment) payload.comment = request.comment;
    if (request.resolution) payload.resolution = request.resolution;

    const response = await fetchClient.patch<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies/${anomalyId}/status`,
      payload
    );
    return toCamelCase<Anomaly>(response);
  },

  /**
   * Get anomaly action history
   * BACKEND: GET /api/v1/admin/service-requests/treasury/anomalies/{id}/actions
   */
  getAnomalyActions: async (anomalyId: string): Promise<AnomalyAction[]> => {
    const response = await fetchClient.get<Record<string, unknown>[]>(
      `${TREASURY_BASE}/anomalies/${anomalyId}/actions`
    );
    return response.map((a) => toCamelCase<AnomalyAction>(a));
  },

  /**
   * Add comment to anomaly
   * BACKEND: POST /api/v1/admin/service-requests/treasury/anomalies/{id}/comment
   */
  addAnomalyComment: async (anomalyId: string, comment: string): Promise<AnomalyAction> => {
    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies/${anomalyId}/comment`,
      { comment }
    );
    return toCamelCase<AnomalyAction>(response);
  },

  /**
   * Run automatic anomaly detection
   * BACKEND: POST /api/v1/admin/service-requests/treasury/anomalies/detect
   */
  runAnomalyDetection: async (
    detectionTypes?: string[]
  ): Promise<{ detectedAt: string; anomaliesFound: number; byType: Record<string, unknown> }> => {
    const payload: Record<string, unknown> = {};
    if (detectionTypes && detectionTypes.length > 0) {
      payload.detection_types = detectionTypes;
    }

    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/anomalies/detect`,
      Object.keys(payload).length > 0 ? payload : undefined
    );

    return {
      detectedAt: (response.detected_at as string) || new Date().toISOString(),
      anomaliesFound: (response.anomalies_found as number) || 0,
      byType: (response.by_type as Record<string, unknown>) || {},
    };
  },

  // -------------------------------------------------------------------------
  // Exports (Phase 2B)
  // -------------------------------------------------------------------------

  /**
   * Get exports list with filters
   * BACKEND: GET /api/v1/admin/service-requests/treasury/exports
   */
  getExports: async (params: ExportParams = {}): Promise<ExportListResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page || 1,
      page_size: params.pageSize || 20,
    };

    if (params.status) queryParams.status = params.status;
    if (params.exportType) queryParams.export_type = params.exportType;
    if (params.periodStart) queryParams.period_start = params.periodStart;
    if (params.periodEnd) queryParams.period_end = params.periodEnd;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/exports`,
      queryParams
    );

    const exports = (response.exports as Record<string, unknown>[]) || [];
    return {
      exports: exports.map((e) => toCamelCase<TreasuryExport>(e)),
      total: (response.total as number) || 0,
    };
  },

  /**
   * Get single export details
   * BACKEND: GET /api/v1/admin/service-requests/treasury/exports/{id}
   */
  getExport: async (exportId: string): Promise<TreasuryExport> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/exports/${exportId}`
    );
    return toCamelCase<TreasuryExport>(response);
  },

  /**
   * Get export templates
   * BACKEND: GET /api/v1/admin/service-requests/treasury/exports/templates
   */
  getExportTemplates: async (exportType?: string): Promise<ExportTemplate[]> => {
    const queryParams: Record<string, string | undefined> = {};
    if (exportType) queryParams.export_type = exportType;

    const response = await fetchClient.get<Record<string, unknown>[]>(
      `${TREASURY_BASE}/exports/templates`,
      queryParams
    );
    return response.map((t) => toCamelCase<ExportTemplate>(t));
  },

  /**
   * Generate new export
   * BACKEND: POST /api/v1/admin/service-requests/treasury/exports/generate
   */
  generateExport: async (request: ExportCreateRequest): Promise<TreasuryExport> => {
    const payload: Record<string, unknown> = {
      export_type: request.exportType,
      export_format: request.exportFormat,
      period_start: request.periodStart,
      period_end: request.periodEnd,
    };
    if (request.filters) {
      payload.filters = {
        ministry_id: request.filters.ministryId,
        payment_method: request.filters.paymentMethod,
        workflow_code: request.filters.workflowCode,
        status: request.filters.status,
      };
    }
    if (request.templateCode) payload.template_code = request.templateCode;

    const response = await fetchClient.post<Record<string, unknown>>(
      `${TREASURY_BASE}/exports/generate`,
      payload
    );
    return toCamelCase<TreasuryExport>(response);
  },

  /**
   * Download export file
   * BACKEND: GET /api/v1/admin/service-requests/treasury/exports/{id}/download
   */
  downloadExport: async (exportId: string): Promise<ExportDownloadResponse> => {
    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/exports/${exportId}/download`
    );
    return toCamelCase<ExportDownloadResponse>(response);
  },

  // -------------------------------------------------------------------------
  // KPIs & Performance Stats (Phase 4)
  // -------------------------------------------------------------------------

  /**
   * Get Treasury KPIs
   * BACKEND: GET /api/v1/admin/service-requests/treasury/stats/kpis
   */
  getKPIs: async (params: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<KPIResponse> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/stats/kpis`,
      queryParams
    );

    // Transform response with nested arrays
    const byPaymentMethod = (response.by_payment_method as Record<string, unknown>[]) || [];
    const byMinistry = (response.by_ministry as Record<string, unknown>[]) || [];
    const dailyTrend = (response.daily_trend as Record<string, unknown>[]) || [];
    const previousPeriod = response.previous_period as Record<string, unknown> | undefined;

    return {
      period: (response.period as string) || 'month',
      dateFrom: (response.date_from as string) || '',
      dateTo: (response.date_to as string) || '',
      totalCollected: (response.total_collected as number) || 0,
      totalTransactions: (response.total_transactions as number) || 0,
      avgTransactionAmount: (response.avg_transaction_amount as number) || 0,
      slaRespectRate: (response.sla_respect_rate as number) || 100,
      byPaymentMethod: byPaymentMethod.map((m) => toCamelCase<PaymentMethodKPI>(m)),
      byMinistry: byMinistry.map((m) => toCamelCase<MinistryKPI>(m)),
      dailyTrend: dailyTrend.map((d) => toCamelCase<DailyTrend>(d)),
      previousPeriod: previousPeriod ? toCamelCase<PeriodComparison>(previousPeriod) : undefined,
    };
  },

  /**
   * Get Agent Performance Statistics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/stats/agents
   */
  getAgentPerformance: async (params: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<AgentPerformanceResponse> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/stats/agents`,
      queryParams
    );

    const agents = (response.agents as Record<string, unknown>[]) || [];

    return {
      period: (response.period as string) || 'month',
      dateFrom: (response.date_from as string) || '',
      dateTo: (response.date_to as string) || '',
      agents: agents.map((a) => toCamelCase<AgentStats>(a)),
      totalValidations: (response.total_validations as number) || 0,
      totalRejections: (response.total_rejections as number) || 0,
    };
  },

  // -------------------------------------------------------------------------
  // Analytics (Phase 5)
  // -------------------------------------------------------------------------

  /**
   * Get descriptive statistics for treasury metrics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/statistics
   */
  getStatistics: async (params: AnalyticsParams = {}): Promise<StatisticsResponse> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/statistics`,
      queryParams
    );

    return toCamelCase<StatisticsResponse>(response);
  },

  /**
   * Get correlation matrix between metrics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/correlations
   */
  getCorrelations: async (params: AnalyticsParams = {}): Promise<CorrelationMatrix> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/correlations`,
      queryParams
    );

    return toCamelCase<CorrelationMatrix>(response);
  },

  /**
   * Get trend analysis for metrics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/trends
   */
  getTrends: async (params: AnalyticsParams = {}): Promise<TrendsResponse> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/trends`,
      queryParams
    );

    return toCamelCase<TrendsResponse>(response);
  },

  /**
   * Get detected anomalies in metrics
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/anomalies
   */
  getAnalyticsAnomalies: async (params: AnalyticsParams = {}): Promise<AnomaliesResponse> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/anomalies`,
      queryParams
    );

    return toCamelCase<AnomaliesResponse>(response);
  },

  /**
   * Get predictions for a metric
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/predictions
   */
  getPredictions: async (params: PredictionParams = {}): Promise<PredictionsResponse> => {
    const queryParams: Record<string, string | number | undefined> = {
      period: params.period || 'month',
      horizon_days: params.horizonDays || 7,
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/predictions`,
      queryParams
    );

    return toCamelCase<PredictionsResponse>(response);
  },

  /**
   * Generate complete analytics report with findings and recommendations
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/report
   */
  getAnalyticsReport: async (params: ReportParams = {}): Promise<AnalyticsReport> => {
    const queryParams: Record<string, string | undefined> = {
      period: params.period || 'month',
      language: params.language || 'es',
    };
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/report`,
      queryParams
    );

    return toCamelCase<AnalyticsReport>(response);
  },

  /**
   * Explore custom variable analysis
   * BACKEND: GET /api/v1/admin/service-requests/treasury/analytics/explore
   */
  exploreAnalytics: async (params: ExploreParams): Promise<ExploreResponse> => {
    const queryParams: Record<string, string | undefined> = {
      primary_variable: params.primaryVariable,
      period: params.period || 'month',
    };
    if (params.secondaryVariable) queryParams.secondary_variable = params.secondaryVariable;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;

    const response = await fetchClient.get<Record<string, unknown>>(
      `${TREASURY_BASE}/analytics/explore`,
      queryParams
    );

    return toCamelCase<ExploreResponse>(response);
  },
};

export default treasuryApi;
