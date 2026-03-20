'use client'

/**
 * OMS Compliance — Track overdue obligations by fee type
 *
 * Groups obligations by fee_type, shows recovery progress per group,
 * lists overdue companies with days late and accumulated penalties.
 * Supervisor-oriented view for monitoring compliance.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw,
  Building2, DollarSign, TrendingUp, ChevronDown, Eye, FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { omsLicensesApi } from '@/modules/oms/services/api'
import type { LicenseResponse } from '@/modules/oms/types'

function fmtXAF(n: number): string {
  return new Intl.NumberFormat('es-GQ', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

interface FeeTypeGroup {
  fee_type: string
  total_obligations: number
  paid: number
  pending: number
  overdue: number
  total_amount: number
  paid_amount: number
  overdue_amount: number
  recovery_pct: number
  overdue_companies: { company_name: string; company_nif: string | null; amount: number; penalty: number; zone: string | null; license_id: string }[]
}

export default function OMSCompliancePage() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const [groups, setGroups] = useState<FeeTypeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFee, setExpandedFee] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all licenses for current year — we'll aggregate client-side by fee_type
      const res = await omsLicensesApi.list({ fiscal_year: currentYear, page_size: 200 })

      // For each license, fetch its obligations
      const allObligations: { lic: LicenseResponse; fee_type: string; status: string; amount: number; penalty: number }[] = []

      // Batch fetch obligations for all licenses
      const obligationResults = await Promise.all(
        res.items.map(lic =>
          omsLicensesApi.getObligations(lic.id, { page: 1 }).then(r => ({ lic, obligations: r.items })).catch(() => ({ lic, obligations: [] }))
        )
      )

      for (const { lic, obligations } of obligationResults) {
        for (const ob of obligations) {
          allObligations.push({
            lic,
            fee_type: ob.fee_type,
            status: ob.status,
            amount: ob.amount,
            penalty: ob.penalty_amount,
          })
        }
      }

      // Group by fee_type
      const feeMap = new Map<string, FeeTypeGroup>()
      for (const ob of allObligations) {
        let g = feeMap.get(ob.fee_type)
        if (!g) {
          g = { fee_type: ob.fee_type, total_obligations: 0, paid: 0, pending: 0, overdue: 0, total_amount: 0, paid_amount: 0, overdue_amount: 0, recovery_pct: 0, overdue_companies: [] }
          feeMap.set(ob.fee_type, g)
        }
        g.total_obligations++
        g.total_amount += ob.amount
        if (ob.status === 'paid' || ob.status === 'completed') { g.paid++; g.paid_amount += ob.amount }
        else if (ob.status === 'overdue') {
          g.overdue++
          g.overdue_amount += ob.amount
          // Add to overdue companies if not already there
          if (!g.overdue_companies.find(c => c.license_id === ob.lic.id && c.company_name === ob.lic.company_name)) {
            g.overdue_companies.push({
              company_name: ob.lic.company_name || '—',
              company_nif: ob.lic.company_nif,
              amount: ob.amount + ob.penalty,
              penalty: ob.penalty,
              zone: ob.lic.zone_code,
              license_id: ob.lic.id,
            })
          } else {
            const existing = g.overdue_companies.find(c => c.license_id === ob.lic.id)
            if (existing) { existing.amount += ob.amount + ob.penalty; existing.penalty += ob.penalty }
          }
        } else { g.pending++ }
      }

      // Compute recovery
      Array.from(feeMap.values()).forEach(g => {
        g.recovery_pct = g.total_amount > 0 ? Math.round((g.paid_amount / g.total_amount) * 100) : 0
        g.overdue_companies.sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount)
      })

      setGroups(Array.from(feeMap.values()).sort((a, b) => b.overdue_amount - a.overdue_amount))
    } catch {
      toast({ title: 'Error al cargar datos de cumplimiento', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentYear, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const totalOverdue = groups.reduce((s, g) => s + g.overdue, 0)
  const totalOverdueAmount = groups.reduce((s, g) => s + g.overdue_amount, 0)
  const totalRecovery = (() => {
    const t = groups.reduce((s, g) => s + g.total_amount, 0)
    const p = groups.reduce((s, g) => s + g.paid_amount, 0)
    return t > 0 ? Math.round((p / t) * 100) : 0
  })()

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Cumplimiento por Tipo de Tasa
          </h1>
          <p className="text-sm text-muted-foreground">Seguimiento de obligaciones por fee_type — Año {currentYear}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${totalOverdue > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            <div>
              <p className="text-xs text-muted-foreground">Obligaciones vencidas</p>
              <p className="text-2xl font-bold text-red-700">{totalOverdue}</p>
              <p className="text-[10px] text-muted-foreground">{fmtXAF(totalOverdueAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Recuperación global</p>
              <p className="text-2xl font-bold">{totalRecovery}%</p>
              <Progress value={totalRecovery} className="h-1.5 mt-1" />
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Tipos de tasa</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fee type groups */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Analizando obligaciones...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>Sin obligaciones para este año fiscal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => {
            const isExpanded = expandedFee === g.fee_type
            return (
              <Card key={g.fee_type}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedFee(isExpanded ? null : g.fee_type)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs uppercase">{g.fee_type}</Badge>
                      <span className="text-muted-foreground font-normal">{g.total_obligations} obligaciones</span>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-green-600">{g.paid} pagadas</span>
                        <span className="text-yellow-600">{g.pending} pend.</span>
                        {g.overdue > 0 && <span className="text-red-600 font-semibold">{g.overdue} vencidas</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${g.recovery_pct >= 70 ? 'text-green-700' : g.recovery_pct >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>
                          {g.recovery_pct}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${g.recovery_pct}%`,
                            backgroundColor: g.recovery_pct >= 70 ? '#22c55e' : g.recovery_pct >= 40 ? '#eab308' : '#ef4444',
                          }} />
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Summary bar */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
                      <span>Total: <strong className="text-foreground">{fmtXAF(g.total_amount)}</strong></span>
                      <span>Pagado: <strong className="text-green-700">{fmtXAF(g.paid_amount)}</strong></span>
                      {g.overdue_amount > 0 && <span>Vencido: <strong className="text-red-700">{fmtXAF(g.overdue_amount)}</strong></span>}
                    </div>

                    {/* Overdue companies */}
                    {g.overdue_companies.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-700">Empresas con obligaciones vencidas:</p>
                        {g.overdue_companies.map((c, i) => (
                          <div key={`${c.license_id}-${i}`} className="flex items-center justify-between p-2.5 bg-red-50/50 rounded border border-red-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="h-3.5 w-3.5 text-red-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{c.company_name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  {c.company_nif && <span className="font-mono">{c.company_nif}</span>}
                                  {c.zone && <Badge variant="outline" className="text-[9px] px-1 py-0">{c.zone}</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-xs font-bold text-red-700">{fmtXAF(c.amount)}</p>
                                {c.penalty > 0 && <p className="text-[10px] text-amber-600">+{fmtXAF(c.penalty)} pen.</p>}
                              </div>
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver licencia"
                                  onClick={() => router.push(`/${locale}/dashboard/agent/oms/licenses/${c.license_id}`)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver deuda"
                                  onClick={() => router.push(`/${locale}/dashboard/agent/companies/debt`)}>
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        Sin obligaciones vencidas para este tipo
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
