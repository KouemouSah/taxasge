'use client';

/**
 * Team Workload Page - Supervisor View
 * View workload balance and distribution across the team
 *
 * Backend endpoint: GET /supervisor/workload/balance
 * Model: WorkloadBalanceResponse from supervisor_routes.py
 *
 * @route /[locale]/dashboard/supervisor/team/workload
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Scale,
  Users,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import Link from 'next/link';
import type { WorkloadBalanceResponse } from '../../types';
import { WORKLOAD_STATUS_COLORS, getBalanceColor, getBalanceBadgeKey } from '../../types';

export default function TeamWorkloadPage() {
  const locale = useLocale();
  const t = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  const [isRebalancing, setIsRebalancing] = useState(false);

  // Fetch workload balance - uses GET /supervisor/workload/balance
  const { data, isLoading, isError, error, refetch } = useQuery<WorkloadBalanceResponse>({
    queryKey: ['supervisor', 'workload', 'balance'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/workload/balance');
      return response.data;
    },
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
            <Button variant="outline" onClick={() => refetch()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, agents, recommendations } = data || { report: null, agents: [], recommendations: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/supervisor`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-6 w-6" />
              {t('nav.workloadBalance') || 'Workload Balance'}
            </h1>
            <p className="text-muted-foreground">
              {t('workload.description') || 'View and analyze team workload distribution'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report?.rebalancing_needed && (
            <Button
              variant="default"
              disabled={isRebalancing}
              onClick={async () => {
                setIsRebalancing(true);
                try {
                  const res = await apiClient.post('/supervisor/workload/rebalance');
                  const result = res.data;
                  if (result.reassignments_made > 0) {
                    toast.success(t('workload.rebalanceSuccess', {
                      defaultValue: '{count} assignments rebalanced',
                      count: result.reassignments_made,
                    }));
                  } else {
                    toast.info(result.message);
                  }
                  refetch();
                } catch {
                  toast.error(t('workload.rebalanceError', { defaultValue: 'Failed to rebalance workload' }));
                } finally {
                  setIsRebalancing(false);
                }
              }}
            >
              {isRebalancing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Scale className="h-4 w-4 mr-2" />
              )}
              {t('workload.rebalance')}
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
        </div>
      </div>

      {/* Balance Score Card */}
      {report && (
        <Card className={report.rebalancing_needed ? 'border-orange-300' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {report.rebalancing_needed ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {t('workload.balanceScore') || 'Balance Score'}
                </CardTitle>
                <CardDescription>
                  {t('workload.balanceScoreDescription') || 'Overall workload distribution score (0-100)'}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getBalanceColor(report.balance_score)}`}>
                  {report.balance_score.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">{t(getBalanceBadgeKey(report.balance_score).key)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={report.balance_score}
              className={`h-3 ${report.balance_score >= 80 ? '[&>div]:bg-green-500' : report.balance_score >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
            />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {report && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('team.totalAgents') || 'Total Agents'}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.total_agents}</div>
              <p className="text-xs text-muted-foreground">
                {report.available_agents} {t('team.available') || 'available'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('team.avgAssignments') || 'Avg Assignments'}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.avg_assignments_per_agent.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {report.min_assignments} - {report.max_assignments}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('team.overloaded') || 'Overloaded'}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.overloaded_agents}</div>
              <p className="text-xs text-muted-foreground">
                {t('workload.needsAttention') || 'Needs attention'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('workload.unavailableAgents') || 'Unavailable'}</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{report.unavailable_agents}</div>
              <p className="text-xs text-muted-foreground">
                {t('workload.unavailableAgents') || 'Unavailable'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('workload.recommendations') || 'Recommendations'}</CardTitle>
            <CardDescription>
              {t('workload.recommendationsDescription') || 'Actions to improve workload balance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-md border ${
                    rec.priority === 'urgent'
                      ? 'bg-red-50 border-red-200'
                      : rec.priority === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rec.priority === 'urgent' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{rec.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{rec.message}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        rec.priority === 'urgent'
                          ? 'border-red-300 text-red-700'
                          : rec.priority === 'high'
                          ? 'border-orange-300 text-orange-700'
                          : 'border-blue-300 text-blue-700'
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workload.agentDistribution') || 'Agent Distribution'}</CardTitle>
          <CardDescription>
            {t('workload.agentDistributionDescription') || 'Workload distribution across team members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.agent_profile_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{agent.agent_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.current_assignments} {t('team.assignments') || 'assignments'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={WORKLOAD_STATUS_COLORS[agent.workload_status] || 'bg-gray-100'}>
                      {agent.workload_status}
                    </Badge>
                    <span className="text-sm font-medium w-12 text-right">
                      {agent.capacity_percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.min(agent.capacity_percentage, 100)}
                  className={`h-2 ${
                    agent.capacity_percentage > 80
                      ? '[&>div]:bg-red-500'
                      : agent.capacity_percentage > 60
                      ? '[&>div]:bg-yellow-500'
                      : '[&>div]:bg-green-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
