'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search, Building2, DollarSign, AlertTriangle,
  CheckCircle2, Clock, XCircle, TrendingUp, ArrowLeft, ShieldCheck,
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
import type { CompanyDebtResponse, LookupResult } from '@/modules/companies/types'

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

  // Step 1: Search companies by NIF/name
  const [query, setQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)

  // Step 2: Selected company debt
  const [debt, setDebt] = useState<CompanyDebtResponse | null>(null)
  const [debtLoading, setDebtLoading] = useState(false)
  const [error, setError] = useState('')

  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)

  // Step 1: Lookup by NIF/name (debounced)
  const doLookup = useCallback(async (q: string) => {
    if (q.length < 2) { setLookupResults([]); return }
    const seq = ++seqRef.current
    setLookupLoading(true)
    try {
      const res = await companyMinistryApi.lookup(q)
      if (seq === seqRef.current) setLookupResults(res.results)
    } catch {
      if (seq === seqRef.current) setLookupResults([])
    } finally {
      if (seq === seqRef.current) setLookupLoading(false)
    }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setDebt(null)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doLookup(val), 300)
  }

  // Step 2: Select company → load debt
  const selectCompany = useCallback(async (companyId: string) => {
    setDebtLoading(true)
    setError('')
    try {
      const res = await companyMinistryApi.getCompanyDebt(companyId)
      setDebt(res)
      setLookupResults([])
    } catch {
      setError(t('companyDebt.error'))
    } finally {
      setDebtLoading(false)
    }
  }, [t])

  const handleBack = () => {
    setDebt(null)
    setError('')
  }

  const totals = debt?.totals

  return (
    <div className="max-w-5xl mx-auto space-y-4 h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        {debt && (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('companyDebt.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('companyDebt.subtitle')}</p>
        </div>
      </div>

      {/* Search bar — always visible */}
      {!debt && (
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t('companyDebt.searchByNif')}
            className="pl-9 h-11"
            autoFocus
          />
          {lookupLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">{error}</div>
      )}

      {/* Step 1: Lookup results — click to select */}
      {!debt && lookupResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {t('companyDebt.selectCompany')} ({lookupResults.length})
          </p>
          {lookupResults.map(c => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => selectCompany(c.id)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {c.is_verified ? (
                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.legal_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.nif && <span className="font-mono">NIF: {c.nif}</span>}
                      {c.nif && c.registration_number && <span> | </span>}
                      {c.registration_number && <span className="font-mono">{c.registration_number}</span>}
                      {c.city_name && <span> — {c.city_name}</span>}
                    </p>
                  </div>
                </div>
                <Badge className={`shrink-0 ${c.regimen_fiscal === 'bundle' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {c.regimen_fiscal || 'pendiente'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {debtLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {t('companyDebt.searching')}
        </div>
      )}

      {/* Step 2: Debt detail */}
      {debt && totals && (
        <>
          {/* Company header + KPIs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Building2 className="h-4 w-4" />
                {debt.company.legal_name}
                {debt.company.nif && (
                  <Badge variant="outline" className="font-mono text-xs">NIF: {debt.company.nif}</Badge>
                )}
                {debt.company.registration_number && (
                  <Badge variant="outline" className="font-mono text-xs">{debt.company.registration_number}</Badge>
                )}
                {debt.company.zone_code && (
                  <Badge variant="secondary" className="text-xs">{debt.company.zone_code}</Badge>
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

          {/* Obligations table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t('companyDebt.obligations')} ({totals.obligation_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {debt.obligations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {t('companyDebt.noObligations')}
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
