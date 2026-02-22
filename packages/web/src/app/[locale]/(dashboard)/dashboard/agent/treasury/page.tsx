/**
 * Treasury Dashboard Overview
 * Main dashboard for Treasury Agents showing stats and quick actions.
 *
 * Quick actions are derived from the dynamic menu_config (roles.menu_config JSON).
 * Stats cards are kept as-is (API-driven, TESORO-specific).
 * Widgets section uses DynamicDashboard + WidgetRegistry from dashboard_config.
 */

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTreasuryStats } from '@/modules/treasury/hooks';
import { useMenuConfig } from '@/modules/agent-dashboard/hooks/useMenuConfig';
import { DynamicDashboard } from '@/modules/agent-dashboard/components/DynamicDashboard';
import { renderWidget } from '@/modules/agent-dashboard/components/widgets/WidgetRegistry';
import { getIconComponent } from '@/modules/agent-dashboard/utils/menu-helpers';
import type { EntityCode } from '@/modules/agent-dashboard/types';
import type { DynamicMenuItem, SubMenuItem } from '@/modules/agent-dashboard/types/menu-config';

const TREASURY_ENTITY_CODE: EntityCode = 'TESORO';

export default function TreasuryDashboardPage() {
  const t = useTranslations('treasury');
  const tMenu = useTranslations();  // No namespace — resolves menu titleKeys like 'agent.nav.validation'
  const locale = useLocale();
  const { data: stats, isLoading, error } = useTreasuryStats();
  const { menuConfig, dashboardConfig, isLoading: menuLoading } = useMenuConfig();

  const formatCurrency = (amount: number) => {
    const intlLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-GQ';
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Derive quick actions from menu_config (replaces 9 hardcoded cards)
  const quickActions = useMemo(() => {
    if (!menuConfig?.menus) return [];

    const actions: (DynamicMenuItem | SubMenuItem)[] = [];
    for (const menu of menuConfig.menus) {
      // Skip dashboard itself and settings
      if (menu.id === 'dashboard' || menu.id === 'settings') continue;

      if (menu.items?.length) {
        // Group: take up to 2 sub-items as quick actions
        for (const item of menu.items.slice(0, 2)) {
          actions.push(item);
        }
      } else if (menu.href) {
        // Direct link item
        actions.push(menu);
      }
    }
    return actions;
  }, [menuConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboardDescription')}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('errors.loadingStats')}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards (API-driven, TESORO-specific — kept as-is) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.pendingValidation')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.pendingValidationCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.pendingDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.unreconciled')}
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.unreconciledCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.unreconciledDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.todayValidated')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.todayValidatedCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.todayValidatedDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.todayAmount')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.todayValidatedAmount ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.todayAmountDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions (derived from menu_config — dynamic) */}
      {menuLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : quickActions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const ActionIcon = getIconComponent(action.icon);
            // href is already locale-prefixed by useMenuConfig hook
            const href = action.href || '#';
            const titleKey = action.titleKey;

            return (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ActionIcon className="h-5 w-5 text-primary" />
                    {tMenu.has(titleKey) ? tMenu(titleKey) : titleKey}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={href}>
                    <Button variant="outline" className="w-full">
                      {t.has('actions.view') ? t('actions.view') : 'Ver'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* Widgets (from dashboard_config — dynamic) */}
      {dashboardConfig && dashboardConfig.widgets?.length > 0 && (
        <DynamicDashboard
          config={dashboardConfig}
          renderWidget={(widget) =>
            renderWidget(widget.id, TREASURY_ENTITY_CODE, widget)
          }
        />
      )}
    </div>
  );
}
