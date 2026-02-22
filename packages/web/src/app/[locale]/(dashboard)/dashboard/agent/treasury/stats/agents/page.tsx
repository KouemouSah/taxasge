/**
 * Treasury Agent Performance Page (Phase 4)
 * Performance statistics for Treasury agents
 * Using Chart.js for visualizations
 */

'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAgentPerformance } from '@/modules/treasury/hooks';
import type { KPIPeriod, AgentStats } from '@/modules/treasury/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Locale mapping for Intl formatters
const LOCALE_MAP: Record<string, string> = { es: 'es-GQ', fr: 'fr-FR', en: 'en-US' };

export default function TreasuryAgentPerformancePage() {
  const t = useTranslations('treasury');
  const locale = useLocale();

  const [period, setPeriod] = useState<KPIPeriod>('month');

  const { data: agentData, isLoading, error, refetch } = useAgentPerformance({ period });

  const intlLocale = LOCALE_MAP[locale] || 'es-GQ';

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(intlLocale).format(num);
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 95) return 'default';
    if (rate >= 85) return 'secondary';
    return 'destructive';
  };

  const getWorkloadStatus = (workload: number) => {
    if (workload <= 5) return { label: t('agents.workload.low'), color: 'bg-green-100 text-green-800' };
    if (workload <= 15) return { label: t('agents.workload.normal'), color: 'bg-blue-100 text-blue-800' };
    if (workload <= 25) return { label: t('agents.workload.high'), color: 'bg-yellow-100 text-yellow-800' };
    return { label: t('agents.workload.overloaded'), color: 'bg-red-100 text-red-800' };
  };

  // Calculate top performer
  const topPerformer = agentData?.agents.reduce((best: AgentStats | null, agent: AgentStats) => {
    if (!best) return agent;
    const bestScore = best.validationsCount + best.slaRespectRate;
    const agentScore = agent.validationsCount + agent.slaRespectRate;
    return agentScore > bestScore ? agent : best;
  }, null);

  // Prepare chart data for agent performance (Grouped Bar Chart)
  const agentChartData = {
    labels: agentData?.agents.map((a) => {
      const name = a.agentName;
      return name.length > 15 ? name.substring(0, 15) + '...' : name;
    }) || [],
    datasets: [
      {
        label: t('agents.charts.validations'),
        data: agentData?.agents.map((a) => a.validationsCount) || [],
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: t('agents.charts.rejections'),
        data: agentData?.agents.map((a) => a.rejectionsCount) || [],
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t('agents.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('agents.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as KPIPeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('kpis.periods.day')}</SelectItem>
              <SelectItem value="week">{t('kpis.periods.week')}</SelectItem>
              <SelectItem value="month">{t('kpis.periods.month')}</SelectItem>
              <SelectItem value="year">{t('kpis.periods.year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('agents.loadError')}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {agentData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Agents */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('agents.cards.totalAgents')}</p>
                    <p className="text-2xl font-bold">{agentData.agents.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Validations */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('agents.cards.totalValidations')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(agentData.totalValidations)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Rejections */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('agents.cards.totalRejections')}</p>
                    <p className="text-2xl font-bold text-red-600">{formatNumber(agentData.totalRejections)}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performer */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('agents.cards.topPerformer')}</p>
                    <p className="text-lg font-bold truncate">{topPerformer?.agentName || '-'}</p>
                    {topPerformer && (
                      <Badge variant="default">{topPerformer.validationsCount} {t('agents.validations')}</Badge>
                    )}
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('agents.charts.performance')}
              </CardTitle>
              <CardDescription>
                {t('agents.charts.performanceDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentData.agents.length > 0 ? (
                <div className="h-[350px]">
                  <Bar data={agentChartData} options={barChartOptions} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  {t('kpis.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('agents.table.title')}
              </CardTitle>
              <CardDescription>
                {t('agents.table.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentData.agents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('agents.table.agent')}</TableHead>
                      <TableHead className="text-right">{t('agents.table.validations')}</TableHead>
                      <TableHead className="text-right">{t('agents.table.rejections')}</TableHead>
                      <TableHead className="text-right">{t('agents.table.avgTime')}</TableHead>
                      <TableHead className="text-center">{t('agents.table.slaRate')}</TableHead>
                      <TableHead className="text-center">{t('agents.table.workload')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.agents.map((agent) => {
                      const workloadStatus = getWorkloadStatus(agent.currentWorkload);
                      return (
                        <TableRow key={agent.agentProfileId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{agent.agentName}</p>
                              {agent.agentEmail && (
                                <p className="text-xs text-muted-foreground">{agent.agentEmail}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-green-600">{formatNumber(agent.validationsCount)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-red-600">{formatNumber(agent.rejectionsCount)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {agent.avgProcessingMinutes.toFixed(1)} {t('agentsPage.units.min')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant={getPerformanceBadge(agent.slaRespectRate)}>
                                {agent.slaRespectRate.toFixed(1)}%
                              </Badge>
                              <Progress
                                value={agent.slaRespectRate}
                                className="w-16 h-1"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={workloadStatus.color}>
                                {agent.currentWorkload} {t('agents.pending')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {workloadStatus.label}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">{t('agents.noAgents')}</h3>
                  <p className="text-muted-foreground">
                    {t('agents.noAgentsDescription')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
