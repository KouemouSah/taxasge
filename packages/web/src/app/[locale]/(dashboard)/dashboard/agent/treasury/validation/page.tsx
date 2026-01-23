/**
 * Treasury Validation Page
 * Lists pending payments requiring manual validation (cash/check)
 * Treasury agents can validate or reject payments directly (auto-assignment)
 * @version 1.2.0 - Simplified workflow: removed mandatory lock step
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Unlock,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { usePendingPayments, usePaymentActions } from '@/modules/treasury/hooks';
import { PaymentMethodBadge, WorkflowStatusBadge, SLABadge } from '@/modules/treasury/components';
import { PaymentValidationDialog } from '@/modules/treasury/components';
import { PaymentRejectionDialog } from '@/modules/treasury/components';
import type { PendingPayment } from '@/modules/treasury/types';
import { calculateSLAStatus } from '@/modules/treasury/types';

export default function TreasuryValidationPage() {
  const t = useTranslations('treasury');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');

  // Dialogs
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);

  // Data fetching
  const { data: paymentsData, isLoading, error, refetch } = usePendingPayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    method: methodFilter !== 'all' ? methodFilter : undefined,
  });

  // Debug logging
  useEffect(() => {
    console.log('[TreasuryValidation] paymentsData:', paymentsData);
    console.log('[TreasuryValidation] isLoading:', isLoading);
    console.log('[TreasuryValidation] error:', error);
    if (paymentsData?.payments) {
      console.log('[TreasuryValidation] First payment:', paymentsData.payments[0]);
      paymentsData.payments.forEach((p, i) => {
        console.log(`[TreasuryValidation] Payment ${i} id:`, p.id, 'paymentRef:', p.paymentReference);
      });
    }
  }, [paymentsData, isLoading, error]);

  // Actions
  const {
    validatePayment,
    rejectPayment,
    unlockPayment,
    isValidating,
    isRejecting,
    isUnlocking,
  } = usePaymentActions();

  // Filter payments by search term and SLA status
  const filteredPayments = useMemo(() => {
    // Extract payments array inside useMemo to avoid dependency issues
    const payments = paymentsData?.payments || [];
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p: PendingPayment) =>
        p.paymentReference.toLowerCase().includes(term) ||
        p.userName?.toLowerCase().includes(term) ||
        p.serviceRequestId?.toLowerCase().includes(term)
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

  const handleUnlock = async (payment: PendingPayment) => {
    await unlockPayment.mutateAsync(payment.id);
  };

  const openValidationDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setIsValidationOpen(true);
  };

  const openRejectionDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setIsRejectionOpen(true);
  };

  const handleValidate = async (paymentId: string, comment?: string) => {
    await validatePayment.mutateAsync({ paymentId, request: comment ? { comment } : undefined });
  };

  const handleReject = async (paymentId: string, reason: string) => {
    await rejectPayment.mutateAsync({ paymentId, request: { reason } });
  };

  const isAnyLoading = isValidating || isRejecting || isUnlocking;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('validation.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('validation.description')}
          </p>
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
                placeholder="Buscar por referencia, ciudadano..."
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
                <SelectItem value="locked_by_agent">Bloqueado por agente</SelectItem>
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagos Pendientes de Validacion
            {filteredPayments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredPayments.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Sin pagos pendientes</h3>
              <p className="text-muted-foreground">
                No hay pagos que requieran validacion en este momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Ciudadano</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: PendingPayment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.paymentReference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.userName || 'N/A'}</p>
                          {payment.serviceRequestId && (
                            <p className="text-xs text-muted-foreground">
                              Solicitud: {payment.serviceRequestId}
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
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Unlock - only show if locked by agent */}
                          {payment.workflowStatus === 'locked_by_agent' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUnlock(payment)}
                              disabled={isAnyLoading}
                              title="Desbloquear"
                            >
                              {isUnlocking ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {/* Validate - show for both pending_agent_review and locked_by_agent */}
                          {(payment.workflowStatus === 'pending_agent_review' || payment.workflowStatus === 'locked_by_agent') && (
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => openValidationDialog(payment)}
                              disabled={isAnyLoading}
                              className="bg-green-600 hover:bg-green-700"
                              title="Validar pago"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Reject - show for both pending_agent_review and locked_by_agent */}
                          {(payment.workflowStatus === 'pending_agent_review' || payment.workflowStatus === 'locked_by_agent') && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openRejectionDialog(payment)}
                              disabled={isAnyLoading}
                              title="Rechazar pago"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Dialog */}
      <PaymentValidationDialog
        payment={selectedPayment}
        isOpen={isValidationOpen}
        onClose={() => {
          setIsValidationOpen(false);
          setSelectedPayment(null);
        }}
        onValidate={handleValidate}
        isLoading={isValidating}
      />

      {/* Rejection Dialog */}
      <PaymentRejectionDialog
        payment={selectedPayment}
        isOpen={isRejectionOpen}
        onClose={() => {
          setIsRejectionOpen(false);
          setSelectedPayment(null);
        }}
        onReject={handleReject}
        isLoading={isRejecting}
      />
    </div>
  );
}
