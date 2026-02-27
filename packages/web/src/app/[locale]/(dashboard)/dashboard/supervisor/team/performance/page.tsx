'use client';

/**
 * Team Performance Page - Supervisor View
 * View performance metrics for all team agents
 *
 * Backend endpoints:
 * - GET /supervisor/agents - List agents
 * - GET /supervisor/agents/{agent_id}/stats - Get agent stats
 *
 * @route /[locale]/dashboard/supervisor/team/performance
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
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
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Award,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import Link from 'next/link';
import type { AgentListItem, AgentStats, AgentTrendsResponse, AgentProficiency, SkillsGapItem } from '../../types';
import { getSuccessRateColor, getPerformanceBadge, COVERAGE_STATUS_COLORS } from '../../types';

export default function TeamPerformancePage() {
  const locale = useLocale();
  const t = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  const [periodDays, setPeriodDays] = useState('30');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Fetch agents list
  const { data: agents, isLoading: agentsLoading } = useQuery<AgentListItem[]>({
    queryKey: ['supervisor', 'agents', 'performance'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/agents', {
        params: { include_unavailable: true }
      });
      return response.data;
    },
  });

  // Fetch agent trends
  const { data: trends } = useQuery<AgentTrendsResponse>({
    queryKey: ['supervisor', 'agent', selectedAgentId, 'trends', periodDays],
    queryFn: async () => {
      const response = await apiClient.get(`/supervisor/agents/${selectedAgentId}/trends`, {
        params: {
          period_days: parseInt(periodDays),
          granularity: parseInt(periodDays) <= 14 ? 'daily' : parseInt(periodDays) <= 90 ? 'weekly' : 'monthly',
        }
      });
      return response.data;
    },
    enabled: !!selectedAgentId,
  });

  // Fetch proficiency overview (all agents, all workflows — paginated)
  const { data: proficienciesResponse } = useQuery<{
    items: AgentProficiency[];
    total: number;
    page: number;
    page_size: number;
  }>({
    queryKey: ['supervisor', 'proficiency-overview'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/proficiency-overview');
      return response.data;
    },
    staleTime: 120000, // 2 minutes
  });
  const proficiencies = proficienciesResponse?.items;

  // Fetch skills gap analysis
  const { data: skillsGap } = useQuery<SkillsGapItem[]>({
    queryKey: ['supervisor', 'skills-gap'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/skills-gap');
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });

  // Fetch selected agent stats
  const { data: agentStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AgentStats>({
    queryKey: ['supervisor', 'agent', selectedAgentId, 'stats', periodDays],
    queryFn: async () => {
      const response = await apiClient.get(`/supervisor/agents/${selectedAgentId}/stats`, {
        params: { period_days: parseInt(periodDays) }
      });
      return response.data;
    },
    enabled: !!selectedAgentId,
  });

  // Calculate team averages
  const teamAvgSuccessRate = agents?.length
    ? agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length
    : 0;
  const teamAvgProcessingTime = agents?.length
    ? agents.reduce((sum, a) => sum + (a.avg_processing_time_hours || 0), 0) / agents.length
    : 0;

  // Loading state
  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

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
              <TrendingUp className="h-6 w-6" />
              {t('nav.teamPerformance') || 'Team Performance'}
            </h1>
            <p className="text-muted-foreground">
              {t('performance.description') || 'Monitor and analyze team performance metrics'}
            </p>
          </div>
        </div>
        <Select value={periodDays} onValueChange={setPeriodDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('performance.last7days', { defaultValue: 'Last 7 days' })}</SelectItem>
            <SelectItem value="30">{t('performance.last30days', { defaultValue: 'Last 30 days' })}</SelectItem>
            <SelectItem value="90">{t('performance.last90days', { defaultValue: 'Last 90 days' })}</SelectItem>
            <SelectItem value="365">{t('performance.lastYear', { defaultValue: 'Last year' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('performance.teamSize') || 'Team Size'}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('performance.activeAgents') || 'Active agents'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('performance.avgSuccessRate') || 'Avg Success Rate'}</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(teamAvgSuccessRate)}`}>
              {(teamAvgSuccessRate * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t('performance.teamAverage') || 'Team average'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('performance.avgProcessingTime') || 'Avg Processing'}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAvgProcessingTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {t('performance.perAssignment') || 'Per assignment'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('performance.topPerformers') || 'Top Performers'}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents?.filter(a => a.success_rate >= 0.9).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('performance.above90') || 'Above 90% success'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('performance.agentMetrics') || 'Agent Metrics'}</CardTitle>
          <CardDescription>
            {t('performance.agentMetricsDescription') || 'Click on an agent to view detailed statistics'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('team.agent') || 'Agent'}</TableHead>
                <TableHead>{t('performance.successRate') || 'Success Rate'}</TableHead>
                <TableHead>{t('performance.processingTime') || 'Avg Processing'}</TableHead>
                <TableHead>{t('team.assignments') || 'Current Load'}</TableHead>
                <TableHead>{t('performance.rating') || 'Rating'}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {tCommon('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                agents?.map((agent) => {
                  const performanceBadge = getPerformanceBadge(agent.success_rate);
                  return (
                    <TableRow
                      key={agent.agent_profile_id}
                      className={`cursor-pointer ${selectedAgentId === agent.agent_profile_id ? 'bg-muted/50' : ''}`}
                      onClick={() => setSelectedAgentId(agent.agent_profile_id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{agent.agent_name}</p>
                          <p className="text-xs text-muted-foreground">{agent.agent_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getSuccessRateColor(agent.success_rate)}>
                          {(agent.success_rate * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {agent.avg_processing_time_hours
                          ? `${agent.avg_processing_time_hours.toFixed(1)}h`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {agent.current_assignments} ({agent.capacity_percentage.toFixed(0)}%)
                      </TableCell>
                      <TableCell>
                        <Badge className={performanceBadge.color}>
                          {t(performanceBadge.key, { defaultValue: performanceBadge.key.split('.')[1] })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgentId(agent.agent_profile_id);
                          }}
                        >
                          {t('performance.viewStats') || 'View Stats'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Agent Details */}
      {selectedAgentId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {agents?.find(a => a.agent_profile_id === selectedAgentId)?.agent_name || 'Agent'} - {t('performance.detailedStats') || 'Detailed Statistics'}
                </CardTitle>
                <CardDescription>
                  {t('performance.period') || 'Period'}: {periodDays} {t('performance.days') || 'days'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchStats()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : agentStats ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('performance.totalAssignments') || 'Total Assignments'}</p>
                    <p className="text-2xl font-bold">{agentStats.total_assignments}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('performance.completed') || 'Completed'}</p>
                    <p className="text-2xl font-bold text-green-600">{agentStats.completed_assignments}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('performance.qualityScore') || 'Quality Score'}</p>
                    <p className="text-2xl font-bold">{(agentStats.quality_score_avg * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('performance.deadlineCompliance') || 'Deadline Compliance'}</p>
                    <p className={`text-2xl font-bold ${getSuccessRateColor(agentStats.deadline_compliance_rate)}`}>
                      {(agentStats.deadline_compliance_rate * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* By Status */}
                {agentStats.by_status && Object.keys(agentStats.by_status).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t('performance.byStatus') || 'By Status'}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(agentStats.by_status).map(([status, count]) => (
                        <Badge key={status} variant="outline">
                          {status}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Type */}
                {agentStats.by_type && Object.keys(agentStats.by_type).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t('performance.byType') || 'By Type'}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(agentStats.by_type).map(([type, count]) => (
                        <Badge key={type} variant="secondary">
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{t('performance.noStats') || 'No statistics available for this period'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proficiency Breakdown */}
      {proficiencies && proficiencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('performance.proficiencyBreakdown', { defaultValue: 'Proficiency by Workflow' })}
            </CardTitle>
            <CardDescription>
              {t('performance.proficiencyDescription', {
                defaultValue: 'Agent specialization and success rates per workflow type',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('team.agent', { defaultValue: 'Agent' })}</TableHead>
                  <TableHead>{t('performance.workflow', { defaultValue: 'Workflow' })}</TableHead>
                  <TableHead className="text-center">{t('performance.completions', { defaultValue: 'Completions' })}</TableHead>
                  <TableHead className="text-center">{t('performance.escalations', { defaultValue: 'Escalations' })}</TableHead>
                  <TableHead className="text-center">{t('performance.successRate', { defaultValue: 'Success Rate' })}</TableHead>
                  <TableHead className="text-center">{t('performance.avgHours', { defaultValue: 'Avg Hours' })}</TableHead>
                  <TableHead className="text-center">{t('performance.last30d', { defaultValue: '30d' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proficiencies.map((p) => (
                  <TableRow key={`${p.agent_profile_id}-${p.workflow_code}`}>
                    <TableCell className="font-medium">{p.agent_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.workflow_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{p.completions_total}</TableCell>
                    <TableCell className="text-center">{p.escalations_total}</TableCell>
                    <TableCell className="text-center">
                      <span className={getSuccessRateColor(p.success_rate / 100)}>
                        {p.success_rate.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {p.avg_processing_hours ? `${Number(p.avg_processing_hours).toFixed(1)}h` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground">
                        {p.completions_30d}C / {p.escalations_30d}E
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Skills Gap / Coverage Analysis */}
      {skillsGap && skillsGap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t('performance.skillsGap', { defaultValue: 'Workflow Coverage Analysis' })}
            </CardTitle>
            <CardDescription>
              {t('performance.skillsGapDescription', {
                defaultValue: 'Workflows with pending items and their specialist coverage',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('performance.workflow', { defaultValue: 'Workflow' })}</TableHead>
                  <TableHead className="text-center">{t('performance.pending', { defaultValue: 'Pending' })}</TableHead>
                  <TableHead className="text-center">{t('performance.specialists', { defaultValue: 'Specialists' })}</TableHead>
                  <TableHead className="text-center">{t('performance.avgSuccess', { defaultValue: 'Avg Success' })}</TableHead>
                  <TableHead className="text-center">{t('performance.coverage', { defaultValue: 'Coverage' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillsGap.map((sg) => (
                  <TableRow key={sg.workflow_code}>
                    <TableCell>
                      <Badge variant="outline">{sg.workflow_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{sg.pending_count}</TableCell>
                    <TableCell className="text-center">{sg.specialist_count}</TableCell>
                    <TableCell className="text-center">
                      {sg.avg_specialist_success > 0 ? `${sg.avg_specialist_success.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={COVERAGE_STATUS_COLORS[sg.coverage_status] || ''}>
                        {sg.coverage_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Trends Chart */}
      {selectedAgentId && trends && trends.data_points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('performance.trends', { defaultValue: 'Performance Trends' })}
            </CardTitle>
            <CardDescription>
              {t('performance.trendsDescription', {
                defaultValue: '{name} - {granularity} trend over {days} days',
                name: trends.agent_name,
                granularity: trends.granularity,
                days: trends.period_days,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bar chart */}
              <div className="flex items-end gap-1 h-32">
                {trends.data_points.map((point) => {
                  const maxProcessed = Math.max(...trends.data_points.map(p => p.processed), 1);
                  return (
                    <div
                      key={point.period}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${point.period}: ${point.processed} (${point.approved} ${t('performance.approvedLabel', { defaultValue: 'approved' })}, ${point.rejected} ${t('performance.rejectedLabel', { defaultValue: 'rejected' })})`}
                    >
                      <div className="w-full flex flex-col items-stretch">
                        <div
                          className="bg-green-500 rounded-t"
                          style={{ height: `${(point.approved / maxProcessed) * 100}px` }}
                        />
                        <div
                          className="bg-red-400"
                          style={{ height: `${(point.rejected / maxProcessed) * 100}px` }}
                        />
                        <div
                          className="bg-blue-300 rounded-b"
                          style={{ height: `${Math.max(((point.processed - point.approved - point.rejected) / maxProcessed) * 100, 0)}px` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Labels */}
              <div className="flex gap-1">
                {trends.data_points.map((point) => (
                  <div key={point.period} className="flex-1 text-center">
                    <span className="text-[9px] text-muted-foreground">
                      {point.period.replace(/^\d{4}-/, '')}
                    </span>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 text-xs text-muted-foreground justify-center">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500" />
                  {t('performance.approvedLabel', { defaultValue: 'Approved' })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-400" />
                  {t('performance.rejectedLabel', { defaultValue: 'Rejected' })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-300" />
                  {t('performance.otherLabel', { defaultValue: 'Other' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
