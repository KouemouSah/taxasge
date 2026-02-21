'use client';

/**
 * Supervisor Dashboard - Main Page
 * Overview of team, escalations, assignments, and performance metrics
 *
 * @route /[locale]/dashboard/supervisor
 * @date 2026-01-19
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  AlertCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Settings2,
  BarChart2,
  FileBarChart,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import type { SupervisorDashboardStats } from './types';

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  // Fetch supervisor dashboard stats
  const { data: stats, isLoading, isError, error } = useQuery<SupervisorDashboardStats>({
    queryKey: ['supervisor', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/dashboard');
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {tCommon('error')}
            </CardTitle>
            <CardDescription>
              {(error as Error)?.message || tCommon('errorGeneric')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.refresh()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.welcome', { name: '' })}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('team.activeAgents')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.team.activeAgents || 0} / {stats?.team.totalAgents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('team.utilizationRate')}: {stats?.team.utilizationRate || 0}%
            </p>
          </CardContent>
        </Card>

        {/* Pending Escalations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('escalations.pending')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats?.escalations.pending || 0}
              {(stats?.escalations.pending || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {tCommon('attention')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('escalations.resolved')}: {stats?.escalations.resolvedToday || 0} {tCommon('today')}
            </p>
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.teamPending')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.assignments.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.teamInProgress')}: {stats?.assignments.inProgress || 0}
            </p>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.teamCompleted')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.assignments.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              SLA: {stats?.performance.slaCompliance || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Team Management */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {t('nav.team')}
            </CardTitle>
            <CardDescription>{t('team.title')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/supervisor/team/agents`}>
              <Button className="w-full">
                {t('nav.agents')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Workload */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-500" />
              {t('nav.workload')}
            </CardTitle>
            <CardDescription>{t('workload.title')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/supervisor/team/workload`}>
              <Button variant="outline" className="w-full">
                {t('workload.title')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Assignment Rules */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gray-500" />
              {t('nav.rules')}
            </CardTitle>
            <CardDescription>{t('rules.title')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/supervisor/assignments/rules`}>
              <Button variant="outline" className="w-full">
                {t('rules.title')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Escalations */}
        <Card className="hover:shadow-md transition-shadow border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('nav.escalations')}
              {(stats?.escalations.pending || 0) > 0 && (
                <Badge variant="destructive">{stats?.escalations.pending}</Badge>
              )}
            </CardTitle>
            <CardDescription>{t('escalations.title')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/supervisor/escalations/pending`}>
              <Button variant="default" className="w-full bg-orange-500 hover:bg-orange-600">
                {t('nav.pendingEscalations')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/supervisor/escalations/resolved`}>
              <Button variant="ghost" size="sm" className="w-full mt-2">
                {t('nav.resolvedEscalations')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-teal-500" />
              {t('nav.reports')}
            </CardTitle>
            <CardDescription>{t('reports.description', { defaultValue: 'Informes y métricas' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/dashboard/supervisor/reports`}>
              <Button variant="outline" className="w-full">
                {t('nav.reports')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('nav.performance')}
          </CardTitle>
          <CardDescription>{t('stats.performanceScore')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {stats?.performance.avgResponseTime || 0}h
              </p>
              <p className="text-sm text-muted-foreground">{t('stats.avgResponseTime')}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {stats?.performance.slaCompliance || 0}%
              </p>
              <p className="text-sm text-muted-foreground">{t('stats.slaCompliance', { defaultValue: 'SLA Compliance' })}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {stats?.performance.qualityScore || 0}/100
              </p>
              <p className="text-sm text-muted-foreground">{t('stats.performanceScore')}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Link href={`/${locale}/dashboard/supervisor/team/performance`}>
              <Button variant="outline">
                {t('nav.performance')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
