'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search, Building2, DollarSign, AlertTriangle,
  CheckCircle2, Clock, XCircle, TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { companyMinistryApi } from '@/modules/companies/services/api'
import type { CompanyDebtResponse } from '@/modules/companies/types'

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Pagado' },
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
  overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Vencido' },
  cancelled: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelado' },
}

function formatXAF(amount: number): string {
  return new Intl.NumberFormat('es-GQ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' XAF'
}

export default function MinistryDebtPage() {
  const t = useTranslations('agent')

  const [searchId, setSearchId] = useState('')
  const [debt, setDebt] = useState<CompanyDebtResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(async () => {
    const id = searchId.trim()
    if (!id) return
    setLoading(true)
    setError('')
    setDebt(null)
    try {
      const res = await companyMinistryApi.getCompanyDebt(id)
      setDebt(res)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      setError(msg.includes('404') ? t('companyDebt.notFound') : t('companyDebt.error'))
    } finally {
      setLoading(false)
    }
  }, [searchId, t])

  const totals = debt?.totals

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {/* Header + Search */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('companyDebt.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('companyDebt.subtitle')}</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('companyDebt.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !searchId.trim()}>
          {loading ? t('companyDebt.searching') : t('companyDebt.search')}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">{error}</div>
      )}

      {/* Company Info + Totals */}
      {debt && totals && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {debt.company.legal_name}
                {debt.company.nif && (
                  <span className="font-mono text-sm text-muted-foreground ml-2">
                    NIF: {debt.company.nif}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('companyDebt.totalDue')}</p>
                  <p className="text-lg font-bold">{formatXAF(totals.total_due)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('companyDebt.totalPaid')}</p>
                  <p className="text-lg font-bold text-green-700">{formatXAF(totals.total_paid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('companyDebt.balance')}</p>
                  <p className={`text-lg font-bold ${totals.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatXAF(totals.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('companyDebt.recoveryRate')}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold">{totals.recovery_rate_pct}%</span>
                  </div>
                  <Progress value={totals.recovery_rate_pct} className="h-2 mt-1" />
                </div>
              </div>
              {totals.total_penalties > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {t('companyDebt.penalties')}: {formatXAF(totals.total_penalties)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Obligations Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t('companyDebt.obligations')} ({totals.obligation_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('companyDebt.feeType')}</TableHead>
                    <TableHead>{t('companyDebt.year')}</TableHead>
                    <TableHead className="text-right">{t('companyDebt.amount')}</TableHead>
                    <TableHead className="text-right">{t('companyDebt.penalty')}</TableHead>
                    <TableHead>{t('companyDebt.dueDate')}</TableHead>
                    <TableHead>{t('companyDebt.status')}</TableHead>
                    <TableHead>{t('companyDebt.paidAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debt.obligations.map(ob => {
                    const cfg = STATUS_CONFIG[ob.status] || STATUS_CONFIG.pending
                    const Icon = cfg.icon
                    return (
                      <TableRow key={ob.id}>
                        <TableCell className="font-medium">{ob.fee_type}</TableCell>
                        <TableCell>{ob.fiscal_year}</TableCell>
                        <TableCell className="text-right font-mono">{formatXAF(ob.amount)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {ob.penalty_amount > 0 ? formatXAF(ob.penalty_amount) : '-'}
                        </TableCell>
                        <TableCell>{ob.due_date}</TableCell>
                        <TableCell>
                          <Badge className={`${cfg.color} text-xs gap-1`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ob.paid_at ? new Date(ob.paid_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
