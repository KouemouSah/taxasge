'use client'

/**
 * OMS Licenses Overview — Commercial licenses scoped by ministry
 *
 * Table with stats cards, filters, badge status, PDF download.
 * Uses /licenses/ backend endpoints.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  FileCheck, Search, ChevronLeft, ChevronRight, RefreshCw,
  TrendingUp, AlertTriangle, DollarSign, Download, Eye,
  Building2, CheckCircle2, Clock, Play, XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { omsLicensesApi } from '@/modules/oms/services/api'
import type { LicenseResponse, LicenseStats } from '@/modules/oms/types'

const STATUS_BADGE: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Abierta', icon: Play },
  partial: { color: 'bg-amber-100 text-amber-800', label: 'Parcial', icon: Clock },
  overdue: { color: 'bg-red-100 text-red-800', label: 'Vencida', icon: AlertTriangle },
  complete: { color: 'bg-green-100 text-green-800', label: 'Completa', icon: CheckCircle2 },
  cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelada', icon: XCircle },
}

function fmtXAF(n: number): string {
  return new Intl.NumberFormat('es-GQ', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export default function OMSLicensesPage() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()

  const [stats, setStats] = useState<LicenseStats | null>(null)
  const [licenses, setLicenses] = useState<{ items: LicenseResponse[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const seqRef = useRef(0)
  const debounceRef = useRef<NodeJS.Timeout>()
  const PAGE_SIZE = 20

  const fetchAll = useCallback(async () => {
    const seq = ++seqRef.current
    setLoading(true)
    try {
      const [s, l] = await Promise.all([
        omsLicensesApi.getStats(),
        omsLicensesApi.list({
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          page_size: PAGE_SIZE,
        }),
      ])
      if (seq === seqRef.current) {
        setStats(s)
        setLicenses(l)
      }
    } catch {
      if (seq === seqRef.current) toast({ title: 'Error al cargar licencias', variant: 'destructive' })
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // Client-side search filter
  const filteredItems = (licenses?.items ?? []).filter(lic => {
    if (!search) return true
    const q = search.toLowerCase()
    return (lic.company_name?.toLowerCase().includes(q)) ||
           (lic.company_nif?.toLowerCase().includes(q)) ||
           (lic.zone_code?.toLowerCase().includes(q))
  })

  const totalPages = licenses ? Math.ceil(licenses.total / PAGE_SIZE) : 0
  const recoveryPct = stats && stats.total_amount > 0
    ? Math.round((stats.total_paid / stats.total_amount) * 100) : 0

  const handleDownloadPDF = async (licenseId: string) => {
    try {
      const blob = await omsLicensesApi.downloadPDF(licenseId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `licencia_${licenseId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error al descargar PDF', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Licencias Comerciales
          </h1>
          <p className="text-sm text-muted-foreground">Licencias de tu ministerio — año fiscal en curso</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3"><Skeleton className="h-14 w-full" /></Card>
          ))
        ) : stats ? (<>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total licencias</p>
                <p className="text-2xl font-bold">{stats.total_licenses}</p>
                <p className="text-[10px] text-muted-foreground">{stats.active_licenses} activas</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${stats.overdue_licenses > 0 ? 'text-red-500' : 'text-gray-300'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-700">{stats.overdue_licenses}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Deuda total</p>
                <p className="text-lg font-bold">{fmtK(stats.total_debt)} XAF</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Recuperación</p>
                <p className="text-2xl font-bold">{recoveryPct}%</p>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${recoveryPct}%`,
                      backgroundColor: recoveryPct >= 70 ? '#22c55e' : recoveryPct >= 40 ? '#eab308' : '#ef4444',
                    }} />
                </div>
              </div>
            </div>
          </Card>
        </>) : null}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar empresa, NIF, zona..." className="pl-8 h-8 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Abiertas</SelectItem>
            <SelectItem value="partial">Parciales</SelectItem>
            <SelectItem value="overdue">Vencidas</SelectItem>
            <SelectItem value="complete">Completas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{licenses?.total ?? 0} licencias</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Empresa</TableHead>
                <TableHead className="text-xs w-[80px]">NIF</TableHead>
                <TableHead className="text-xs w-[60px]">Zona</TableHead>
                <TableHead className="text-xs w-[70px]">Año</TableHead>
                <TableHead className="text-xs w-[90px] text-right">Total</TableHead>
                <TableHead className="text-xs w-[90px] text-right">Pagado</TableHead>
                <TableHead className="text-xs w-[90px] text-right">Balance</TableHead>
                <TableHead className="text-xs w-[80px]">Estado</TableHead>
                <TableHead className="text-xs w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No hay licencias</p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.map(lic => {
                const balance = lic.total_amount - lic.amount_paid
                const cfg = STATUS_BADGE[lic.status] || STATUS_BADGE.open
                return (
                  <TableRow key={lic.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/${locale}/dashboard/agent/oms/licenses/${lic.id}`)}>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[180px]">{lic.company_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{lic.company_nif || '—'}</TableCell>
                    <TableCell className="text-xs">
                      {lic.zone_code && <Badge variant="outline" className="text-[10px]">{lic.zone_code}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">{lic.fiscal_year}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{fmtXAF(lic.total_amount)}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-green-700">{fmtXAF(lic.amount_paid)}</TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      <span className={balance > 0 ? 'text-red-700' : 'text-green-700'}>{fmtXAF(balance)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] gap-1 ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver detalle"
                          onClick={() => router.push(`/${locale}/dashboard/agent/oms/licenses/${lic.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Descargar PDF"
                          onClick={() => handleDownloadPDF(lic.id)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">{licenses?.total ?? 0} licencias — Página {page}/{totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
