'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { monitoringApi } from '@/modules/admin/services/monitoringApi'
import type {
  SlowQuery,
  FrequentQuery,
  TableStat,
  UnusedIndex,
} from '@/modules/admin/services/monitoringApi'

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('slow-queries')

  const {
    data: slowQueries,
    isLoading: loadingSlow,
    refetch: refetchSlow,
  } = useQuery({
    queryKey: ['monitoring', 'slow-queries'],
    queryFn: () => monitoringApi.getSlowQueries(20, 5),
    refetchInterval: 30000,
  })

  const {
    data: frequentQueries,
    isLoading: loadingFrequent,
    refetch: refetchFrequent,
  } = useQuery({
    queryKey: ['monitoring', 'frequent-queries'],
    queryFn: () => monitoringApi.getFrequentQueries(20),
    refetchInterval: 30000,
  })

  const {
    data: poolStats,
    isLoading: loadingPool,
    refetch: refetchPool,
  } = useQuery({
    queryKey: ['monitoring', 'pool'],
    queryFn: () => monitoringApi.getPoolStats(),
    refetchInterval: 10000,
  })

  const {
    data: dbStats,
    isLoading: loadingDb,
    refetch: refetchDb,
  } = useQuery({
    queryKey: ['monitoring', 'db-stats'],
    queryFn: () => monitoringApi.getDatabaseStats(),
    refetchInterval: 60000,
  })

  const {
    data: lockStatus,
    isLoading: loadingLocks,
    refetch: refetchLocks,
  } = useQuery({
    queryKey: ['monitoring', 'locks'],
    queryFn: () => monitoringApi.getLockStatus(),
    refetchInterval: 15000,
  })

  const handleRefreshAll = () => {
    refetchSlow()
    refetchFrequent()
    refetchPool()
    refetchDb()
    refetchLocks()
  }

  const formatMs = (ms: number | null) => {
    if (ms == null) return '-'
    if (ms < 1) return `${(ms * 1000).toFixed(0)}us`
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Database Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            pg_stat_statements, connection pool, locks, table sizes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pool + Lock status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Pool Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPool ? (
              <div className="text-muted-foreground">...</div>
            ) : poolStats ? (
              <div>
                <div className="text-2xl font-bold">
                  {poolStats.used_connections}/{poolStats.max_size}
                </div>
                <p className="text-xs text-muted-foreground">
                  {poolStats.free_connections} free
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingLocks ? '...' : lockStatus?.active_connections?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">non-idle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tracked Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingSlow ? '...' : formatNumber(slowQueries?.total_tracked ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">pg_stat_statements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingDb ? '...' : dbStats?.tables?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="frequent-queries">Most Called</TabsTrigger>
          <TabsTrigger value="tables">Table Sizes</TabsTrigger>
          <TabsTrigger value="indexes">Unused Indexes</TabsTrigger>
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
                            <code className="text-xs break-all">
                              {q.query_preview}
                            </code>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(q.calls)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge
                              variant={
                                q.mean_exec_time_ms > 1000
                                  ? 'destructive'
                                  : q.mean_exec_time_ms > 100
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {formatMs(q.mean_exec_time_ms)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMs(q.max_exec_time_ms)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMs(q.total_exec_time_ms)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {q.cache_hit_ratio != null
                              ? `${q.cache_hit_ratio}%`
                              : '-'}
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
              <CardDescription>
                Top 20 queries by call count.
              </CardDescription>
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
                      {frequentQueries?.queries?.map(
                        (q: FrequentQuery, i: number) => (
                          <TableRow key={q.queryid || i}>
                            <TableCell>
                              <code className="text-xs break-all">
                                {q.query_preview}
                              </code>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatNumber(q.calls)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMs(q.mean_exec_time_ms)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMs(q.total_exec_time_ms)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(q.total_rows)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {q.cache_hit_ratio != null
                                ? `${q.cache_hit_ratio}%`
                                : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      )}
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
              <CardDescription>
                Top 30 tables by total size (data + indexes).
              </CardDescription>
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
                          <TableCell className="font-mono text-sm">
                            {t.table_name}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {t.total_size}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {t.data_size}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {t.index_size}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(t.row_estimate)}
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

        {/* Unused Indexes */}
        <TabsContent value="indexes">
          <Card>
            <CardHeader>
              <CardTitle>Unused Indexes</CardTitle>
              <CardDescription>
                Non-unique indexes with fewer than 10 scans. Candidates for removal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDb ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : dbStats?.unused_indexes?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
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
                          <TableCell className="font-mono text-sm">
                            {idx.table_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {idx.index_name}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {idx.size}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge
                              variant={
                                idx.scan_count === 0 ? 'destructive' : 'secondary'
                              }
                            >
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
              <CardDescription>
                Current lock modes and active (non-idle) connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingLocks ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {/* Lock mode counts */}
                  {lockStatus?.lock_counts && lockStatus.lock_counts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Lock Modes</h4>
                      <div className="flex flex-wrap gap-2">
                        {lockStatus.lock_counts.map((lc, i) => (
                          <Badge
                            key={i}
                            variant={lc.granted ? 'outline' : 'destructive'}
                          >
                            {lc.mode}: {lc.count}
                            {!lc.granted && ' (waiting)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active connections */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Active Connections ({lockStatus?.active_connections?.length ?? 0})
                    </h4>
                    {lockStatus?.active_connections?.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No active queries.
                      </p>
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
                                <TableCell className="font-mono">
                                  {conn.pid}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{conn.state}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {conn.query_seconds != null
                                    ? `${conn.query_seconds}s`
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {conn.wait_event ?? '-'}
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs break-all">
                                    {conn.query}
                                  </code>
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
