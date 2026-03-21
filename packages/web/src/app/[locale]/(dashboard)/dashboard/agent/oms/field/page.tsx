'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Activity, ClipboardCheck, QrCode, AlertTriangle, DollarSign, CheckCircle2, XCircle, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { inspectionApi } from '@/modules/inspections/services/api'
import { INSPECTION_STATUS_CONFIG, fmtXAF } from '@/modules/inspections/utils/formatters'
import type { InspectionStats, InspectionListItem } from '@/modules/inspections/types'

export default function FieldDashboardPage() {
  const locale = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<InspectionStats | null>(null)
  const [recent, setRecent] = useState<InspectionListItem[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsData, listData] = await Promise.all([
        inspectionApi.getStats({ date_from: today, date_to: today }),
        inspectionApi.list({ inspection_date: today, page: 1, page_size: 10 }),
      ])
      setStats(statsData)
      setRecent(listData.items)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [today, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const statCards = [
    { label: 'Inspecciones hoy', value: stats?.total ?? 0, icon: ClipboardCheck, color: 'text-blue-600' },
    { label: 'Conformes', value: stats?.conforme ?? 0, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'No conformes', value: stats?.non_conforme ?? 0, icon: XCircle, color: 'text-red-600' },
    { label: 'Cobrado', value: fmtXAF(stats?.total_collected_amount ?? 0, locale), icon: DollarSign, color: 'text-amber-600' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">Control Terrain</h1>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => router.push(`/${locale}/dashboard/agent/oms/field/scan`)}
          >
            <QrCode className="h-5 w-5" />
            Nueva Inspección
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => router.push(`/${locale}/dashboard/agent/oms/field/reconcile`)}
          >
            <Wallet className="h-5 w-5" />
            Reconciliación
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {stats && stats.mise_en_demeure > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {stats.mise_en_demeure} mise(s) en demeure activa(s)
            </span>
          </CardContent>
        </Card>
      )}

      {/* Recent inspections */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inspecciones de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ninguna inspección realizada hoy. Pulse &quot;Nueva Inspección&quot; para comenzar.
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((item) => {
                const statusCfg = INSPECTION_STATUS_CONFIG[item.status]
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/${locale}/dashboard/agent/oms/field/inspect?id=${item.id}`)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.company_name}</span>
                      <span className="text-xs text-muted-foreground">{item.company_nif}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.unpaid_obligations_count > 0 && (
                        <span className="text-xs text-red-600 font-medium">
                          {fmtXAF(item.unpaid_obligations_amount, locale)}
                        </span>
                      )}
                      <Badge className={`${statusCfg.bgColor} ${statusCfg.color} text-xs`}>
                        {statusCfg.label}
                      </Badge>
                    </div>
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
