/**
 * Treasury Supervisor Dashboard — Single-viewport layout
 *
 * This page is supervisor-only (agents use generic entity dashboard at /agent/tesoro).
 * Always shows: Stats + SLA alert banner + charts + panels + quick actions.
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
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
import { getIconComponent } from '@/modules/agent-dashboard/utils/menu-helpers';
import type { DynamicMenuItem, SubMenuItem } from '@/modules/agent-dashboard/types/menu-config';

export default function TreasuryDashboardPage() {
  const t = useTranslations('treasury');
  const tMenu = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data: stats, isLoading, error } = useTreasuryStats();
  const { menuConfig, isLoading: menuLoading } = useMenuConfig();

  const [overviewDays, setOverviewDays] = useState(30);
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useSupervisorOverview(overviewDays);

  const formatCurrency = useCallback((amount: number) => {
    const intlLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-GQ';
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  // Derive quick actions from menu_config
  const quickActions = useMemo(() => {
    if (!menuConfig?.menus) return [];
    const actions: (DynamicMenuItem | SubMenuItem)[] = [];
    for (const menu of menuConfig.menus) {
      if (menu.id === 'dashboard' || menu.id === 'settings' || menu.id === 'treasury_overview') continue;
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

  // SLA alert count for conditional banner
  const breachedCount = overview?.slaAlerts?.filter(
    (a: { slaStatus: string }) => a.slaStatus === 'breached'
  ).length ?? 0;

  // Retry handler
  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['treasury-stats'] });
    queryClient.invalidateQueries({ queryKey: ['treasury-supervisor-overview'] });
  }, [queryClient]);

  return (
    <div className="space-y-3">
      {/* Row 1: Header + Compact Stats */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('dashboardDescription')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{t('overview.supervisor')}</span>
          </div>
        </div>

        {/* Compact inline stats */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <StatCell
            icon={<Clock className="h-4 w-4 text-orange-500" />}
            value={stats?.pendingValidationCount ?? 0}
            label={t('stats.pendingValidation')}
            isLoading={isLoading}
          />
          <StatCell
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            value={stats?.todayValidatedCount ?? 0}
            label={t('stats.todayValidated')}
            isLoading={isLoading}
          />
          <StatCell
            icon={<CreditCard className="h-4 w-4 text-blue-500" />}
            value={formatCurrency(stats?.todayValidatedAmount ?? 0)}
            label={t('stats.todayAmount')}
            isLoading={isLoading}
          />
          <StatCell
            icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
            value={overview?.slaAlertsCount ?? 0}
            label={t('overview.slaAlerts')}
            isLoading={isLoading || overviewLoading}
            highlight={(overview?.slaAlertsCount ?? 0) > 0}
          />
        </div>
      </div>

      {/* Error State with retry button */}
      {(error || overviewError) && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{t('errors.loadingStats')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 gap-1.5">
            <RotateCcw className="h-3 w-3" />
            {t('overview.retry')}
          </Button>
        </div>
      )}

      {/* SLA Alert Banner */}
      {breachedCount > 0 && (
        <div className="flex items-center gap-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg" role="alert">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            {t('overview.breachedCount', { count: breachedCount })} — {t('overview.slaAtRisk')}
          </span>
        </div>
      )}

      {/* Charts + Panels */}
      {overview ? (
        <>
          {/* Row 2: Charts — 2/3 + 1/3 */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CashFlowChart
                data={overview.paymentFlow}
                periodDays={overviewDays}
                onPeriodChange={setOverviewDays}
                t={t}
              />
            </div>
            <div>
              <ServiceDistributionChart data={overview.topServices} t={t} />
            </div>
          </div>

          {/* Row 3: Three panels side-by-side */}
          <div className="grid gap-3 lg:grid-cols-3">
            <AgentWorkloadPanel agents={overview.agentLoad} t={t} />
            <SLAAlertsPanel alerts={overview.slaAlerts} compliance={overview.slaCompliance} t={t} />
            <RecentActivityTimeline activities={overview.recentActivity} t={t} />
          </div>
        </>
      ) : overviewLoading ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <Skeleton className="h-[230px] lg:col-span-2" />
            <Skeleton className="h-[230px]" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
        </div>
      ) : null}

      {/* Quick Actions (inline buttons) */}
      {menuLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : quickActions.length > 0 ? (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const ActionIcon = getIconComponent(action.icon);
                const href = action.href || '#';
                const titleKey = action.titleKey;

                return (
                  <Link key={action.id} href={href}>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <ActionIcon className="h-3.5 w-3.5" />
                      {tMenu.has(titleKey) ? tMenu(titleKey) : titleKey}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Compact stat cell for inline display */
function StatCell({
  icon,
  value,
  label,
  isLoading,
  highlight,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      {icon}
      <div>
        {isLoading ? (
          <Skeleton className="h-5 w-12" />
        ) : (
          <p className={`text-lg font-bold leading-tight ${highlight ? 'text-orange-600' : ''}`}>
            {value}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}
