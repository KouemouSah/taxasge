/**
 * Payment Status Badge Component
 * Displays colored badge for payment status
 */

'use client';

import { Badge } from '@/components/ui/badge';
import type { PaymentStatus, PaymentWorkflowStatus } from '../types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string | undefined;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  processing: { label: 'Procesando', variant: 'default' },
  completed: { label: 'Completado', variant: 'default' },
  failed: { label: 'Fallido', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  if (!status) {
    return <Badge variant="secondary" className={className}>-</Badge>;
  }
  const config = statusConfig[status as PaymentStatus] || { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Workflow status badge
interface WorkflowStatusBadgeProps {
  status: PaymentWorkflowStatus | string;
  className?: string;
}

const workflowStatusConfig: Record<
  PaymentWorkflowStatus,
  { label: string; color: string }
> = {
  submitted: { label: 'Enviado', color: 'bg-gray-500' },
  auto_processing: { label: 'Procesando Auto', color: 'bg-blue-500' },
  auto_approved: { label: 'Auto Aprobado', color: 'bg-green-500' },
  pending_agent_review: { label: 'Pendiente Revision', color: 'bg-yellow-500' },
  agent_reviewing: { label: 'En Revision', color: 'bg-blue-500' },
  requires_documents: { label: 'Requiere Docs', color: 'bg-yellow-600' },
  docs_resubmitted: { label: 'Docs Reenviados', color: 'bg-blue-400' },
  approved_by_agent: { label: 'Aprobado', color: 'bg-green-500' },
  rejected_by_agent: { label: 'Rechazado', color: 'bg-red-500' },
  escalated_supervisor: { label: 'Escalado', color: 'bg-purple-500' },
  supervisor_reviewing: { label: 'Supervisor Revisando', color: 'bg-purple-400' },
  completed: { label: 'Completado', color: 'bg-green-600' },
  cancelled_by_user: { label: 'Cancelado Usuario', color: 'bg-gray-500' },
  cancelled_by_agent: { label: 'Cancelado Agente', color: 'bg-gray-600' },
  expired: { label: 'Expirado', color: 'bg-red-400' },
};

export function WorkflowStatusBadge({ status, className }: WorkflowStatusBadgeProps) {
  const config = workflowStatusConfig[status as PaymentWorkflowStatus] || { label: status, color: 'bg-gray-500' };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${config.color} ${className || ''}`}
    >
      {config.label}
    </span>
  );
}

// Payment Method badge
interface PaymentMethodBadgeProps {
  method: string;
  className?: string;
}

const methodConfig: Record<string, { label: string; color: string }> = {
  cash: { label: 'Efectivo', color: 'bg-green-100 text-green-800 border-green-200' },
  check: { label: 'Cheque', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  mobile_money: { label: 'Mobile Money', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  bank_transfer: { label: 'Transferencia', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  card: { label: 'Tarjeta', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  bange_wallet: { label: 'BANGE Wallet', color: 'bg-teal-100 text-teal-800 border-teal-200' },
};

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  const config = methodConfig[method] || { label: method, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.color} ${className || ''}`}
    >
      {config.label}
    </span>
  );
}

export default PaymentStatusBadge;
