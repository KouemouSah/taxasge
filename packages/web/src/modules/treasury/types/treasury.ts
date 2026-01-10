/**
 * Treasury Module Types
 * Type definitions for Treasury Agent dashboard
 *
 * @module treasury/types
 */

// =============================================================================
// ENUMS (aligned with backend payment_workflow_status)
// =============================================================================

export type PaymentWorkflowStatus =
  | 'submitted'
  | 'auto_processing'
  | 'auto_approved'
  | 'pending_agent_review'
  | 'locked_by_agent'
  | 'agent_reviewing'
  | 'requires_documents'
  | 'docs_resubmitted'
  | 'approved_by_agent'
  | 'rejected_by_agent'
  | 'escalated_supervisor'
  | 'supervisor_reviewing'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_agent'
  | 'expired';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod =
  | 'mobile_money'
  | 'card'
  | 'bank_transfer'
  | 'cash'
  | 'check'
  | 'bange_wallet';

export type BankCode =
  | 'BANGE'
  | 'BGFI'
  | 'CCEIBANK'
  | 'SGBGE'
  | 'ECOBANK';

export type TransactionStatus =
  | 'unreconciled'
  | 'reconciled'
  | 'failed';

// =============================================================================
// SERVICE PAYMENT (from service_payments table)
// =============================================================================

