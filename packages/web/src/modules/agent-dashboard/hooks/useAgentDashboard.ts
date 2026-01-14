/**
 * useAgentDashboard Hook
 * Fetches current user's agent profile and determines dashboard configuration
 *
 * @module agent-dashboard/hooks
 * @date 2025-01-14
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { getAuthData } from '@/core/auth/storage';
import apiClient from '@/core/api/client';
import type { AgentDashboardContext, EntityCode, MenuItem } from '../types';
import { getEntityConfig, getEntityCodeFromName, ENTITY_CONFIGS } from '../config/entity-menus';

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

interface AgentProfileResponse {
  id: string;
  user_id: string;
  agent_type: 'ministry_agent' | 'entity_agent';
  is_supervisor: boolean;
  entity_id: string | null;
  ministry_id: number | null;
  agent_role: string;
  specializations: string[];
  is_active: boolean;
  // Joined fields
  entity_code?: string;
  entity_name?: string;
  ministry_code?: string;
  ministry_name?: string;
}

// =============================================================================
// HOOK: useAgentProfile
// Fetches the current user's agent profile
// =============================================================================

export function useAgentProfile() {
  const authData = getAuthData();
  const userId = authData?.user?.id;
  const userRole = authData?.user?.role;

  // Only fetch if user is an agent (new unified role from migration 048)
  const isAgent = userRole === 'agent';

  return useQuery<AgentProfileResponse | null>({
    queryKey: ['agent-profile', 'me', userId],
    queryFn: async () => {
      if (!userId || !isAgent) return null;

      try {
        const response = await apiClient.get<AgentProfileResponse>(
          '/agents/profiles/me'
        );
        return response.data;
      } catch (error) {
        console.error('Failed to fetch agent profile:', error);
        return null;
      }
    },
    enabled: !!userId && isAgent,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// HOOK: useAgentDashboard
// Main hook for agent dashboard configuration
// =============================================================================

interface UseAgentDashboardReturn {
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Agent context
  context: AgentDashboardContext | null;

  // Entity configuration
  entityCode: EntityCode | null;
  entityConfig: ReturnType<typeof getEntityConfig> | null;

  // Menu items (filtered by permissions)
  menuItems: MenuItem[];

  // Helper functions
  hasPermission: (permission: string) => boolean;
  getBasePath: () => string;
}

export function useAgentDashboard(): UseAgentDashboardReturn {
  const locale = useLocale();
  const authData = getAuthData();
  const user = authData?.user;

  // Fetch agent profile
  const {
    data: agentProfile,
    isLoading,
    isError,
    error,
  } = useAgentProfile();

  // Build agent context
  const context: AgentDashboardContext | null = agentProfile
    ? {
        agentProfileId: agentProfile.id,
        userId: agentProfile.user_id,
        entityCode: (agentProfile.entity_code as EntityCode) || null,
        entityId: agentProfile.entity_id,
        entityName: agentProfile.entity_name || null,
        ministryId: agentProfile.ministry_id,
        ministryName: agentProfile.ministry_name || null,
        isSupervisor: agentProfile.is_supervisor,
        agentRole: agentProfile.agent_role,
        permissions: user?.permissions || [],
        specializations: agentProfile.specializations || [],
      }
    : null;

  // Determine entity code
  const entityCode: EntityCode | null = agentProfile
    ? (agentProfile.entity_code as EntityCode) ||
      getEntityCodeFromName(agentProfile.entity_name || agentProfile.ministry_name || '')
    : null;

  // Get entity configuration
  const entityConfig = entityCode ? getEntityConfig(entityCode) : null;

  // Get user permissions (from auth data or agent profile)
  const userPermissions = new Set(user?.permissions || []);

  // Helper to check permission
  const hasPermission = (permission: string): boolean => {
    // Supervisors have all permissions within their entity
    if (context?.isSupervisor) return true;
    // Check if user has the specific permission
    return userPermissions.has(permission);
  };

  // Filter menu items by permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // Check group/item level permission
        if ('permission' in item && item.permission) {
          if (!hasPermission(item.permission)) return false;
        }
        return true;
      })
      .map((item) => {
        // If it's a group, filter its items
        if ('items' in item && Array.isArray(item.items)) {
          const filteredSubItems = item.items.filter((subItem) => {
            if (subItem.permission && !hasPermission(subItem.permission)) {
              return false;
            }
            return true;
          });

          // Only include group if it has visible items
          if (filteredSubItems.length === 0) return null;

          return {
            ...item,
            items: filteredSubItems,
          };
        }
        return item;
      })
      .filter(Boolean) as MenuItem[];
  };

  // Get filtered menu items
  const menuItems: MenuItem[] = entityConfig
    ? filterMenuItems(entityConfig.menuItems)
    : [];

  // Get base path with locale
  const getBasePath = (): string => {
    if (!entityConfig) return `/${locale}/dashboard/agent`;
    return `/${locale}${entityConfig.basePath}`;
  };

  return {
    isLoading,
    isError,
    error: error as Error | null,
    context,
    entityCode,
    entityConfig,
    menuItems,
    hasPermission,
    getBasePath,
  };
}

// =============================================================================
// HOOK: useAgentEntityRedirect
// Determines the correct dashboard URL for the current agent
// =============================================================================

export function useAgentEntityRedirect(): {
  isLoading: boolean;
  redirectUrl: string | null;
  entityCode: EntityCode | null;
} {
  const locale = useLocale();
  const { isLoading, entityCode, entityConfig } = useAgentDashboard();

  const redirectUrl = entityConfig
    ? `/${locale}${entityConfig.basePath}`
    : null;

  return {
    isLoading,
    redirectUrl,
    entityCode,
  };
}

export default useAgentDashboard;
