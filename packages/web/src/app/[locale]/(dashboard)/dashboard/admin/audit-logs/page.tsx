'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  FileText, Search, X, ChevronLeft, ChevronRight,
  Activity, Cpu, AlertTriangle, CheckCircle, XCircle,
  Clock, RefreshCw, TrendingUp, Zap, DollarSign,
  BarChart3,
} from 'lucide-react'
import type { TooltipItem } from 'chart.js'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { fetchClient } from '@/core/api'
import type { AuditLog, PaginatedAuditLogsResponse, AuditLogStats } from '@/modules/audit-logs-admin/types'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
)

// ─── Action badge colors ───
const ACTION_COLORS: Record<string, string> = {
  payment_completed: 'bg-green-100 text-green-800',
  request_submitted: 'bg-blue-100 text-blue-800',
  request_approved: 'bg-green-100 text-green-800',
  request_rejected: 'bg-red-100 text-red-800',
  request_escalated: 'bg-orange-100 text-orange-800',
  document_uploaded: 'bg-indigo-100 text-indigo-800',
  document_validated: 'bg-green-100 text-green-800',
  user_registered: 'bg-blue-100 text-blue-800',
  sla_warning: 'bg-yellow-100 text-yellow-800',
  sla_breach: 'bg-red-100 text-red-800',
}

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

// ─── Gemini stats types ───
interface GeminiUsageStats {
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  error_count: number
  fallback_count: number
  avg_processing_time_ms: number
  avg_confidence: number
  daily_breakdown: Array<{ day: string; calls: number; tokens: number; errors: number }>
  by_workflow: Array<{ workflow: string; calls: number; tokens: number }>
  by_document_category: Array<{ category: string; calls: number; tokens: number; avg_confidence: number }>
}