export interface TariffBreakdown {
  baseAmount: number;
  baseDescription?: string;
  supplements?: Array<{
    code: string;
    nameEs: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  supplementsTotal: number;
  penaltiesAmount: number;
  totalAmount: number;
  currency: string;
  tariffType?: string;
  workflowCode?: string;
}

export interface PendingPayment {
  id: string;
  paymentReference: string;
  serviceRequestId?: string;
  userId: string;
  companyId?: string;
  paymentType: string;
  baseAmount: number;
  penalties: number;
  discounts: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  currency: string;
  paymentStatus: PaymentStatus;
  status: PaymentStatus; // Alias for paymentStatus
  workflowStatus: PaymentWorkflowStatus;
  requiresAgentValidation: boolean;
  lockedByAgentId?: number;
  lockedAt?: string;
  lockExpiresAt?: string;
  slaTargetDate?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  userName?: string;
  userEmail?: string;
  serviceName?: string;
  ministryName?: string;
  calculationDetails?: TariffBreakdown;
  // Computed fields from backend (extracted from calculationDetails)
  supplementsAmount?: number;
  supplements?: Array<{
    code: string;
    nameEs: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

export interface PendingPaymentsListResponse {
  payments: PendingPayment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PendingPaymentsParams {
  paymentMethod?: PaymentMethod | 'cash' | 'check';
  method?: string; // Alias for paymentMethod
  workflowStatus?: PaymentWorkflowStatus;
  status?: string; // Alias for workflowStatus
  page?: number;
  pageSize?: number;
}

// =============================================================================
// PAYMENT ACTIONS
// =============================================================================

export interface PaymentLockRequest {
  durationMinutes?: number;
}

export interface PaymentValidationRequest {
  comment?: string;
}

export interface PaymentRejectionRequest {
  reason: string;
}

export interface PaymentActionResponse {
  success: boolean;
  paymentId: string;
  newStatus?: PaymentWorkflowStatus;
  receiptNumber?: string;
  messageEs?: string;
  error?: string;
}

// =============================================================================
// BANK TRANSACTIONS (from bank_transactions table)
// =============================================================================

export interface BankTransaction {
  id: string;
  bankCode: BankCode;
  bankReference: string;
  transactionId: string; // Alias for bankReference
  bankTransactionDate?: string;
  amount: number;
  currency: string;
  accountNumber?: string;
  accountHolderName?: string;
  senderName?: string; // Alias for accountHolderName
  senderPhone?: string;
  paymentId?: string;
  status: TransactionStatus;
  reconciledAt?: string;
  reconciledBy?: string;
  rawData?: Record<string, unknown>;
  receivedAt: string; // Alias for createdAt
  createdAt: string;
  updatedAt?: string;
}

export interface BankTransactionListResponse {
  transactions: BankTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BankTransactionParams {
  status?: TransactionStatus;
  bankCode?: BankCode;
  page?: number;
  pageSize?: number;
}

export interface ReconcileRequest {
  bankTransactionId: string;
  paymentId: string;
}

// =============================================================================
// BANK CONFIGURATIONS (from bank_configurations table)
// =============================================================================

export interface BankConfiguration {
  id: number;
  bankCode: BankCode | string;
  bankName: string;
  apiEndpoint?: string;
  apiUrl?: string; // Alias for apiEndpoint
  apiVersion?: string;
  webhookUrl?: string;
  treasuryAccountNumber: string;
  isActive: boolean;
  supportsWebhooks: boolean;
  supportsDirectIntegration: boolean;
  requiresManualValidation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankConfigurationCreate {
  bankCode: BankCode;
  bankName: string;
  apiEndpoint?: string;
  apiVersion?: string;
  apiKeyEncrypted?: string;
  webhookSecret?: string;
  treasuryAccountNumber: string;
  isActive?: boolean;
  supportsWebhooks?: boolean;
  supportsDirectIntegration?: boolean;
}

export interface BankConfigurationUpdate {
  bankName?: string;
  apiEndpoint?: string;
  apiVersion?: string;
  apiKeyEncrypted?: string;
  webhookSecret?: string;
  treasuryAccountNumber?: string;
  isActive?: boolean;
  supportsWebhooks?: boolean;
  supportsDirectIntegration?: boolean;
}

// =============================================================================
// TREASURY STATS (for dashboard)
// =============================================================================

export interface TreasuryStats {
  pendingValidationCount: number;
  unreconciledCount: number;
  todayValidatedCount: number;
  todayValidatedAmount: number;
  currency: string;
}

// =============================================================================
// PAYMENT METHOD CONFIGURATIONS (from payment_method_configurations table)
// =============================================================================

export type ProcessorType = 'bange_api' | 'manual';

export interface PaymentMethodConfig {
  id: number;
  code: string;
  labelEs: string;
  // Note: Translations (FR/EN) are managed via entity_translations table
  processorType: ProcessorType;
  requiresPhone: boolean;
  requiresRedirect: boolean;
  requiresAgentValidation: boolean;
  isActive: boolean;
  displayOrder: number;
  icon: string;
  minAmount?: number;
  maxAmount?: number;
  feesPercentage: number;
  feesFixed: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentMethodConfigCreate {
  code: string;
  labelEs: string;
  // Note: Translations (FR/EN) are managed via entity_translations table
  processorType?: ProcessorType;
  requiresPhone?: boolean;
  requiresRedirect?: boolean;
  requiresAgentValidation?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  icon?: string;
  minAmount?: number;
  maxAmount?: number;
  feesPercentage?: number;
  feesFixed?: number;
}

export interface PaymentMethodConfigUpdate {
  labelEs?: string;
  // Note: Translations (FR/EN) are managed via entity_translations table
  processorType?: ProcessorType;
  requiresPhone?: boolean;
  requiresRedirect?: boolean;
  requiresAgentValidation?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  icon?: string;
  minAmount?: number;
  maxAmount?: number;
  feesPercentage?: number;
  feesFixed?: number;
}

export interface PaymentMethodReorderRequest {
  order: string[];
}

// =============================================================================
// AUDIT (Phase 1A)
// =============================================================================

export type AgentActionType =
  | 'lock_for_review'
  | 'approve'
  | 'reject'
  | 'request_documents'
  | 'escalate'
  | 'unlock_release'
  | 'assign_to_colleague';

export interface AuditEntry {
  id: string;
  paymentId: string;
  paymentReference: string;
  serviceRequestId?: string;
  serviceRequestReference?: string;
  action: AgentActionType;
  fromStatus?: PaymentWorkflowStatus;
  toStatus?: PaymentWorkflowStatus;
  comment?: string;
  agentId?: number;
  agentName?: string;
  agentEmail?: string;
  actionDurationSeconds?: number;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditListResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditParams {
  paymentId?: string;
  agentId?: number;
  action?: AgentActionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentAuditDetail {
  paymentId: string;
  paymentReference: string;
  serviceRequestId?: string;
  serviceRequestReference?: string;
  workflowCode?: string;
  currentStatus: PaymentWorkflowStatus;
  createdAt: string;
  timeline: AuditEntry[];
  totalProcessingMinutes?: number;
  lockCount: number;
}

// =============================================================================
// SLA STATS (Phase 1B)
// =============================================================================

export type SLAStatus = 'on_time' | 'warning' | 'critical' | 'breached';

export interface SLAStats {
  totalPending: number;
  onTime: number;
  warning: number;
  critical: number;
  breached: number;
  avgProcessingMinutes?: number;
  maxProcessingMinutes?: number;
  slaRespectRate: number;
  byPaymentMethod?: Record<string, {
    total: number;
    onTime: number;
    warning: number;
    critical: number;
    breached: number;
  }>;
}

/**
 * Calculate SLA status from target date
 */
export function calculateSLAStatus(
  slaTargetDate: string | undefined | null,
  workflowStatus: PaymentWorkflowStatus
): SLAStatus | 'completed' {
  // Completed statuses
  const completedStatuses: PaymentWorkflowStatus[] = [
    'completed',
    'cancelled_by_user',
    'cancelled_by_agent',
    'expired',
  ];

  if (completedStatuses.includes(workflowStatus)) {
    return 'completed';
  }

  if (!slaTargetDate) {
    return 'on_time';
  }

  const now = new Date();
  const target = new Date(slaTargetDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return 'breached';
  } else if (diffHours < 2) {
    return 'critical';
  } else if (diffHours < 6) {
    return 'warning';
  }
  return 'on_time';
}

// =============================================================================
// ANOMALIES (Phase 2A)
// =============================================================================

export type AnomalyType =
  | 'duplicate_payment'
  | 'amount_mismatch'
  | 'reference_missing'
  | 'orphan_transaction'
  | 'late_validation'
  | 'suspicious_pattern'
  | 'high_amount'
  | 'other';

export type AnomalyStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'false_positive'
  | 'escalated';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  entityType: string;
  entityId: string;
  paymentReference?: string;
  serviceRequestId?: string;
  serviceRequestReference?: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  title: string;
  description?: string;
  detectedBy: 'system' | 'agent';
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolution?: string;
  affectedAmount?: number;
  relatedEntities?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface AnomalySummary {
  open: number;
  investigating: number;
  resolved: number;
  falsePositive: number;
  escalated: number;
  total: number;
}

export interface AnomalyListResponse {
  anomalies: Anomaly[];
  total: number;
  summary: AnomalySummary;
}

export interface AnomalyParams {
  status?: AnomalyStatus;
  severity?: AnomalySeverity;
  anomalyType?: AnomalyType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AnomalyCreateRequest {
  entityType: string;
  entityId: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description?: string;
  affectedAmount?: number;
  relatedEntities?: Record<string, unknown>;
}

export interface AnomalyStatusUpdateRequest {
  newStatus: AnomalyStatus;
  comment?: string;
  resolution?: string;
}

export interface AnomalyAction {
  id: string;
  anomalyId: string;
  action: string;
  fromStatus?: AnomalyStatus;
  toStatus?: AnomalyStatus;
  comment?: string;
  performedByName?: string;
  performedAt: string;
}

// =============================================================================
// EXPORTS (Phase 2B)
// =============================================================================

export type ExportType =
  | 'sage_x3'
  | 'ministry_report'
  | 'bank_central'
  | 'audit_report'
  | 'reconciliation'
  | 'custom';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'xml' | 'json';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportFilters {
  ministryId?: string;
  paymentMethod?: string;
  workflowCode?: string;
  status?: string;
}

export interface TreasuryExport {
  id: string;
  exportType: ExportType;
  exportFormat: ExportFormat;
  periodStart: string;
  periodEnd: string;
  filters?: ExportFilters;
  status: ExportStatus;
  progressPercentage: number;
  totalRecords?: number;
  totalAmount?: number;
  currency: string;
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  requestedByName?: string;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  downloadCount: number;
}

export interface ExportListResponse {
  exports: TreasuryExport[];
  total: number;
}

export interface ExportParams {
  status?: ExportStatus;
  exportType?: ExportType;
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  pageSize?: number;
}

export interface ExportCreateRequest {
  exportType: ExportType;
  exportFormat: ExportFormat;
  periodStart: string;
  periodEnd: string;
  filters?: ExportFilters;
  templateCode?: string;
}

export interface ExportTemplate {
  id: number;
  code: string;
  name: string;
  exportType: ExportType;
  exportFormat: ExportFormat;
  description?: string;
  isActive: boolean;
}

export interface ExportDownloadResponse {
  fileName: string;
  filePath: string;
  contentType: string;
  message: string;
}

// =============================================================================
// KPIs (Phase 4)
// =============================================================================

export type KPIPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface KPIParams {
  period?: KPIPeriod;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentMethodKPI {
  method: string;
  count: number;
  amount: number;
  percentage: number;
  successRate: number;
  avgProcessingMinutes?: number;
}

export interface MinistryKPI {
  ministryId: number;
  ministryName: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  count: number;
  amount: number;
}

export interface PeriodComparison {
  totalCollectedChange: number;
  transactionsChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPIResponse {
  period: string;
  dateFrom: string;
  dateTo: string;
  totalCollected: number;
  totalTransactions: number;
  avgTransactionAmount: number;
  slaRespectRate: number;
  byPaymentMethod: PaymentMethodKPI[];
  byMinistry: MinistryKPI[];
  dailyTrend: DailyTrend[];
  previousPeriod?: PeriodComparison;
}

export interface AgentStats {
  agentId: number;
  agentName: string;
  agentEmail?: string;
  validationsCount: number;
  rejectionsCount: number;
  avgProcessingMinutes: number;
  slaRespectRate: number;
  currentWorkload: number;
}

export interface AgentPerformanceResponse {
  period: string;
  dateFrom: string;
  dateTo: string;
  agents: AgentStats[];
  totalValidations: number;
  totalRejections: number;
}
