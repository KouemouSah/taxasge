/**
 * Workflow Display Config Hook
 * React Query hook for CRUD operations on workflow display configurations
 *
 * @module admin/hooks
 * @date 2026-02-01
 *
 * ERROR HANDLING:
 * - All mutations show toast messages on success/error
 * - Console logs for debugging in development
 * - Specific error messages for different failure scenarios
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { menuConfigApi } from '../services/menuConfigService';
import type {
  DisplayConfig,
  DisplayConfigListResponse,
  DisplayConfigCreateRequest,
  DisplayConfigUpdateRequest,
  PaginationParams,
  AvailableColumn,
  AvailableColumnsResponse,
} from '../services/menuConfigService';

// =============================================================================
// LOGGING UTILITY
// =============================================================================

const LOG_PREFIX = '[DisplayConfigs]';

function logInfo(message: string, data?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${LOG_PREFIX} ${message}`, data ?? '');
  }
}

function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`${LOG_PREFIX} ERROR: ${message}`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const displayConfigKeys = {
  all: ['display-configs'] as const,
  lists: () => [...displayConfigKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...displayConfigKeys.lists(), params] as const,
  details: () => [...displayConfigKeys.all, 'detail'] as const,
  detail: (id: number) => [...displayConfigKeys.details(), id] as const,
  byWorkflow: (code: string) => [...displayConfigKeys.all, 'by-workflow', code] as const,
  availableColumns: (pattern: string) =>
    [...displayConfigKeys.all, 'available-columns', pattern] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch paginated list of display configs
 */
