'use client'

/**
 * Admin Companies Dashboard — Professional 4-Tab Layout
 *
 * Tab 1: ESTRATÉGICO  — KPIs macro, tendances, objectifs annuels
 * Tab 2: PILOTAJE     — Carte zones, répartition régimes, top zones
 * Tab 3: OPERACIONAL  — Alertes urgentes, actions requises, nouvelles entreprises
 * Tab 4: CONTROL      — Anomalies, conformité identifiants, qualité données
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, ShieldCheck, TrendingUp, BarChart3,
  AlertTriangle, RefreshCw, FileWarning, Target,
  Eye, Gauge, ShieldAlert, Zap,
  CheckCircle2, XCircle, MapPin,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi } from '@/modules/companies/services/api'
import DynamicGEMap from '@/modules/companies/components/DynamicGEMap'
import type { GlobalStats, ZoneStats } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const REGIME_COLORS: Record<string, string> = {
  bundle: '#22c55e',
  declarativo: '#3b82f6',
  mixto: '#a855f7',
  exento: '#6b7280',
  pendiente: '#eab308',
}

function formatXAF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function KpiCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: typeof Building2; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-2 px-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className={`h-3.5 w-3.5 ${color}`} />
          {label}
        </div>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminCompaniesDashboardPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [global, setGlobal] = useState<GlobalStats | null>(null)
  const [zones, setZones] = useState<ZoneStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [g, z] = await Promise.all([
        companyDashboardApi.getGlobalStats(),
        companyDashboardApi.getZoneStats(),
      ])
      setGlobal(g)
      setZones(z.zones)
    } catch {
      toast({ title: 'Error', description: 'Failed to load dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading || !global) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const verificationRate = global.total_companies > 0
    ? Math.round((global.verified_companies / global.total_companies) * 100)
    : 0
  const identifierCoverage = global.total_companies > 0
    ? Math.round(((global.with_nif + global.with_reg_number) / global.total_companies) * 100)
    : 0
  const totalDebt = zones.reduce((s, z) => s + z.total_debt, 0)
  const totalPaid = zones.reduce((s, z) => s + z.total_paid_amount, 0)
  const avgRecovery = zones.length > 0
    ? Math.round(zones.reduce((s, z) => s + z.recovery_rate_pct, 0) / zones.length)
    : 0

  // Chart data
  const regimeDonut = {
    labels: ['Bundle', 'Declarativo', 'Mixto', 'Exento', 'Pendiente'],
    datasets: [{
      data: [global.bundle_count, global.declarativo_count, global.mixto_count, global.exento_count, global.pendiente_count],
      backgroundColor: Object.values(REGIME_COLORS),
      borderWidth: 0,
    }],
  }

  const topZonesSorted = [...zones].sort((a, b) => b.total_companies - a.total_companies)

  const zoneBar = {
    labels: topZonesSorted.map(z => z.zone_code),
    datasets: [{
      label: t('companyDashboard.companies'),
      data: topZonesSorted.map(z => z.total_companies),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }],
  }

  const recoveryBar = {
    labels: topZonesSorted.map(z => z.zone_code),
    datasets: [{
      label: t('companyDashboard.paid'),
      data: topZonesSorted.map(z => z.total_paid_amount),
      backgroundColor: '#22c55e',
      borderRadius: 4,
    }, {
      label: t('companyDashboard.debt'),
      data: topZonesSorted.map(z => z.total_debt),
      backgroundColor: '#ef4444',
      borderRadius: 4,
    }],
  }

  const zonesWithIssues = zones.filter(z => z.recovery_rate_pct < 50 && z.total_companies > 0)
  const zonesHighDebt = [...zones].sort((a, b) => b.total_debt - a.total_debt).slice(0, 5)

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('companyDashboard.title')}
        </h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          {t('companyDashboard.refresh')}
        </Button>
      </div>

      <Tabs defaultValue="strategic" className="space-y-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategic" className="text-xs gap-1">
            <Target className="h-3.5 w-3.5" />
            {t('companyDashboard.tabStrategic')}
          </TabsTrigger>
          <TabsTrigger value="piloting" className="text-xs gap-1">
            <Gauge className="h-3.5 w-3.5" />
            {t('companyDashboard.tabPiloting')}
          </TabsTrigger>
          <TabsTrigger value="operational" className="text-xs gap-1">
            <Zap className="h-3.5 w-3.5" />
            {t('companyDashboard.tabOperational')}
          </TabsTrigger>
          <TabsTrigger value="control" className="text-xs gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            {t('companyDashboard.tabControl')}
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: ESTRATÉGICO ═══ */}
        <TabsContent value="strategic" className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard icon={Building2} label={t('companyDashboard.total')} value={global.total_companies.toLocaleString()} sub={`${global.active_companies} ${t('companyDashboard.active')}`} />
            <KpiCard icon={ShieldCheck} label={t('companyDashboard.verified')} value={`${verificationRate}%`} sub={`${global.verified_companies} / ${global.total_companies}`} color="text-green-600" />
            <KpiCard icon={TrendingUp} label={t('companyDashboard.avgRecovery')} value={`${avgRecovery}%`} sub={`${formatXAF(totalPaid)} / ${formatXAF(totalPaid + totalDebt)}`} color="text-blue-600" />
            <KpiCard icon={AlertTriangle} label={t('companyDashboard.totalDebt')} value={formatXAF(totalDebt)} color="text-red-600" />
            <KpiCard icon={MapPin} label={t('companyDashboard.zonesActive')} value={zones.filter(z => z.total_companies > 0).length} sub={`/ ${zones.length} ${t('companyDashboard.zones')}`} />
          </div>

          {/* Regime distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{t('companyDashboard.regimeDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] flex items-center justify-center">
                  <Doughnut data={regimeDonut} options={{
                    cutout: '60%', responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 6, font: { size: 11 } } } },
                  }} />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{t('companyDashboard.byZone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <Bar data={zoneBar} options={{
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    scales: { x: { grid: { display: false } }, y: { grid: { display: false } } },
                    plugins: { legend: { display: false } },
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 2: PILOTAJE ═══ */}
        <TabsContent value="piloting" className="space-y-3">
          {/* Choropleth Map */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('companyDashboard.mapTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicGEMap zones={zones} metric="recovery" height="350px" />
            </CardContent>
          </Card>

          {/* Recovery by zone */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.recoveryByZone')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <Bar data={recoveryBar} options={{
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

          {/* Zone detail table */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.zoneDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 pl-3">Zone</th>
                    <th className="text-right p-2">{t('companyDashboard.companies')}</th>
                    <th className="text-right p-2">Bundle</th>
                    <th className="text-right p-2">Decl.</th>
                    <th className="text-right p-2">{t('companyDashboard.obligations')}</th>
                    <th className="text-right p-2">{t('companyDashboard.paid')}</th>
                    <th className="text-right p-2">{t('companyDashboard.debt')}</th>
                    <th className="text-right p-2 pr-3">{t('companyDashboard.recovery')}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.zone_id} className="border-b hover:bg-muted/30">
                      <td className="p-2 pl-3">
                        <Badge variant="outline" className="font-mono text-[10px]">{z.zone_code}</Badge>
                        <span className="ml-1.5 text-muted-foreground">{z.zone_name}</span>
                      </td>
                      <td className="text-right p-2 font-medium">{z.total_companies}</td>
                      <td className="text-right p-2">{z.bundle_count}</td>
                      <td className="text-right p-2">{z.declarativo_count}</td>
                      <td className="text-right p-2 font-mono">{z.total_obligations_amount > 0 ? formatXAF(z.total_obligations_amount) : '-'}</td>
                      <td className="text-right p-2 font-mono text-green-700">{z.total_paid_amount > 0 ? formatXAF(z.total_paid_amount) : '-'}</td>
                      <td className="text-right p-2 font-mono text-red-700">{z.total_debt > 0 ? formatXAF(z.total_debt) : '-'}</td>
                      <td className="text-right p-2 pr-3">
                        <Badge className={z.recovery_rate_pct >= 80 ? 'bg-green-100 text-green-800' : z.recovery_rate_pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
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

        {/* ═══ TAB 3: OPERACIONAL ═══ */}
        <TabsContent value="operational" className="space-y-3">
          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Zones with low recovery */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {t('companyDashboard.lowRecoveryZones')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {zonesWithIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    <CheckCircle2 className="h-5 w-5 inline mr-1 text-green-600" />
                    {t('companyDashboard.noAlerts')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {zonesWithIssues.map(z => (
                      <div key={z.zone_id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div>
                          <Badge variant="outline" className="font-mono text-xs">{z.zone_code}</Badge>
                          <span className="ml-2 text-sm">{z.zone_name}</span>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-100 text-red-800 text-xs">{z.recovery_rate_pct}%</Badge>
                          <p className="text-[10px] text-red-600">{formatXAF(z.total_debt)} {t('companyDashboard.debt')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top debtors by zone */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  {t('companyDashboard.topDebtZones')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zonesHighDebt.filter(z => z.total_debt > 0).map((z, i) => (
                    <div key={z.zone_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{z.zone_code}</Badge>
                      <div className="flex-1">
                        <Progress value={zonesHighDebt[0].total_debt > 0 ? (z.total_debt / zonesHighDebt[0].total_debt) * 100 : 0} className="h-2" />
                      </div>
                      <span className="text-xs font-mono text-red-700 shrink-0">{formatXAF(z.total_debt)}</span>
                    </div>
                  ))}
                  {zonesHighDebt.every(z => z.total_debt === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      <CheckCircle2 className="h-5 w-5 inline mr-1 text-green-600" />
                      {t('companyDashboard.noDebt')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending verification */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-yellow-600" />
                {t('companyDashboard.pendingVerification')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {zones.filter(z => z.pending_verification > 0).map(z => (
                  <div key={z.zone_id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Badge variant="outline" className="font-mono text-xs">{z.zone_code}</Badge>
                    <span className="font-bold text-yellow-800">{z.pending_verification}</span>
                    <span className="text-xs text-muted-foreground">{t('companyDashboard.pending')}</span>
                  </div>
                ))}
                {zones.every(z => z.pending_verification === 0) && (
                  <p className="col-span-4 text-sm text-muted-foreground text-center py-3">
                    <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                    {t('companyDashboard.allVerified')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: CONTROL ═══ */}
        <TabsContent value="control" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* NIF Coverage */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">NIF {t('companyDashboard.coverage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold">{global.with_nif}</p>
                  <p className="text-xs text-muted-foreground">/ {global.total_companies}</p>
                  <Progress value={global.total_companies > 0 ? (global.with_nif / global.total_companies) * 100 : 0} className="h-2 mt-3" />
                </div>
              </CardContent>
            </Card>

            {/* PE-XXXX Coverage */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">PE-XXXX {t('companyDashboard.coverage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold">{global.with_reg_number}</p>
                  <p className="text-xs text-muted-foreground">/ {global.total_companies}</p>
                  <Progress value={global.total_companies > 0 ? (global.with_reg_number / global.total_companies) * 100 : 0} className="h-2 mt-3" />
                </div>
              </CardContent>
            </Card>

            {/* Missing identifiers */}
            <Card className={global.missing_identifier > 0 ? 'border-red-200' : ''}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  {global.missing_identifier > 0 ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {t('companyDashboard.missingId')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <p className={`text-3xl font-bold ${global.missing_identifier > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {global.missing_identifier}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('companyDashboard.missingIdDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone coverage */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.zoneCoverage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{global.with_zone} / {global.total_companies}</span>
                <span className="text-xs text-muted-foreground">({global.total_companies > 0 ? Math.round((global.with_zone / global.total_companies) * 100) : 0}%)</span>
              </div>
              <Progress value={global.total_companies > 0 ? (global.with_zone / global.total_companies) * 100 : 0} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {t('companyDashboard.zoneCoverageDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Identifier coverage rate */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.identifierRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">{identifierCoverage}%</p>
                  <p className="text-xs text-muted-foreground">{t('companyDashboard.withIdentifier')}</p>
                </div>
                <Progress value={identifierCoverage} className="h-4 flex-[2]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
