'use client'

/**
 * Supervisor Site Dashboard — Zone-filtered company management
 *
 * Auto-filtered to the supervisor's assigned zone.
 * 3 tabs: Pilotage (KPIs + regime chart), Operacional (list + alerts), Control (compliance)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, ShieldCheck, TrendingUp, AlertTriangle,
  RefreshCw, CheckCircle2, Clock, Search, Target,
  ChevronLeft, ChevronRight, Gauge, Zap, ShieldAlert, MapPin,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi, companiesSupervisorApi } from '@/modules/companies/services/api'
import type { ZoneStats, CompanyAdminListResponse } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend)

const REGIME_COLORS: Record<string, string> = {
  bundle: '#22c55e', declarativo: '#3b82f6', mixto: '#a855f7',
  exento: '#6b7280', pendiente: '#eab308',
}

function formatXAF(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export default function SupervisorSiteDashboardPage() {
  const t = useTranslations('supervisor')
  const { toast } = useToast()

  const [zone, setZone] = useState<ZoneStats | null>(null)
  const [companies, setCompanies] = useState<CompanyAdminListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)

  const fetchZone = async () => {
    try {
      const res = await companyDashboardApi.getMyZoneStats()
      setZone(res.zone)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const fetchCompanies = useCallback(async (p: number, q: string) => {
    const seq = ++seqRef.current
    try {
      const res = await companiesSupervisorApi.listMyCompanies({
        page: p, pageSize: 20, search: q || undefined,
      })
      if (seq === seqRef.current) setCompanies(res)
    } catch { /* silent */ }
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchZone(), fetchCompanies(1, '')])
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search debounced, pagination immediate
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Only debounce search changes, not page changes
    const isSearchChange = search !== ''
    const delay = isSearchChange ? 400 : 0
    debounceRef.current = setTimeout(() => fetchCompanies(page, search), delay)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>{t('companyDashboard.noZoneAssigned')}</p>
      </div>
    )
  }

  const regimeDonut = {
    labels: ['Bundle', 'Declarativo', 'Mixto', 'Exento', 'Pendiente'],
    datasets: [{
      data: [zone.bundle_count, zone.declarativo_count, zone.mixto_count, zone.exento_count, zone.pendiente_count],
      backgroundColor: Object.values(REGIME_COLORS),
      borderWidth: 0,
    }],
  }

  const totalPages = companies ? Math.ceil(companies.total / companies.page_size) || 1 : 1
  const items = companies?.items || []

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-0">
      {/* Header — compact */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('companyDashboard.title')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="font-mono">{zone.zone_code}</Badge>
            <span className="text-sm text-muted-foreground">{zone.zone_name}</span>
            <Badge variant="secondary" className="text-xs">{zone.zone_tier}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchZone(); fetchCompanies(page, search) }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
        </Button>
      </div>

      <Tabs defaultValue="strategic" className="flex flex-col flex-1 min-h-0">
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

        {/* ═══ STRATÉGIQUE ═══ */}
        <TabsContent value="strategic" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{t('companyDashboard.total')}</div>
                <p className="text-2xl font-bold mt-1">{zone.total_companies}</p>
                <p className="text-[11px] text-muted-foreground">{zone.active_companies} {t('companyDashboard.active')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-blue-600" />{t('companyDashboard.recoveryRate')}</div>
                <p className={`text-2xl font-bold mt-1 ${zone.recovery_rate_pct >= 60 ? 'text-green-700' : 'text-red-700'}`}>{zone.recovery_rate_pct}%</p>
                <Progress value={zone.recovery_rate_pct} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-red-600" />{t('companyDashboard.debt')}</div>
                <p className="text-2xl font-bold mt-1 text-red-700">{formatXAF(zone.total_debt)}</p>
                <p className="text-[11px] text-muted-foreground">{t('companyDashboard.paid')}: {formatXAF(zone.total_paid_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-green-600" />{t('companyDashboard.licenses')}</div>
                <p className="text-2xl font-bold mt-1">{zone.active_licenses || 0}</p>
                <p className="text-[11px] text-muted-foreground">{t('companyDashboard.obligations')}: {formatXAF(zone.total_obligations_amount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Regime donut */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.regimeDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <Doughnut data={regimeDonut} options={{
                  cutout: '60%', responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } },
                }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PILOTAGE ═══ */}
        <TabsContent value="piloting" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{t('companyDashboard.companies')}</div>
                <p className="text-2xl font-bold mt-1">{zone.total_companies}</p>
                <p className="text-[11px] text-muted-foreground">{zone.active_companies} {t('companyDashboard.active')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-green-600" />{t('companyDashboard.licenses')}</div>
                <p className="text-2xl font-bold mt-1">{zone.active_licenses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-blue-600" />{t('companyDashboard.recoveryRate')}</div>
                <p className="text-2xl font-bold mt-1">{zone.recovery_rate_pct}%</p>
                <Progress value={zone.recovery_rate_pct} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-red-600" />{t('companyDashboard.debt')}</div>
                <p className="text-2xl font-bold mt-1 text-red-700">{formatXAF(zone.total_debt)}</p>
                <p className="text-[11px] text-muted-foreground">{t('companyDashboard.paid')}: {formatXAF(zone.total_paid_amount)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{t('companyDashboard.regimeDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <Doughnut data={regimeDonut} options={{
                  cutout: '60%', responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } },
                }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ OPERACIONAL ═══ */}
        <TabsContent value="operational" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Alerts */}
          {zone.pending_verification > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm"><strong>{zone.pending_verification}</strong> {t('companyDashboard.pendingVerificationAlert')}</span>
            </div>
          )}

          {/* Company list */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">{t('companyDashboard.companyList')}</CardTitle>
                <div className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    placeholder={t('companyDashboard.searchCompany')}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('companyDashboard.name')}</TableHead>
                    <TableHead className="text-xs">NIF</TableHead>
                    <TableHead className="text-xs">{t('companyDashboard.regime')}</TableHead>
                    <TableHead className="text-xs">{t('companyDashboard.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">
                        {t('companyDashboard.noCompanies')}
                      </TableCell>
                    </TableRow>
                  ) : items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.legal_name}</TableCell>
                      <TableCell className="text-xs font-mono">{c.nif || c.registration_number || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${
                          c.regimen_fiscal === 'bundle' ? 'bg-green-100 text-green-800' :
                          c.regimen_fiscal === 'declarativo' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>{c.regimen_fiscal || 'pendiente'}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.is_verified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">{page}/{totalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CONTROL ═══ */}
        <TabsContent value="control" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('companyDashboard.verificationRate')}</p>
                <p className="text-3xl font-bold">
                  {zone.total_companies > 0 ? Math.round(((zone.total_companies - zone.pending_verification) / zone.total_companies) * 100) : 0}%
                </p>
                <Progress value={zone.total_companies > 0 ? ((zone.total_companies - zone.pending_verification) / zone.total_companies) * 100 : 0} className="h-2 mt-2" />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.pending_verification} {t('companyDashboard.pendingShort')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('companyDashboard.recoveryRate')}</p>
                <p className={`text-3xl font-bold ${zone.recovery_rate_pct >= 70 ? 'text-green-700' : zone.recovery_rate_pct >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {zone.recovery_rate_pct}%
                </p>
                <Progress value={zone.recovery_rate_pct} className="h-2 mt-2" />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {formatXAF(zone.total_paid_amount)} / {formatXAF(zone.total_obligations_amount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('companyDashboard.bundleRate')}</p>
                <p className="text-3xl font-bold">
                  {zone.total_companies > 0 ? Math.round((zone.bundle_count / zone.total_companies) * 100) : 0}%
                </p>
                <Progress value={zone.total_companies > 0 ? (zone.bundle_count / zone.total_companies) * 100 : 0} className="h-2 mt-2" />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.bundle_count} bundles / {zone.total_companies}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
