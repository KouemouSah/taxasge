/**
 * useAgentDashboard Hook
 * Fetches current user's agent profile and determines dashboard configuration
 *
 * Updated 2026-01-19: Now supports dynamic menu configuration from backend API.
 * Falls back to static entity-menus.ts if API fails.
 *
 * @module agent-dashboard/hooks
 * @date 2026-01-19
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { getAuthData } from '@/core/auth/storage';
import apiClient from '@/core/api/client';
import type { AgentDashboardContext, EntityCode, MenuItem, MinistryCode } from '../types';
import { MINISTRY_ENTITIES } from '../types';
import { getEntityConfig, getEntityCodeFromName, ENTITY_CONFIGS } from '../config/entity-menus';
import type { AgentMenuConfigResponse, DynamicMenuItem } from '../types/menu-config';
import { FEATURE_DYNAMIC_MENUS } from '@/core/config/features';

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
  // Use state to handle SSR/hydration timing - getAuthData() relies on localStorage
  const [authState, setAuthState] = useState<{
    userId: string | null;
    role: string | null;
    isLoaded: boolean;
  }>({
    userId: null,
    role: null,
    isLoaded: false,
  });

  // Load auth data on client-side only (after hydration)
  useEffect(() => {
    const authData = getAuthData();
    if (authData?.user) {
      setAuthState({
        userId: authData.user.id,
        role: authData.user.role,
        isLoaded: true,
      });
    } else {
      setAuthState({
        userId: null,
        role: null,
        isLoaded: true,
      });
    }
  }, []);

  // Only fetch if user is an agent (new unified role from migration 048)
  const isAgent = authState.role === 'agent';

  return useQuery<AgentProfileResponse | null>({
    queryKey: ['agent-profile', 'me', authState.userId],
    queryFn: async () => {
      if (!authState.userId || !isAgent) return null;

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
    // Only enable after auth state is loaded and user is an agent
    enabled: authState.isLoaded && !!authState.userId && isAgent,
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
  // For ministry_agent: merged menus from all entities of the ministry
  // Now supports dynamic menus from backend API
  menuItems: MenuItem[];

  // Dynamic menu items from API (if available)
  dynamicMenuItems: DynamicMenuItem[];
  useDynamicMenus: boolean;

  // Helper functions
  hasPermission: (permission: string) => boolean;
  getBasePath: () => string;

  // Ministry agent specific
  isMinistryAgent: boolean;
  ministryEntities: EntityCode[];

  // Dynamic config
  menuConfig: AgentMenuConfigResponse | null;
}

export function useAgentDashboard(): UseAgentDashboardReturn {
  const locale = useLocale();

  // Use state to handle SSR/hydration timing - getAuthData() relies on localStorage
  const [userState, setUserState] = useState<{
    user: { id?: string; role?: string; permissions?: string[] } | null;
    isLoaded: boolean;
  }>({
    user: null,
    isLoaded: false,
  });

  // Load user data on client-side only (after hydration)
  useEffect(() => {
    const authData = getAuthData();
    setUserState({
      user: authData?.user || null,
      isLoaded: true,
    });
  }, []);

  const user = userState.user;

  // Fetch agent profile
  const {
    data: agentProfile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErr,
  } = useAgentProfile();

  // Fetch dynamic menu configuration from backend API
  const isAgent = userState.user?.role === 'agent';
  const {
    data: menuConfigData,
    isLoading: menuConfigLoading,
    isError: menuConfigError,
  } = useQuery<AgentMenuConfigResponse | null>({
    queryKey: ['agent-menu-config', 'me', userState.user?.id],
    queryFn: async () => {
      if (!userState.user?.id || !isAgent) return null;
      try {
        const response = await apiClient.get<AgentMenuConfigResponse>('/menu-config/me');
        return response.data;
      } catch (err) {
        console.warn('[useAgentDashboard] Menu config API not available, using static config');
        return null;
      }
    },
    enabled: userState.isLoaded && !!userState.user?.id && isAgent,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1, // Only retry once since we have static fallback
  });

  // Use dynamic menus if:
  // 1. Feature flag is enabled (default: true, set NEXT_PUBLIC_FEATURE_DYNAMIC_MENUS=false to disable)
  // 2. API returns menu config with menus
  const hasDynamicMenusFromApi = !!menuConfigData?.menu_config?.menus?.length;
  const useDynamicMenus = FEATURE_DYNAMIC_MENUS && hasDynamicMenusFromApi;

  // Warning: Detect fallback scenarios and log appropriately
  // has_role_menu_config = true means DB has menu_config, so if menus are empty, it's a parsing issue
  if (typeof window !== 'undefined' && !menuConfigLoading && menuConfigData) {
    if (menuConfigData.has_role_menu_config && !hasDynamicMenusFromApi) {
      // DB has config but parsing failed - critical issue
      console.error(
        `[useAgentDashboard] ❌ ERREUR: role.menu_config existe en DB mais aucun menu parsé. ` +
        `role=${menuConfigData.role_code}. Vérifier le format JSON dans roles.menu_config.`
      );
    } else if (!menuConfigData.has_role_menu_config && !hasDynamicMenusFromApi) {
      // No DB config - expected fallback for non-migrated entities
      console.info(
        `[useAgentDashboard] ℹ️ Fallback statique: role.menu_config NULL en DB. ` +
        `role=${menuConfigData.role_code}, entity_type=${menuConfigData.entity_type}`
      );
    }
  }

  // Include userState.isLoaded in loading check to prevent SSR mismatch
  const isLoading = !userState.isLoaded || profileLoading || (isAgent && menuConfigLoading);
  const isError = profileError || menuConfigError;
  const error = profileErr;

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

  // Debug logging for troubleshooting menu issues
  if (typeof window !== 'undefined' && agentProfile) {
    console.log('[AgentDashboard] Debug:', {
      userId: user?.id,
      role: user?.role,
      entityCode,
      entityConfigFound: !!entityConfig,
      entityName: agentProfile?.entity_name,
      ministryName: agentProfile?.ministry_name,
      isSupervisor: agentProfile?.is_supervisor,
      permissionsCount: user?.permissions?.length || 0,
    });
  }

  // Get user permissions (from auth data or agent profile)
  const userPermissions = useMemo(
    () => new Set(user?.permissions || []),
    [user?.permissions]
  );

  // Helper to check permission (memoized to prevent infinite re-renders)
  const hasPermission = useCallback((permission: string): boolean => {
    // Supervisors have all permissions within their entity
    if (context?.isSupervisor) return true;
    // Check if user has the specific permission
    return userPermissions.has(permission);
  }, [context?.isSupervisor, userPermissions]);

  // Filter menu items by permissions (memoized to prevent infinite re-renders)
  const filterMenuItems = useCallback((items: MenuItem[]): MenuItem[] => {
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
  }, [hasPermission]);

  // Determine if this is a ministry_agent (supervisor over ministry entities)
  const isMinistryAgent = agentProfile?.agent_type === 'ministry_agent';
  const ministryCode = agentProfile?.ministry_code as MinistryCode | undefined;

  // Get ministry entities if ministry_agent
  const ministryEntities: EntityCode[] = isMinistryAgent && ministryCode && MINISTRY_ENTITIES[ministryCode]
    ? MINISTRY_ENTITIES[ministryCode]
    : [];

  // Get filtered menu items
  // For ministry_agent: merge menus from all entities of the ministry
  // Memoize to prevent infinite re-render loop when used as useEffect dependency
  const menuItems: MenuItem[] = useMemo(() => {
    if (isMinistryAgent && ministryEntities.length > 0) {
      // Merge menus from all ministry entities
      const mergedMenus: MenuItem[] = [];
      const seenIds = new Set<string>();

      // Add ministry dashboard as first item
      mergedMenus.push({
        id: 'ministry-dashboard',
        titleKey: 'agent.nav.ministryDashboard',
        href: `/dashboard/agent/ministry`,
        icon: entityConfig?.icon || ENTITY_CONFIGS.GENERAL.icon,
      });

      // Collect all menus from ministry entities (skip duplicates)
      for (const entCode of ministryEntities) {
        const entConfig = getEntityConfig(entCode);
        if (!entConfig) continue;

        for (const item of entConfig.menuItems) {
          // Skip dashboard items (we already have ministry dashboard)
          if (item.id === 'dashboard') continue;

          // Prefix item ID with entity code to avoid collisions
          const prefixedId = `${entCode}-${item.id}`;
          if (seenIds.has(prefixedId)) continue;
          seenIds.add(prefixedId);

          // Add entity label to group titles for clarity
          if ('items' in item && Array.isArray(item.items)) {
            mergedMenus.push({
              ...item,
              id: prefixedId,
              titleKey: `${item.titleKey}`, // Could prefix with entity name if needed
            });
          } else {
            mergedMenus.push({
              ...item,
              id: prefixedId,
            });
          }
        }
      }

      return filterMenuItems(mergedMenus);
    }

    // Regular entity agent: return entity-specific menus
    return entityConfig ? filterMenuItems(entityConfig.menuItems) : [];
  }, [isMinistryAgent, ministryEntities, entityConfig, filterMenuItems]);

  // Debug: log menu items count
  if (typeof window !== 'undefined' && entityConfig) {
    console.log('[AgentDashboard] Menu items:', {
      rawMenuItemsCount: entityConfig?.menuItems?.length || 0,
      filteredMenuItemsCount: menuItems.length,
      menuItemIds: menuItems.map(m => m.id),
      useDynamicMenus,
      dynamicMenuCount: menuConfigData?.menu_config?.menus?.length || 0,
    });
  }

  // Process dynamic menu items with locale-prefixed hrefs
  const dynamicMenuItems: DynamicMenuItem[] = useMemo(() => {
    if (!menuConfigData?.menu_config?.menus) {
      return [];
    }
    return menuConfigData.menu_config.menus.map((menu) => ({
      ...menu,
      href: menu.href
        ? menu.href.startsWith('/')
          ? `/${locale}${menu.href}`
          : menu.href
        : undefined,
      items: menu.items?.map((item) => ({
        ...item,
        href: item.href.startsWith('/') ? `/${locale}${item.href}` : item.href,
      })),
    }));
  }, [menuConfigData?.menu_config?.menus, locale]);

  // Get base path with locale
  const getBasePath = (): string => {
    if (isMinistryAgent) {
      return `/${locale}/dashboard/agent/ministry`;
    }
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
    dynamicMenuItems,
    useDynamicMenus,
    hasPermission,
    getBasePath,
    isMinistryAgent,
    ministryEntities,
    menuConfig: menuConfigData || null,
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
