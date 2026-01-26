/**
 * RequestListItem - Individual item in the request list
 *
 * @module agent-dashboard/components/pending
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ServiceRequestListItem, SlaStatus, Priority } from '../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface RequestListItemProps {
  item: ServiceRequestListItem;
  isSelected: boolean;
  onClick: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; label: string }> = {
  URGENT: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
  NORMAL: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Normal' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Baja' },
};

const SLA_STYLES: Record<SlaStatus, { icon: React.ReactNode; text: string }> = {
  on_track: { icon: <Clock className="h-3 w-3" />, text: 'text-green-600' },
  at_risk: { icon: <AlertTriangle className="h-3 w-3" />, text: 'text-orange-600' },
  violated: { icon: <AlertCircle className="h-3 w-3" />, text: 'text-red-600' },
};

function formatSlaTime(deadline: string | null): string {
  if (!deadline) return '';
  const now = new Date();
  const sla = new Date(deadline);
  const diffMs = sla.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) return `${Math.abs(diffHours)}h atrasado`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function formatWorkflowLabel(workflowCode: string, solicitudType: string, motivo: string | null): string {
  // Simplify workflow display
  const typeMap: Record<string, string> = {
    expedicion: 'Exp.',
    renovacion: 'Ren.',
  };

  const base = workflowCode.replace('PASAPORTE_', 'Pasaporte ').replace('_', ' ');
  const type = typeMap[solicitudType?.toLowerCase()] || '';

  if (motivo) {
    return `Pasaporte ${type} (${motivo})`;
  }
  return type ? `Pasaporte ${type}` : base;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RequestListItem({ item, isSelected, onClick }: RequestListItemProps) {
  const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.NORMAL;
  const slaStyle = SLA_STYLES[item.slaStatus] || SLA_STYLES.on_track;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'p-3 border-b cursor-pointer transition-colors',
        'hover:bg-accent/50',
        isSelected && 'bg-accent border-l-4 border-l-primary'
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm font-medium">{item.reference}</span>
        <div className="flex items-center gap-2">
          {/* SLA indicator */}
          {item.slaDeadline && (
            <span className={cn('flex items-center gap-1 text-xs', slaStyle.text)}>
              {slaStyle.icon}
              {formatSlaTime(item.slaDeadline)}
            </span>
          )}
          {/* Priority badge */}
          <Badge className={cn('text-[10px] px-1.5 py-0', priorityStyle.bg, priorityStyle.text)}>
            {priorityStyle.label}
          </Badge>
        </div>
      </div>

      {/* Workflow type */}
      <p className="text-xs text-muted-foreground mb-1">
        {formatWorkflowLabel(item.workflowCode, item.solicitudType, item.motivo)}
      </p>

      {/* Citizen name */}
      <p className="text-sm truncate">{item.citizenName}</p>
    </div>
  );
}

export default RequestListItem;
