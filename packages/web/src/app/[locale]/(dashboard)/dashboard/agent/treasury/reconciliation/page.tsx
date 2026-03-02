/**
 * Treasury Reconciliation Page
 * Match bank transactions (from BANGE webhooks) with system payments
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Link2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Zap,
  Target,
  ChevronsUpDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnreconciledTransactions, useReconcileTransaction, useReconciliationSuggestions, useAutoMatch } from '@/modules/treasury/hooks';
import { useTreasuryStats } from '@/modules/treasury/hooks/useTreasuryStats';
import { treasuryApi } from '@/modules/treasury/services/api';
import type { BankTransaction, ReconciliationSuggestion, SearchPaymentResult } from '@/modules/treasury/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function TreasuryReconciliationPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();

  // Pagination
  const [page, setPage] = useState(1);

  // Search with debounce (C4 + M9)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reconciliation dialog state
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<SearchPaymentResult | null>(null);
  const [isReconcileDialogOpen, setIsReconcileDialogOpen] = useState(false);
  const [paymentSearchOpen, setPaymentSearchOpen] = useState(false);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  // Data fetching with server-side search (C4)
  const { data: transactionsData, isLoading, error, refetch } = useUnreconciledTransactions({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  // Global stats for KPI (M5)
  const { data: statsData } = useTreasuryStats();

  // Reconcile mutation (C2 error handling in hook)
  const reconcileMutation = useReconcileTransaction();
  const isReconciling = reconcileMutation.isPending;

  // Smart matching suggestions
  const { data: suggestionsData } = useReconciliationSuggestions();
  const autoMatchMutation = useAutoMatch();
  const suggestions = suggestionsData?.suggestions || [];
  const highConfidenceSuggestions = suggestions.filter((s: ReconciliationSuggestion) => s.bestScore >= 80);

  // Payment search for ComboBox (C3)
  const { data: searchPaymentResults } = useQuery({
    queryKey: ['reconciliation-payment-search', paymentSearchQuery, selectedTransaction?.currency],
    queryFn: () => treasuryApi.searchPaymentsForReconciliation(paymentSearchQuery, selectedTransaction?.currency),
    enabled: paymentSearchQuery.length >= 2,
    staleTime: 10 * 1000,
  });

  // Pagination computed values
  const totalTransactions = transactionsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE));
  const transactions = transactionsData?.transactions || [];

  const formatCurrency = useCallback((amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  const formatDate = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [locale]);

  const openReconcileDialog = (transaction: BankTransaction, payment?: SearchPaymentResult) => {
    setSelectedTransaction(transaction);
    setSelectedPayment(payment || null);
    setPaymentSearchQuery('');
    setPaymentSearchOpen(false);
    setIsReconcileDialogOpen(true);
  };

  const handleReconcile = async () => {
    if (!selectedTransaction || !selectedPayment) return;

    await reconcileMutation.mutateAsync({
      bankTransactionId: selectedTransaction.id,
      servicePaymentId: selectedPayment.id,
    });

    setIsReconcileDialogOpen(false);
    setSelectedTransaction(null);
    setSelectedPayment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unreconciled':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('reconciliationPage.status.unreconciled')}</Badge>;
      case 'reconciled':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('reconciliationPage.status.reconciled')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('reconciliationPage.status.failed')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // m1: Score badge colors
  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-green-600 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-gray-400 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reconciliation.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('reconciliation.description')}
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* KPI Cards (m6: loading skeleton) */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-3">
                <div className="animate-pulse flex items-center gap-3">
                  <div className="h-9 w-9 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-6 w-12 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  {/* M5: Use global stats count, not page-scoped count */}
                  <p className="text-2xl font-bold">{statsData?.unreconciledCount ?? totalTransactions}</p>
                  <p className="text-xs text-muted-foreground">{t('reconciliationPage.kpi.unreconciled')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{suggestions.length}</p>
                  <p className="text-xs text-muted-foreground">{t('reconciliationPage.kpi.suggestions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{highConfidenceSuggestions.length}</p>
                  <p className="text-xs text-muted-foreground">{t('reconciliationPage.kpi.highConfidence')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {autoMatchMutation.isSuccess ? autoMatchMutation.data.matchedCount : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('reconciliationPage.kpi.autoMatched')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('reconciliationPage.loadError')}</p>
          </CardContent>
        </Card>
      )}

      {/* Smart Matching Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  {t('reconciliationPage.suggestions.title')}
                  <Badge variant="secondary" className="ml-2">{suggestions.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {t('reconciliationPage.suggestions.description')}
                </CardDescription>
              </div>
              {highConfidenceSuggestions.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => autoMatchMutation.mutate(80)}
                  disabled={autoMatchMutation.isPending}
                >
                  {autoMatchMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('reconciliationPage.suggestions.autoReconcile', { count: highConfidenceSuggestions.length })}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {autoMatchMutation.isSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                {t('reconciliationPage.suggestions.matchedResult', { count: autoMatchMutation.data.matchedCount })}
                {autoMatchMutation.data.skippedCount > 0 && (
                  <span className="text-yellow-700 ml-2">
                    {t('reconciliationPage.suggestions.skippedResult', { count: autoMatchMutation.data.skippedCount })}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-3">
              {suggestions.slice(0, 10).map((suggestion: ReconciliationSuggestion) => (
                <div key={suggestion.transactionId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{suggestion.bankReference}</span>
                      <Badge variant="outline">{formatCurrency(suggestion.bankAmount, suggestion.bankCurrency)}</Badge>
                    </div>
                    <Badge className={cn('text-xs', getScoreBadgeClass(suggestion.bestScore))}>
                      {t('reconciliationPage.suggestions.score', { score: suggestion.bestScore })}
                    </Badge>
                  </div>
                  {suggestion.candidates.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1 ml-4">
                      {suggestion.candidates.map((c, idx) => (
                        <div key={c.paymentId} className="flex items-center gap-2 flex-wrap">
                          <span className="text-muted-foreground">#{idx + 1}</span>
                          <span className="font-mono">{c.paymentReference}</span>
                          <span>{formatCurrency(c.paymentAmount)}</span>
                          <span className="italic">{c.payerName}</span>
                          {/* m4: Translate reason strings */}
                          <Badge variant="outline" className="text-[10px] h-4">
                            {c.reasons.map((r) => t(`reconciliationPage.reasons.${r}`)).join(', ')}
                          </Badge>
                          {/* C5: Reconciliar button on each suggestion */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto h-6 text-xs"
                            onClick={() => {
                              const tx = transactions.find(
                                (tr: BankTransaction) => tr.id === suggestion.transactionId
                              );
                              const bankTx: BankTransaction = tx || {
                                id: suggestion.transactionId,
                                bankReference: suggestion.bankReference,
                                amount: suggestion.bankAmount,
                                currency: suggestion.bankCurrency,
                                bankCode: suggestion.bankCode as BankTransaction['bankCode'],
                                status: 'unreconciled' as const,
                                transactionId: suggestion.bankReference,
                                receivedAt: suggestion.bankDate,
                                createdAt: suggestion.bankDate,
                              };
                              openReconcileDialog(bankTx, {
                                id: c.paymentId,
                                paymentReference: c.paymentReference,
                                totalAmount: c.paymentAmount,
                                currency: suggestion.bankCurrency,
                                paymentMethod: c.paymentMethod,
                                paymentDate: c.paymentDate,
                                payerName: c.payerName,
                                payerEmail: '',
                              });
                            }}
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            {t('reconciliationPage.reconcileButton')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {t('reconciliationPage.tableTitle')}
                {totalTransactions > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalTransactions}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {t('reconciliationPage.tableDescription')}
              </CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('reconciliationPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            /* M4: Differentiate "all reconciled" vs "no search results" */
            debouncedSearch ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('reconciliationPage.noSearchResults')}</h3>
                <p className="text-muted-foreground">
                  {t('reconciliationPage.noSearchResultsDescription')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">{t('reconciliationPage.allReconciled')}</h3>
                <p className="text-muted-foreground">
                  {t('reconciliationPage.allReconciledDescription')}
                </p>
              </div>
            )
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reconciliationPage.table.bankReference')}</TableHead>
                      <TableHead>{t('reconciliationPage.table.accountHolder')}</TableHead>
                      <TableHead>{t('reconciliationPage.table.amount')}</TableHead>
                      <TableHead>{t('reconciliationPage.table.bank')}</TableHead>
                      <TableHead>{t('reconciliationPage.table.status')}</TableHead>
                      <TableHead>{t('reconciliationPage.table.date')}</TableHead>
                      <TableHead className="text-right">{t('reconciliationPage.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: BankTransaction) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">
                          {tx.bankReference}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.accountHolderName || 'N/A'}</p>
                            {tx.accountNumber && (
                              <p className="text-xs text-muted-foreground">
                                {tx.accountNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(tx.amount, tx.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tx.bankCode || 'BANGE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(tx.status)}
                        </TableCell>
                        {/* m8: Use bankTransactionDate over createdAt */}
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.bankTransactionDate || tx.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReconcileDialog(tx)}
                            disabled={isReconciling}
                          >
                            <Link2 className="mr-2 h-4 w-4" />
                            {t('reconciliationPage.reconcileButton')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t('reconciliationPage.pagination.showing', {
                      from: (page - 1) * PAGE_SIZE + 1,
                      to: Math.min(page * PAGE_SIZE, totalTransactions),
                      total: totalTransactions,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Dialog (C3: ComboBox replaces text input) */}
      <Dialog open={isReconcileDialogOpen} onOpenChange={setIsReconcileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              {t('reconciliationPage.dialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('reconciliationPage.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* Transaction Details */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reconciliationPage.dialog.bankReferenceLabel')}:</span>
                  <span className="font-mono">{selectedTransaction.bankReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reconciliationPage.dialog.amountLabel')}:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reconciliationPage.dialog.accountHolderLabel')}:</span>
                  <span>{selectedTransaction.accountHolderName || 'N/A'}</span>
                </div>
                {selectedTransaction.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reconciliationPage.dialog.accountNumberLabel')}:</span>
                    <span>{selectedTransaction.accountNumber}</span>
                  </div>
                )}
              </div>

              {/* Payment Search ComboBox (C3) */}
              <div className="space-y-2">
                <Label>{t('reconciliationPage.dialog.paymentReferenceLabel')} *</Label>
                {selectedPayment ? (
                  <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium">{selectedPayment.paymentReference}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPayment.payerName} — {formatCurrency(selectedPayment.totalAmount, selectedPayment.currency)}
                        </p>
                        {selectedPayment.paymentDate && (
                          <p className="text-xs text-muted-foreground">{formatDate(selectedPayment.paymentDate)}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(null)}
                      >
                        {t('reconciliationPage.dialog.changePayment')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Popover open={paymentSearchOpen} onOpenChange={setPaymentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {t('reconciliationPage.dialog.searchPayments')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t('reconciliationPage.dialog.searchPayments')}
                          value={paymentSearchQuery}
                          onValueChange={setPaymentSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {paymentSearchQuery.length < 2
                              ? t('reconciliationPage.dialog.typeToSearch')
                              : t('reconciliationPage.dialog.noPaymentsFound')
                            }
                          </CommandEmpty>
                          {(searchPaymentResults || []).map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={() => {
                                setSelectedPayment(p);
                                setPaymentSearchOpen(false);
                              }}
                              className="flex flex-col items-start gap-1 py-2"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className="font-mono text-sm font-medium">{p.paymentReference}</span>
                                <span className="ml-auto font-bold">{formatCurrency(p.totalAmount, p.currency)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {p.payerName} {p.paymentDate ? `— ${formatDate(p.paymentDate)}` : ''}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReconcileDialogOpen(false)}
              disabled={isReconciling}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReconcile}
              disabled={isReconciling || !selectedPayment}
            >
              {isReconciling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('reconciliationPage.dialog.reconciling')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('reconciliationPage.dialog.confirmButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
