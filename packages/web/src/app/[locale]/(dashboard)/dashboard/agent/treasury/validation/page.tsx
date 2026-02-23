/**
 * Treasury Validation Page — Split View
 * Left panel: compact payment list with filters + batch actions
 * Right panel: payment detail + inline actions
 * Mobile: list only, click navigates to [paymentId] detail page
 *
 * @version 5.0.0 - Split view layout
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Package,
  CreditCard,
} from 'lucide-react';
import { usePendingPayments, usePaymentActions, useTreasuryLocations } from '@/modules/treasury/hooks';
import {
  PaymentMethodBadge,
  WorkflowStatusBadge,
  SLABadge,
  PaymentDetailPanel,
} from '@/modules/treasury/components';
import type { PendingPayment } from '@/modules/treasury/types';
import { calculateSLAStatus } from '@/modules/treasury/types';

const PAGE_SIZE = 20;

// =============================================================================
// COMPACT LIST ITEM
// =============================================================================

function PaymentListItem({
  payment,
  isSelected,
  isChecked,
  showCheckbox,
  onClick,
  onCheck,
  getWorkflowName,
}: {
  payment: PendingPayment;
  isSelected: boolean;
  isChecked: boolean;
  showCheckbox: boolean;
  onClick: () => void;
  onCheck: () => void;
  getWorkflowName: (code: string | undefined) => string;
}) {
  const isLongWait = (payment.hoursWaiting ?? 0) > 8;
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('es-GQ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount);

  const formatWaiting = (hours: number | undefined): string => {
    if (!hours) return '';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`p-3 border-b cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent border-l-4 border-l-primary'
          : isLongWait
          ? 'bg-yellow-50/50 hover:bg-yellow-50'
          : 'hover:bg-accent/50'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        {showCheckbox && payment.workflowStatus === 'pending_agent_review' && (
          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isChecked}
              onCheckedChange={onCheck}
              className="h-4 w-4"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Reference + Amount */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-mono font-medium truncate">
                {payment.paymentReference}
              </span>
              {payment.batchReference && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0 border-blue-300 text-blue-700 bg-blue-50">
                  <Package className="h-2.5 w-2.5 mr-0.5" />
                  {payment.batchReference}
                </Badge>
              )}
            </div>
            <span className="text-sm font-bold whitespace-nowrap">
              {formatAmount(payment.totalAmount)} XAF
            </span>
          </div>

          {/* Row 2: Workflow + request ref */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground truncate">
              {getWorkflowName(payment.workflowCode)}
            </span>
            {payment.userName && (
              <span className="text-xs text-muted-foreground truncate ml-2">
                {payment.userName}
              </span>
            )}
          </div>

          {/* Row 3: Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <PaymentMethodBadge method={payment.paymentMethod} />
            <WorkflowStatusBadge status={payment.workflowStatus} />
            <SLABadge
              slaTargetDate={payment.slaTargetDate}
              workflowStatus={payment.workflowStatus}
            />
            {payment.hoursWaiting != null && payment.hoursWaiting > 0 && (
              <span className={`text-[10px] flex items-center gap-0.5 ${
                isLongWait ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                <Clock className="h-2.5 w-2.5" />
                {formatWaiting(payment.hoursWaiting)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function TreasuryValidationPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workflow name helper
  const getWorkflowName = useCallback((code: string | undefined): string => {
    if (!code) return t('validationPage.unspecified');
    const normalizedKey = code.toUpperCase().replace(/[^A-Z_]/g, '');
    if (t.has(`workflowNames.${normalizedKey}`)) {
      return t(`workflowNames.${normalizedKey}`);
    }
    return code.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }, [t]);

  // Pagination state
  const [page, setPage] = useState(1);

  // Filters from URL
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'pending_agent_review'
  );
  const [methodFilter, setMethodFilter] = useState<string>(
    searchParams.get('method') || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Treasury locations
  const { data: locations } = useTreasuryLocations();

  // Selection state (batch actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Split view: selected payment for right panel
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Batch action dialogs
  const [showBatchValidateDialog, setShowBatchValidateDialog] = useState(false);
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);
  const [batchComment, setBatchComment] = useState('');
  const [batchRejectReason, setBatchRejectReason] = useState('');

  // Escalation dialog (for batch escalate from list)
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalatePaymentId, setEscalatePaymentId] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateLevel, setEscalateLevel] = useState<string>('medium');

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
    setSelectedPaymentId(null);
  }, [statusFilter, methodFilter]);

  // Data fetching
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
    rejectPayment,
    escalatePayment,
    validateBatch,
    rejectBatch,
    isValidating,
    isRejecting,
    isEscalating,
    isBatchProcessing,
  } = usePaymentActions();

  // Client-side filters (search + SLA)
  const filteredPayments = useMemo(() => {
    const payments = paymentsData?.payments || [];
    let filtered = payments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p: PendingPayment) =>
        p.paymentReference.toLowerCase().includes(term) ||
        p.requestReference?.toLowerCase().includes(term) ||
        p.workflowCode?.toLowerCase().includes(term) ||
        p.userName?.toLowerCase().includes(term)
      );
    }

    if (slaFilter !== 'all') {
      filtered = filtered.filter((p: PendingPayment) => {
        const slaStatus = calculateSLAStatus(p.slaTargetDate, p.workflowStatus);
        return slaStatus === slaFilter;
      });
    }

    return filtered;
  }, [paymentsData?.payments, searchTerm, slaFilter]);

  // Pagination
  const totalPages = Math.ceil((paymentsData?.total || 0) / PAGE_SIZE);

  // Selected payment object
  const selectedPayment = useMemo(() => {
    if (!selectedPaymentId) return null;
    return filteredPayments.find((p) => p.id === selectedPaymentId) || null;
  }, [filteredPayments, selectedPaymentId]);

  // Auto-select first item if nothing selected and data loads
  useEffect(() => {
    if (!selectedPaymentId && filteredPayments.length > 0) {
      setSelectedPaymentId(filteredPayments[0].id);
    }
  }, [filteredPayments, selectedPaymentId]);

  // Navigation for detail panel
  const selectedIndex = useMemo(() => {
    if (!selectedPaymentId) return -1;
    return filteredPayments.findIndex((p) => p.id === selectedPaymentId);
  }, [filteredPayments, selectedPaymentId]);

  const handleDetailNavigate = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex >= 0 && newIndex < filteredPayments.length) {
      setSelectedPaymentId(filteredPayments[newIndex].id);
    }
  }, [selectedIndex, filteredPayments]);

  // Selection helpers (for batch actions)
  const pendingPayments = filteredPayments.filter(
    (p) => p.workflowStatus === 'pending_agent_review'
  );
  const allPendingSelected = pendingPayments.length > 0 &&
    pendingPayments.every((p) => selectedIds.has(p.id));

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  // Navigate to full detail page (mobile + external link)
  const openPaymentDetail = (paymentId: string) => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (methodFilter !== 'all') params.set('method', methodFilter);
    router.push(`/${locale}/dashboard/agent/treasury/validation/${paymentId}?${params.toString()}`);
  };

  const goToDashboard = () => {
    router.push(`/${locale}/dashboard/agent/treasury`);
  };

  // --- Batch action handlers ---
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

  const handleEscalateConfirm = async () => {
    if (!escalatePaymentId || !escalateReason.trim()) return;
    await escalatePayment.mutateAsync({
      paymentId: escalatePaymentId,
      reason: escalateReason,
      level: escalateLevel,
    });
    setShowEscalateDialog(false);
    setEscalatePaymentId(null);
    setEscalateReason('');
  };

  // --- Detail panel action handlers ---
  const handleDetailValidate = async (paymentId: string, comment?: string) => {
    await validatePayment.mutateAsync({ paymentId, request: comment ? { comment } : undefined });
    // Auto-advance to next
    const idx = filteredPayments.findIndex((p) => p.id === paymentId);
    if (idx < filteredPayments.length - 1) {
      setSelectedPaymentId(filteredPayments[idx + 1].id);
    } else if (idx > 0) {
      setSelectedPaymentId(filteredPayments[idx - 1].id);
    }
  };

  const handleDetailReject = async (paymentId: string, reason: string) => {
    await rejectPayment.mutateAsync({ paymentId, request: { reason } });
    const idx = filteredPayments.findIndex((p) => p.id === paymentId);
    if (idx < filteredPayments.length - 1) {
      setSelectedPaymentId(filteredPayments[idx + 1].id);
    } else if (idx > 0) {
      setSelectedPaymentId(filteredPayments[idx - 1].id);
    }
  };

  const handleDetailEscalate = async (paymentId: string, reason: string, level: string) => {
    await escalatePayment.mutateAsync({ paymentId, reason, level });
    const idx = filteredPayments.findIndex((p) => p.id === paymentId);
    if (idx < filteredPayments.length - 1) {
      setSelectedPaymentId(filteredPayments[idx + 1].id);
    } else if (idx > 0) {
      setSelectedPaymentId(filteredPayments[idx - 1].id);
    }
  };

  // Selected total for batch actions
  const selectedTotalAmount = useMemo(() => {
    return filteredPayments
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [filteredPayments, selectedIds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDetailNavigate('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDetailNavigate('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDetailNavigate]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 -mt-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-6 lg:px-8 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToDashboard}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('nav.dashboard')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('validation.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('validation.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
              <Badge variant="secondary" className="text-sm px-2 py-0">
                {selectedIds.size}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(selectedTotalAmount)}
              </span>
              <div className="h-4 w-px bg-border" />
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-7"
                onClick={() => setShowBatchValidateDialog(true)}
                disabled={isBatchProcessing}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('validationPage.buttons.validate')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7"
                onClick={() => setShowBatchRejectDialog(true)}
                disabled={isBatchProcessing}
              >
                <XCircle className="h-3 w-3 mr-1" />
                {t('validationPage.buttons.reject')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => setSelectedIds(new Set())}
              >
                {t('validationPage.buttons.cancel')}
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-6 px-4 md:px-6 lg:px-8 pb-3 shrink-0">
        <div className="relative col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('validationPage.filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('validationPage.filters.workflowStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('validationPage.filters.allStatuses')}</SelectItem>
            <SelectItem value="pending_agent_review">{t('validationPage.filters.pendingReview')}</SelectItem>
            <SelectItem value="escalated_supervisor">{t('validationPage.filters.escalated')}</SelectItem>
            <SelectItem value="completed">{t('validationPage.filters.validated')}</SelectItem>
            <SelectItem value="rejected_by_agent">{t('validationPage.filters.rejected')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('validationPage.filters.paymentMethod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('validationPage.filters.allMethods')}</SelectItem>
            <SelectItem value="cash">{t('validationPage.filters.cash')}</SelectItem>
            <SelectItem value="check">{t('validationPage.filters.check')}</SelectItem>
            <SelectItem value="bank_transfer">{t('validationPage.filters.bankTransfer')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={slaFilter} onValueChange={setSlaFilter}>
          <SelectTrigger className="h-9">
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
        {locations && locations.length > 0 && (
          <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9">
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

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 mx-4 md:mx-6 lg:mx-8 mb-3 shrink-0">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{t('validationPage.error.loadingPayments')}</p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* SPLIT VIEW: LEFT (list) + RIGHT (detail)                         */}
      {/* ================================================================= */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL — Payment List */}
        <div className="w-full lg:w-[35%] flex flex-col min-h-0 border-r bg-card">
          {/* List header */}
          <div className="flex items-center justify-between p-2 border-b bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              {statusFilter === 'pending_agent_review' && pendingPayments.length > 0 && (
                <Checkbox
                  checked={allPendingSelected}
                  onCheckedChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              )}
              <span className="text-sm font-medium">
                {paymentsData?.total ?? 0} {t('validationPage.tableTitle.pending')}
              </span>
            </div>
            {totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                {page}/{totalPages}
              </span>
            )}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="text-sm font-semibold">
                  {statusFilter === 'pending_agent_review'
                    ? t('validationPage.empty.noPending')
                    : t('validationPage.empty.noResults')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statusFilter === 'pending_agent_review'
                    ? t('validationPage.empty.noPendingDescription')
                    : t('validationPage.empty.noResultsDescription')}
                </p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <PaymentListItem
                  key={payment.id}
                  payment={payment}
                  isSelected={payment.id === selectedPaymentId}
                  isChecked={selectedIds.has(payment.id)}
                  showCheckbox={statusFilter === 'pending_agent_review'}
                  onClick={() => {
                    setSelectedPaymentId(payment.id);
                    // On mobile, navigate to detail page
                    if (window.innerWidth < 1024) {
                      openPaymentDetail(payment.id);
                    }
                  }}
                  onCheck={() => toggleSelect(payment.id)}
                  getWorkflowName={getWorkflowName}
                />
              ))
            )}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2 border-t shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
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
                      variant={pageNum === page ? 'default' : 'ghost'}
                      size="sm"
                      className="w-7 h-7 p-0 text-xs"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Payment Detail (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 bg-card overflow-hidden">
          {selectedPayment ? (
            <PaymentDetailPanel
              payment={selectedPayment}
              currentIndex={selectedIndex + 1}
              totalItems={filteredPayments.length}
              onNavigate={handleDetailNavigate}
              hasPrev={selectedIndex > 0}
              hasNext={selectedIndex < filteredPayments.length - 1}
              onOpenFullDetail={openPaymentDetail}
              onValidate={handleDetailValidate}
              onReject={handleDetailReject}
              onEscalate={handleDetailEscalate}
              isValidating={isValidating}
              isRejecting={isRejecting}
              isEscalating={isEscalating}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <CreditCard className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">{t('validationPage.selectPayment')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* BATCH DIALOGS (kept from original)                               */}
      {/* ================================================================= */}

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
                <p>{t('validationPage.dialogs.validateDescription', { count: selectedIds.size, amount: formatCurrency(selectedTotalAmount) })}</p>
                <p className="text-sm">{t('validationPage.dialogs.validateInfo')}</p>
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
              {isBatchProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('validationPage.dialogs.validateConfirm', { count: selectedIds.size })}
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
                <p>{t('validationPage.dialogs.rejectDescription', { count: selectedIds.size })}</p>
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
              {isBatchProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('validationPage.dialogs.rejectConfirm', { count: selectedIds.size })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Escalation Dialog */}
      <AlertDialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('escalation.dialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>{t('escalation.dialogDescription')}</p>
                <div className="space-y-2">
                  <Label htmlFor="escalateLevel">{t('escalation.level')}</Label>
                  <Select value={escalateLevel} onValueChange={setEscalateLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('escalation.levels.low')}</SelectItem>
                      <SelectItem value="medium">{t('escalation.levels.medium')}</SelectItem>
                      <SelectItem value="high">{t('escalation.levels.high')}</SelectItem>
                      <SelectItem value="critical">{t('escalation.levels.critical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="escalateReason">{t('escalation.reason')}</Label>
                  <Textarea
                    id="escalateReason"
                    placeholder={t('escalation.reasonPlaceholder')}
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    rows={3}
                    className="bg-background"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEscalating}>{t('validationPage.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEscalateConfirm}
              disabled={isEscalating || escalateReason.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isEscalating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('escalation.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
