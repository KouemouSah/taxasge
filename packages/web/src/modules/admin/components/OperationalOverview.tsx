'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import type { TooltipItem } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAlertsDashboard } from '@/modules/agents-admin/hooks'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

// Colors for entity capacity bars
const CAPACITY_COLORS = {
  normal: '#10b981',   // emerald-500
  warning: '#f59e0b',  // amber-500
  critical: '#ef4444', // red-500
}

// Colors for alerts donut
const ALERT_COLORS = {
  inactive: '#f59e0b',   // amber — inactive agents
  overloaded: '#ef4444', // red — overloaded agents
  staleLocks: '#f97316', // orange — stale locks
  slaAtRisk: '#dc2626',  // red-600 — SLA risk
  ok: '#10b981',         // emerald — all normal
}

export default function OperationalOverview() {
  const t = useTranslations('admin.dashboard')
  const { data: dashboard, isLoading, error } = useAlertsDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{t('operationalError')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAlerts = dashboard.total_alerts || 0
  const entities = dashboard.workload_by_entity || []

  // =============================================
  // CHART 1: Entity Capacity Bar Chart
  // =============================================
  const entityLabels = entities.map(e => e.entity_name || e.entity_code || '—')
  const entityCapacities = entities.map(e => e.avg_capacity || 0)
  const entityBarColors = entityCapacities.map(c =>
    c > 80 ? CAPACITY_COLORS.critical : c > 60 ? CAPACITY_COLORS.warning : CAPACITY_COLORS.normal
  )

  const capacityChartData = {
    labels: entityLabels,
    datasets: [
      {
        label: t('capacityCol'),
        data: entityCapacities,
        backgroundColor: entityBarColors,
        borderRadius: 4,
        maxBarThickness: 40,
      },
    ],
  }

  const capacityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.x ?? 0}% ${t('capacityCol').toLowerCase()}`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { display: false },
        ticks: { callback: (v: string | number) => `${v}%` },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  }

  // =============================================
  // CHART 2: Entity Assignments Bar Chart
  // =============================================
  const entityAssignments = entities.map(e => e.total_assignments || 0)
  const entityAgentCounts = entities.map(e => e.agent_count || 0)

  const assignmentsChartData = {
    labels: entityLabels,
    datasets: [
      {
        label: t('casesCol'),
        data: entityAssignments,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        maxBarThickness: 40,
      },
      {
        label: t('agentsCol'),
        data: entityAgentCounts,
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        maxBarThickness: 40,
      },
    ],
  }

  const assignmentsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { stepSize: 1, font: { size: 11 } },
      },
    },
  }

  // =============================================
  // CHART 3: Alerts Donut Chart
  // =============================================
  const alertValues = [
    dashboard.inactive_count || 0,
    dashboard.overloaded_count || 0,
    dashboard.stale_locks_count || 0,
    dashboard.sla_at_risk_count || 0,
  ]
  const alertLabels = [
    t('inactiveAgents'),
    t('overloadedAgents'),
    t('staleLocks'),
    t('slaAtRisk'),
  ]
  const alertColors = [
    ALERT_COLORS.inactive,
    ALERT_COLORS.overloaded,
    ALERT_COLORS.staleLocks,
    ALERT_COLORS.slaAtRisk,
  ]

  // Filter out zero values for cleaner donut
  const nonZeroIndices = alertValues
    .map((v, i) => (v > 0 ? i : -1))
    .filter(i => i >= 0)

  const hasAlerts = nonZeroIndices.length > 0
  const donutData = hasAlerts
    ? {
        labels: nonZeroIndices.map(i => alertLabels[i]),
        datasets: [{
          data: nonZeroIndices.map(i => alertValues[i]),
          backgroundColor: nonZeroIndices.map(i => alertColors[i]),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      }
    : {
        labels: [t('allNormal')],
        datasets: [{
          data: [1],
          backgroundColor: [ALERT_COLORS.ok],
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) =>
            hasAlerts ? `${ctx.label}: ${ctx.parsed}` : t('allNormal'),
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      {/* LLM Briefing banner */}
      {dashboard.llm_briefing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-2.5">
          <p className="text-sm text-blue-900">{dashboard.llm_briefing}</p>
        </div>
      )}

      {/* Charts Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Alerts Donut */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('operationalAlertsLabel')}
              </CardTitle>
              {totalAlerts > 0 ? (
                <Badge variant="destructive" className="text-xs">{totalAlerts}</Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">OK</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Entity Capacity (horizontal bar) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('capacityCol')} {t('workloadByEntity').toLowerCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            {entities.length > 0 ? (
              <div style={{ height: Math.max(entities.length * 40, 120) }}>
                <Bar data={capacityChartData} options={capacityChartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                {t('operationalError')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Assignments + Agents by Entity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('casesCol')} & {t('agentsCol')} {t('workloadByEntity').toLowerCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            {entities.length > 0 ? (
              <div className="h-52">
                <Bar data={assignmentsChartData} options={assignmentsChartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                {t('operationalError')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
