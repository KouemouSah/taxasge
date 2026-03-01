/**
 * Agent Statistics Page — Analytical / Decision-Making
 *
 * Business function: comparative agent performance analysis for supervisors.
 * 5 decision types:
 *   1. Performance evaluation (who performs well/poorly)
 *   2. Quality control (approval rate, rejection patterns)
 *   3. Resource planning (workload distribution)
 *   4. Compliance/audit (SLA respect rates)
 *   5. Accountability (individual agent tracking)
 *
 * Uses the same workload-dashboard endpoint as stats/agents (monitoring page)
 * but presents data as sortable tables with export/print capabilities.
 *
 * @route /[locale]/dashboard/supervisor/team/workload
 */

'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  RotateCcw,
  Download,
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useWorkloadDashboard,
  WORKLOAD_DASHBOARD_QUERY_KEY,
} from '@/modules/treasury/hooks';
import type {
  AgentRanking,
  WorkloadAgentLoad,
  ProcessingTimeAgent,
} from '@/modules/treasury/types';

// ─── Merged agent row for the comparison table ───────────────────────

interface AgentRow {
  name: string;
  validated: number;
  rejected: number;
  approvalRate: number;
  avgHours: number;
  slaRate: number;
  capacityPct: number;
  status: string;
  score: number;
  anomalies: string[];
}

type SortKey = 'name' | 'validated' | 'rejected' | 'approvalRate' | 'avgHours' | 'slaRate' | 'score';
type SortDir = 'asc' | 'desc';
type PeriodDays = 7 | 30 | 90;

// ─── Page ────────────────────────────────────────────────────────────

