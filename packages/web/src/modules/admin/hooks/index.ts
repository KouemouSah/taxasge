/**
 * Admin Module Hooks
 *
 * Includes:
 * - Menu configuration hooks
 * - Workflow mapping hooks
 * - Admin dashboard hooks (users, audit, stats)
 * - Treasury dashboard hooks
 *
 * @module admin/hooks
 * @date 2026-01-25
 */

// Menu configuration hooks
export {
  useMenuTemplates,
  useMenuTemplate,
  useCreateMenuTemplate,
  useUpdateMenuTemplate,
  useDeleteMenuTemplate,
  useMenuTemplateOperations,
  menuTemplateKeys,
} from './useMenuTemplates';

// Workflow mapping hooks
export {
  useWorkflowMappings,
  useWorkflowMapping,
  useCreateWorkflowMapping,
  useUpdateWorkflowMapping,
  useDeleteWorkflowMapping,
  useWorkflowMappingOperations,
  workflowMappingKeys,
} from './useWorkflowMappings';

// Role menu config hooks
export { useRoleMenuConfig } from './useRoleMenuConfig';

// Admin dashboard hooks (users, audit, stats)
export {
  useAdminStats,
  useAdminUsers,
  useAdminUser,
  useAuditLogs,
  useRoles,
  usePermissions,
  useUpdateUserStatus,
  useUpdateUserRole,
  usePrefetchAdminData,
  useInvalidateAdminCache,
  adminQueryKeys,
} from './useAdminQueries';
export type {
  AdminStats,
  UserListItem,
  UserListResponse,
  UserFilters,
  AuditLogEntry,
  AuditLogResponse,
  AuditFilters,
  RoleWithPermissions,
} from './useAdminQueries';

// Treasury dashboard hooks
export {
  useTreasuryStats,
  usePendingPayments,
  useTreasuryPayments,
  useTreasuryPayment,
  useRevenueAnalytics,
  useValidatePayment,
  useRejectPayment,
  useLockPayment,
  useUnlockPayment,
  usePrefetchTreasuryData,
  useInvalidateTreasuryCache,
  treasuryQueryKeys,
} from './useTreasuryQueries';
export type {
  TreasuryStats,
  TreasuryPayment,
  TreasuryPaymentListResponse,
  TreasuryFilters,
  RevenueData,
  RevenueAnalytics,
} from './useTreasuryQueries';
