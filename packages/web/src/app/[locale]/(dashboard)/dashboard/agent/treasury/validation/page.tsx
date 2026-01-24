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
import { usePendingPayments, usePaymentActions } from '@/modules/treasury/hooks';
import {
  PaymentMethodBadge,
  WorkflowStatusBadge,
  SLABadge,
} from '@/modules/treasury/components';
import type { PendingPayment } from '@/modules/treasury/types';
import { calculateSLAStatus } from '@/modules/treasury/types';

// Workflow names mapping (short versions for table)
const WORKFLOW_NAMES: Record<string, string> = {
  'pasaporte_expedicion': 'Pasaporte Expedicion',
  'pasaporte_renovacion': 'Pasaporte Renovacion',
  'pasaporte_menor': 'Pasaporte Menor',
  'residencia_expedicion': 'Residencia (Exp.)',
  'residencia_renovacion': 'Residencia (Ren.)',
  'verificacion_funcionario': 'Verif. Funcionario',
  'licencia_conducir': 'Licencia Conducir',
  'certificado_nacimiento': 'Cert. Nacimiento',
  'certificado_antecedentes': 'Cert. Antecedentes',
};

function getWorkflowName(code: string | undefined): string {
  if (!code) return 'Sin especificar';
  return WORKFLOW_NAMES[code] || code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const PAGE_SIZE = 20;

export default function TreasuryValidationPage() {
  const t = useTranslations('treasury');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

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
            Dashboard
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
          Actualizar
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Error al cargar los pagos pendientes</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por referencia, servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado del workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending_agent_review">Pendiente revision</SelectItem>
                <SelectItem value="completed">Validados</SelectItem>
                <SelectItem value="rejected_by_agent">Rechazados</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Metodo de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los metodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>

            {/* SLA Filter */}
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los SLA</SelectItem>
                <SelectItem value="on_time">En plazo</SelectItem>
                <SelectItem value="warning">Alerta</SelectItem>
                <SelectItem value="critical">Critico</SelectItem>
                <SelectItem value="breached">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {statusFilter === 'pending_agent_review' ? 'Pagos Pendientes de Validacion' :
               statusFilter === 'completed' ? 'Pagos Validados' :
               statusFilter === 'rejected_by_agent' ? 'Pagos Rechazados' : 'Todos los Pagos'}
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
                    seleccionado(s) • {formatCurrency(selectedTotalAmount)}
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
                    Validar
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
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setSelectedIds(new Set())}
                    disabled={isBatchProcessing}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              /* Pagination info - shows when nothing selected */
              totalPages > 1 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
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
                {statusFilter === 'pending_agent_review' ? 'Sin pagos pendientes' : 'Sin resultados'}
              </h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending_agent_review'
                  ? 'No hay pagos que requieran validacion en este momento.'
                  : 'No se encontraron pagos con los filtros seleccionados.'}
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
                            aria-label="Seleccionar todos"
                            className={somePendingSelected && !allPendingSelected ? 'opacity-50' : ''}
                          />
                        </TableHead>
                      )}
                      <TableHead>Referencia</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Accion</TableHead>
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
                                aria-label={`Seleccionar ${payment.paymentReference}`}
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
                        <TableCell className="font-bold">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <PaymentMethodBadge method={payment.paymentMethod} />
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
                    Mostrando {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, paymentsData?.total || 0)} de {paymentsData?.total || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!hasPrevPage || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
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
                      Siguiente
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
              Validar {selectedIds.size} Pago(s)
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Esta a punto de validar <strong>{selectedIds.size}</strong> pago(s) por un total de{' '}
                  <strong>{formatCurrency(selectedTotalAmount)}</strong>.
                </p>
                <p className="text-sm">
                  Se generaran recibos para cada pago y los solicitantes seran notificados.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="batchComment">Comentario general (opcional)</Label>
                  <Textarea
                    id="batchComment"
                    placeholder="Comentario que se aplicara a todos los pagos..."
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
            <AlertDialogCancel disabled={isBatchProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchValidate}
              disabled={isBatchProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Validar ${selectedIds.size} Pago(s)`
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
              Rechazar {selectedIds.size} Pago(s)
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Esta a punto de rechazar <strong>{selectedIds.size}</strong> pago(s).
                  Los solicitantes seran notificados del rechazo.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="batchRejectReason">Motivo del rechazo (obligatorio)</Label>
                  <Textarea
                    id="batchRejectReason"
                    placeholder="Indique el motivo del rechazo..."
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
            <AlertDialogCancel disabled={isBatchProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchReject}
              disabled={isBatchProcessing || !batchRejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Rechazar ${selectedIds.size} Pago(s)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