export default function AgentStatisticsPage() {
  const t = useTranslations('supervisor');
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement>(null);

  const [days, setDays] = useState<PeriodDays>(30);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data, isLoading, error } = useWorkloadDashboard(days);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: [WORKLOAD_DASHBOARD_QUERY_KEY] });
  };

  // ─── Merge data sources into unified agent rows ──────────────────

  const rows = useMemo<AgentRow[]>(() => {
    if (!data) return [];

    const loadMap = new Map<string, WorkloadAgentLoad>();
    for (const a of data.agentLoad) {
      loadMap.set(a.agentName, a);
    }

    const timeMap = new Map<string, ProcessingTimeAgent>();
    for (const a of data.processingTimes) {
      timeMap.set(a.agentName, a);
    }

    const rankMap = new Map<string, AgentRanking>();
    for (const a of data.rankings) {
      rankMap.set(a.agentName, a);
    }

    // Collect all agent names
    const allNames = new Set<string>();
    data.agentLoad.forEach(a => allNames.add(a.agentName));
    data.rankings.forEach(a => allNames.add(a.agentName));
    data.processingTimes.forEach(a => allNames.add(a.agentName));

    // Compute averages for anomaly detection
    const allRankings = data.rankings;
    const avgScore = allRankings.length > 0
      ? allRankings.reduce((s, r) => s + r.score, 0) / allRankings.length
      : 0;
    const stdDev = allRankings.length > 1
      ? Math.sqrt(
          allRankings.reduce((s, r) => s + Math.pow(r.score - avgScore, 2), 0)
          / allRankings.length
        )
      : 0;

    return Array.from(allNames).map(name => {
      const load = loadMap.get(name);
      const time = timeMap.get(name);
      const rank = rankMap.get(name);

      const validated = rank?.validated ?? load?.completedPeriod ?? 0;
      const rejected = rank?.rejected ?? 0;
      const total = validated + rejected;
      const approvalRate = total > 0 ? (validated / total) * 100 : 0;

      const avgHours = time?.avgHours ?? load?.avgHours ?? 0;
      const slaBreakdown = data.slaBreakdown;
      const globalSla = slaBreakdown.compliancePct;
      const score = rank?.score ?? 0;
      const capacityPct = load?.capacityPct ?? 0;
      const status = load?.status ?? 'available';

      // Anomaly flags
      const anomalies: string[] = [];
      if (stdDev > 0 && score > avgScore + 1.5 * stdDev) anomalies.push('high');
      if (stdDev > 0 && score < avgScore - 1.5 * stdDev) anomalies.push('low');
      if (globalSla > 50 && approvalRate < globalSla * 0.5) anomalies.push('slaLow');
      if (capacityPct > 90) anomalies.push('overloaded');

      return {
        name,
        validated,
        rejected,
        approvalRate,
        avgHours,
        slaRate: globalSla,
        capacityPct,
        status,
        score,
        anomalies,
      };
    });
  }, [data]);

  // ─── Sorting ─────────────────────────────────────────────────────

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = va as number;
      const nb = vb as number;
      return sortDir === 'asc' ? na - nb : nb - na;
    });
    return sorted;
  }, [rows, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  // ─── Summary KPIs ───────────────────────────────────────────────

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const totalValidated = rows.reduce((s, r) => s + r.validated, 0);
    const totalRejected = rows.reduce((s, r) => s + r.rejected, 0);
    const total = totalValidated + totalRejected;
    const avgApprovalRate = total > 0 ? (totalValidated / total) * 100 : 0;
    const topPerformer = sortedRows[0]?.name ?? '-';
    return { totalValidated, totalRejected, avgApprovalRate, topPerformer };
  }, [rows, sortedRows]);

  // ─── Export CSV ──────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (sortedRows.length === 0) return;
    const headers = [
      t('agentStats.agent'),
      t('agentStats.validated'),
      t('agentStats.rejected'),
      t('agentStats.approvalRate'),
      t('agentStats.avgTime'),
      t('agentStats.load'),
      t('agentStats.score'),
      t('agentStats.status'),
    ];
    const csvRows = [headers.join(',')];
    for (const row of sortedRows) {
      csvRows.push([
        `"${row.name}"`,
        row.validated,
        row.rejected,
        `${row.approvalRate.toFixed(1)}%`,
        `${row.avgHours.toFixed(1)}h`,
        `${row.capacityPct.toFixed(0)}%`,
        row.score.toFixed(0),
        row.status,
      ].join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-statistics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, days, t]);

  // ─── Print PDF ───────────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    const printContent = tableRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head>
        <title>${t('agentStats.printTitle')}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { font-size: 12px; color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { padding: 6px 10px; border: 1px solid #ddd; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .right { text-align: right; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .green { background: #dcfce7; color: #166534; }
          .yellow { background: #fef9c3; color: #854d0e; }
          .red { background: #fee2e2; color: #991b1b; }
          @media print { body { margin: 0; } }
        </style>
      </head><body>
        <h1>${t('agentStats.printTitle')}</h1>
        <p>${t('agentStats.description')} — ${days} ${t('agentStats.period' + days + 'd').toLowerCase()}</p>
        ${printContent.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [days, t]);

  // ─── Sort header helper ──────────────────────────────────────────

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 text-xs whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field ? (
          sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );

  // ─── Status badge helper ─────────────────────────────────────────

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      busy: 'bg-yellow-100 text-yellow-800',
      overloaded: 'bg-red-100 text-red-800',
      unavailable: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={`text-[10px] px-1.5 py-0 ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {t(`workloadStatus.${status}`)}
      </Badge>
    );
  };

  // ─── Anomaly icon helper ─────────────────────────────────────────

  const anomalyIcons = (anomalies: string[]) => {
    if (anomalies.length === 0) return null;
    return (
      <div className="flex gap-0.5">
        {anomalies.includes('high') && (
          <span title={t('agentStats.anomalyHigh')}>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          </span>
        )}
        {anomalies.includes('low') && (
          <span title={t('agentStats.anomalyLow')}>
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          </span>
        )}
        {anomalies.includes('slaLow') && (
          <span title={t('agentStats.anomalySlaLow')}>
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          </span>
        )}
        {anomalies.includes('overloaded') && (
          <span title={t('agentStats.anomalyOverloaded')}>
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('agentStats.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('agentStats.description')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {([7, 30, 90] as PeriodDays[]).map(d => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
              className="h-7 text-xs"
            >
              {t(`agentStats.period${d}d`)}
            </Button>
          ))}
          <div className="w-px h-5 bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-7 gap-1.5 text-xs"
            disabled={!data || sortedRows.length === 0}
          >
            <Download className="h-3 w-3" />
            {t('agentStats.exportCsv')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-7 gap-1.5 text-xs"
            disabled={!data || sortedRows.length === 0}
          >
            <Printer className="h-3 w-3" />
            {t('agentStats.printPdf')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRetry} className="h-7 gap-1.5" disabled={isLoading}>
            <RotateCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{(error as Error)?.message ?? 'Error'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} className="h-7">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SummaryCard
            icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
            label={t('agentStats.totalValidated')}
            value={summary.totalValidated}
          />
          <SummaryCard
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            label={t('agentStats.totalRejected')}
            value={summary.totalRejected}
          />
          <SummaryCard
            icon={<Target className="h-4 w-4 text-blue-500" />}
            label={t('agentStats.avgApprovalRate')}
            value={`${summary.avgApprovalRate.toFixed(1)}%`}
          />
          <SummaryCard
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            label={t('agentStats.topPerformer')}
            value={summary.topPerformer}
            small
          />
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      )}

      {/* Main comparison table */}
      {data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('agentStats.title')}
              <Badge variant="outline" className="text-xs ml-auto">
                {sortedRows.length} {t('team.totalAgents').toLowerCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <div ref={tableRef}>
              {sortedRows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 text-xs w-8">#</TableHead>
                      <SortHeader label={t('agentStats.agent')} field="name" />
                      <SortHeader label={t('agentStats.validated')} field="validated" />
                      <SortHeader label={t('agentStats.rejected')} field="rejected" />
                      <SortHeader label={t('agentStats.approvalRate')} field="approvalRate" />
                      <SortHeader label={t('agentStats.avgTime')} field="avgHours" />
                      <SortHeader label={t('agentStats.score')} field="score" />
                      <TableHead className="text-xs">{t('agentStats.load')}</TableHead>
                      <TableHead className="text-xs">{t('agentStats.status')}</TableHead>
                      <TableHead className="text-xs w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((row, idx) => (
                      <TableRow key={row.name} className={row.anomalies.length > 0 ? 'bg-amber-50/30' : ''}>
                        <TableCell className="pl-4 py-2 text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="py-2">
                          <span className="text-sm font-medium truncate block max-w-[160px]" title={row.name}>
                            {row.name}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium text-emerald-700">{row.validated}</TableCell>
                        <TableCell className="py-2 text-sm text-red-600">{row.rejected}</TableCell>
                        <TableCell className="py-2">
                          <span className={`text-sm font-medium ${
                            row.approvalRate >= 80 ? 'text-emerald-600' :
                            row.approvalRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {row.approvalRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{row.avgHours.toFixed(1)}h</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant={row.score >= 70 ? 'default' : row.score >= 50 ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {row.score.toFixed(0)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.capacityPct > 90 ? 'bg-red-500' :
                                  row.capacityPct > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(row.capacityPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{row.capacityPct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {statusBadge(row.status)}
                        </TableCell>
                        <TableCell className="py-2 pr-4">
                          {anomalyIcons(row.anomalies)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('agentStats.noData')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact complement charts (2 small charts side by side) */}
      {data && data.dailyVelocity.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Mini velocity summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {t('agentStats.velocityTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={data.dailyVelocity} t={t} />
            </CardContent>
          </Card>

          {/* Mini volume trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                {t('agentStats.volumeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniVolumeChart data={data.volumeTrend} t={t} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Summary card component ──────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      {icon}
      <div className="overflow-hidden">
        <p className={`font-bold leading-tight truncate ${small ? 'text-sm' : 'text-lg'}`}>
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

// ─── Mini bar chart (velocity by agent, last 7 days aggregated) ──────

function MiniBarChart({
  data,
  t,
}: {
  data: { date: string; agentName: string; approved: number; rejected: number }[];
  t: ReturnType<typeof useTranslations>;
}) {
  const agentTotals = useMemo(() => {
    const map = new Map<string, { approved: number; rejected: number }>();
    for (const d of data) {
      const curr = map.get(d.agentName) ?? { approved: 0, rejected: 0 };
      curr.approved += d.approved;
      curr.rejected += d.rejected;
      map.set(d.agentName, curr);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v, total: v.approved + v.rejected }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [data]);

  const maxTotal = Math.max(...agentTotals.map(a => a.total), 1);

  return (
    <div className="space-y-1.5">
      {agentTotals.map(agent => (
        <div key={agent.name} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 truncate" title={agent.name}>
            {agent.name}
          </span>
          <div className="flex-1 flex h-4 gap-px">
            <div
              className="bg-emerald-500 rounded-l h-full"
              style={{ width: `${(agent.approved / maxTotal) * 100}%` }}
              title={`${t('agentStats.approvals')}: ${agent.approved}`}
            />
            <div
              className="bg-red-400 rounded-r h-full"
              style={{ width: `${(agent.rejected / maxTotal) * 100}%` }}
              title={`${t('agentStats.rejections')}: ${agent.rejected}`}
            />
          </div>
          <span className="text-xs font-medium w-8 text-right">{agent.total}</span>
        </div>
      ))}
      {agentTotals.length > 0 && (
        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> {t('agentStats.approvals')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-400 rounded-sm" /> {t('agentStats.rejections')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Mini volume chart (incoming vs processed per day) ───────────────

function MiniVolumeChart({
  data,
  t,
}: {
  data: { date: string; incoming: number; outgoing: number }[];
  t: ReturnType<typeof useTranslations>;
}) {
  // Show last 14 data points max for readability
  const recent = data.slice(-14);
  const maxVal = Math.max(...recent.map(d => Math.max(d.incoming, d.outgoing)), 1);
  const barHeight = 80;

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height: barHeight }}>
        {recent.map(d => {
          const inH = (d.incoming / maxVal) * barHeight;
          const outH = (d.outgoing / maxVal) * barHeight;
          return (
            <div key={d.date} className="flex-1 flex gap-px items-end" title={`${d.date}: ${d.incoming}/${d.outgoing}`}>
              <div
                className="flex-1 bg-blue-400 rounded-t"
                style={{ height: Math.max(inH, 1) }}
              />
              <div
                className="flex-1 bg-emerald-400 rounded-t"
                style={{ height: Math.max(outH, 1) }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-400 rounded-sm" /> {t('agentStats.incoming')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> {t('agentStats.processed')}
        </span>
      </div>
    </div>
  );
}
