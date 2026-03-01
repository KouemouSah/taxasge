'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Database,
  Activity,
  Zap,
  Server,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react'
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
import { monitoringApi } from '@/modules/admin/services/monitoringApi'
import type {
  SlowQuery,
  FrequentQuery,
  TableStat,
  UnusedIndex,
} from '@/modules/admin/services/monitoringApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// ---------- helpers ----------
const formatMs = (ms: number | null) => {
  if (ms == null) return '-'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
const formatNumber = (n: number) => n.toLocaleString()

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

// ---------- small gauge component ----------
function PoolGauge({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.round((used / max) * 100) : 0
  const color = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981'
  const data = {
    datasets: [{
      data: [used, Math.max(0, max - used)],
      backgroundColor: [color, '#e5e7eb'],
      borderWidth: 0,
      circumference: 270,
      rotation: 225,
    }],
  }
  const options = {
    cutout: '75%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  }
  return (
    <div className="relative h-[140px] w-[140px] mx-auto">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-muted-foreground">{used}/{max}</span>
      </div>
    </div>
  )
}

// ---------- page ----------
export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('slow-queries')

  const { data: slowQueries, isLoading: loadingSlow, refetch: refetchSlow } =
    useQuery({
      queryKey: ['monitoring', 'slow-queries'],
      queryFn: () => monitoringApi.getSlowQueries(20, 5),
      refetchInterval: 30000,
    })

  const { data: frequentQueries, isLoading: loadingFrequent, refetch: refetchFrequent } =
    useQuery({
      queryKey: ['monitoring', 'frequent-queries'],
      queryFn: () => monitoringApi.getFrequentQueries(20),
      refetchInterval: 30000,
    })

  const { data: poolStats, isLoading: loadingPool, refetch: refetchPool } =
    useQuery({
      queryKey: ['monitoring', 'pool'],
      queryFn: () => monitoringApi.getPoolStats(),
      refetchInterval: 10000,
    })

  const { data: dbStats, isLoading: loadingDb, refetch: refetchDb } =
    useQuery({
      queryKey: ['monitoring', 'db-stats'],
      queryFn: () => monitoringApi.getDatabaseStats(),
      refetchInterval: 60000,
    })

  const { data: lockStatus, isLoading: loadingLocks, refetch: refetchLocks } =
    useQuery({
      queryKey: ['monitoring', 'locks'],
      queryFn: () => monitoringApi.getLockStatus(),
      refetchInterval: 15000,
    })

  const handleRefreshAll = () => {
    refetchSlow(); refetchFrequent(); refetchPool(); refetchDb(); refetchLocks()
  }

  // ---------- chart data: slow queries horizontal bar ----------
  const slowBarData = useMemo(() => {
    const top = (slowQueries?.queries ?? []).slice(0, 10)
    return {
      labels: top.map(q => {
        const preview = q.query_preview.replace(/\s+/g, ' ').trim()
        return preview.length > 50 ? preview.slice(0, 47) + '...' : preview
      }),
      datasets: [{
        label: 'Mean exec (ms)',
        data: top.map(q => q.mean_exec_time_ms),
        backgroundColor: top.map((q) =>
          q.mean_exec_time_ms > 1000 ? '#ef4444'
            : q.mean_exec_time_ms > 100 ? '#f59e0b'
            : '#10b981'
        ),
        borderRadius: 4,
      }],
    }
  }, [slowQueries])

  const slowBarOptions = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => `${formatMs(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'ms', font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 9, family: 'monospace' } },
        grid: { display: false },
      },
    },
  }), [])

  // ---------- chart data: table sizes doughnut ----------
  const tableSizeData = useMemo(() => {
    const tables = (dbStats?.tables ?? []).slice(0, 8)
    return {
      labels: tables.map(t => t.table_name),
      datasets: [{
        data: tables.map(t => t.row_estimate),
        backgroundColor: CHART_COLORS.slice(0, tables.length),
        borderWidth: 1,
        borderColor: '#fff',
      }],
    }
  }, [dbStats])

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { font: { size: 10 }, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            `${ctx.label}: ${formatNumber(ctx.raw as number)} rows`,
        },
      },
    },
  }), [])

  // ---------- derived metrics ----------
  const avgCacheHit = useMemo(() => {
    const queries = slowQueries?.queries ?? []
    const withCache = queries.filter(q => q.cache_hit_ratio != null)
    if (withCache.length === 0) return null
    const avg = withCache.reduce((s, q) => s + (q.cache_hit_ratio ?? 0), 0) / withCache.length
    return Math.round(avg * 10) / 10
  }, [slowQueries])

  const unusedCount = dbStats?.unused_indexes?.length ?? 0

  return (
    <div className="space-y-4">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Database Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            pg_stat_statements &middot; pool &middot; locks &middot; tables
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* ═══════ VISUAL DASHBOARD (always visible) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Card 1: Pool Gauge */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              Connection Pool
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            {loadingPool ? (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground">...</div>
            ) : poolStats ? (
              <PoolGauge used={poolStats.used_connections} max={poolStats.max_size} />
            ) : null}
          </CardContent>
        </Card>

        {/* Card 2: Key Metrics */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tracked Queries</span>
              <span className="font-mono font-bold text-sm">
                {loadingSlow ? '...' : formatNumber(slowQueries?.total_tracked ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active Connections</span>
              <span className="font-mono font-bold text-sm">
                {loadingLocks ? '...' : lockStatus?.active_connections?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Cache Hit</span>
              <span className="font-mono font-bold text-sm">
                {avgCacheHit != null ? (
                  <Badge variant={avgCacheHit > 95 ? 'default' : avgCacheHit > 80 ? 'secondary' : 'destructive'}>
                    {avgCacheHit}%
                  </Badge>
                ) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unused Indexes</span>
              <span className="font-mono font-bold text-sm">
                {loadingDb ? '...' : (
                  <span className="flex items-center gap-1">
                    {unusedCount === 0
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />{unusedCount}</>
                      : <><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />{unusedCount}</>}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Lock Modes</span>
              <span className="font-mono font-bold text-sm flex items-center gap-1">
                {loadingLocks ? '...' : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {lockStatus?.lock_counts?.length ?? 0}
                  </>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Slow Queries Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              Top 10 Slowest Queries
            </CardTitle>
            <CardDescription className="text-[10px]">
              Mean execution time (ms). Red &gt; 1s, Yellow &gt; 100ms, Green &lt; 100ms
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            {loadingSlow ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground">...</div>
            ) : (slowQueries?.queries?.length ?? 0) === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                No slow queries detected
              </div>
            ) : (
              <div className="h-[160px]">
                <Bar data={slowBarData} options={slowBarOptions} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Table sizes doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-500" />
              Table Size Distribution (by rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            {loadingDb ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">...</div>
            ) : (
              <div className="h-[180px]">
                <Doughnut data={tableSizeData} options={doughnutOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick table: Top 5 heaviest tables */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Heaviest Tables (disk)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-2">
            {loadingDb ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Table</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Rows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dbStats?.tables ?? []).slice(0, 6).map((t: TableStat) => (
                    <TableRow key={t.table_name}>
                      <TableCell className="font-mono text-xs py-1.5">{t.table_name}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-1.5">{t.total_size}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-1.5">{formatNumber(t.row_estimate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════ DETAIL TABS ═══════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="frequent-queries">Most Called</TabsTrigger>
          <TabsTrigger value="tables">Table Sizes</TabsTrigger>
          <TabsTrigger value="indexes">
            Unused Indexes
            {unusedCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {unusedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="locks">Locks</TabsTrigger>
        </TabsList>

        {/* Slow Queries */}
        <TabsContent value="slow-queries">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Queries (by mean exec time)</CardTitle>
              <CardDescription>
                Top 20 queries with mean execution time DESC. Min 5 calls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSlow ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[400px]">Query</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Mean</TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Cache Hit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slowQueries?.queries?.map((q: SlowQuery, i: number) => (
                        <TableRow key={q.queryid || i}>
                          <TableCell>
                            <code className="text-xs break-all">{q.query_preview}</code>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(q.calls)}</TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge variant={
                              q.mean_exec_time_ms > 1000 ? 'destructive'
                                : q.mean_exec_time_ms > 100 ? 'secondary' : 'outline'
                            }>
                              {formatMs(q.mean_exec_time_ms)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatMs(q.max_exec_time_ms)}</TableCell>
                          <TableCell className="text-right font-mono">{formatMs(q.total_exec_time_ms)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {q.cache_hit_ratio != null ? `${q.cache_hit_ratio}%` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequent Queries */}
        <TabsContent value="frequent-queries">
          <Card>
            <CardHeader>
              <CardTitle>Most Called Queries</CardTitle>
              <CardDescription>Top 20 queries by call count.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFrequent ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[400px]">Query</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Mean</TableHead>
                        <TableHead className="text-right">Total Time</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                        <TableHead className="text-right">Cache Hit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {frequentQueries?.queries?.map((q: FrequentQuery, i: number) => (
                        <TableRow key={q.queryid || i}>
                          <TableCell>
                            <code className="text-xs break-all">{q.query_preview}</code>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">{formatNumber(q.calls)}</TableCell>
                          <TableCell className="text-right font-mono">{formatMs(q.mean_exec_time_ms)}</TableCell>
                          <TableCell className="text-right font-mono">{formatMs(q.total_exec_time_ms)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(q.total_rows)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {q.cache_hit_ratio != null ? `${q.cache_hit_ratio}%` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Sizes */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Table Sizes</CardTitle>
              <CardDescription>Top 30 tables by total size (data + indexes).</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDb ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                        <TableHead className="text-right">Indexes</TableHead>
                        <TableHead className="text-right">Rows (est.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbStats?.tables?.map((t: TableStat) => (
                        <TableRow key={t.table_name}>
                          <TableCell className="font-mono text-sm">{t.table_name}</TableCell>
                          <TableCell className="text-right font-mono">{t.total_size}</TableCell>
                          <TableCell className="text-right font-mono">{t.data_size}</TableCell>
                          <TableCell className="text-right font-mono">{t.index_size}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(t.row_estimate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unused Indexes */}
        <TabsContent value="indexes">
          <Card>
            <CardHeader>
              <CardTitle>Unused Indexes</CardTitle>
              <CardDescription>Non-unique indexes with fewer than 10 scans. Candidates for removal.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDb ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (dbStats?.unused_indexes?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No unused indexes found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Index</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Scans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbStats?.unused_indexes?.map((idx: UnusedIndex) => (
                        <TableRow key={idx.index_name}>
                          <TableCell className="font-mono text-sm">{idx.table_name}</TableCell>
                          <TableCell className="font-mono text-sm">{idx.index_name}</TableCell>
                          <TableCell className="text-right font-mono">{idx.size}</TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge variant={idx.scan_count === 0 ? 'destructive' : 'secondary'}>
                              {idx.scan_count}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locks */}
        <TabsContent value="locks">
          <Card>
            <CardHeader>
              <CardTitle>Active Locks</CardTitle>
              <CardDescription>Current lock modes and active (non-idle) connections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingLocks ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {lockStatus?.lock_counts && lockStatus.lock_counts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Lock Modes</h4>
                      <div className="flex flex-wrap gap-2">
                        {lockStatus.lock_counts.map((lc, i) => (
                          <Badge key={i} variant={lc.granted ? 'outline' : 'destructive'}>
                            {lc.mode}: {lc.count}
                            {!lc.granted && ' (waiting)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Active Connections ({lockStatus?.active_connections?.length ?? 0})
                    </h4>
                    {(lockStatus?.active_connections?.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-sm">No active queries.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>PID</TableHead>
                              <TableHead>State</TableHead>
                              <TableHead className="text-right">Duration</TableHead>
                              <TableHead>Wait</TableHead>
                              <TableHead className="w-[400px]">Query</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lockStatus?.active_connections?.map((conn) => (
                              <TableRow key={conn.pid}>
                                <TableCell className="font-mono">{conn.pid}</TableCell>
                                <TableCell><Badge variant="outline">{conn.state}</Badge></TableCell>
                                <TableCell className="text-right font-mono">
                                  {conn.query_seconds != null ? `${conn.query_seconds}s` : '-'}
                                </TableCell>
                                <TableCell className="text-sm">{conn.wait_event ?? '-'}</TableCell>
                                <TableCell>
                                  <code className="text-xs break-all">{conn.query}</code>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