export function useDisplayConfigs(params?: PaginationParams) {
  return useQuery<DisplayConfigListResponse, Error>({
    queryKey: displayConfigKeys.list(params),
    queryFn: async () => {
      logInfo('Fetching display configs', params);
      try {
        const result = await menuConfigApi.listDisplayConfigs(params);
        logInfo(`Fetched ${result.items.length} configs (total: ${result.total})`);
        return result;
      } catch (error) {
        logError('Failed to fetch display configs', error, { params });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single display config by ID
 */
export function useDisplayConfig(id: number, enabled = true) {
  return useQuery<DisplayConfig, Error>({
    queryKey: displayConfigKeys.detail(id),
    queryFn: async () => {
      logInfo(`Fetching display config id=${id}`);
      try {
        const result = await menuConfigApi.getDisplayConfig(id);
        logInfo(`Fetched config: ${result.workflow_code}`);
        return result;
      } catch (error) {
        logError(`Failed to fetch display config id=${id}`, error);
        throw error;
      }
    },
    enabled: enabled && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch display config for a specific workflow code
 */
export function useDisplayConfigForWorkflow(workflowCode: string, enabled = true) {
  return useQuery<DisplayConfig, Error>({
    queryKey: displayConfigKeys.byWorkflow(workflowCode),
    queryFn: async () => {
      logInfo(`Fetching display config for workflow=${workflowCode}`);
      try {
        const result = await menuConfigApi.getDisplayConfigForWorkflow(workflowCode);
        logInfo(`Found config: ${result.workflow_code}`);
        return result;
      } catch (error) {
        logError(`No display config found for workflow=${workflowCode}`, error);
        throw error;
      }
    },
    enabled: enabled && !!workflowCode,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on 404
  });
}

/**
 * Hook for creating a new display config
 */
export function useCreateDisplayConfig() {
  const queryClient = useQueryClient();
  const t = useTranslations('admin.menuConfig.displayConfig');

  return useMutation<DisplayConfig, Error, DisplayConfigCreateRequest>({
    mutationFn: async (data) => {
      logInfo('Creating display config', { workflowCode: data.workflow_code });
      return menuConfigApi.createDisplayConfig(data);
    },
    onSuccess: (result) => {
      logInfo(`Config created successfully: id=${result.id}, workflowCode=${result.workflow_code}`);
      queryClient.invalidateQueries({ queryKey: displayConfigKeys.lists() });
      toast.success(t('messages.created'));
    },
    onError: (error, variables) => {
      logError('Failed to create display config', error, {
        workflowCode: variables.workflow_code,
        data: variables,
      });
      toast.error(t('messages.createError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating an existing display config
 */
export function useUpdateDisplayConfig() {
  const queryClient = useQueryClient();
  const t = useTranslations('admin.menuConfig.displayConfig');

  return useMutation<
    DisplayConfig,
    Error,
    { id: number; data: DisplayConfigUpdateRequest }
  >({
    mutationFn: async ({ id, data }) => {
      logInfo(`Updating display config id=${id}`, data);
      return menuConfigApi.updateDisplayConfig(id, data);
    },
    onSuccess: (result, variables) => {
      logInfo(`Config updated successfully: id=${variables.id}`, result);
      queryClient.invalidateQueries({
        queryKey: displayConfigKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: displayConfigKeys.lists() });
      toast.success(t('messages.updated'));
    },
    onError: (error, variables) => {
      logError(`Failed to update display config id=${variables.id}`, error, {
        data: variables.data,
      });
      toast.error(t('messages.updateError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a display config
 */
export function useDeleteDisplayConfig() {
  const queryClient = useQueryClient();
  const t = useTranslations('admin.menuConfig.displayConfig');

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      logInfo(`Deleting display config id=${id}`);
      return menuConfigApi.deleteDisplayConfig(id);
    },
    onSuccess: (_, id) => {
      logInfo(`Config deleted successfully: id=${id}`);
      queryClient.removeQueries({ queryKey: displayConfigKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: displayConfigKeys.lists() });
      toast.success(t('messages.deleted'));
    },
    onError: (error, id) => {
      logError(`Failed to delete display config id=${id}`, error);
      toast.error(t('messages.deleteError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Column discovery filter options
 * Used to filter columns by workflow sub-type
 */
export interface ColumnDiscoveryFilters {
  isMinor?: boolean;
  motivo?: string;
}

/**
 * Hook to discover available columns for a workflow pattern
 * Dynamically introspects form_data from actual DB records
 *
 * @param workflowCode - Exact workflow code
 * @param enabled - Whether to enable the query
 * @param filters - Optional filters for sub-type column discovery
 *
 * @updated 2026-02-02 - Added isMinor and motivo filter support
 */
export function useAvailableColumns(
  workflowCode: string,
  enabled = true,
  filters?: ColumnDiscoveryFilters
) {
  // Include filters in query key for proper cache invalidation
  const queryKey = filters
    ? [...displayConfigKeys.availableColumns(workflowCode), filters]
    : displayConfigKeys.availableColumns(workflowCode);

  return useQuery<AvailableColumnsResponse, Error>({
    queryKey,
    queryFn: async () => {
      logInfo(`Discovering columns for code=${workflowCode}`, filters);
      try {
        const result = await menuConfigApi.getAvailableColumns(workflowCode, filters);
        logInfo(
          `Found ${result.system_columns.length} system + ${result.extracted_columns.length} extracted columns`
        );
        return result;
      } catch (error) {
        logError(`Failed to discover columns for ${workflowCode}`, error);
        throw error;
      }
    },
    enabled: enabled && !!workflowCode,
    staleTime: 10 * 60 * 1000, // 10 minutes - column discovery is expensive
  });
}

/**
 * Hook to get all available columns (system + extracted + nested) as a flat list
 * Useful for column selector components
 *
 * @param workflowCode - Exact workflow code
 * @param enabled - Whether to enable the query
 * @param filters - Optional filters for sub-type column discovery
 *
 * @updated 2026-02-02 - Separate extracted_nested columns for better UI grouping
 * @updated 2026-02-02 - Added isMinor and motivo filter support
 */
export function useAllAvailableColumns(
  workflowCode: string,
  enabled = true,
  filters?: ColumnDiscoveryFilters
) {
  const { data, isLoading, isError, error } = useAvailableColumns(
    workflowCode,
    enabled,
    filters
  );

  // Separate extracted columns by source
  const allExtractedColumns = data?.extracted_columns ?? [];
  const topLevelColumns = allExtractedColumns.filter(
    (col) => col.source === 'extracted'
  );
  const nestedColumns = allExtractedColumns.filter(
    (col) => col.source === 'extracted_nested'
  );

  const allColumns: AvailableColumn[] = data
    ? [...data.system_columns, ...allExtractedColumns]
    : [];

  // Default selected columns from backend - ONLY system columns, not extracted
  const defaultSelected = data?.default_selected ?? [
    'reference',
    'fullName',
    'solicitudType',
    'createdAt',
    'status',
    'priority',
  ];

  return {
    columns: allColumns,
    systemColumns: data?.system_columns ?? [],
    // Top-level form_data fields (nombres, apellidos, etc.)
    extractedColumns: topLevelColumns,
    // Flattened nested objects (dip_*, pasaporte_antiguo_*)
    nestedColumns,
    defaultSelected,
    totalRequests: data?.total_requests ?? 0,
    isLoading,
    isError,
    error,
  };
}

// =============================================================================
// COMBINED HOOK
// =============================================================================

/**
 * Combined hook for all display config operations
 * Provides a convenient interface for components
 */
export function useDisplayConfigOperations(params?: PaginationParams) {
  const configsQuery = useDisplayConfigs(params);
  const createMutation = useCreateDisplayConfig();
  const updateMutation = useUpdateDisplayConfig();
  const deleteMutation = useDeleteDisplayConfig();

  return {
    // Query data
    configs: configsQuery.data?.items ?? [],
    total: configsQuery.data?.total ?? 0,
    pages: configsQuery.data?.pages ?? 1,
    isLoading: configsQuery.isLoading,
    isError: configsQuery.isError,
    error: configsQuery.error,
    refetch: configsQuery.refetch,

    // Mutations
    createConfig: createMutation.mutate,
    createConfigAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateConfig: (id: number, data: DisplayConfigUpdateRequest) =>
      updateMutation.mutate({ id, data }),
    updateConfigAsync: (id: number, data: DisplayConfigUpdateRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,

    deleteConfig: deleteMutation.mutate,
    deleteConfigAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Combined loading state
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

// =============================================================================
// AVAILABLE COLUMNS AND SECTIONS
// =============================================================================

/**
 * @deprecated Use useAvailableColumns() hook instead for dynamic column discovery
 *
 * FALLBACK system columns - used only when dynamic discovery fails
 * The actual columns are now discovered dynamically from service_requests.form_data
 */
export const FALLBACK_SYSTEM_COLUMNS = [
  { id: 'reference', label: 'Reference', description: 'Request reference number' },
  { id: 'fullName', label: 'Full Name', description: 'Applicant full name' },
  { id: 'solicitudType', label: 'Request Type', description: 'Type of request' },
  { id: 'createdAt', label: 'Created At', description: 'Submission date' },
  { id: 'priority', label: 'Priority', description: 'Request priority level' },
  { id: 'status', label: 'Status', description: 'Current status' },
  { id: 'totalAmount', label: 'Total Amount', description: 'Total amount to pay' },
  { id: 'paymentStatus', label: 'Payment Status', description: 'Payment workflow status' },
  { id: 'assignedAgent', label: 'Assigned Agent', description: 'Assigned agent name' },
] as const;

/**
 * @deprecated Alias for backwards compatibility
 */
export const AVAILABLE_COLUMNS = FALLBACK_SYSTEM_COLUMNS;

/**
 * Default pre-selected columns for new display configurations
 */
export const DEFAULT_SELECTED_COLUMNS = [
  'reference',
  'fullName',
  'solicitudType',
  'createdAt',
  'status',
  'priority',
] as const;

/**
 * Available sections for preview panel
 */
export const AVAILABLE_SECTIONS = [
  { id: 'info', label: 'General Info', description: 'Basic request information' },
  { id: 'extractedData', label: 'Extracted Data', description: 'OCR extracted data' },
  { id: 'documents', label: 'Documents', description: 'Attached documents' },
  { id: 'contact', label: 'Contact', description: 'Contact information' },
  { id: 'appointment', label: 'Appointment', description: 'Appointment details' },
  { id: 'paymentDetails', label: 'Payment Details', description: 'Payment information' },
  { id: 'timeline', label: 'Timeline', description: 'Request timeline' },
  { id: 'history', label: 'History', description: 'Action history' },
] as const;
