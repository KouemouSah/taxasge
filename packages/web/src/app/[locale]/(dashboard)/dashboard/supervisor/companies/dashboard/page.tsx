'use client'

/**
 * Supervisor Site Dashboard — Zone-filtered company management (Sage ERP quality)
 *
 * 4 tabs:
 *   ESTRATÉGICO  — KPIs with gauges + regime donut + monthly trend line
 *   PILOTAJE     — Company list with advanced filters + compliance sparkline
 *   OPERACIONAL  — Alerts (overdue, unverified) + priority actions
 *   CONTROL      — Verification rate, identifier coverage, anomalies
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Building2, ShieldCheck, TrendingUp, AlertTriangle,
  RefreshCw, CheckCircle2, Clock, Search, Target,
  ChevronLeft, ChevronRight, Gauge, Zap, ShieldAlert, MapPin,
  FileText, Eye, XCircle,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi, companiesSupervisorApi } from '@/modules/companies/services/api'
import type { ZoneStats, CompanyAdminListResponse, CompanyAnalytics } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler)

const REGIME_COLORS: Record<string, string> = {
  bundle: '#22c55e', declarativo: '#3b82f6',
  exento: '#6b7280', pendiente: '#eab308',
}

function fmtXAF(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

// SVG Gauge Ring
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

export default function SupervisorSiteDashboardPage() {
  const t = useTranslations('supervisor')
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()

  const [zone, setZone] = useState<ZoneStats | null>(null)
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null)
  const [companies, setCompanies] = useState<CompanyAdminListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterRegimen, setFilterRegimen] = useState('all')
  const [filterVerified, setFilterVerified] = useState('all')
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

  const fetchCompanies = useCallback(async (p: number, q: string, regimen?: string, verified?: string) => {
    const seq = ++seqRef.current
    try {
      const res = await companiesSupervisorApi.listMyCompanies({
        page: p, pageSize: 20,
        search: q || undefined,
        regimenFiscal: regimen && regimen !== 'all' ? regimen : undefined,
        isVerified: verified && verified !== 'all' ? verified === 'true' : undefined,
      })
      if (seq === seqRef.current) setCompanies(res)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchZone(),
      fetchCompanies(1, ''),
      companyDashboardApi.getAnalytics().then(setAnalytics).catch(() => {}),
    ]).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(
      () => fetchCompanies(page, search, filterRegimen, filterVerified),
      search ? 400 : 0,
    )
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterRegimen, filterVerified])

  // --- Derived data ---
  const monthlyTrend = useMemo(() => {
    if (!analytics?.monthly_trend?.length) return null
    const labels = analytics.monthly_trend.slice(-6).map(m => m.month.slice(5))
    const created = analytics.monthly_trend.slice(-6).map(m => m.created)
    const verified = analytics.monthly_trend.slice(-6).map(m => m.verified)
    return {
      labels,
      datasets: [
        { label: 'Creadas', data: created, borderColor: '#3b82f6', backgroundColor: '#3b82f615', fill: true, tension: 0.4, pointRadius: 2 },
        { label: 'Verificadas', data: verified, borderColor: '#22c55e', backgroundColor: '#22c55e15', fill: true, tension: 0.4, pointRadius: 2 },
      ],
    }
  }, [analytics])

  const trendOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 8, font: { size: 10 } } } },
    scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { font: { size: 10 } } } },
  }), [])

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
    labels: ['Bundle', 'Declarativo', 'Exento', 'Pendiente'],
    datasets: [{
      data: [zone.bundle_count, zone.declarativo_count, zone.exento_count, zone.pendiente_count],
      backgroundColor: Object.values(REGIME_COLORS),
      borderWidth: 0,
    }],
  }

  const totalPages = companies ? Math.ceil(companies.total / companies.page_size) || 1 : 1
  const items = companies?.items || []
  const verifiedPct = zone.total_companies > 0 ? Math.round((zone.verified_companies / zone.total_companies) * 100) : 0
  const nifCoverage = zone.total_companies > 0 ? Math.round((zone.with_nif / zone.total_companies) * 100) : 0
  const identifierCoverage = zone.total_companies > 0 ? Math.round(((zone.total_companies - zone.missing_identifier) / zone.total_companies) * 100) : 0

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-0">
      {/* Header */}
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
        <Button variant="outline" size="sm" onClick={() => { fetchZone(); fetchCompanies(page, search, filterRegimen, filterVerified) }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
        </Button>
      </div>

      <Tabs defaultValue="strategic" className="flex flex-col flex-1 min-h-0">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategic" className="text-xs gap-1"><Target className="h-3.5 w-3.5" />{t('companyDashboard.tabStrategic')}</TabsTrigger>
          <TabsTrigger value="piloting" className="text-xs gap-1"><Gauge className="h-3.5 w-3.5" />{t('companyDashboard.tabPiloting')}</TabsTrigger>
          <TabsTrigger value="operational" className="text-xs gap-1"><Zap className="h-3.5 w-3.5" />{t('companyDashboard.tabOperational')}</TabsTrigger>
          <TabsTrigger value="control" className="text-xs gap-1"><ShieldAlert className="h-3.5 w-3.5" />{t('companyDashboard.tabControl')}</TabsTrigger>
        </TabsList>

        {/* ═══ STRATÉGIQUE ═══ */}
        <TabsContent value="strategic" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* KPIs with gauges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{t('companyDashboard.total')}</div>
                    <p className="text-2xl font-bold mt-1">{zone.total_companies}</p>
                    <p className="text-[11px] text-muted-foreground">{zone.active_companies} {t('companyDashboard.active')}</p>
                  </div>
                  <GaugeRing value={zone.active_companies} max={zone.total_companies} color="#3b82f6" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-blue-600" />{t('companyDashboard.recoveryRate')}</div>
                    <p className={`text-2xl font-bold mt-1 ${zone.recovery_rate_pct >= 60 ? 'text-green-700' : 'text-red-700'}`}>{zone.recovery_rate_pct}%</p>
                  </div>
                  <GaugeRing value={zone.recovery_rate_pct} max={100} color={zone.recovery_rate_pct >= 60 ? '#22c55e' : '#ef4444'} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-red-600" />{t('companyDashboard.debt')}</div>
                <p className="text-2xl font-bold mt-1 text-red-700">{fmtXAF(zone.total_debt)}</p>
                <p className="text-[11px] text-muted-foreground">{t('companyDashboard.paid')}: {fmtXAF(zone.total_paid_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2 px-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-green-600" />{t('companyDashboard.licenses')}</div>
                <p className="text-2xl font-bold mt-1">{zone.active_licenses || 0}</p>
                <p className="text-[11px] text-muted-foreground">{t('companyDashboard.obligations')}: {fmtXAF(zone.total_obligations_amount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Donut + Trend side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">{t('companyDashboard.regimeDistribution')}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[180px] flex items-center justify-center">
                  <Doughnut data={regimeDonut} options={{ cutout: '60%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } }} />
                </div>
              </CardContent>
            </Card>
            {monthlyTrend && (
              <Card>
                <CardHeader className="pb-1"><CardTitle className="text-sm">Tendencia mensual</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <Line data={monthlyTrend} options={trendOptions} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══ PILOTAGE ═══ */}
        <TabsContent value="piloting" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={t('companyDashboard.searchCompany')} className="pl-8 h-8 text-xs" />
            </div>
            <Select value={filterRegimen} onValueChange={(v) => { setFilterRegimen(v); setPage(1) }}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Régimen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
                <SelectItem value="declarativo">Declarativo</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVerified} onValueChange={(v) => { setFilterVerified(v); setPage(1) }}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Verificación" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="true">Verificadas</SelectItem>
                <SelectItem value="false">Pendientes</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground self-center">{companies?.total ?? 0} empresas</span>
          </div>

          {/* Company table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('companyDashboard.name')}</TableHead>
                    <TableHead className="text-xs w-[90px]">NIF</TableHead>
                    <TableHead className="text-xs w-[80px]">Ciudad</TableHead>
                    <TableHead className="text-xs w-[90px]">{t('companyDashboard.regime')}</TableHead>
                    <TableHead className="text-xs w-[60px]">{t('companyDashboard.status')}</TableHead>
                    <TableHead className="text-xs w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">{t('companyDashboard.noCompanies')}</TableCell>
                    </TableRow>
                  ) : items.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/${locale}/dashboard/admin/companies/${c.id}`)}>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.legal_name}</TableCell>
                      <TableCell className="text-xs font-mono">{c.nif || '-'}</TableCell>
                      <TableCell className="text-xs">{c.city_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]" style={{
                          borderColor: REGIME_COLORS[c.regimen_fiscal ?? 'pendiente'],
                          color: REGIME_COLORS[c.regimen_fiscal ?? 'pendiente'],
                        }}>{c.regimen_fiscal || 'pendiente'}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.is_verified ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-yellow-600" />}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => router.push(`/${locale}/dashboard/admin/companies/${c.id}`)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs">{page}/{totalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ OPERACIONAL ═══ */}
        <TabsContent value="operational" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Alert cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {zone.pending_verification > 0 && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-3 pb-2 px-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">{zone.pending_verification} sin verificar</p>
                      <p className="text-[11px] text-yellow-600">{t('companyDashboard.pendingVerificationAlert')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {zone.total_debt > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-3 pb-2 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">{fmtXAF(zone.total_debt)} XAF</p>
                      <p className="text-[11px] text-red-600">Deuda pendiente en zona {zone.zone_code}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {zone.missing_identifier > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-3 pb-2 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">{zone.missing_identifier} sin identificador</p>
                      <p className="text-[11px] text-orange-600">Empresas sin NIF ni N° registro</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Priority actions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Acciones prioritarias</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {zone.recovery_rate_pct < 40 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded border border-red-100">
                  <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Tasa de recuperación crítica: {zone.recovery_rate_pct}%</p>
                    <p className="text-[10px] text-muted-foreground">Objetivo: 70%. Revisar empresas con deuda.</p>
                  </div>
                </div>
              )}
              {zone.pendiente_count > 0 && (
                <div className="flex items-center gap-3 p-2 bg-amber-50 rounded border border-amber-100">
                  <Gauge className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{zone.pendiente_count} empresas en régimen pendiente</p>
                    <p className="text-[10px] text-muted-foreground">Necesitan clasificación fiscal.</p>
                  </div>
                </div>
              )}
              {zone.pending_verification > 0 && (
                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border border-yellow-100">
                  <ShieldCheck className="h-4 w-4 text-yellow-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{zone.pending_verification} empresas por verificar</p>
                    <p className="text-[10px] text-muted-foreground">Documentación pendiente de revisión.</p>
                  </div>
                </div>
              )}
              {zone.recovery_rate_pct >= 40 && zone.pendiente_count === 0 && zone.pending_verification === 0 && (
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-xs font-medium text-green-800">Sin acciones prioritarias pendientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CONTROL ═══ */}
        <TabsContent value="control" className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* 5 compliance gauges */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">{t('companyDashboard.verificationRate')}</p>
                <GaugeRing value={zone.verified_companies} max={zone.total_companies} color={verifiedPct >= 80 ? '#22c55e' : verifiedPct >= 50 ? '#eab308' : '#ef4444'} size={64} />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.verified_companies}/{zone.total_companies}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">{t('companyDashboard.recoveryRate')}</p>
                <GaugeRing value={zone.recovery_rate_pct} max={100} color={zone.recovery_rate_pct >= 70 ? '#22c55e' : zone.recovery_rate_pct >= 40 ? '#eab308' : '#ef4444'} size={64} />
                <p className="text-[11px] text-muted-foreground mt-1">{fmtXAF(zone.total_paid_amount)} / {fmtXAF(zone.total_obligations_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">Cobertura NIF</p>
                <GaugeRing value={zone.with_nif} max={zone.total_companies} color={nifCoverage >= 80 ? '#22c55e' : '#eab308'} size={64} />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.with_nif}/{zone.total_companies}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">Identificadores</p>
                <GaugeRing value={zone.total_companies - zone.missing_identifier} max={zone.total_companies} color={identifierCoverage >= 90 ? '#22c55e' : '#eab308'} size={64} />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.missing_identifier} sin ID</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">{t('companyDashboard.bundleRate')}</p>
                <GaugeRing value={zone.bundle_count} max={zone.total_companies} color="#0ea5e9" size={64} />
                <p className="text-[11px] text-muted-foreground mt-1">{zone.bundle_count} bundles</p>
              </CardContent>
            </Card>
          </div>

          {/* Anomalies */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Anomalías zona {zone.zone_code}</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {zone.recovery_rate_pct < 40 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-red-500" /><span>Tasa recuperación &lt; 40% — <strong className="text-red-600">{zone.recovery_rate_pct}%</strong></span></div>
              )}
              {verifiedPct < 70 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-yellow-500" /><span>Tasa verificación baja — <strong className="text-yellow-600">{verifiedPct}%</strong></span></div>
              )}
              {nifCoverage < 60 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-orange-500" /><span>Cobertura NIF insuficiente — <strong className="text-orange-600">{nifCoverage}%</strong></span></div>
              )}
              {zone.pendiente_count > 2 && (
                <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-amber-500" /><span>{zone.pendiente_count} empresas sin clasificar</span></div>
              )}
              {zone.recovery_rate_pct >= 40 && verifiedPct >= 70 && nifCoverage >= 60 && zone.pendiente_count <= 2 && (
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">Sin anomalías detectadas</span></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
