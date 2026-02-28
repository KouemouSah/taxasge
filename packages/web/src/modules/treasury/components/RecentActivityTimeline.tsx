'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, ArrowUpCircle } from 'lucide-react';
import type { RecentActivityItem } from '../types';

interface RecentActivityTimelineProps {
  activities: RecentActivityItem[];
}

function getActionIcon(action: string) {
  switch (action) {
    case 'approve': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'reject': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'escalate': return <ArrowUpCircle className="h-4 w-4 text-orange-500" />;
    default: return <Activity className="h-4 w-4 text-blue-500" />;
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'approve': return 'Aprobado';
    case 'reject': return 'Rechazado';
    case 'escalate': return 'Escalado';
    case 'lock_for_review': return 'En revisión';
    case 'unlock_release': return 'Liberado';
    case 'request_documents': return 'Docs solicitados';
    default: return action;
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays}d`;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
}

export function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin actividad reciente
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activity.agentName}</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {getActionLabel(activity.action)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{activity.paymentReference}</span>
                    <span>&middot;</span>
                    <span>{formatAmount(activity.amount, activity.currency)}</span>
                    <span>&middot;</span>
                    <span>{activity.paymentMethod}</span>
                  </div>
                  {activity.comment && (
                    <p className="text-xs text-muted-foreground mt-1 italic truncate">
                      &ldquo;{activity.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
