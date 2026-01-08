/**
 * Agent Sidebar Navigation
 * Sidebar for ministry agents (treasury, DGI, etc.)
 * Permission-based menu items
 *
 * @module components/layout
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/core/utils';
import {
  LayoutDashboard,
  CreditCard,
  CheckCircle,
  RefreshCw,
  History,
  Settings,
  Building2,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Wallet,
  FileSearch,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuthData } from '@/core/auth/storage';
import { useToast } from '@/hooks/use-toast';

// Type definitions for navigation items
interface NavSubItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavSubItem[];
}

interface NavSingleItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

type NavItem = NavGroup | NavSingleItem;

// Type guard to check if item is a group
function isNavGroup(item: NavItem): item is NavGroup {
  return 'items' in item && Array.isArray(item.items);
}

export function AgentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('treasury');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [collapsed, setCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(['treasury'])
  );

  // Navigation items with i18n
  const navigationItems: NavItem[] = useMemo(
    () => [
      {
        title: t('nav.dashboard'),
        href: `/${locale}/dashboard/agent/treasury`,
        icon: LayoutDashboard,
      },
      {
        id: 'treasury',
        title: t('nav.payments'),
        icon: CreditCard,
        items: [
          {
            title: t('nav.validation'),
            href: `/${locale}/dashboard/agent/treasury/validation`,
            icon: CheckCircle,
          },
          {
            title: t('nav.reconciliation'),
            href: `/${locale}/dashboard/agent/treasury/reconciliation`,
            icon: RefreshCw,
          },
          {
            title: t('nav.transactions'),
            href: `/${locale}/dashboard/agent/treasury/transactions`,
            icon: History,
          },
        ],
      },
      {
        id: 'reports',
        title: 'Reportes',
        icon: BarChart3,
        items: [
          {
            title: t('nav.stats'),
            href: `/${locale}/dashboard/agent/treasury/stats`,
            icon: TrendingUp,
          },
          {
            title: t('nav.analytics'),
            href: `/${locale}/dashboard/agent/treasury/analytics`,
            icon: Activity,
          },
          {
            title: t('nav.audit'),
            href: `/${locale}/dashboard/agent/treasury/audit`,
            icon: FileSearch,
          },
          {
            title: t('nav.slaStats'),
            href: `/${locale}/dashboard/agent/treasury/stats/sla`,
            icon: BarChart3,
          },
          {
            title: t('nav.anomalies'),
            href: `/${locale}/dashboard/agent/treasury/anomalies`,
            icon: ShieldAlert,
          },
          {
            title: t('nav.exports'),
            href: `/${locale}/dashboard/agent/treasury/exports`,
            icon: FileSpreadsheet,
          },
        ],
      },
      {
        id: 'settings',
        title: t('nav.settings'),
        icon: Settings,
        items: [
          {
            title: t('nav.banks'),
            href: `/${locale}/dashboard/agent/treasury/settings/banks`,
            icon: Building2,
          },
          {
            title: t('nav.paymentMethods'),
            href: `/${locale}/dashboard/agent/treasury/settings/payment-methods`,
            icon: Banknote,
          },
        ],
      },
    ],
    [t, locale]
  );

  // Find which group contains the active route and expand it on mount
  React.useEffect(() => {
    for (const item of navigationItems) {
      if (isNavGroup(item)) {
        const hasActiveChild = item.items.some(
          (sub) =>
            pathname === sub.href || pathname?.startsWith(sub.href + '/')
        );
        if (hasActiveChild) {
          setExpandedGroups((prev) => new Set(prev).add(item.id));
          break;
        }
      }
    }
  }, [pathname, navigationItems]);

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

  const handleLogout = () => {
    clearAuthData();
    toast({
      title: tCommon('logoutSuccess'),
      description: tCommon('logoutMessage'),
    });
    router.push(`/${locale}`);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{t('pageTitle')}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navigationItems.map((item) => {
            // Group with collapsible sub-items
            if (isNavGroup(item)) {
              const GroupIcon = item.icon;
              const isExpanded = expandedGroups.has(item.id);
              const hasActiveChild = item.items.some(
                (sub) =>
                  pathname === sub.href || pathname?.startsWith(sub.href + '/')
              );

              return (
                <div key={item.id} className="pt-2">
                  {/* Group header - clickable */}
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full transition-all hover:bg-gray-100',
                      hasActiveChild
                        ? 'text-primary font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <GroupIcon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
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
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isActive =
                          pathname === subItem.href ||
                          pathname?.startsWith(subItem.href + '/');

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-600 hover:text-gray-900'
                            )}
                            title={collapsed ? subItem.title : undefined}
                          >
                            <SubIcon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && <span>{subItem.title}</span>}
                            {!collapsed && subItem.badge !== undefined && subItem.badge > 0 && (
                              <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Single item (Dashboard link)
            const singleItem = item as NavSingleItem;
            const Icon = singleItem.icon;
            const isActive = pathname === singleItem.href;

            return (
              <Link
                key={singleItem.href}
                href={singleItem.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                )}
                title={collapsed ? singleItem.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{singleItem.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Logout Button */}
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleLogout}
          title={collapsed ? tCommon('logout') : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">{tCommon('logout')}</span>}
        </Button>

        {/* Version */}
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center">
            Treasury Agent v1.0
          </div>
        )}
      </div>
    </aside>
  );
}

export default AgentSidebar;
