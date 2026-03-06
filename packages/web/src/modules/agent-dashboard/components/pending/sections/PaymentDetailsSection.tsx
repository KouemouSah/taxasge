/**
 * PaymentDetailsSection - Compact payment card for split view
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-03-06
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
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

export function PaymentDetailsSection({
  status,
  amount,
  currency = 'XAF',
  method,
  paidAt: _paidAt,
  reference: _reference,
}: PaymentDetailsSectionProps) {
  const t = useTranslations('agent.pending.preview');

  if (!status && amount == null) return null;

  const statusVariant = STATUS_VARIANTS[status || ''] || 'secondary';

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {t('paymentDetails')}
        </p>
        <div className="space-y-1">
          {amount != null && (
            <p className="text-lg font-bold leading-tight">{formatAmount(amount, currency || 'XAF')}</p>
          )}
          <div className="flex items-center gap-2">
            {status && (
              <Badge variant={statusVariant} className="text-[10px]">
                {status.replace(/_/g, ' ')}
              </Badge>
            )}
            {method && (
              <span className="text-xs text-muted-foreground">
                {METHOD_LABELS[method] || method}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentDetailsSection;
