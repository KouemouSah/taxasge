/**
 * Payment Detail Page
 * Complete view for Treasury agents to review and act on payments
 * Includes navigation between payments and integrated actions
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  CreditCard,
  Mail,
  Clock,
  Hash,
  Building,
  Receipt,
} from 'lucide-react';
import { treasuryApi } from '@/modules/treasury/services/api';
import { usePendingPayments, usePaymentActions } from '@/modules/treasury/hooks';
import {
  PaymentMethodBadge,
  WorkflowStatusBadge,
  SLABadge,
} from '@/modules/treasury/components';

// Workflow names mapping
const WORKFLOW_NAMES: Record<string, string> = {
  'pasaporte_expedicion': 'Expedicion de Pasaporte',
  'pasaporte_renovacion': 'Renovacion de Pasaporte',
  'pasaporte_menor': 'Pasaporte Menor de Edad',
  'residencia_expedicion': 'Permiso de Residencia (Expedicion)',
  'residencia_renovacion': 'Permiso de Residencia (Renovacion)',
  'verificacion_funcionario': 'Verificacion de Funcionario Publico',
  'licencia_conducir': 'Licencia de Conducir',
  'certificado_nacimiento': 'Certificado de Nacimiento',
  'certificado_antecedentes': 'Certificado de Antecedentes Penales',
};

function getWorkflowName(code: string | undefined): string {
  if (!code) return 'Servicio no especificado';
  return WORKFLOW_NAMES[code] || code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-GQ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHours(hours: number | undefined): string {
  if (!hours) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} horas`;
  return `${Math.round(hours / 24)} dias`;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const paymentId = params.paymentId as string;

  // Get filter params from URL to maintain context
  const statusFilter = searchParams.get('status') || 'pending_agent_review';
  const methodFilter = searchParams.get('method') || undefined;

  // State for actions
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Fetch current payment details
  const { data: payment, isLoading: isLoadingPayment, error: paymentError } = useQuery({
    queryKey: ['treasury-payment-detail', paymentId],
    queryFn: () => treasuryApi.getPaymentDetails(paymentId),
    enabled: !!paymentId,
  });

  // Fetch list of payments for navigation (same filters as list page)
  const { data: paymentsData } = usePendingPayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    method: methodFilter !== 'all' ? methodFilter : undefined,
  });

  // Payment actions
  const {
    validatePayment,
    rejectPayment,
    isValidating,
    isRejecting,
  } = usePaymentActions();

  // Calculate navigation (prev/next)
  const navigation = useMemo(() => {
    const payments = paymentsData?.payments || [];
    const currentIndex = payments.findIndex(p => p.id === paymentId);

    return {
      currentIndex: currentIndex + 1,
      total: payments.length,
      prevId: currentIndex > 0 ? payments[currentIndex - 1]?.id : null,
      nextId: currentIndex < payments.length - 1 ? payments[currentIndex + 1]?.id : null,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < payments.length - 1 && currentIndex !== -1,
    };
  }, [paymentsData?.payments, paymentId]);

  // Navigation handlers
  const navigateToPayment = (id: string) => {
    const navParams = new URLSearchParams();
    if (statusFilter) navParams.set('status', statusFilter);
    if (methodFilter) navParams.set('method', methodFilter);
    router.push(`/${locale}/dashboard/agent/treasury/validation/${id}?${navParams.toString()}`);
  };

  const goBack = () => {
    const navParams = new URLSearchParams();
    if (statusFilter) navParams.set('status', statusFilter);
    if (methodFilter) navParams.set('method', methodFilter);
    router.push(`/${locale}/dashboard/agent/treasury/validation?${navParams.toString()}`);
  };

  // Action handlers
  const handleValidate = async () => {
    try {
      await validatePayment.mutateAsync({
        paymentId,
        request: comment ? { comment } : undefined,
      });
      setShowValidateConfirm(false);
      setComment('');
      // Navigate to next payment or back to list
      if (navigation.nextId) {
        navigateToPayment(navigation.nextId);
      } else {
        goBack();
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await rejectPayment.mutateAsync({
        paymentId,
        request: { reason: rejectReason },
      });
      setShowRejectConfirm(false);
      setRejectReason('');
      // Navigate to next payment or back to list
      if (navigation.nextId) {
        navigateToPayment(navigation.nextId);
      } else {
        goBack();
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isActionable = payment?.workflowStatus === 'pending_agent_review';
  const isAnyLoading = isValidating || isRejecting;

  // Loading state
  if (isLoadingPayment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (paymentError || !payment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={goBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Pago no encontrado</p>
              <p className="text-sm text-red-600">
                El pago solicitado no existe o no tienes permisos para verlo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Lista
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detalle del Pago</h1>
            <p className="text-muted-foreground font-mono">{payment.paymentReference}</p>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          {navigation.total > 0 && (
            <span className="text-sm text-muted-foreground mr-2">
              {navigation.currentIndex > 0 ? navigation.currentIndex : '?'} / {navigation.total}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigation.prevId && navigateToPayment(navigation.prevId)}
            disabled={!navigation.hasPrev}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigation.nextId && navigateToPayment(navigation.nextId)}
            disabled={!navigation.hasNext}
          >
            Siguiente
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Tramite</p>
                  <p className="text-lg font-semibold">{getWorkflowName(payment.workflowCode)}</p>
                </div>
                <WorkflowStatusBadge status={payment.workflowStatus} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {payment.requestReference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Referencia Solicitud</p>
                    <p className="font-mono">{payment.requestReference}</p>
                  </div>
                )}
                {payment.serviceRequestId && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID Solicitud</p>
                    <p className="font-mono text-xs text-muted-foreground">{payment.serviceRequestId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Detalles del Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Referencia</span>
                </div>
                <span className="font-mono font-medium">{payment.paymentReference}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Metodo de Pago</span>
                <PaymentMethodBadge method={payment.paymentMethod} />
              </div>

              <Separator />

              {/* Amount breakdown */}
              <div className="space-y-2">
                {payment.baseAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto Base</span>
                    <span>{formatCurrency(payment.baseAmount)}</span>
                  </div>
                )}

                {payment.calculationDetails?.supplements && payment.calculationDetails.supplements.length > 0 && (
                  <div className="border-l-2 border-muted pl-4 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Suplementos:</p>
                    {payment.calculationDetails.supplements.map((supp, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {supp.nameEs} x{supp.quantity}
                        </span>
                        <span>{formatCurrency(supp.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {payment.penalties && payment.penalties > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Penalidades</span>
                    <span>+{formatCurrency(payment.penalties)}</span>
                  </div>
                )}

                {payment.discounts && payment.discounts > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuentos</span>
                    <span>-{formatCurrency(payment.discounts)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(payment.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citizen Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{payment.userName || 'N/A'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Correo Electronico</p>
                    <p className="text-sm">{payment.userEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronologia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Creado</p>
                  <p className="text-sm">{formatDate(payment.createdAt)}</p>
                </div>
                {payment.submittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Enviado</p>
                    <p className="text-sm">{formatDate(payment.submittedAt)}</p>
                  </div>
                )}
                {payment.slaTargetDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Limite SLA</p>
                    <p className="text-sm">{formatDate(payment.slaTargetDate)}</p>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">En Espera</p>
                    <p className="text-sm font-medium">{formatHours(payment.hoursWaiting)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Status & SLA Card */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Workflow</span>
                <WorkflowStatusBadge status={payment.workflowStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SLA</span>
                <SLABadge
                  slaTargetDate={payment.slaTargetDate}
                  workflowStatus={payment.workflowStatus}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          {isActionable && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Acciones
                </CardTitle>
                <CardDescription>
                  Revise los detalles y tome una decision
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Validation comment */}
                <div className="space-y-2">
                  <Label htmlFor="comment">Comentario (opcional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Agregar comentario de validacion..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    disabled={isAnyLoading}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowValidateConfirm(true)}
                    disabled={isAnyLoading}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validar Pago
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={isAnyLoading}
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rechazando...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar Pago
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already processed */}
          {!isActionable && (
            <Card className="border-muted">
              <CardContent className="py-6">
                <div className="text-center space-y-2">
                  {payment.workflowStatus === 'completed' && (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-medium text-green-700">Pago Validado</p>
                      <p className="text-sm text-muted-foreground">
                        Este pago ya fue procesado
                      </p>
                    </>
                  )}
                  {payment.workflowStatus === 'rejected_by_agent' && (
                    <>
                      <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                      <p className="font-medium text-red-700">Pago Rechazado</p>
                      <p className="text-sm text-muted-foreground">
                        Este pago fue rechazado
                      </p>
                    </>
                  )}
                  {!['completed', 'rejected_by_agent', 'pending_agent_review'].includes(payment.workflowStatus) && (
                    <>
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                      <p className="font-medium">Estado: {payment.workflowStatus}</p>
                      <p className="text-sm text-muted-foreground">
                        No se pueden realizar acciones en este estado
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick navigation hint */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                Use las flechas <kbd className="px-1 py-0.5 bg-background rounded border text-xs">Anterior</kbd> / <kbd className="px-1 py-0.5 bg-background rounded border text-xs">Siguiente</kbd> para navegar entre pagos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Validation Confirmation Dialog */}
      <AlertDialog open={showValidateConfirm} onOpenChange={setShowValidateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirmar Validacion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta a punto de validar el pago <strong>{payment.paymentReference}</strong> por{' '}
              <strong>{formatCurrency(payment.totalAmount)}</strong>.
              <br /><br />
              Se generara un recibo automaticamente y el solicitante sera notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isValidating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidate}
              disabled={isValidating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Confirmar Validacion'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rechazar Pago
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Esta a punto de rechazar el pago <strong>{payment.paymentReference}</strong>.
                  El solicitante sera notificado del rechazo.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="rejectReason">Motivo del rechazo (obligatorio)</Label>
                  <Textarea
                    id="rejectReason"
                    placeholder="Indique el motivo del rechazo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="bg-background"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rechazando...
                </>
              ) : (
                'Confirmar Rechazo'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
