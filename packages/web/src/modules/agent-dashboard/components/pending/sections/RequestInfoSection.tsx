/**
 * RequestInfoSection - Request metadata display
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, AlertTriangle, AlertCircle, Baby, FileStack } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Priority, SlaStatus } from '../../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface RequestInfoSectionProps {
  reference: string;
  workflowLabel: string;
  solicitudType: string;
  motivo?: string | null;
  priority: Priority;
  status: string;
  slaStatus: SlaStatus;
  slaRemainingHours?: number | null;
  isMinor: boolean;
  batchReference?: string | null;
  batchId?: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  URGENT: { bg: 'bg-red-100', text: 'text-red-700' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  NORMAL: { bg: 'bg-blue-100', text: 'text-blue-700' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const SLA_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  on_track: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <Clock className="h-4 w-4" />,
  },
  at_risk: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  violated: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

function formatSlaRemaining(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '-';
  if (hours < 0) return `${Math.abs(Math.round(hours))}h atrasado`;
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RequestInfoSection({
  reference,
  workflowLabel,
  solicitudType,
  motivo,
  priority,
  status,
  slaStatus,
  slaRemainingHours,
  isMinor,
  batchReference,
  batchId,
}: RequestInfoSectionProps) {
  const locale = useLocale();
  const t = useTranslations('agent.pending.preview');
  const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.NORMAL;
  const slaStyle = SLA_STYLES[slaStatus] || SLA_STYLES.on_track;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t('requestInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Reference & Priority */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t('reference')}</p>
            <p className="font-mono font-semibold">{reference}</p>
          </div>
          <div className="flex items-center gap-2">
            {batchReference && batchId ? (
              <Link href={`/${locale}/dashboard/batch-requests/${batchId}`}>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer">
                  <FileStack className="h-3 w-3 mr-1" />
                  {batchReference}
                </Badge>
              </Link>
            ) : batchReference ? (
              <Badge className="bg-indigo-100 text-indigo-700">
                <FileStack className="h-3 w-3 mr-1" />
                {batchReference}
              </Badge>
            ) : null}
            {isMinor && (
              <Badge className="bg-purple-100 text-purple-700">
                <Baby className="h-3 w-3 mr-1" />
                {t('minor', { defaultValue: 'Menor' })}
              </Badge>
            )}
            <Badge className={cn(priorityStyle.bg, priorityStyle.text)}>
              {priority}
            </Badge>
          </div>
        </div>

        {/* Workflow & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('workflow')}</p>
            <p className="text-sm font-medium">{workflowLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('type')}</p>
            <p className="text-sm font-medium capitalize">
              {solicitudType}
              {motivo && ` - ${motivo}`}
            </p>
          </div>
        </div>

        {/* Status & SLA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('status')}</p>
            <Badge variant="outline" className="mt-1">
              {status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SLA</p>
            <div className={cn(
              'flex items-center gap-1 mt-1 px-2 py-1 rounded-md w-fit',
              slaStyle.bg, slaStyle.text
            )}>
              {slaStyle.icon}
              <span className="text-sm font-medium">
                {formatSlaRemaining(slaRemainingHours)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RequestInfoSection;
