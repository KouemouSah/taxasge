/**
 * PaymentDetailsSection - Payment card for split view
 *
 * Compact Card with: amount + status + method + date + reference
 * Visually clean, not cramped.
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-03-06
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

interface PaymentDetailsSectionProps {
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  method?: string | null;
  paidAt?: string | null;
  reference?: string | null;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  approved: 'default',
  pending_agent_review: 'secondary',
  submitted: 'secondary',
  rejected: 'destructive',
  failed: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Transferencia',
  card: 'Tarjeta',
  bange_wallet: 'BANGE',
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function PaymentDetailsSection({
  status,
  amount,
  currency = 'XAF',
  method,
  paidAt,
  reference,
}: PaymentDetailsSectionProps) {
  const t = useTranslations('agent.pending.preview');

  if (!status && amount == null) return null;

  const statusVariant = STATUS_VARIANTS[status || ''] || 'secondary';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          {t('paymentDetails')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Amount */}
          {amount != null && (
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentAmount')}</p>
              <p className="text-sm font-bold">{formatAmount(amount, currency || 'XAF')}</p>
            </div>
          )}

          {/* Status */}
          {status && (
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentStatus')}</p>
              <Badge variant={statusVariant} className="mt-0.5">
                {status.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}

          {/* Method */}
          {method && (
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentMethod')}</p>
              <p className="text-sm font-medium">{METHOD_LABELS[method] || method}</p>
            </div>
          )}

          {/* Date */}
          {paidAt && (
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentDate')}</p>
              <p className="text-sm font-medium">{formatShortDate(paidAt)}</p>
            </div>
          )}

          {/* Reference - full width */}
          {reference && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('paymentRef')}</p>
              <p className="text-sm font-mono truncate" title={reference}>{reference}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentDetailsSection;
