/**
 * Generic Agent Sidebar Navigation
 * Dynamically configured sidebar based on agent's entity
 *
 * @module agent-dashboard/components
 * @date 2026-01-19
 *
 * This sidebar automatically adapts its menu based on:
 * - Dynamic menu configuration from backend API (preferred)
 * - Static entity-menus.ts fallback
 * - The agent's permissions
 * - The agent's role (supervisor gets all menus)
 */

'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/core/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  User,
  Settings,
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  History,
  Calendar,
  Wallet,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  FileSearch,
  ClipboardList,
  Building2,
  Car,
  BadgeCheck,
  Briefcase,
  Globe,
  // Treasury icons
  RefreshCw,
  Activity,
  ShieldAlert,
  FileSpreadsheet,
  Banknote,
  // Escalation icons
  AlertTriangle,
  AlertCircle,
  List,
  // Workflow icons
  Plane,
  Truck,
  FileSignature,
  type LucideIcon,
} from 'lucide-react';
import { clearAuthData } from '@/core/auth/storage';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem, MenuGroup, EntityDashboardConfig } from '../types';
import { isMenuGroup } from '../types';
import type { DynamicMenuItem, SubMenuItem } from '../types/menu-config';
import { isDynamicMenuGroup, isDynamicMenuLink } from '../types/menu-config';
import { useAgentDashboard } from '../hooks';

// =============================================================================
// ICON MAPPING
// =============================================================================

/**
 * Map icon string names to Lucide components
 * Used for dynamic menus where icons come from backend as strings
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Layout & Navigation
  LayoutDashboard,
  ChevronDown,

  // Documents & Files
  FileText,
  FileSearch,
  FileSpreadsheet,
  FileSignature,
  ClipboardList,

  // Time & Status
  Clock,
  CheckCircle,
  History,
  Calendar,

  // Finance & Payment
  Wallet,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Banknote,
  RefreshCw,
  Activity,

  // Entities & Business
  Building2,
  Car,
  Truck,
  IdCard: BadgeCheck,
  BadgeCheck,
  Briefcase,
  Globe,
  Plane,

  // Users & Security
  User,
  Settings,
  Shield,
  ShieldAlert,
  LogOut,

  // Alerts & Notifications
  AlertTriangle,
  AlertCircle,
  List,
};

/**
 * Get Lucide icon component from string name
 */
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || FileText;
}

// =============================================================================
// PROPS
// =============================================================================

