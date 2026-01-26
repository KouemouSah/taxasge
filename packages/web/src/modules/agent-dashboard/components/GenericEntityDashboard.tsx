/**
 * Generic Entity Dashboard Component
 * Reusable dashboard for any entity type
 *
 * @module agent-dashboard/components
 * @date 2026-01-18
 *
 * Security: Includes entity access verification to prevent unauthorized access
 */

'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { useAgentDashboard, useEntityAccess, useMenuConfig } from '../hooks';
import { useEntityStats } from '../hooks/useEntityStats';
import { AccessDenied } from './AccessDenied';
import { DynamicDashboard } from './DynamicDashboard';
import { renderWidget, DEFAULT_ENTITY_WIDGETS } from './widgets';
import type { EntityCode, MenuItem } from '../types';
import { isMenuGroup } from '../types';
import type { WidgetConfig, DashboardConfig } from '../types/menu-config';

// =============================================================================
// PROPS
// =============================================================================

interface GenericEntityDashboardProps {
  /** The entity code for this dashboard */
  entityCode: EntityCode;
  /** Optional: Custom stats component */
  statsComponent?: React.ReactNode;
  /** Optional: Additional class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GenericEntityDashboard({
  entityCode,
  statsComponent,
  className,
}: GenericEntityDashboardProps) {
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Entity access verification (security check)
  const {
    hasAccess,
    isLoading: accessLoading,
    agentEntityCode,
    allowedEntities,
  } = useEntityAccess(entityCode);

  const {
    isLoading: dashboardLoading,
    isError,
    error,
    context,
    entityConfig,
    menuItems,
  } = useAgentDashboard();

  const { isLoading: statsLoading, stats } = useEntityStats(entityCode);

  // Get dashboard_config for widgets from dynamic menu config
  const { dashboardConfig, isLoading: menuConfigLoading } = useMenuConfig();

  const isLoading = accessLoading || dashboardLoading || menuConfigLoading;

  // Determine which widget config to use: from API or default
  const widgetConfig: DashboardConfig = dashboardConfig || {
    version: '1.0',
    layout: 'grid',
    widgets: DEFAULT_ENTITY_WIDGETS,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Access denied state (security check)
  if (!hasAccess) {
    return (
      <AccessDenied
        requestedEntity={entityCode}
        userEntity={agentEntityCode}
        allowedEntities={allowedEntities}
        className={className}
      />
    );
  }

  // Error state
  if (isError || !context || !entityConfig) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">
              {error?.message || t('errors.loadingFailed')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get entity title
  const getTitle = (titleKey: string): string => {
    try {
      return t(titleKey.replace('agent.', '')) || titleKey;
    } catch {
      const parts = titleKey.split('.');
      return parts[parts.length - 1];
    }
  };

  const EntityIcon = entityConfig.icon;

  // Extract quick actions from menu items (first level items with href)
  const quickActions = menuItems
    .filter((item) => !isMenuGroup(item) && 'href' in item && item.id !== 'dashboard')
    .slice(0, 3) as (MenuItem & { href: string })[];

  // Extract sub-menu actions (for groups)
  const groupActions = menuItems
    .filter(isMenuGroup)
    .flatMap((group) => group.items.slice(0, 2))
    .slice(0, 6);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <EntityIcon className="h-8 w-8 text-primary" />
          {getTitle(entityConfig.titleKey)}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.welcome', { name: context.entityName || context.ministryName || entityCode })}
        </p>
      </div>

      {/* Stats Cards - Custom or Default */}
      {statsComponent || (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Pending */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('stats.pending')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.pendingCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('stats.awaitingReview')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('stats.inProgress')}
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.inProgressCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('stats.beingProcessed')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completed Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('stats.completedToday')}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.completedTodayCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('stats.processedToday')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* This Week */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('stats.thisWeek')}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalThisWeek}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('stats.totalProcessed')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Widgets Section */}
      {widgetConfig.widgets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.widgets')}</h2>
          <DynamicDashboard
            config={widgetConfig}
            renderWidget={(widget) => renderWidget(widget.id, entityCode, widget)}
          />
        </div>
      )}

      {/* Quick Actions from Menu Groups */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('quickActions.title')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ActionIcon className="h-5 w-5 text-primary" />
                    {getTitle(action.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/${locale}${action.href}`}>
                    <Button variant="outline" className="w-full">
                      {tCommon('view')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}

          {/* If no group actions, show direct actions */}
          {groupActions.length === 0 && quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ActionIcon className="h-5 w-5 text-primary" />
                    {getTitle(action.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/${locale}${action.href}`}>
                    <Button variant="outline" className="w-full">
                      {tCommon('view')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Agent Info */}
      {context.isSupervisor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('profile.supervisorAccess')}
            </CardTitle>
            <CardDescription>
              {t('profile.supervisorDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('profile.fullAccessMessage')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default GenericEntityDashboard;
