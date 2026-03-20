'use client'

/**
 * OMS License Detail — Obligations, donut, timeline, actions
 *
 * Shows a single commercial license with all its obligations,
 * compliance events, donut paid/pending/overdue, and actions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  ArrowLeft, Building2, FileCheck, DollarSign,
  AlertTriangle, CheckCircle2, Clock, Download, RefreshCw,
  Play, XCircle, MapPin, Calendar,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { omsLicensesApi, omsQueueApi } from '@/modules/oms/services/api'
import type { LicenseResponse, ObligationResponse } from '@/modules/oms/types'
import { PrintHeader, PrintFooter } from '@/components/shared/PrintHeader'

ChartJS.register(ArcElement, Tooltip, Legend)

const OB_STATUS: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
  paid: { color: 'bg-emerald-100 text-emerald-800', label: 'Pagado', icon: DollarSign },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'En proceso', icon: Play },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completado', icon: CheckCircle2 },
  overdue: { color: 'bg-red-100 text-red-800', label: 'Vencido', icon: AlertTriangle },
  cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelado', icon: XCircle },
}

const LIC_STATUS: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Abierta' },
  partial: { color: 'bg-amber-100 text-amber-800', label: 'Parcial' },
  overdue: { color: 'bg-red-100 text-red-800', label: 'Vencida' },
  complete: { color: 'bg-green-100 text-green-800', label: 'Completa' },
  cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelada' },
}

function fmtXAF(n: number): string {
  return new Intl.NumberFormat('es-GQ', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

export default function LicenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const licenseId = params.id as string

  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [obligations, setObligations] = useState<ObligationResponse[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [lic, obs] = await Promise.all([
        omsLicensesApi.get(licenseId),
        omsLicensesApi.getObligations(licenseId, { page: 1 }),
      ])
      setLicense(lic)
      setObligations(obs.items)
    } catch {
      toast({ title: 'Error al cargar la licencia', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [licenseId, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Derived
  const balance = license ? license.total_amount - license.amount_paid : 0
  const recoveryPct = license && license.total_amount > 0
    ? Math.round((license.amount_paid / license.total_amount) * 100) : 0

  const paidCount = obligations.filter(o => o.status === 'paid' || o.status === 'completed').length
  const pendingCount = obligations.filter(o => o.status === 'pending' || o.status === 'processing').length
  const overdueCount = obligations.filter(o => o.status === 'overdue').length
  const totalPenalties = obligations.reduce((s, o) => s + o.penalty_amount, 0)

  // Donut
  const donutData = useMemo(() => {
    if (!obligations.length) return null
    return {
      labels: ['Pagado', 'Pendiente', 'Vencido'],
      datasets: [{
        data: [paidCount, pendingCount, overdueCount],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 0,
      }],
    }
  }, [paidCount, pendingCount, overdueCount, obligations.length])

  // Actions
  const handleProcess = async (obId: string) => {
    try {
      await omsQueueApi.processObligation(obId)
      toast({ title: 'Obligación procesada' })
      fetchAll()
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleReject = async (obId: string) => {
    const reason = window.prompt('Motivo del rechazo (min 5 caracteres):')
    if (!reason || reason.length < 5) return
    try {
      await omsQueueApi.rejectObligation(obId, { reason })
      toast({ title: 'Obligación rechazada' })
      fetchAll()
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleDownloadPDF = async () => {
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

  const licStatus = license ? (LIC_STATUS[license.status] || LIC_STATUS.open) : LIC_STATUS.open

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!license) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Licencia no encontrada</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Print layout */}
      <div className="hidden print:block p-4 max-w-2xl mx-auto">
        <PrintHeader title="Licencia Comercial" subtitle="Detalle"
          meta={[
            { label: 'Empresa', value: license.company_name || '—' },
            ...(license.company_nif ? [{ label: 'NIF', value: license.company_nif }] : []),
            { label: 'Año', value: String(license.fiscal_year) },
          ]} />
        <div className="grid grid-cols-4 gap-2 text-[9pt] my-3 bg-gray-50 p-2 rounded">
          <div><span className="font-medium">Total:</span><br/>{fmtXAF(license.total_amount)}</div>
          <div><span className="font-medium">Pagado:</span><br/>{fmtXAF(license.amount_paid)}</div>
          <div><span className="font-medium">Balance:</span><br/>{fmtXAF(balance)}</div>
          <div><span className="font-medium">Recovery:</span><br/>{recoveryPct}%</div>
        </div>
        <table className="w-full text-[8pt] border-collapse">
          <thead><tr className="border-b">
            <th className="text-left p-1">Tipo</th><th className="text-left p-1">Ministerio</th>
            <th className="text-right p-1">Monto</th>
            {totalPenalties > 0 && <th className="text-right p-1">Penalidad</th>}
            <th className="text-left p-1">Vence</th><th className="text-left p-1">Estado</th>
          </tr></thead>
          <tbody>
            {obligations.map(ob => (
              <tr key={ob.id} className="border-b">
                <td className="p-1">{ob.fee_type}</td>
                <td className="p-1 text-[7pt]">{ob.ministry_name || '—'}</td>
                <td className="text-right p-1 font-mono">{fmtXAF(ob.amount)}</td>
                {totalPenalties > 0 && <td className="text-right p-1 font-mono">{ob.penalty_amount > 0 ? fmtXAF(ob.penalty_amount) : '—'}</td>}
                <td className="p-1">{ob.due_date || '—'}</td>
                <td className="p-1">{OB_STATUS[ob.status]?.label || ob.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <PrintFooter />
      </div>

      {/* Screen content */}
      <div className="space-y-4 p-4 print:hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/dashboard/agent/oms/licenses`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold flex items-center gap-2 flex-wrap">
              <Building2 className="h-5 w-5 shrink-0" />
              <span className="truncate">{license.company_name || 'Licencia'}</span>
              <Badge className={`text-xs ${licStatus.color}`}>{licStatus.label}</Badge>
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {license.company_nif && <span className="font-mono">NIF: {license.company_nif}</span>}
              {license.zone_code && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{license.zone_code}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Año {license.fiscal_year}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleDownloadPDF}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchAll}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <p className="text-xl font-bold">{fmtXAF(license.total_amount)}</p>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Pagado</div>
            <p className="text-xl font-bold text-green-700">{fmtXAF(license.amount_paid)}</p>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Balance</div>
            <p className={`text-xl font-bold ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmtXAF(balance)}</p>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Recuperación</div>
            <p className="text-xl font-bold">{recoveryPct}%</p>
            <Progress value={recoveryPct} className="h-1.5 mt-1" />
          </Card>
          {totalPenalties > 0 && (
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Penalidades</div>
              <p className="text-xl font-bold text-amber-700">{fmtXAF(totalPenalties)}</p>
            </Card>
          )}
        </div>

        {/* Donut + Obligations summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {donutData && (
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Distribución obligaciones</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[180px] flex items-center justify-center">
                  <Doughnut data={donutData} options={{
                    cutout: '55%', responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } },
                  }} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={donutData ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Obligaciones ({obligations.length})</span>
                <div className="flex gap-2 text-[10px] font-normal">
                  <span className="text-green-600">{paidCount} pagadas</span>
                  <span className="text-yellow-600">{pendingCount} pendientes</span>
                  {overdueCount > 0 && <span className="text-red-600">{overdueCount} vencidas</span>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Ministerio</TableHead>
                    <TableHead className="text-xs w-[90px] text-right">Monto</TableHead>
                    {totalPenalties > 0 && <TableHead className="text-xs w-[80px] text-right">Penalidad</TableHead>}
                    <TableHead className="text-xs w-[80px]">Vence</TableHead>
                    <TableHead className="text-xs w-[80px]">Estado</TableHead>
                    <TableHead className="text-xs w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-sm">Sin obligaciones</TableCell></TableRow>
                  ) : obligations.map(ob => {
                    const cfg = OB_STATUS[ob.status] || OB_STATUS.pending
                    const Icon = cfg.icon
                    const canProcess = ob.status === 'processing' || ob.status === 'paid'
                    return (
                      <TableRow key={ob.id}>
                        <TableCell className="text-xs font-medium">{ob.fee_type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{ob.ministry_name || '—'}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{fmtXAF(ob.amount)}</TableCell>
                        {totalPenalties > 0 && (
                          <TableCell className="text-xs text-right font-mono text-amber-600">
                            {ob.penalty_amount > 0 ? fmtXAF(ob.penalty_amount) : '—'}
                          </TableCell>
                        )}
                        <TableCell className="text-xs">{ob.due_date || '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] gap-1 ${cfg.color}`}>
                            <Icon className="h-3 w-3" />{cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canProcess && (
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Procesar"
                                onClick={() => handleProcess(ob.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Rechazar"
                                onClick={() => handleReject(ob.id)}>
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          )}
                          {ob.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
