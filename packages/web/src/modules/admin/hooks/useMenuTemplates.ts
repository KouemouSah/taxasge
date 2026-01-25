/**
 * Menu Templates Hook
 * React Query hook for CRUD operations on menu templates
 *
 * @module admin/hooks
 * @date 2026-01-19
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
  MenuTemplateCreateRequest,
  MenuTemplateUpdateRequest,
  PaginationParams,
} from '../services/menuConfigService';
import type { MenuTemplate, MenuTemplateListResponse } from '@/modules/agent-dashboard/types/menu-config';

// =============================================================================
// LOGGING UTILITY
// =============================================================================

const LOG_PREFIX = '[MenuTemplates]';

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
    queryFn: async () => {
      logInfo('Fetching menu templates', params);
      try {
        const result = await menuConfigApi.listTemplates(params);
        logInfo(`Fetched ${result.items.length} templates (total: ${result.total})`);
        return result;
      } catch (error) {
        logError('Failed to fetch menu templates', error, { params });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single menu template by ID
 */
export function useMenuTemplate(id: string, enabled = true) {
  return useQuery<MenuTemplate, Error>({
    queryKey: menuTemplateKeys.detail(id),
    queryFn: async () => {
      logInfo(`Fetching menu template id=${id}`);
      try {
        const result = await menuConfigApi.getTemplate(id);
        logInfo(`Fetched template: ${result.code}`);
        return result;
      } catch (error) {
        logError(`Failed to fetch menu template id=${id}`, error);
        throw error;
      }
    },
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
    mutationFn: async (data) => {
      logInfo('Creating menu template', { code: data.code, type: data.template_type });
      return menuConfigApi.createTemplate(data);
    },
    onSuccess: (result) => {
      logInfo(`Template created successfully: id=${result.id}, code=${result.code}`);
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateCreated'));
    },
    onError: (error, variables) => {
      logError('Failed to create menu template', error, {
        code: variables.code,
        data: variables,
      });
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
    mutationFn: async ({ id, data }) => {
      logInfo(`Updating menu template id=${id}`, data);
      return menuConfigApi.updateTemplate(id, data);
    },
    onSuccess: (result, variables) => {
      logInfo(`Template updated successfully: id=${variables.id}`, result);
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateUpdated'));
    },
    onError: (error, variables) => {
      logError(`Failed to update menu template id=${variables.id}`, error, {
        data: variables.data,
      });
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
    mutationFn: async (id) => {
      logInfo(`Deleting menu template id=${id}`);
      return menuConfigApi.deleteTemplate(id);
    },
    onSuccess: (_, id) => {
      logInfo(`Template deleted successfully: id=${id}`);
      queryClient.removeQueries({ queryKey: menuTemplateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: menuTemplateKeys.lists() });
      toast.success(t('messages.templateDeleted'));
    },
    onError: (error, id) => {
      logError(`Failed to delete menu template id=${id}`, error);
      toast.error(t('messages.templateDeleteError'), {
        description: error.message,
      });
    },
  });
}

// =============================================================================
// NAVIGATION HOOK
// =============================================================================

/**
 * Hook to fetch all menu template IDs for navigation
 * Returns a list of all IDs in order for prev/next navigation
 */
export function useMenuTemplateIds() {
  return useQuery<string[], Error>({
    queryKey: [...menuTemplateKeys.all, 'ids'] as const,
    queryFn: async () => {
      // Fetch all items (with a high page_size) to get all IDs
      const response = await menuConfigApi.listTemplates({ page: 1, page_size: 1000 });
      return response.items.map((t) => t.id);
    },
    staleTime: 5 * 60 * 1000,
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
