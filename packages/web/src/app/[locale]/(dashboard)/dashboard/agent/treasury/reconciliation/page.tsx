/**
 * Treasury Reconciliation Page
 * Match bank transactions (from BANGE webhooks) with system payments
 */

'use client';

import { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Link2,
  CheckCircle2,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useUnreconciledTransactions, useReconcileTransaction } from '@/modules/treasury/hooks';
import type { BankTransaction } from '@/modules/treasury/types';

export default function TreasuryReconciliationPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Reconciliation dialog
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [isReconcileDialogOpen, setIsReconcileDialogOpen] = useState(false);

  // Data fetching
  const { data: transactionsData, isLoading, error, refetch } = useUnreconciledTransactions();

  // Reconcile mutation
  const reconcileMutation = useReconcileTransaction();
  const isReconciling = reconcileMutation.isPending;

  // Filter transactions by search term
  const filteredTransactions = useMemo(() => {
    // Extract transactions array inside useMemo to avoid dependency issues
    const transactions = transactionsData?.transactions || [];
    if (!searchTerm) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter((tx: BankTransaction) =>
      tx.bankReference.toLowerCase().includes(term) ||
      tx.accountHolderName?.toLowerCase().includes(term) ||
      tx.accountNumber?.includes(term)
    );
  }, [transactionsData?.transactions, searchTerm]);

  const formatCurrency = (amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openReconcileDialog = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setPaymentReference('');
    setIsReconcileDialogOpen(true);
  };

  const handleReconcile = async () => {
    if (!selectedTransaction || !paymentReference.trim()) return;

    await reconcileMutation.mutateAsync({
      bankTransactionId: selectedTransaction.id,
      paymentId: paymentReference.trim(),
    });

    setIsReconcileDialogOpen(false);
    setSelectedTransaction(null);
    setPaymentReference('');
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

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 py-4">
          <Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">{t('reconciliationPage.infoTitle')}</p>
            <p className="text-sm text-blue-700">
              {t('reconciliationPage.infoDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('reconciliationPage.loadError')}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('reconciliationPage.searchTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('reconciliationPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t('reconciliationPage.tableTitle')}
            {filteredTransactions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredTransactions.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('reconciliationPage.tableDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">{t('reconciliationPage.allReconciled')}</h3>
              <p className="text-muted-foreground">
                {t('reconciliationPage.allReconciledDescription')}
              </p>
            </div>
          ) : (
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
                  {filteredTransactions.map((tx: BankTransaction) => (
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
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tx.createdAt)}
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
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Dialog */}
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

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Payment Reference Input */}
              <div className="space-y-2">
                <Label htmlFor="paymentRef">{t('reconciliationPage.dialog.paymentReferenceLabel')} *</Label>
                <Input
                  id="paymentRef"
                  placeholder={t('reconciliationPage.dialog.paymentReferencePlaceholder')}
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t('reconciliationPage.dialog.paymentReferenceHint')}
                </p>
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
              disabled={isReconciling || !paymentReference.trim()}
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
