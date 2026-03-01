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
import * as XLSX from 'xlsx';
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
  FileSpreadsheet,
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

  // ─── Export helpers ─────────────────────────────────────────────

  const getExportData = useCallback(() => {
    return sortedRows.map((row, idx) => ({
      '#': idx + 1,
      [t('agentStats.agent')]: row.name,
      [t('agentStats.validated')]: row.validated,
      [t('agentStats.rejected')]: row.rejected,
      [t('agentStats.approvalRate')]: Number(row.approvalRate.toFixed(1)),
      [`${t('agentStats.avgTime')} (h)`]: Number(row.avgHours.toFixed(1)),
      [t('agentStats.score')]: Number(row.score.toFixed(1)),
      [`${t('agentStats.load')} %`]: Number(row.capacityPct.toFixed(0)),
      [t('agentStats.status')]: row.status,
    }));
  }, [sortedRows, t]);

  const filePrefix = `agent-statistics-${days}d-${new Date().toISOString().slice(0, 10)}`;

  // ─── Export CSV ──────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (sortedRows.length === 0) return;
    const exportData = getExportData();
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, getExportData, filePrefix]);

  // ─── Export XLSX ─────────────────────────────────────────────────

  const handleExportXLSX = useCallback(() => {
    if (sortedRows.length === 0) return;
    const exportData = getExportData();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-width columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => String(row[key as keyof typeof row] ?? '').length)
      ) + 2,
    }));
    ws['!cols'] = colWidths;

    // Summary row at the bottom
    if (summary) {
      const summaryRowIdx = exportData.length + 2;
      XLSX.utils.sheet_add_aoa(ws, [
        [],
        [
          t('agentStats.totalValidated'), summary.totalValidated,
          t('agentStats.totalRejected'), summary.totalRejected,
          t('agentStats.avgApprovalRate'), `${summary.avgApprovalRate.toFixed(1)}%`,
          t('agentStats.topPerformer'), summary.topPerformer,
        ],
      ], { origin: `A${summaryRowIdx}` });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('agentStats.title').slice(0, 31));
    XLSX.writeFile(wb, `${filePrefix}.xlsx`);
  }, [sortedRows, getExportData, filePrefix, summary, t]);

  // ─── Print PDF ───────────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    if (sortedRows.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString();
    const periodLabel = t(`agentStats.period${days}d`);

    // Build clean table rows from data (not innerHTML copy)
    const tableRows = sortedRows.map((row, idx) => {
      const rateColor = row.approvalRate >= 80 ? '#166534' : row.approvalRate >= 60 ? '#854d0e' : '#991b1b';
      const scoreColor = row.score >= 70 ? '#166534' : row.score >= 50 ? '#854d0e' : '#991b1b';
      const scoreBg = row.score >= 70 ? '#dcfce7' : row.score >= 50 ? '#f5f5f5' : '#fee2e2';
      const anomalyStr = row.anomalies.length > 0 ? row.anomalies.map(a => {
        if (a === 'high') return '▲';
        if (a === 'low') return '▼';
        if (a === 'slaLow') return '⚠';
        if (a === 'overloaded') return '●';
        return '';
      }).join(' ') : '';

      return `<tr${row.anomalies.length > 0 ? ' style="background:#fffbeb"' : ''}>
        <td style="text-align:center;color:#888">${idx + 1}</td>
        <td><b>${row.name}</b></td>
        <td style="text-align:right;color:#166534">${row.validated}</td>
        <td style="text-align:right;color:#991b1b">${row.rejected}</td>
        <td style="text-align:right;color:${rateColor}">${row.approvalRate.toFixed(1)}%</td>
        <td style="text-align:right">${row.avgHours.toFixed(1)}h</td>
        <td style="text-align:center"><span style="background:${scoreBg};color:${scoreColor};padding:2px 8px;border-radius:4px;font-weight:600">${row.score.toFixed(0)}</span></td>
        <td style="text-align:right">${row.capacityPct.toFixed(0)}%</td>
        <td>${row.status}</td>
        <td style="text-align:center">${anomalyStr}</td>
      </tr>`;
    }).join('');

    const summaryHtml = summary ? `
      <div style="display:flex;gap:24px;margin-bottom:16px;font-size:13px">
        <div><b>${t('agentStats.totalValidated')}:</b> ${summary.totalValidated}</div>
        <div><b>${t('agentStats.totalRejected')}:</b> ${summary.totalRejected}</div>
        <div><b>${t('agentStats.avgApprovalRate')}:</b> ${summary.avgApprovalRate.toFixed(1)}%</div>
        <div><b>${t('agentStats.topPerformer')}:</b> ${summary.topPerformer}</div>
      </div>
    ` : '';

    printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <title>${t('agentStats.printTitle')}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
    .header h1 { font-size: 20px; margin: 0; }
    .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
    .meta { font-size: 11px; color: #888; text-align: right; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th { background: #f0f0f0; font-weight: 600; padding: 8px 10px; border: 1px solid #ddd; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 6px 10px; border: 1px solid #ddd; }
    .footer { margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; }
    @media print { body { margin: 12px; } @page { margin: 1cm; } }
  </style>
</head><body>
  <div class="header">
    <div>
      <h1>${t('agentStats.printTitle')}</h1>
      <p>${t('agentStats.description')}</p>
    </div>
    <div class="meta">
      <div>${dateStr}</div>
      <div>${periodLabel}</div>
    </div>
  </div>
  ${summaryHtml}
  <table>
    <thead><tr>
      <th style="text-align:center;width:30px">#</th>
      <th>${t('agentStats.agent')}</th>
      <th style="text-align:right">${t('agentStats.validated')}</th>
      <th style="text-align:right">${t('agentStats.rejected')}</th>
      <th style="text-align:right">${t('agentStats.approvalRate')}</th>
      <th style="text-align:right">${t('agentStats.avgTime')}</th>
      <th style="text-align:center">${t('agentStats.score')}</th>
      <th style="text-align:right">${t('agentStats.load')}</th>
      <th>${t('agentStats.status')}</th>
      <th style="text-align:center;width:30px"></th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>TaxasGE — ${t('agentStats.printTitle')}</span>
    <span>${dateStr} | ${periodLabel} | ${sortedRows.length} agents</span>
  </div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }, [sortedRows, days, summary, t]);

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
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportXLSX}
            className="h-7 gap-1.5 text-xs"
            disabled={!data || sortedRows.length === 0}
          >
            <FileSpreadsheet className="h-3 w-3" />
            XLSX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-7 gap-1.5 text-xs"
            disabled={!data || sortedRows.length === 0}
          >
            <Printer className="h-3 w-3" />
            PDF
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
