/**
 * Treasury Dashboard Overview
 * Main dashboard for Treasury Agents showing stats and quick actions
 */

'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  History,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useTreasuryStats } from '@/modules/treasury/hooks';

export default function TreasuryDashboardPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();
  const { data: stats, isLoading, error } = useTreasuryStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GQ', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
            <p className="text-red-700">Error al cargar estadisticas</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Validation */}
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
                  Pagos en espera de revision
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Unreconciled Transactions */}
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
                  Transacciones sin reconciliar
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today Validated */}
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
                  Pagos validados hoy
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today Amount */}
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
                  Monto validado hoy
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Validation */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('nav.validation')}
            </CardTitle>
            <CardDescription>
              Validar pagos en efectivo y cheque pendientes de revision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/validation`}>
              <Button className="w-full">
                Ir a Validacion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reconciliation */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              {t('nav.reconciliation')}
            </CardTitle>
            <CardDescription>
              Reconciliar transacciones bancarias con pagos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/reconciliation`}>
              <Button variant="outline" className="w-full">
                Ir a Reconciliacion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              {t('nav.transactions')}
            </CardTitle>
            <CardDescription>
              Ver historial completo de pagos y transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/transactions`}>
              <Button variant="outline" className="w-full">
                Ver Historial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Audit */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              {t('nav.audit')}
            </CardTitle>
            <CardDescription>
              {t('audit.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/audit`}>
              <Button variant="outline" className="w-full">
                Ver Auditoria
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* SLA Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              {t('nav.slaStats')}
            </CardTitle>
            <CardDescription>
              {t('sla.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/stats/sla`}>
              <Button variant="outline" className="w-full">
                Ver Estadisticas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              {t('nav.anomalies')}
            </CardTitle>
            <CardDescription>
              {t('anomalies.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/anomalies`}>
              <Button variant="outline" className="w-full">
                Ver Anomalias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              {t('nav.exports')}
            </CardTitle>
            <CardDescription>
              {t('exports.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/exports`}>
              <Button variant="outline" className="w-full">
                Ver Exportaciones
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* KPIs Dashboard */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {t('nav.stats')}
            </CardTitle>
            <CardDescription>
              {t('kpis.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/stats`}>
              <Button variant="outline" className="w-full">
                Ver KPIs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              {t('nav.analytics')}
            </CardTitle>
            <CardDescription>
              {t('analytics.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/agent/treasury/analytics`}>
              <Button variant="outline" className="w-full">
                Ver Analisis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
