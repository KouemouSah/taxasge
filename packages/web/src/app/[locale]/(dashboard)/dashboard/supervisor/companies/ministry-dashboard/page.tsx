'use client'

/**
 * Supervisor Ministry Dashboard — Cross-zone view of ministry's fee_type items
 *
 * Shows all zones for the supervisor's ministry obligations.
 * 3 tabs: Estratégico (KPIs + recovery), Pilotaje (zone breakdown), Operacional (overdue alerts)
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  DollarSign, TrendingUp, AlertTriangle, RefreshCw,
  CheckCircle2, Target, Gauge, Zap, MapPin, BarChart3,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi } from '@/modules/companies/services/api'
import type { MinistryStatsResponse, MinistryZoneStats } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

function formatXAF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export default function SupervisorMinistryDashboardPage() {
  const t = useTranslations('supervisor')
  const { toast } = useToast()

  const [data, setData] = useState<MinistryStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await companyDashboardApi.getMinistryStats()
      setData(res)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.zones.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>{t('ministryDashboard.noData')}</p>
      </div>
    )
  }

  const { totals, zones } = data

  // Group by zone for charts
  const byZone = new Map<string, { code: string; paid: number; overdue: number; total: number; companies: number }>()
  for (const z of zones) {
    const code = z.zone_code || 'N/A'
    const existing = byZone.get(code) || { code, paid: 0, overdue: 0, total: 0, companies: 0 }
    existing.paid += z.paid_amount
    existing.overdue += z.overdue_amount
    existing.total += z.total_amount
    existing.companies += z.companies_count
    byZone.set(code, existing)
  }
  const zoneArr = Array.from(byZone.values()).sort((a, b) => b.total - a.total)

  // Group by fee_type
  const byFee = new Map<string, { fee: string; total: number; paid: number; overdue: number }>()
  for (const z of zones) {
    const existing = byFee.get(z.fee_type) || { fee: z.fee_type, total: 0, paid: 0, overdue: 0 }
    existing.total += z.total_amount
    existing.paid += z.paid_amount
    existing.overdue += z.overdue_amount
    byFee.set(z.fee_type, existing)
  }
  const feeArr = Array.from(byFee.values())

  const overdue = zones.filter(z => z.overdue_count > 0)

  // Charts
  const zoneRecoveryBar = {
    labels: zoneArr.map(z => z.code),
    datasets: [{
      label: t('ministryDashboard.paid'),
      data: zoneArr.map(z => z.paid),
      backgroundColor: '#22c55e',
      borderRadius: 4,
    }, {
      label: t('ministryDashboard.overdue'),
      data: zoneArr.map(z => z.overdue),
      backgroundColor: '#ef4444',
      borderRadius: 4,
    }],
  }

  const feeDonut = {
    labels: feeArr.map(f => f.fee),
    datasets: [{
      data: feeArr.map(f => f.total),
      backgroundColor: ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#6b7280'],
      borderWidth: 0,
    }],
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('ministryDashboard.title')}
        </h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
        </Button>
      </div>

      <Tabs defaultValue="strategic" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategic" className="text-xs gap-1">
            <Target className="h-3.5 w-3.5" />
            {t('ministryDashboard.tabStrategic')}
          </TabsTrigger>
          <TabsTrigger value="piloting" className="text-xs gap-1">
            <Gauge className="h-3.5 w-3.5" />
            {t('ministryDashboard.tabPiloting')}
          </TabsTrigger>
          <TabsTrigger value="operational" className="text-xs gap-1">
            <Zap className="h-3.5 w-3.5" />
            {t('ministryDashboard.tabOperational')}
          </TabsTrigger>
        </TabsList>

        {/* ═══ ESTRATÉGICO ═══ */}
        <TabsContent value="strategic" className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{t('ministryDashboard.totalAmount')}</div>
                <p className="text-2xl font-bold mt-1">{formatXAF(totals.total_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />{t('ministryDashboard.paid')}</div>
                <p className="text-2xl font-bold mt-1 text-green-700">{formatXAF(totals.paid_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-red-600" />{t('ministryDashboard.overdue')}</div>
                <p className="text-2xl font-bold mt-1 text-red-700">{formatXAF(totals.overdue_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-blue-600" />{t('ministryDashboard.recoveryRate')}</div>
                <p className="text-2xl font-bold mt-1">{totals.recovery_rate_pct}%</p>
                <Progress value={totals.recovery_rate_pct} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
          </div>

          {/* Fee type distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{t('ministryDashboard.byFeeType')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <Doughnut data={feeDonut} options={{
                    cutout: '55%', responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
                  }} />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{t('ministryDashboard.recoveryByZone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <Bar data={zoneRecoveryBar} options={{
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true, grid: { display: false } },
                      y: { stacked: true, grid: { color: '#f0f0f0' } },
                    },
                    plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } },
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PILOTAJE ═══ */}
        <TabsContent value="piloting" className="space-y-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('ministryDashboard.zoneBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 pl-3">Zone</th>
                    <th className="text-left p-2">Fee Type</th>
                    <th className="text-right p-2">{t('ministryDashboard.companies')}</th>
                    <th className="text-right p-2">{t('ministryDashboard.obligations')}</th>
                    <th className="text-right p-2">{t('ministryDashboard.paid')}</th>
                    <th className="text-right p-2">{t('ministryDashboard.overdue')}</th>
                    <th className="text-right p-2">{t('ministryDashboard.total')}</th>
                    <th className="text-right p-2 pr-3">{t('ministryDashboard.recoveryRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2 pl-3">
                        <Badge variant="outline" className="font-mono text-[10px]">{z.zone_code || 'N/A'}</Badge>
                      </td>
                      <td className="p-2">{z.fee_type}</td>
                      <td className="text-right p-2">{z.companies_count}</td>
                      <td className="text-right p-2">{z.obligations_count}</td>
                      <td className="text-right p-2 font-mono text-green-700">{z.paid_count}</td>
                      <td className="text-right p-2 font-mono text-red-700">{z.overdue_count}</td>
                      <td className="text-right p-2 font-mono">{formatXAF(z.total_amount)}</td>
                      <td className="text-right p-2 pr-3">
                        <Badge className={z.recovery_rate_pct >= 70 ? 'bg-green-100 text-green-800' : z.recovery_rate_pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {z.recovery_rate_pct}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ OPERACIONAL ═══ */}
        <TabsContent value="operational" className="space-y-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {t('ministryDashboard.overdueZones')} ({overdue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm">{t('ministryDashboard.noOverdue')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdue.sort((a, b) => b.overdue_amount - a.overdue_amount).map((z, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded border border-red-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{z.zone_code || 'N/A'}</Badge>
                        <span className="text-sm">{z.fee_type}</span>
                        <Badge variant="secondary" className="text-[10px]">{z.overdue_count} {t('ministryDashboard.overdueCount')}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-700">{formatXAF(z.overdue_amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{z.companies_count} {t('ministryDashboard.companies')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
