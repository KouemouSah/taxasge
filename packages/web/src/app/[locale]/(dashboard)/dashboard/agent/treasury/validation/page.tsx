/**
 * Treasury Validation Page
 * Lists pending payments requiring manual validation (cash/check)
 * Features:
 * - Multi-select with batch actions (validate/reject)
 * - Pagination with navigation buttons
 * - Back to dashboard navigation
 * @version 4.0.0 - Added batch actions and pagination
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { usePendingPayments, usePaymentActions, useTreasuryLocations } from '@/modules/treasury/hooks';
import {
  PaymentMethodBadge,
  WorkflowStatusBadge,
  SLABadge,
} from '@/modules/treasury/components';
import type { PendingPayment } from '@/modules/treasury/types';
import { calculateSLAStatus } from '@/modules/treasury/types';

const PAGE_SIZE = 20;

export default function TreasuryValidationPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workflow name helper using i18n
  const getWorkflowName = (code: string | undefined): string => {
    if (!code) return t('validationPage.unspecified');
    // Try to find a matching workflow name key by normalizing the code
    const normalizedKey = code.toUpperCase().replace(/[^A-Z_]/g, '');
    if (t.has(`workflowNames.${normalizedKey}`)) {
      return t(`workflowNames.${normalizedKey}`);
    }
    return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Pagination state
  const [page, setPage] = useState(1);

  // Initialize filters from URL params
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'pending_agent_review'
  );
  const [methodFilter, setMethodFilter] = useState<string>(
    searchParams.get('method') || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Treasury locations for filter dropdown
  const { data: locations } = useTreasuryLocations();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch action dialogs
  const [showBatchValidateDialog, setShowBatchValidateDialog] = useState(false);
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);
  const [batchComment, setBatchComment] = useState('');
  const [batchRejectReason, setBatchRejectReason] = useState('');

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [statusFilter, methodFilter]);

  // Data fetching with pagination
  const { data: paymentsData, isLoading, error, refetch } = usePendingPayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    method: methodFilter !== 'all' ? methodFilter : undefined,
    entityLocationId: locationFilter !== 'all' ? locationFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  // Actions
  const {
    validatePayment,
    validateBatch,
    rejectBatch,
    isValidating,
    isBatchProcessing,
  } = usePaymentActions();

  // Filter payments by search term and SLA status (client-side)
  const filteredPayments = useMemo(() => {
    const payments = paymentsData?.payments || [];
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p: PendingPayment) =>
        p.paymentReference.toLowerCase().includes(term) ||
        p.requestReference?.toLowerCase().includes(term) ||
        p.workflowCode?.toLowerCase().includes(term) ||
        getWorkflowName(p.workflowCode).toLowerCase().includes(term)
      );
    }

    // SLA filter
    if (slaFilter !== 'all') {
      filtered = filtered.filter((p: PendingPayment) => {
        const slaStatus = calculateSLAStatus(p.slaTargetDate, p.workflowStatus);
        return slaStatus === slaFilter;
      });
    }

    return filtered;
  }, [paymentsData?.payments, searchTerm, slaFilter]);

  // Pagination info
  const totalPages = Math.ceil((paymentsData?.total || 0) / PAGE_SIZE);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Selection helpers
  const pendingPayments = filteredPayments.filter(
    (p) => p.workflowStatus === 'pending_agent_review'
  );
  const allPendingSelected = pendingPayments.length > 0 &&
    pendingPayments.every((p) => selectedIds.has(p.id));
  const somePendingSelected = pendingPayments.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingPayments.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

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

  // Navigate to payment detail
  const openPaymentDetail = (paymentId: string) => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (methodFilter !== 'all') params.set('method', methodFilter);
    router.push(`/${locale}/dashboard/agent/treasury/validation/${paymentId}?${params.toString()}`);
  };

  // Navigate back to dashboard
  const goToDashboard = () => {
    router.push(`/${locale}/dashboard/agent/treasury`);
  };

  // Batch actions
  const handleBatchValidate = async () => {
    const ids = Array.from(selectedIds);
    await validateBatch.mutateAsync({ paymentIds: ids, comment: batchComment || undefined });
    setShowBatchValidateDialog(false);
    setBatchComment('');
    setSelectedIds(new Set());
  };

  const handleBatchReject = async () => {
    if (!batchRejectReason.trim()) return;
    const ids = Array.from(selectedIds);
    await rejectBatch.mutateAsync({ paymentIds: ids, reason: batchRejectReason });
    setShowBatchRejectDialog(false);
    setBatchRejectReason('');
    setSelectedIds(new Set());
  };

  // Single payment actions
  // Validation: Direct action without dialog (fast workflow)
  const handleSingleValidate = async (paymentId: string) => {
    await validatePayment.mutateAsync({ paymentId });
  };

  // Rejection: Opens dialog because reason is required
  const handleSingleReject = (paymentId: string) => {
    setSelectedIds(new Set([paymentId]));
    setShowBatchRejectDialog(true);
  };

  // Calculate total amount of selected payments
  const selectedTotalAmount = useMemo(() => {
    return filteredPayments
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [filteredPayments, selectedIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goToDashboard}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('nav.dashboard')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('validation.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('validation.description')}
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('validationPage.buttons.refresh')}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{t('validationPage.error.loadingPayments')}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('validationPage.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('validationPage.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('validationPage.filters.workflowStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('validationPage.filters.allStatuses')}</SelectItem>
                <SelectItem value="pending_agent_review">{t('validationPage.filters.pendingReview')}</SelectItem>
                <SelectItem value="completed">{t('validationPage.filters.validated')}</SelectItem>
                <SelectItem value="rejected_by_agent">{t('validationPage.filters.rejected')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('validationPage.filters.paymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('validationPage.filters.allMethods')}</SelectItem>
                <SelectItem value="cash">{t('validationPage.filters.cash')}</SelectItem>
                <SelectItem value="check">{t('validationPage.filters.check')}</SelectItem>
                <SelectItem value="bank_transfer">{t('validationPage.filters.bankTransfer')}</SelectItem>
              </SelectContent>
            </Select>

            {/* SLA Filter */}
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('validationPage.filters.slaStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('validationPage.filters.allSla')}</SelectItem>
                <SelectItem value="on_time">{t('validationPage.filters.onTime')}</SelectItem>
                <SelectItem value="warning">{t('validationPage.filters.warning')}</SelectItem>
                <SelectItem value="critical">{t('validationPage.filters.critical')}</SelectItem>
                <SelectItem value="breached">{t('validationPage.filters.breached')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            {locations && locations.length > 0 && (
              <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('validationPage.filters.location')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('validationPage.filters.allLocations')}</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.location_name} ({loc.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {statusFilter === 'pending_agent_review' ? t('validationPage.tableTitle.pending') :
               statusFilter === 'completed' ? t('validationPage.tableTitle.completed') :
               statusFilter === 'rejected_by_agent' ? t('validationPage.tableTitle.rejected') : t('validationPage.tableTitle.all')}
              {paymentsData?.total !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {paymentsData.total}
                </Badge>
              )}
            </CardTitle>

            {/* Selection Actions Bar - shows when payments are selected */}
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-2 py-0.5">
                    {selectedIds.size}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t('validationPage.selection.selected')} • {formatCurrency(selectedTotalAmount)}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-7"
                    onClick={() => setShowBatchValidateDialog(true)}
                    disabled={isBatchProcessing}
                  >
                    {isBatchProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {t('validationPage.buttons.validate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7"
                    onClick={() => setShowBatchRejectDialog(true)}
                    disabled={isBatchProcessing}
                  >
                    {isBatchProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {t('validationPage.buttons.reject')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setSelectedIds(new Set())}
                    disabled={isBatchProcessing}
                  >
                    {t('validationPage.buttons.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              /* Pagination info - shows when nothing selected */
              totalPages > 1 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t('validationPage.pagination.page', { current: page, total: totalPages })}
                </div>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">
                {statusFilter === 'pending_agent_review' ? t('validationPage.empty.noPending') : t('validationPage.empty.noResults')}
              </h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending_agent_review'
                  ? t('validationPage.empty.noPendingDescription')
                  : t('validationPage.empty.noResultsDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Checkbox column - only show for pending payments */}
                      {statusFilter === 'pending_agent_review' && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allPendingSelected}
                            onCheckedChange={toggleSelectAll}
                            aria-label={t('validationPage.table.selectAll')}
                            className={somePendingSelected && !allPendingSelected ? 'opacity-50' : ''}
                          />
                        </TableHead>
                      )}
                      <TableHead>{t('validationPage.table.reference')}</TableHead>
                      <TableHead>{t('validationPage.table.service')}</TableHead>
                      <TableHead>{t('validationPage.table.location')}</TableHead>
                      <TableHead>{t('validationPage.table.amount')}</TableHead>
                      <TableHead>{t('validationPage.table.method')}</TableHead>
                      <TableHead>{t('validationPage.table.agent')}</TableHead>
                      <TableHead>{t('validationPage.table.status')}</TableHead>
                      <TableHead>{t('validationPage.table.sla')}</TableHead>
                      <TableHead>{t('validationPage.table.date')}</TableHead>
                      <TableHead className="text-right">{t('validationPage.table.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: PendingPayment) => (
                      <TableRow
                        key={payment.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedIds.has(payment.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => openPaymentDetail(payment.id)}
                      >
                        {/* Checkbox */}
                        {statusFilter === 'pending_agent_review' && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {payment.workflowStatus === 'pending_agent_review' && (
                              <Checkbox
                                checked={selectedIds.has(payment.id)}
                                onCheckedChange={() => toggleSelect(payment.id)}
                                aria-label={t('validationPage.table.select', { reference: payment.paymentReference })}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-sm">
                          {payment.paymentReference}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {getWorkflowName(payment.workflowCode)}
                            </p>
                            {payment.requestReference && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {payment.requestReference}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.locationName || '-'}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.assignedAgentName || (
                            <span className="text-muted-foreground italic">{t('validationPage.unassigned')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <WorkflowStatusBadge status={payment.workflowStatus} />
                        </TableCell>
                        <TableCell>
                          <SLABadge
                            slaTargetDate={payment.slaTargetDate}
                            workflowStatus={payment.workflowStatus}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.submittedAt || payment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {payment.workflowStatus === 'pending_agent_review' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleValidate(payment.id);
                                  }}
                                  disabled={isValidating || isBatchProcessing}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleReject(payment.id);
                                  }}
                                  disabled={isValidating || isBatchProcessing}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentDetail(payment.id);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('validationPage.pagination.showing', { from: ((page - 1) * PAGE_SIZE) + 1, to: Math.min(page * PAGE_SIZE, paymentsData?.total || 0), total: paymentsData?.total || 0 })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!hasPrevPage || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('validationPage.pagination.previous')}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                            disabled={isLoading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={!hasNextPage || isLoading}
                    >
                      {t('validationPage.pagination.next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Batch Validate Dialog */}
      <AlertDialog open={showBatchValidateDialog} onOpenChange={setShowBatchValidateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('validationPage.dialogs.validateTitle', { count: selectedIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t('validationPage.dialogs.validateDescription', { count: selectedIds.size, amount: formatCurrency(selectedTotalAmount) })}
                </p>
                <p className="text-sm">
                  {t('validationPage.dialogs.validateInfo')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="batchComment">{t('validationPage.dialogs.validateComment')}</Label>
                  <Textarea
                    id="batchComment"
                    placeholder={t('validationPage.dialogs.validateCommentPlaceholder')}
                    value={batchComment}
                    onChange={(e) => setBatchComment(e.target.value)}
                    rows={2}
                    className="bg-background"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchProcessing}>{t('validationPage.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchValidate}
              disabled={isBatchProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('validationPage.selection.processing')}
                </>
              ) : (
                t('validationPage.dialogs.validateConfirm', { count: selectedIds.size })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Reject Dialog */}
      <AlertDialog open={showBatchRejectDialog} onOpenChange={setShowBatchRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {t('validationPage.dialogs.rejectTitle', { count: selectedIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t('validationPage.dialogs.rejectDescription', { count: selectedIds.size })}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="batchRejectReason">{t('validationPage.dialogs.rejectReason')}</Label>
                  <Textarea
                    id="batchRejectReason"
                    placeholder={t('validationPage.dialogs.rejectReasonPlaceholder')}
                    value={batchRejectReason}
                    onChange={(e) => setBatchRejectReason(e.target.value)}
                    rows={3}
                    className="bg-background"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchProcessing}>{t('validationPage.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchReject}
              disabled={isBatchProcessing || !batchRejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('validationPage.selection.processing')}
                </>
              ) : (
                t('validationPage.dialogs.rejectConfirm', { count: selectedIds.size })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