interface GenericAgentSidebarProps {
  /** Optional: Override entity config (for testing or custom dashboards) */
  entityConfig?: EntityDashboardConfig;
  /** Optional: Custom class name */
  className?: string;
  /** Show collapsed state toggle */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GenericAgentSidebar({
  entityConfig: propConfig,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: GenericAgentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('agent');
  const tDashboard = useTranslations('dashboard');
  const { toast } = useToast();

  // State
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get agent dashboard configuration
  const {
    isLoading,
    entityConfig: hookConfig,
    menuItems,
    dynamicMenuItems,
    useDynamicMenus,
    context,
    getBasePath: _getBasePath,
  } = useAgentDashboard();

  // Use prop config if provided, otherwise use hook config
  const entityConfig = propConfig || hookConfig;

  // Build menu items with locale in href (for static menus)
  // Memoize to prevent infinite re-render loop when used as useEffect dependency
  const localizedMenuItems = useMemo(
    () => menuItems.map((item) => localizeMenuItem(item, locale)),
    [menuItems, locale]
  );

  // Debug: log which menu system is being used
  if (typeof window !== 'undefined') {
    console.log('[GenericAgentSidebar] Menu system:', {
      useDynamicMenus,
      dynamicMenuCount: dynamicMenuItems.length,
      staticMenuCount: localizedMenuItems.length,
    });
  }

  // Auto-expand group containing active route
  useEffect(() => {
    // Handle dynamic menus
    if (useDynamicMenus && dynamicMenuItems.length > 0) {
      for (const item of dynamicMenuItems) {
        if (isDynamicMenuGroup(item)) {
          const hasActiveChild = item.items.some(
            (sub) =>
              pathname === sub.href || pathname?.startsWith(sub.href + '/')
          );
          if (hasActiveChild) {
            // Only update state if the group isn't already expanded (prevents infinite re-renders)
            setExpandedGroups((prev) => {
              if (prev.has(item.id)) return prev; // Already expanded, return same reference
              return new Set(prev).add(item.id);
            });
            break;
          }
        }
      }
      return;
    }

    // Handle static menus
    if (!localizedMenuItems.length) return;

    for (const item of localizedMenuItems) {
      if (isMenuGroup(item)) {
        const hasActiveChild = item.items.some(
          (sub) =>
            pathname === sub.href || pathname?.startsWith(sub.href + '/')
        );
        if (hasActiveChild) {
          // Only update state if the group isn't already expanded (prevents infinite re-renders)
          setExpandedGroups((prev) => {
            if (prev.has(item.id)) return prev; // Already expanded, return same reference
            return new Set(prev).add(item.id);
          });
          break;
        }
      }
    }
  }, [pathname, localizedMenuItems, dynamicMenuItems, useDynamicMenus]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Logout handler
  const handleLogout = () => {
    clearAuthData();
    toast({
      title: tDashboard('logoutSuccess') || 'Logged out',
      description: tDashboard('logoutMessage') || 'You have been logged out successfully.',
    });
    router.push(`/${locale}`);
  };

  // Get translated title
  const getTitle = (titleKey: string): string => {
    try {
      return t(titleKey.replace('agent.', '')) || titleKey;
    } catch {
      // Fallback to key name
      const parts = titleKey.split('.');
      return parts[parts.length - 1];
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <aside className={cn('h-full bg-card border-r flex flex-col', collapsed ? 'w-16' : 'w-64', className)}>
        <div className="h-16 flex items-center px-4 border-b">
          <Skeleton className="h-8 w-8 rounded" />
          {!collapsed && <Skeleton className="h-4 w-24 ml-2" />}
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
    );
  }

  // No config available
  if (!entityConfig) {
    return (
      <aside className={cn('h-full bg-card border-r flex flex-col w-64', className)}>
        <div className="h-16 flex items-center px-4 border-b">
          <span className="font-semibold">Agent Dashboard</span>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground">
          <p className="text-sm text-center">
            No configuration available for this agent.
          </p>
        </div>
      </aside>
    );
  }

  const EntityIcon = entityConfig.icon;

  return (
    <aside
      className={cn(
        'h-full bg-card border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header with logo and collapse toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <EntityIcon className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="font-bold text-lg truncate">
              {getTitle(entityConfig.titleKey)}
            </span>
          </div>
        )}
        {collapsed && (
          <EntityIcon className="h-6 w-6 text-primary mx-auto" />
        )}
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn('flex-shrink-0', collapsed && 'mx-auto')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Supervisor badge */}
      {context?.isSupervisor && !collapsed && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <div className="flex items-center gap-2 text-primary text-sm">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Supervisor</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {/* Use dynamic menus if available from API */}
          {useDynamicMenus && dynamicMenuItems.length > 0 ? (
            dynamicMenuItems.map((item) => renderDynamicMenuItem(item, {
              pathname,
              collapsed,
              expandedGroups,
              toggleGroup,
              getTitle,
            }))
          ) : (
            /* Fall back to static menus */
            localizedMenuItems.map((item) => renderMenuItem(item, {
              pathname,
              collapsed,
              expandedGroups,
              toggleGroup,
              getTitle,
            }))
          )}
        </nav>
      </ScrollArea>

      {/* Footer with profile, settings, and logout */}
      <div className="p-4 border-t space-y-2">
        {/* Profile link */}
        <Link
          href={`/${locale}/dashboard/profile`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
            pathname?.includes('/dashboard/profile')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? tDashboard('profile') : undefined}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>{tDashboard('profile')}</span>}
        </Link>

        {/* Settings link */}
        <Link
          href={`/${locale}/dashboard/settings/security`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
            pathname?.includes('/dashboard/settings')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? tDashboard('settings') : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>{tDashboard('settings')}</span>}
        </Link>

        {/* Logout button */}
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleLogout}
          title={collapsed ? tDashboard('logout') : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">{tDashboard('logout')}</span>}
        </Button>

        {/* Version info */}
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            {entityConfig.entityCode} Agent v1.0
          </div>
        )}
      </div>
    </aside>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Add locale prefix to menu item hrefs
 */
function localizeMenuItem(item: MenuItem, locale: string): MenuItem {
  if (isMenuGroup(item)) {
    return {
      ...item,
      items: item.items.map((subItem) => ({
        ...subItem,
        href: `/${locale}${subItem.href}`,
      })),
    };
  }
  return {
    ...item,
    href: `/${locale}${item.href}`,
  };
}

/**
 * Render a menu item (single or group)
 */
function renderMenuItem(
  item: MenuItem,
  options: {
    pathname: string | null;
    collapsed: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (id: string) => void;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, getTitle } = options;

  if (isMenuGroup(item)) {
    return renderMenuGroup(item, options);
  }

  return renderSingleItem(item, { pathname, collapsed, getTitle });
}

/**
 * Render a menu group with collapsible sub-items
 */
function renderMenuGroup(
  group: MenuGroup,
  options: {
    pathname: string | null;
    collapsed: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (id: string) => void;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, expandedGroups, toggleGroup, getTitle } = options;
  const GroupIcon = group.icon;
  const isExpanded = expandedGroups.has(group.id);
  const hasActiveChild = group.items.some(
    (sub) => pathname === sub.href || pathname?.startsWith(sub.href + '/')
  );

  return (
    <div key={group.id} className="pt-2">
      {/* Group header */}
      <button
        onClick={() => toggleGroup(group.id)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full transition-all hover:bg-accent',
          hasActiveChild
            ? 'text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={collapsed ? getTitle(group.titleKey) : undefined}
      >
        <GroupIcon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">
              {getTitle(group.titleKey)}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded ? 'rotate-180' : ''
              )}
            />
          </>
        )}
      </button>

