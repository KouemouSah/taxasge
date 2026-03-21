'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import {
  Shield, ClipboardCheck, CheckCircle2, XCircle, Lock,
  DollarSign, AlertTriangle, Clock, Wallet, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { inspectionApi } from '@/modules/inspections/services/api'
import { INSPECTION_STATUS_CONFIG, fmtXAF } from '@/modules/inspections/utils/formatters'
import type { SupervisorDashboard } from '@/modules/inspections/types'

interface FieldPayment {
  id: string
  payment_reference: string
  total_amount: number
  agent_name: string
  company_name?: string
  company_nif?: string
  entity_code: string
  fee_type?: string
  inspection_date?: string
  created_at: string
}

export default function SupervisorInspectionDashboard() {
  const locale = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('inspection')
  const [data, setData] = useState<SupervisorDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  // Reconciliation tab state
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([])
  const [fieldTotal, setFieldTotal] = useState(0)
  const [loadingField, setLoadingField] = useState(false)
  const [confirmPayment, setConfirmPayment] = useState<FieldPayment | null>(null)
  const [validating, setValidating] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const result = await inspectionApi.getSupervisorDashboard()
      setData(result)
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  const fetchFieldPayments = useCallback(async () => {
    try {
      setLoadingField(true)
      const result = await inspectionApi.getSupervisorReconciliation()
      setFieldPayments(result.items)
      setFieldTotal(result.total_amount)
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    } finally {
      setLoadingField(false)
    }
  }, [toast, t])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleValidatePayment = useCallback(async () => {
    if (!confirmPayment) return
    try {
      setValidating(true)
      const result = await inspectionApi.validateFieldReconciliation(confirmPayment.id)
      setFieldPayments(prev => prev.filter(p => p.id !== confirmPayment.id))
      setFieldTotal(prev => prev - (confirmPayment.total_amount || 0))
      setConfirmPayment(null)
      toast({
        title: 'Versement validé',
        description: `${result.routed_obligations} obligation(s) routée(s) vers les agents.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast({ title: t('common.error'), description: msg, variant: 'destructive' })
    } finally {
      setValidating(false)
    }
  }, [confirmPayment, toast, t])

  if (loading || !data) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
      </div>
    )
  }

  const kpiCards = [
    { label: t('supervisor.today'), value: data.today.total, icon: ClipboardCheck, color: 'text-blue-600' },
    { label: t('supervisor.conforme'), value: data.today.conforme, icon: CheckCircle2, color: 'text-green-600' },
    { label: t('supervisor.nonConforme'), value: data.today.non_conforme, icon: XCircle, color: 'text-red-600' },
    { label: t('supervisor.seals'), value: data.today.seals_proposed + data.today.seals_approved, icon: Lock, color: 'text-purple-600' },
    { label: t('supervisor.collectedToday'), value: fmtXAF(data.today.total_collected_amount, locale), icon: DollarSign, color: 'text-amber-600' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold">{t('supervisor.title')}</h1>
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

      {/* Tabs: Dashboard | Versements terrain | Scellés */}
      <Tabs defaultValue="dashboard" onValueChange={(v) => {
        if (v === 'field-payments') fetchFieldPayments()
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="field-payments" className="gap-1">
            <Wallet className="h-4 w-4" />
            Versements terrain
            {data.unreconciled_cash_count > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {data.unreconciled_cash_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="seals" className="gap-1">
            <Lock className="h-4 w-4" />
            Scellés
            {data.pending_seals.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {data.pending_seals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Dashboard */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.overdue_med > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm text-orange-800">
                      {data.overdue_med} {t('supervisor.overdueMed')}
                    </p>
                    <p className="text-xs text-orange-600">{t('supervisor.overdueMedAction')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('supervisor.thisWeek')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-lg font-bold">{data.week.total}</p>
                  <p className="text-xs text-muted-foreground">{t('supervisor.totalWeek')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {data.week.total > 0 ? Math.round((data.week.conforme / data.week.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t('supervisor.conformityRate')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">
                    {fmtXAF(data.week.total_collected_amount, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('supervisor.collectedWeek')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('supervisor.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recent_inspections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('supervisor.noRecentInspections')}
                </p>
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
        </TabsContent>

        {/* TAB 2: Versements terrain (double validation) */}
        <TabsContent value="field-payments" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  Versements terrain en attente de validation
                </CardTitle>
                {fieldPayments.length > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">{fmtXAF(fieldTotal, locale)}</p>
                    <p className="text-xs text-muted-foreground">{fieldPayments.length} paiement(s)</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingField ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
                </div>
              ) : fieldPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Aucun versement terrain en attente.</p>
                  <p className="text-xs mt-1">Les paiements collectés par les agents terrain apparaîtront ici.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.payment_reference}</TableCell>
                        <TableCell className="font-medium">{p.agent_name}</TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{p.company_name}</span>
                            <br />
                            <span className="text-xs text-muted-foreground">{p.company_nif}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{p.fee_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {fmtXAF(p.total_amount, locale)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.inspection_date
                            ? new Date(p.inspection_date).toLocaleDateString()
                            : new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="gap-1 min-h-[44px]"
                            onClick={() => setConfirmPayment(p)}
                            disabled={validating}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Valider
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Explanation */}
              {fieldPayments.length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Double validation :</strong> En validant, vous confirmez que l&apos;agent a bien reversé
                  le montant au Trésor. Le paiement sera alors complété et les obligations seront routées
                  vers les agents des entités concernées pour émission des documents officiels.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Scellés */}
        <TabsContent value="seals" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {t('supervisor.pendingSeals')}
                </CardTitle>
                <Badge variant={data.pending_seals.length > 0 ? 'destructive' : 'secondary'}>
                  {data.pending_seals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.pending_seals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('supervisor.noPendingSeals')}
                </p>
              ) : (
                <div className="space-y-2">
                  {data.pending_seals.map((seal) => (
                    <div key={seal.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                      <div>
                        <span className="font-medium">{seal.company_name}</span>
                        <span className="text-muted-foreground ml-2 text-sm">{seal.company_nif}</span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {seal.agent_name} — {fmtXAF(seal.unpaid_obligations_amount, locale)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 min-h-[44px]"
                        onClick={() => router.push(`/${locale}/dashboard/supervisor/inspections/pending-seals`)}
                      >
                        Gérer <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm validation dialog */}
      <AlertDialog open={!!confirmPayment} onOpenChange={() => setConfirmPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-600" />
              Confirmer le versement terrain
            </AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez-vous que l&apos;agent <strong>{confirmPayment?.agent_name}</strong> a bien
              reversé le montant au Trésor ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmPayment && (
            <div className="bg-amber-50 p-3 rounded text-sm space-y-1">
              <p><strong>Référence :</strong> {confirmPayment.payment_reference}</p>
              <p><strong>Entreprise :</strong> {confirmPayment.company_name} ({confirmPayment.company_nif})</p>
              <p><strong>Montant :</strong> <span className="font-bold text-amber-700">{fmtXAF(confirmPayment.total_amount, locale)}</span></p>
              <p><strong>Type :</strong> {confirmPayment.fee_type}</p>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
            Cette action va :
            <ul className="list-disc ml-4 mt-1">
              <li>Marquer le paiement comme validé</li>
              <li>Router les obligations vers les agents des entités</li>
              <li>Déclencher l&apos;émission des documents officiels</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleValidatePayment} disabled={validating}>
              {validating ? 'Validation...' : 'Confirmer le versement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
