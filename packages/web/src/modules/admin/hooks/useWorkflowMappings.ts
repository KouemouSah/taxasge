/**
 * Workflow Menu Mappings Hook
 * React Query hook for CRUD operations on workflow-to-menu mappings
 *
 * @module admin/hooks
 * @date 2026-01-19
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { menuConfigApi } from '../services/menuConfigService';
import type {
  WorkflowMappingCreateRequest,
  WorkflowMappingUpdateRequest,
  PaginationParams,
} from '../services/menuConfigService';
import type {
  WorkflowMenuMapping,
  WorkflowMenuMappingListResponse,
} from '@/modules/agent-dashboard/types/menu-config';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const workflowMappingKeys = {
  all: ['workflow-mappings'] as const,
  lists: () => [...workflowMappingKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...workflowMappingKeys.lists(), params] as const,
  details: () => [...workflowMappingKeys.all, 'detail'] as const,
  detail: (id: number) => [...workflowMappingKeys.details(), id] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch paginated list of workflow mappings
 */
export function useWorkflowMappings(params?: PaginationParams) {
  return useQuery<WorkflowMenuMappingListResponse, Error>({
    queryKey: workflowMappingKeys.list(params),
    queryFn: () => menuConfigApi.listWorkflowMappings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single workflow mapping by ID
 */
export function useWorkflowMapping(id: number, enabled = true) {
  return useQuery<WorkflowMenuMapping, Error>({
    queryKey: workflowMappingKeys.detail(id),
    queryFn: () => menuConfigApi.getWorkflowMapping(id),
    enabled: enabled && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a new workflow mapping
 */
export function useCreateWorkflowMapping() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<WorkflowMenuMapping, Error, WorkflowMappingCreateRequest>({
    mutationFn: (data) => menuConfigApi.createWorkflowMapping(data),
    onSuccess: () => {
      // Invalidate all mapping lists
      queryClient.invalidateQueries({ queryKey: workflowMappingKeys.lists() });
      toast.success(t('messages.mappingCreated'));
    },
    onError: (error) => {
      toast.error(t('messages.mappingCreateError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating an existing workflow mapping
 */
export function useUpdateWorkflowMapping() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<
    WorkflowMenuMapping,
    Error,
    { id: number; data: WorkflowMappingUpdateRequest }
  >({
    mutationFn: ({ id, data }) => menuConfigApi.updateWorkflowMapping(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific mapping and all lists
      queryClient.invalidateQueries({
        queryKey: workflowMappingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: workflowMappingKeys.lists() });
      toast.success(t('messages.mappingUpdated'));
    },
    onError: (error) => {
      toast.error(t('messages.mappingUpdateError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a workflow mapping
 */
export function useDeleteWorkflowMapping() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<void, Error, number>({
    mutationFn: (id) => menuConfigApi.deleteWorkflowMapping(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: workflowMappingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowMappingKeys.lists() });
      toast.success(t('messages.mappingDeleted'));
    },
    onError: (error) => {
      toast.error(t('messages.mappingDeleteError'), {
        description: error.message,
      });
    },
  });
}

// =============================================================================
// NAVIGATION HOOK
// =============================================================================

/**
 * Hook to fetch all workflow mapping IDs for navigation
 * Returns a list of all IDs in order for prev/next navigation
 */
export function useWorkflowMappingIds() {
  return useQuery<number[], Error>({
    queryKey: [...workflowMappingKeys.all, 'ids'] as const,
    queryFn: async () => {
      // Fetch all items (with a high page_size) to get all IDs
      const response = await menuConfigApi.listWorkflowMappings({ page: 1, page_size: 1000 });
      return response.items.map((m) => m.id);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// COMBINED HOOK
// =============================================================================

/**
 * Combined hook for all workflow mapping operations
 * Provides a convenient interface for components
 */
export function useWorkflowMappingOperations(params?: PaginationParams) {
  const mappingsQuery = useWorkflowMappings(params);
  const createMutation = useCreateWorkflowMapping();
  const updateMutation = useUpdateWorkflowMapping();
  const deleteMutation = useDeleteWorkflowMapping();

  return {
    // Query data
    mappings: mappingsQuery.data?.items ?? [],
    total: mappingsQuery.data?.total ?? 0,
    pages: mappingsQuery.data?.pages ?? 1,
    isLoading: mappingsQuery.isLoading,
    isError: mappingsQuery.isError,
    error: mappingsQuery.error,
    refetch: mappingsQuery.refetch,

    // Mutations
    createMapping: createMutation.mutate,
    createMappingAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateMapping: (id: number, data: WorkflowMappingUpdateRequest) =>
      updateMutation.mutate({ id, data }),
    updateMappingAsync: (id: number, data: WorkflowMappingUpdateRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,

    deleteMapping: deleteMutation.mutate,
    deleteMappingAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Combined loading state
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
