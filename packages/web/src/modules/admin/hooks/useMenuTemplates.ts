/**
 * Menu Templates Hook
 * React Query hook for CRUD operations on menu templates
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
  MenuTemplateCreateRequest,
  MenuTemplateUpdateRequest,
  PaginationParams,
} from '../services/menuConfigService';
import type { MenuTemplate, MenuTemplateListResponse } from '@/modules/agent-dashboard/types/menu-config';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const menuTemplateKeys = {
  all: ['menu-templates'] as const,
  lists: () => [...menuTemplateKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...menuTemplateKeys.lists(), params] as const,
  details: () => [...menuTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuTemplateKeys.details(), id] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch paginated list of menu templates
 */
export function useMenuTemplates(params?: PaginationParams) {
  return useQuery<MenuTemplateListResponse, Error>({
    queryKey: menuTemplateKeys.list(params),
    queryFn: () => menuConfigApi.listTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single menu template by ID
 */
export function useMenuTemplate(id: string, enabled = true) {
  return useQuery<MenuTemplate, Error>({
    queryKey: menuTemplateKeys.detail(id),
    queryFn: () => menuConfigApi.getTemplate(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a new menu template
 */
export function useCreateMenuTemplate() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<MenuTemplate, Error, MenuTemplateCreateRequest>({
    mutationFn: (data) => menuConfigApi.createTemplate(data),
    onSuccess: () => {
      // Invalidate all template lists
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateCreated'));
    },
    onError: (error) => {
      toast.error(t('messages.templateCreateError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating an existing menu template
 */
export function useUpdateMenuTemplate() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<
    MenuTemplate,
    Error,
    { id: string; data: MenuTemplateUpdateRequest }
  >({
    mutationFn: ({ id, data }) => menuConfigApi.updateTemplate(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific template and all lists
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateUpdated'));
    },
    onError: (error) => {
      toast.error(t('messages.templateUpdateError'), {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a menu template
 */
export function useDeleteMenuTemplate() {
  const queryClient = useQueryClient();
  const t = useTranslations('menuConfig');

  return useMutation<void, Error, string>({
    mutationFn: (id) => menuConfigApi.deleteTemplate(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: menuTemplateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateDeleted'));
    },
    onError: (error) => {
      toast.error(t('messages.templateDeleteError'), {
        description: error.message,
      });
    },
  });
}

// =============================================================================
// COMBINED HOOK
// =============================================================================

/**
 * Combined hook for all menu template operations
 * Provides a convenient interface for components
 */
export function useMenuTemplateOperations(params?: PaginationParams) {
  const templatesQuery = useMenuTemplates(params);
  const createMutation = useCreateMenuTemplate();
  const updateMutation = useUpdateMenuTemplate();
  const deleteMutation = useDeleteMenuTemplate();

  return {
    // Query data
    templates: templatesQuery.data?.items ?? [],
    total: templatesQuery.data?.total ?? 0,
    pages: templatesQuery.data?.pages ?? 1,
    isLoading: templatesQuery.isLoading,
    isError: templatesQuery.isError,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,

    // Mutations
    createTemplate: createMutation.mutate,
    createTemplateAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateTemplate: (id: string, data: MenuTemplateUpdateRequest) =>
      updateMutation.mutate({ id, data }),
    updateTemplateAsync: (id: string, data: MenuTemplateUpdateRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,

    deleteTemplate: deleteMutation.mutate,
    deleteTemplateAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Combined loading state
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
