/**
 * Treasury Transactions History Page
 * Full history of all payments with filters and export
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  History,
  Download,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePendingPayments } from '@/modules/treasury/hooks';
import { PaymentMethodBadge, PaymentStatusBadge, WorkflowStatusBadge } from '@/modules/treasury/components';
import type { PendingPayment } from '@/modules/treasury/types';

interface TransactionFilters {
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export default function TreasuryTransactionsPage() {
  const t = useTranslations('treasury');

  // Filters state
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching
  const { data: paymentsData, isLoading, error, refetch } = usePendingPayments({
    status: filters.status,
    method: filters.method,
  });

  // Filter by search term
  const filteredTransactions = useMemo(() => {
    // Extract transactions array inside useMemo to avoid dependency issues
    const transactions = paymentsData?.payments || [];
    if (!searchTerm) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter((tx: PendingPayment) =>
      tx.paymentReference.toLowerCase().includes(term) ||
      tx.userName?.toLowerCase().includes(term)
    );
  }, [paymentsData?.payments, searchTerm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GQ', {
      style: 'currency',
      currency: 'XAF',
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

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export transactions');
  };

  const updateFilter = (key: keyof TransactionFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const totalPages = Math.ceil(filteredTransactions.length / filters.limit);

  // Calculate stats
  const totalAmount = filteredTransactions.reduce((sum: number, tx: PendingPayment) => sum + tx.totalAmount, 0);
  const approvedCount = filteredTransactions.filter((tx: PendingPayment) => tx.workflowStatus === 'approved_by_agent').length;
  const rejectedCount = filteredTransactions.filter((tx: PendingPayment) => tx.workflowStatus === 'rejected_by_agent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('transactions.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('transactions.export')}
          </Button>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('transactions.loadError')}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            {t('common.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('transactions.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.filters.statusAll')}</SelectItem>
                <SelectItem value="pending">{t('transactions.filters.pending')}</SelectItem>
                <SelectItem value="completed">{t('transactions.filters.completed')}</SelectItem>
                <SelectItem value="failed">{t('transactions.filters.failed')}</SelectItem>
                <SelectItem value="refunded">{t('transactions.filters.refunded')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select
              value={filters.method || 'all'}
              onValueChange={(v) => updateFilter('method', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.filters.method')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.filters.methodAll')}</SelectItem>
                <SelectItem value="cash">{t('transactions.filters.cash')}</SelectItem>
                <SelectItem value="mobile_money">{t('transactions.filters.mobile_money')}</SelectItem>
                <SelectItem value="bank_transfer">{t('transactions.filters.bank_transfer')}</SelectItem>
                <SelectItem value="card">{t('transactions.filters.card')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range - Placeholder */}
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              {t('transactions.dateRange')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">{t('transactions.stats.total')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">{t('transactions.stats.totalAmount')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">{t('transactions.stats.approved')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-xs text-muted-foreground">{t('transactions.stats.rejected')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('transactions.title')}
            <Badge variant="secondary" className="ml-2">
              {filteredTransactions.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t('transactions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('transactions.noRecords')}</h3>
              <p className="text-muted-foreground">
                {t('transactions.noRecordsDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transactions.table.reference')}</TableHead>
                      <TableHead>{t('transactions.table.citizen')}</TableHead>
                      <TableHead>{t('transactions.table.amount')}</TableHead>
                      <TableHead>{t('transactions.table.method')}</TableHead>
                      <TableHead>{t('transactions.table.paymentStatus')}</TableHead>
                      <TableHead>{t('transactions.table.workflowStatus')}</TableHead>
                      <TableHead>{t('transactions.table.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions
                      .slice((filters.page - 1) * filters.limit, filters.page * filters.limit)
                      .map((tx: PendingPayment) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm">
                            {tx.paymentReference}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.userName || 'N/A'}</p>
                              {tx.serviceRequestId && (
                                <p className="text-xs text-muted-foreground">
                                  {tx.serviceRequestId}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(tx.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <PaymentMethodBadge method={tx.paymentMethod} />
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={tx.paymentStatus || tx.status} />
                          </TableCell>
                          <TableCell>
                            <WorkflowStatusBadge status={tx.workflowStatus} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(tx.submittedAt || tx.createdAt)}
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
                    {t('common.pagination.showing', {
                      from: (filters.page - 1) * filters.limit + 1,
                      to: Math.min(filters.page * filters.limit, filteredTransactions.length),
                      total: filteredTransactions.length,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={filters.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('common.pagination.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={filters.page === totalPages}
                    >
                      {t('common.pagination.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
