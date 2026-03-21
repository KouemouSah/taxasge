'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import {
  Shield, ClipboardCheck, CheckCircle2, XCircle, Lock,
  DollarSign, AlertTriangle, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { inspectionApi } from '@/modules/inspections/services/api'
import { INSPECTION_STATUS_CONFIG, fmtXAF } from '@/modules/inspections/utils/formatters'
import type { SupervisorDashboard } from '@/modules/inspections/types'

export default function SupervisorInspectionDashboard() {
  const locale = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('inspection')
  const [data, setData] = useState<SupervisorDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await inspectionApi.getSupervisorDashboard()
      setData(result)
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading || !data) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
      </div>
    )
  }

  const kpiCards = [
    { label: 'Hoy', value: data.today.total, icon: ClipboardCheck, color: 'text-blue-600' },
    { label: 'Conformes', value: data.today.conforme, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'No conformes', value: data.today.non_conforme, icon: XCircle, color: 'text-red-600' },
    { label: 'Scellés', value: data.today.seals_proposed + data.today.seals_approved, icon: Lock, color: 'text-purple-600' },
    { label: 'Cobrado hoy', value: fmtXAF(data.today.total_collected_amount, locale), icon: DollarSign, color: 'text-amber-600' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold">Supervisión Inspecciones</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <k.icon className={`h-6 w-6 ${k.color}`} />
              <div>
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending seals */}
        <Card className={data.pending_seals.length > 0 ? 'border-red-200' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Scellés pendientes
              </CardTitle>
              <Badge variant={data.pending_seals.length > 0 ? 'destructive' : 'secondary'}>
                {data.pending_seals.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.pending_seals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ningún scellé pendiente.</p>
            ) : (
              <div className="space-y-2">
                {data.pending_seals.slice(0, 5).map((seal) => (
                  <div key={seal.id} className="flex items-center justify-between p-2 rounded bg-red-50 text-sm">
                    <div>
                      <span className="font-medium">{seal.company_name}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {seal.agent_name} — {seal.seal_reason}
                      </span>
                    </div>
                    <span className="font-medium text-red-700">
                      {fmtXAF(seal.unpaid_obligations_amount, locale)}
                    </span>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/dashboard/supervisor/inspections/pending-seals`)}
                >
                  Ver todos ({data.pending_seals.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash + MED alerts */}
        <div className="flex flex-col gap-4">
          {data.unreconciled_cash_count > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm text-amber-800">
                    Cash non-reversé: {fmtXAF(data.unreconciled_cash_amount, locale)}
                  </p>
                  <p className="text-xs text-amber-600">
                    {data.unreconciled_cash_count} transaction(s) cette semaine
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {data.overdue_med > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm text-orange-800">
                    {data.overdue_med} MED expirée(s)
                  </p>
                  <p className="text-xs text-orange-600">
                    Action requise — proposer scellé ou renouveler
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Week stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cette semaine</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-lg font-bold">{data.week.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">
                  {data.week.total > 0
                    ? Math.round((data.week.conforme / data.week.total) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Taux conform.</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">
                  {fmtXAF(data.week.total_collected_amount, locale)}
                </p>
                <p className="text-xs text-muted-foreground">Cobrado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent inspections timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_inspections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune inspection récente.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_inspections.map((item) => {
                const statusCfg = INSPECTION_STATUS_CONFIG[item.status]
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-medium">{item.agent_name}</span>
                      <span className="text-muted-foreground">— {item.company_name}</span>
                    </div>
                    <Badge className={`${statusCfg.bgColor} ${statusCfg.color} text-xs`}>
                      {t(`status.${item.status}`)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