      {/* Collapsible sub-items */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn('space-y-1 mt-1', !collapsed && 'ml-4')}>
          {group.items.map((subItem) =>
            renderSingleItem(subItem, { pathname, collapsed, getTitle, isSubItem: true })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render a single menu item
 */
function renderSingleItem(
  item: MenuItem & { href: string },
  options: {
    pathname: string | null;
    collapsed: boolean;
    getTitle: (key: string) => string;
    isSubItem?: boolean;
  }
): React.ReactNode {
  const { pathname, collapsed, getTitle, isSubItem = false } = options;
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

  return (
    <Link
      key={item.id}
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground',
        isSubItem && 'py-1.5'
      )}
      title={collapsed ? getTitle(item.titleKey) : undefined}
    >
      <Icon className={cn('flex-shrink-0', isSubItem ? 'h-4 w-4' : 'h-5 w-5')} />
      {!collapsed && (
        <span className="truncate">{getTitle(item.titleKey)}</span>
      )}
      {!collapsed && 'badge' in item && item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// =============================================================================
// DYNAMIC MENU RENDERING FUNCTIONS
// =============================================================================

/**
 * Render a dynamic menu item (from backend API)
 */
function renderDynamicMenuItem(
  item: DynamicMenuItem,
  options: {
    pathname: string | null;
    collapsed: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (id: string) => void;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, getTitle } = options;

  if (isDynamicMenuGroup(item)) {
    return renderDynamicMenuGroup(item, options);
  }

  if (isDynamicMenuLink(item)) {
    return renderDynamicSingleItem(item, { pathname, collapsed, getTitle });
  }

  return null;
}

/**
 * Render a dynamic menu group with collapsible sub-items
 */
function renderDynamicMenuGroup(
  group: DynamicMenuItem & { items: SubMenuItem[] },
  options: {
    pathname: string | null;
    collapsed: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (id: string) => void;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, expandedGroups, toggleGroup, getTitle } = options;
  const GroupIcon = getIconComponent(group.icon);
  const isExpanded = expandedGroups.has(group.id);
  const hasActiveChild = group.items.some(
    (sub) => pathname === sub.href || pathname?.startsWith(sub.href + '/')
  );

  return (
    <div key={group.id} className="pt-2">
      {/* Group header */}
      <button
        onClick={() => toggleGroup(group.id)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full transition-all hover:bg-accent',
          hasActiveChild
            ? 'text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={collapsed ? getTitle(group.titleKey) : undefined}
      >
        <GroupIcon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">
              {getTitle(group.titleKey)}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded ? 'rotate-180' : ''
              )}
            />
          </>
        )}
      </button>

      {/* Collapsible sub-items */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn('space-y-1 mt-1', !collapsed && 'ml-4')}>
          {group.items.map((subItem) =>
            renderDynamicSubItem(subItem, { pathname, collapsed, getTitle })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render a dynamic single menu item (no children)
 */
function renderDynamicSingleItem(
  item: DynamicMenuItem & { href: string },
  options: {
    pathname: string | null;
    collapsed: boolean;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, getTitle } = options;
  const Icon = getIconComponent(item.icon);
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

  return (
    <Link
      key={item.id}
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
      title={collapsed ? getTitle(item.titleKey) : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <span className="truncate">{getTitle(item.titleKey)}</span>
      )}
    </Link>
  );
}

/**
 * Render a dynamic sub-menu item
 */
function renderDynamicSubItem(
  item: SubMenuItem,
  options: {
    pathname: string | null;
    collapsed: boolean;
    getTitle: (key: string) => string;
  }
): React.ReactNode {
  const { pathname, collapsed, getTitle } = options;
  const Icon = getIconComponent(item.icon);
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

  return (
    <Link
      key={item.id}
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
      title={collapsed ? getTitle(item.titleKey) : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && (
        <span className="truncate">{getTitle(item.titleKey)}</span>
      )}
    </Link>
  );
}

// =============================================================================
// MOBILE AGENT SIDEBAR
// =============================================================================

/**
 * Mobile Agent Sidebar
 * Sheet-based sidebar for mobile viewports
 */
export function MobileAgentSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle agent menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <GenericAgentSidebar />
      </SheetContent>
    </Sheet>
  );
}

export default GenericAgentSidebar;