export default function AuditLogsPage() {
  const t = useTranslations('admin.auditLogs')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Costes IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <AuditLogsTab />
        </TabsContent>

        <TabsContent value="gemini" className="mt-4">
          <GeminiCostsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: AUDIT ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const PAGE_SIZE = 25

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE }
      if (search) params.search = search
      if (actionFilter !== 'all') params.action = actionFilter
      if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const result = await fetchClient.get<PaginatedAuditLogsResponse>('/audit-logs', params)
      setLogs(result.items || [])
      setTotal(result.total || 0)
      setPages(result.pages || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading audit logs')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, actionFilter, entityTypeFilter, startDate, endDate])

  const fetchStats = useCallback(async () => {
    try {
      const result = await fetchClient.get<AuditLogStats>('/audit-logs/stats')
      setStats(result)
    } catch {
      // Stats are optional — don't block the page
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const clearFilters = () => {
    setSearch('')
    setActionFilter('all')
    setEntityTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasFilters = search || actionFilter !== 'all' || entityTypeFilter !== 'all' || startDate || endDate

  // Unique action types from stats
  const actionTypes = stats ? Object.keys(stats.by_action).sort() : []
  const entityTypes = stats ? Object.keys(stats.by_entity_type).sort() : []

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Logs</p>
                  <p className="text-lg font-bold">{stats.total_logs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipos de acción</p>
                  <p className="text-lg font-bold">{Object.keys(stats.by_action).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipos de entidad</p>
                  <p className="text-lg font-bold">{Object.keys(stats.by_entity_type).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">En esta página</p>
                  <p className="text-lg font-bold">{logs.length} / {total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o referencia..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10 h-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {actionTypes.map((a) => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="Entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {entityTypes.map((et) => (
                  <SelectItem key={et} value={et}>{et.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="w-auto h-9"
            />
            <Input
              type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="w-auto h-9"
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando logs...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500 gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <span className="text-sm">No se encontraron logs</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Fecha</TableHead>
                  <TableHead className="w-[160px]">Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="w-[120px]">IP</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('es-GQ', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="ml-1 text-xs text-muted-foreground/60 font-mono">
                            {log.entity_id.length > 12
                              ? `${log.entity_id.substring(0, 8)}...`
                              : log.entity_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedId === log.id ? 'rotate-90' : ''
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">ID:</span>{' '}
                              <span className="font-mono">{log.id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User ID:</span>{' '}
                              <span className="font-mono">{log.user_id || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entity ID:</span>{' '}
                              <span className="font-mono">{log.entity_id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User Agent:</span>{' '}
                              <span className="truncate max-w-[200px] inline-block">
                                {log.user_agent || '-'}
                              </span>
                            </div>
                          </div>
                          {(log.old_values || log.new_values) && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {log.old_values && (
                                <div>
                                  <p className="text-xs font-semibold text-red-600 mb-1">Valores anteriores</p>
                                  <pre className="text-[11px] bg-red-50 p-2 rounded overflow-x-auto max-h-40">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <p className="text-xs font-semibold text-green-600 mb-1">Nuevos valores</p>
                                  <pre className="text-[11px] bg-green-50 p-2 rounded overflow-x-auto max-h-40">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Página {page} de {pages} ({total} registros)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: GEMINI AI COSTS
// ═══════════════════════════════════════════════════════════════

function GeminiCostsTab() {
  const [stats, setStats] = useState<GeminiUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchClient.get<GeminiUsageStats>('/audit-logs/gemini-stats', { days })
        setStats(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading Gemini stats')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [days])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando estadísticas Gemini...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500 gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  if (!stats) return null

  const errorRate = stats.total_calls > 0 ? ((stats.error_count / stats.total_calls) * 100).toFixed(1) : '0'
  const fallbackRate = stats.total_calls > 0 ? ((stats.fallback_count / stats.total_calls) * 100).toFixed(1) : '0'

  // Daily chart data (reversed to show oldest → newest)
  const dailyData = [...(stats.daily_breakdown || [])].reverse()
  const dailyChartData = {
    labels: dailyData.map(d => {
      const date = new Date(d.day)
      return `${date.getDate()}/${date.getMonth() + 1}`
    }),
    datasets: [
      {
        label: 'Tokens',
        data: dailyData.map(d => d.tokens),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  }

  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${(ctx.parsed.y || 0).toLocaleString()} tokens`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 15 } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
    },
  }

  // By workflow bar chart
  const workflowData = stats.by_workflow || []
  const workflowChartData = {
    labels: workflowData.map(w => w.workflow.replace(/_/g, ' ')),
    datasets: [{
      label: 'Tokens',
      data: workflowData.map(w => w.tokens),
      backgroundColor: workflowData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderRadius: 4,
      maxBarThickness: 30,
    }],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${(ctx.parsed.x || 0).toLocaleString()} tokens (${workflowData[ctx.dataIndex]?.calls || 0} llamadas)`,
        },
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  }

  // By category donut
  const categoryData = stats.by_document_category || []
  const categoryDonutData = {
    labels: categoryData.map(c => c.category.replace(/_/g, ' ')),
    datasets: [{
      data: categoryData.map(c => c.tokens),
      backgroundColor: categoryData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { usePointStyle: true, pointStyle: 'circle' as const, padding: 10, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? Math.round(((ctx.parsed || 0) / total) * 100) : 0
            return `${ctx.label}: ${(ctx.parsed || 0).toLocaleString()} tokens (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-500" />
          Monitoreo Gemini AI
        </h2>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 días</SelectItem>
            <SelectItem value="30">30 días</SelectItem>
            <SelectItem value="90">90 días</SelectItem>
            <SelectItem value="365">1 año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Llamadas</p>
                <p className="text-lg font-bold">{stats.total_calls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-xs text-muted-foreground">Tokens</p>
                <p className="text-lg font-bold">
                  {stats.total_tokens > 1_000_000
                    ? `${(stats.total_tokens / 1_000_000).toFixed(1)}M`
                    : stats.total_tokens > 1_000
                    ? `${(stats.total_tokens / 1_000).toFixed(0)}K`
                    : stats.total_tokens}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Coste est.</p>
                <p className="text-lg font-bold">${stats.estimated_cost_usd.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Errores</p>
                <p className="text-lg font-bold">{errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Fallback</p>
                <p className="text-lg font-bold">{fallbackRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Confianza</p>
                <p className="text-lg font-bold">{(stats.avg_confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily tokens line chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Consumo diario de tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <div className="h-56">
                <Line data={dailyChartData} options={dailyChartOptions} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>

        {/* Tokens by category donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tokens por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-56">
                <Doughnut data={categoryDonutData} options={donutOptions} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>

        {/* Tokens by workflow bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tokens por workflow</CardTitle>
          </CardHeader>
          <CardContent>
            {workflowData.length > 0 ? (
              <div style={{ height: Math.max(workflowData.length * 30 + 40, 200) }}>
                <Bar data={workflowChartData} options={barOptions} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
