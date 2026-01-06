/**
 * Treasury Reconciliation Page
 * Match bank transactions (from BANGE webhooks) with system payments
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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

  // Extract transactions array from response
  const transactions = transactionsData?.transactions || [];

  // Filter transactions by search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter((tx: BankTransaction) =>
      tx.bankReference.toLowerCase().includes(term) ||
      tx.accountHolderName?.toLowerCase().includes(term) ||
      tx.accountNumber?.includes(term)
    );
  }, [transactions, searchTerm]);

  const formatCurrency = (amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat('es-GQ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GQ', {
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Sin reconciliar</Badge>;
      case 'reconciled':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Reconciliado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
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
          Actualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 py-4">
          <Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Reconciliacion Bancaria</p>
            <p className="text-sm text-blue-700">
              Las transacciones bancarias llegan via webhook desde BANGE.
              Relacione cada transaccion con su pago correspondiente en el sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Error al cargar las transacciones</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por referencia, nombre, cuenta..."
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
            Transacciones Sin Reconciliar
            {filteredTransactions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredTransactions.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Transacciones bancarias pendientes de vincular con pagos del sistema
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
              <h3 className="text-lg font-semibold">Todo reconciliado</h3>
              <p className="text-muted-foreground">
                No hay transacciones pendientes de reconciliar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia Banco</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                          Reconciliar
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
              Reconciliar Transaccion
            </DialogTitle>
            <DialogDescription>
              Ingrese la referencia de pago del sistema para vincular con esta transaccion bancaria.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* Transaction Details */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia Banco:</span>
                  <span className="font-mono">{selectedTransaction.bankReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titular:</span>
                  <span>{selectedTransaction.accountHolderName || 'N/A'}</span>
                </div>
                {selectedTransaction.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuenta:</span>
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
                <Label htmlFor="paymentRef">Referencia de Pago *</Label>
                <Input
                  id="paymentRef"
                  placeholder="Ej: PAY-2024-000123"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ingrese la referencia del pago en el sistema TaxasGE
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
              Cancelar
            </Button>
            <Button
              onClick={handleReconcile}
              disabled={isReconciling || !paymentReference.trim()}
            >
              {isReconciling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reconciliando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Reconciliacion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
