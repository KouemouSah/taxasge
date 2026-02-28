/**
 * Treasury Dashboard Overview
 * Main dashboard for Treasury Agents and Supervisors.
 *
 * - Agents: Stats cards + quick actions + widgets
 * - Supervisors: Enhanced with cash flow chart, agent workload,
 *   SLA alerts, service distribution, and recent activity
 */

'use client';

import { useMemo, useState } from 'react';
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
  TrendingUp,
} from 'lucide-react';
import { useTreasuryStats, useSupervisorOverview } from '@/modules/treasury/hooks';
import {
  CashFlowChart,
  AgentWorkloadPanel,
  SLAAlertsPanel,
  ServiceDistributionChart,
  RecentActivityTimeline,
} from '@/modules/treasury/components';
import { useMenuConfig } from '@/modules/agent-dashboard/hooks/useMenuConfig';
import { DynamicDashboard } from '@/modules/agent-dashboard/components/DynamicDashboard';
import { renderWidget } from '@/modules/agent-dashboard/components/widgets/WidgetRegistry';
import { getIconComponent } from '@/modules/agent-dashboard/utils/menu-helpers';
import type { EntityCode } from '@/modules/agent-dashboard/types';
import type { DynamicMenuItem, SubMenuItem } from '@/modules/agent-dashboard/types/menu-config';

const TREASURY_ENTITY_CODE: EntityCode = 'TESORO';

export default function TreasuryDashboardPage() {
  const t = useTranslations('treasury');
  const tMenu = useTranslations();
  const locale = useLocale();
  const { data: stats, isLoading, error } = useTreasuryStats();
  const { menuConfig, dashboardConfig, isLoading: menuLoading } = useMenuConfig();

  // Supervisor overview data (only fetched if supervisor via permission check in backend)
  const [overviewDays, setOverviewDays] = useState(30);
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useSupervisorOverview(overviewDays);

  // Detect supervisor: if overview data loads successfully, user is supervisor
  const isSupervisor = !!overview && !overviewError;

  const formatCurrency = (amount: number) => {
    const intlLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-GQ';
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Derive quick actions from menu_config
  const quickActions = useMemo(() => {
    if (!menuConfig?.menus) return [];
    const actions: (DynamicMenuItem | SubMenuItem)[] = [];
    for (const menu of menuConfig.menus) {
      if (menu.id === 'dashboard' || menu.id === 'settings') continue;
      if (menu.items?.length) {
        for (const item of menu.items.slice(0, 2)) {
          actions.push(item);
        }
      } else if (menu.href) {
        actions.push(menu);
      }
    }
    return actions;
  }, [menuConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboardDescription')}
          </p>
        </div>
        {isSupervisor && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Supervisor</span>
          </div>
        )}
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

      {/* Row 1: Stats Cards */}
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

        {/* SLA Alerts Count — supervisors see alert count, agents see unreconciled */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isSupervisor ? 'Alertas SLA' : t('stats.unreconciled')}
            </CardTitle>
            {isSupervisor ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {isLoading || overviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${
                  isSupervisor && (overview?.slaAlertsCount ?? 0) > 0
                    ? 'text-orange-600'
                    : ''
                }`}>
                  {isSupervisor
                    ? overview?.slaAlertsCount ?? 0
                    : stats?.unreconciledCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSupervisor
                    ? 'Pagos en riesgo SLA'
                    : t('stats.unreconciledDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Supervisor Charts (only for supervisors) */}
      {isSupervisor && overview && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashFlowChart
              data={overview.paymentFlow}
              periodDays={overviewDays}
              onPeriodChange={setOverviewDays}
            />
          </div>
          <div>
            <ServiceDistributionChart data={overview.topServices} />
          </div>
        </div>
      )}

      {/* Row 3: Supervisor Panels (only for supervisors) */}
      {isSupervisor && overview && (
        <div className="grid gap-4 md:grid-cols-2">
          <AgentWorkloadPanel agents={overview.agentLoad} />
          <SLAAlertsPanel alerts={overview.slaAlerts} />
        </div>
      )}

      {/* Row 4: Recent Activity (only for supervisors) */}
      {isSupervisor && overview && (
        <RecentActivityTimeline activities={overview.recentActivity} />
      )}

      {/* Quick Actions (derived from menu_config — dynamic) */}
      {menuLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : quickActions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const ActionIcon = getIconComponent(action.icon);
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
