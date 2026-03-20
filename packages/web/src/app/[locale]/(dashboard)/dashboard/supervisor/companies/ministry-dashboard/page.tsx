'use client'

/**
 * Supervisor Ministry Dashboard — Cross-zone ministry obligations (Sage ERP quality)
 *
 * 4 tabs:
 *   ESTRATÉGICO  — KPIs with gauges + fee type donut + zone recovery bar
 *   PILOTAJE     — Cross-zone table with recovery rates + stacked bar
 *   OPERACIONAL  — Top debtors (zones) + overdue alerts sorted by amount
 *   CONTRÔLE     — Compliance by zone (recovery gauges) + penalties breakdown
 */

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  DollarSign, TrendingUp, AlertTriangle, RefreshCw,
  CheckCircle2, Target, Gauge, Zap, BarChart3, ShieldAlert, XCircle,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi } from '@/modules/companies/services/api'
import type { MinistryStatsResponse, MinistryZoneStats } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

function fmtXAF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function GaugeRing({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-gray-100" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} className="transition-all duration-700" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="rotate-90 origin-center fill-gray-700" fontSize={12} fontWeight="bold">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

const FEE_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#6b7280']

export default function SupervisorMinistryDashboardPage() {
  const t = useTranslations('supervisor')
  const { toast } = useToast()

  const [data, setData] = useState<MinistryStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(true)
    companyDashboardApi.getMinistryStats()
      .then(setData)
      .catch(() => toast({ title: 'Error', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  // --- Derived data (MUST be before early returns) ---
  const { byZone, byFee, overdue, totalPenalties } = useMemo(() => {
    if (!data) return { byZone: [] as { code: string; paid: number; overdue: number; total: number; companies: number; penalties: number; recovery: number }[], byFee: [] as { fee: string; total: number; paid: number; overdue: number; penalties: number }[], overdue: [] as MinistryZoneStats[], totalPenalties: 0 }
    const zoneMap = new Map<string, { code: string; paid: number; overdue: number; total: number; companies: number; penalties: number; recovery: number }>()
    let penalties = 0
    for (const z of data.zones) {
      const code = z.zone_code || 'N/A'
      const ex = zoneMap.get(code) || { code, paid: 0, overdue: 0, total: 0, companies: 0, penalties: 0, recovery: 0 }
      ex.paid += z.paid_amount; ex.overdue += z.overdue_amount; ex.total += z.total_amount
      ex.companies += z.companies_count; ex.penalties += z.total_penalties
      zoneMap.set(code, ex)
      penalties += z.total_penalties
    }
    const zones = Array.from(zoneMap.values()).map(z => ({ ...z, recovery: z.total > 0 ? Math.round((z.paid / z.total) * 100) : 0 })).sort((a, b) => b.total - a.total)
    const feeMap = new Map<string, { fee: string; total: number; paid: number; overdue: number; penalties: number }>()
    for (const z of data.zones) {
      const ex = feeMap.get(z.fee_type) || { fee: z.fee_type, total: 0, paid: 0, overdue: 0, penalties: 0 }
      ex.total += z.total_amount; ex.paid += z.paid_amount; ex.overdue += z.overdue_amount; ex.penalties += z.total_penalties
      feeMap.set(z.fee_type, ex)
    }
    return { byZone: zones, byFee: Array.from(feeMap.values()), overdue: data.zones.filter(z => z.overdue_count > 0).sort((a, b) => b.overdue_amount - a.overdue_amount), totalPenalties: penalties }
  }, [data])

  const barOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v: unknown) => fmtXAF(Number(v)) } } },
    plugins: { legend: { position: 'top' as const, labels: { boxWidth: 10, font: { size: 11 } } } },
  }), [])

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }
  if (!data || data.zones.length === 0) {
    return <div className="p-6 text-center text-muted-foreground"><DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>{t('ministryDashboard.noData')}</p></div>
  }

  const { totals } = data

  // Charts
  const zoneRecoveryBar = {
    labels: byZone.map(z => z.code),
    datasets: [
      { label: t('ministryDashboard.paid'), data: byZone.map(z => z.paid), backgroundColor: '#22c55e', borderRadius: 4 },
      { label: t('ministryDashboard.overdue'), data: byZone.map(z => z.overdue), backgroundColor: '#ef4444', borderRadius: 4 },
    ],
  }
  const feeDonut = {
    labels: byFee.map(f => f.fee),
    datasets: [{ data: byFee.map(f => f.total), backgroundColor: FEE_COLORS.slice(0, byFee.length), borderWidth: 0 }],
  }

  // Penalties breakdown bar
  const penaltiesBar = {
    labels: byZone.filter(z => z.penalties > 0).map(z => z.code),
    datasets: [{
      label: 'Pénalités',
      data: byZone.filter(z => z.penalties > 0).map(z => z.penalties),
      backgroundColor: '#f59e0b',
      borderRadius: 4,
    }],
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-0">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('ministryDashboard.title')}</h1>
        <Button variant="outline" size="sm" onClick={() => {
          setLoading(true)
          companyDashboardApi.getMinistryStats().then(setData).catch(() => {}).finally(() => setLoading(false))
        }}><RefreshCw className="h-3.5 w-3.5 mr-1" /></Button>
      </div>

      <Tabs defaultValue="strategic" className="flex flex-col flex-1 min-h-0">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategic" className="text-xs gap-1"><Target className="h-3.5 w-3.5" />{t('ministryDashboard.tabStrategic')}</TabsTrigger>
          <TabsTrigger value="piloting" className="text-xs gap-1"><Gauge className="h-3.5 w-3.5" />{t('ministryDashboard.tabPiloting')}</TabsTrigger>
          <TabsTrigger value="operational" className="text-xs gap-1"><Zap className="h-3.5 w-3.5" />{t('ministryDashboard.tabOperational')}</TabsTrigger>
          <TabsTrigger value="control" className="text-xs gap-1"><ShieldAlert className="h-3.5 w-3.5" />Control</TabsTrigger>
        </TabsList>

        {/* ═══ ESTRATÉGICO ═══ */}
        <TabsContent value="strategic" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{t('ministryDashboard.totalAmount')}</div>
                <p className="text-2xl font-bold mt-1">{fmtXAF(totals.total_amount)}</p>
                <p className="text-[10px] text-muted-foreground">XAF</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />{t('ministryDashboard.paid')}</div>
                    <p className="text-2xl font-bold mt-1 text-green-700">{fmtXAF(totals.paid_amount)}</p>
                  </div>
                  <GaugeRing value={totals.recovery_rate_pct} max={100} color={totals.recovery_rate_pct >= 60 ? '#22c55e' : '#ef4444'} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-red-600" />{t('ministryDashboard.overdue')}</div>
                <p className="text-2xl font-bold mt-1 text-red-700">{fmtXAF(totals.overdue_amount)}</p>
                <p className="text-[10px] text-muted-foreground">{overdue.length} zones en retard</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-blue-600" />{t('ministryDashboard.recoveryRate')}</div>
                <p className={`text-2xl font-bold mt-1 ${totals.recovery_rate_pct >= 60 ? 'text-green-700' : 'text-red-700'}`}>{totals.recovery_rate_pct}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Pénalités</div>
                <p className="text-2xl font-bold mt-1 text-amber-700">{fmtXAF(totalPenalties)}</p>
                <p className="text-[10px] text-muted-foreground">XAF en pénalités</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1"><CardTitle className="text-sm">{t('ministryDashboard.byFeeType')}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <Doughnut data={feeDonut} options={{ cutout: '55%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="pb-1"><CardTitle className="text-sm">{t('ministryDashboard.recoveryByZone')}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[200px]"><Bar data={zoneRecoveryBar} options={barOptions} /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PILOTAJE ═══ */}
        <TabsContent value="piloting" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">{t('ministryDashboard.zoneBreakdown')}</CardTitle></CardHeader>
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
                    <th className="text-right p-2">Pénalités</th>
                    <th className="text-right p-2">{t('ministryDashboard.total')}</th>
                    <th className="text-right p-2 pr-3">{t('ministryDashboard.recoveryRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.zones.map((z, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2 pl-3"><Badge variant="outline" className="font-mono text-[10px]">{z.zone_code || 'N/A'}</Badge></td>
                      <td className="p-2">{z.fee_type}</td>
                      <td className="text-right p-2">{z.companies_count}</td>
                      <td className="text-right p-2">{z.obligations_count}</td>
                      <td className="text-right p-2 font-mono text-green-700">{z.paid_count}</td>
                      <td className="text-right p-2 font-mono text-red-700">{z.overdue_count}</td>
                      <td className="text-right p-2 font-mono text-amber-600">{fmtXAF(z.total_penalties)}</td>
                      <td className="text-right p-2 font-mono">{fmtXAF(z.total_amount)}</td>
                      <td className="text-right p-2 pr-3">
                        <Badge className={`text-[10px] ${z.recovery_rate_pct >= 70 ? 'bg-green-100 text-green-800' : z.recovery_rate_pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
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
        <TabsContent value="operational" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Top debtor zones */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top zones endeudadas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byZone.filter(z => z.overdue > 0).slice(0, 5).map((z, i) => (
                <div key={z.code} className="flex items-center gap-3 p-2 rounded border">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <Badge variant="outline" className="font-mono text-xs">{z.code}</Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{z.companies} empresas</span>
                      <span className="text-xs font-bold text-red-700">{fmtXAF(z.overdue)} XAF</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${z.recovery}%`, backgroundColor: z.recovery >= 60 ? '#22c55e' : z.recovery >= 30 ? '#eab308' : '#ef4444' }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono">{z.recovery}%</span>
                </div>
              ))}
              {byZone.filter(z => z.overdue > 0).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm"><CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />Sin deudas pendientes</div>
              )}
            </CardContent>
          </Card>

          {/* Overdue alerts */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" />{t('ministryDashboard.overdueZones')} ({overdue.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground"><CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" /><p className="text-sm">{t('ministryDashboard.noOverdue')}</p></div>
              ) : (
                <div className="space-y-2">
                  {overdue.map((z, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded border border-red-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{z.zone_code || 'N/A'}</Badge>
                        <span className="text-sm">{z.fee_type}</span>
                        <Badge variant="secondary" className="text-[10px]">{z.overdue_count} {t('ministryDashboard.overdueCount')}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-700">{fmtXAF(z.overdue_amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{z.companies_count} {t('ministryDashboard.companies')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CONTRÔLE ═══ */}
        <TabsContent value="control" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Recovery gauges by zone */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance par zone — Taux de recouvrement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {byZone.map(z => (
                  <div key={z.code} className="text-center">
                    <GaugeRing value={z.recovery} max={100} color={z.recovery >= 70 ? '#22c55e' : z.recovery >= 40 ? '#eab308' : '#ef4444'} size={52} />
                    <p className="text-[10px] font-mono font-semibold mt-1">{z.code}</p>
                    <p className="text-[9px] text-muted-foreground">{fmtXAF(z.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Penalties bar chart */}
          {penaltiesBar.labels.length > 0 && (
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Pénalités par zone</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <Bar data={penaltiesBar} options={{
                    responsive: true, maintainAspectRatio: false,
                    scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v: unknown) => fmtXAF(Number(v)) } } },
                    plugins: { legend: { display: false } },
                  }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomalies */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Anomalías detectadas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {totals.recovery_rate_pct < 40 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-red-500" /><span>Taux global &lt; 40% — <strong className="text-red-600">{totals.recovery_rate_pct}%</strong></span></div>
              )}
              {byZone.filter(z => z.recovery < 20).length > 0 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-red-500" /><span>{byZone.filter(z => z.recovery < 20).length} zones avec recovery &lt; 20%</span></div>
              )}
              {totalPenalties > 100_000 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-amber-500" /><span>Pénalités élevées : <strong className="text-amber-600">{fmtXAF(totalPenalties)} XAF</strong></span></div>
              )}
              {totals.recovery_rate_pct >= 40 && byZone.filter(z => z.recovery < 20).length === 0 && totalPenalties <= 100_000 && (
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">Sin anomalías detectadas</span></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
