/**
 * PaymentDetailsSection - Compact payment card with full details
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-03-06
 * @updated 2026-03-07 - Added paid date and payment reference display
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

const METHOD_KEYS: Record<string, string> = {
  cash: 'paymentMethodCash',
  mobile_money: 'paymentMethodMobileMoney',
  bank_transfer: 'paymentMethodBankTransfer',
  card: 'paymentMethodCard',
  bange_wallet: 'paymentMethodBange',
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
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
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {t('paymentDetails')}
        </p>
        <div className="space-y-1">
          {amount != null && (
            <p className="text-lg font-bold leading-tight">{formatAmount(amount, currency || 'XAF')}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {status && (
              <Badge variant={statusVariant} className="text-[10px]">
                {status.replace(/_/g, ' ')}
              </Badge>
            )}
            {method && (
              <span className="text-xs text-muted-foreground">
                {METHOD_KEYS[method] ? t(METHOD_KEYS[method]) : method}
              </span>
            )}
          </div>
          {/* Payment reference */}
          {reference && (
            <p className="text-[10px] text-muted-foreground">
              {t('refLabel')}: <span className="font-mono">{reference}</span>
            </p>
          )}
          {/* Paid date */}
          {paidAt && (
            <p className="text-[10px] text-muted-foreground">
              {t('paidAtLabel')}: {formatDate(paidAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentDetailsSection;
