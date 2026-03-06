/**
 * RequestInfoSection - Compact request metadata bar
 * All critical info visible without scrolling: ref, type, status, SLA, priority
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 * @updated 2026-03-06 - Compact layout, unified tramite label
 */

'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, AlertCircle, Baby, FileStack } from 'lucide-react';
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
    icon: <Clock className="h-3 w-3" />,
  },
  at_risk: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  violated: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function formatSlaRemaining(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '-';
  if (hours < 0) return `${Math.abs(Math.round(hours))}h atrasado`;
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

/** Build a unified tramite label from solicitudType + motivo, fallback to workflowLabel */
function buildTramiteLabel(solicitudType: string, motivo: string | null | undefined, workflowLabel: string): string {
  if (solicitudType) {
    const base = solicitudType.charAt(0).toUpperCase() + solicitudType.slice(1);
    return motivo ? `${base} - ${motivo}` : base;
  }
  return workflowLabel;
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
  const tramiteLabel = buildTramiteLabel(solicitudType, motivo, workflowLabel);

  return (
    <Card>
      <CardContent className="p-3">
        {/* Row 1: Reference + Badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-sm">{reference}</span>
            <Badge className={cn('text-[10px]', priorityStyle.bg, priorityStyle.text)}>
              {priority}
            </Badge>
            {isMinor && (
              <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                <Baby className="h-3 w-3 mr-0.5" />
                {t('minor', { defaultValue: 'Menor' })}
              </Badge>
            )}
            {batchReference && batchId ? (
              <Link href={`/${locale}/dashboard/batch-requests/${batchId}`}>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer text-[10px]">
                  <FileStack className="h-3 w-3 mr-0.5" />
                  {batchReference}
                </Badge>
              </Link>
            ) : batchReference ? (
              <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">
                <FileStack className="h-3 w-3 mr-0.5" />
                {batchReference}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Row 2: 4-column grid — Tramite | Status | SLA */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('workflow')}</p>
            <p className="text-sm font-medium leading-tight">{tramiteLabel}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('status')}</p>
            <Badge variant="outline" className="mt-0.5 text-xs">
              {status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">SLA</p>
            <div className={cn(
              'flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded w-fit text-xs',
              slaStyle.bg, slaStyle.text
            )}>
              {slaStyle.icon}
              <span className="font-medium">{formatSlaRemaining(slaRemainingHours)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RequestInfoSection;
