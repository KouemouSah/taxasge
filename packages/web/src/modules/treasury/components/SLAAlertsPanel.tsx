'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import type { SLAAlertItem } from '../types';

interface SLAAlertsPanelProps {
  alerts: SLAAlertItem[];
  onPaymentClick?: (paymentId: string) => void;
}

function getSLABadge(status: string) {
  switch (status) {
    case 'breached':
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    case 'critical':
      return <Badge className="text-xs bg-orange-500 hover:bg-orange-600">Crítico</Badge>;
    case 'warning':
      return <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600 text-black">Atención</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">OK</Badge>;
  }
}

function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return 'Vencido';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}h`;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
}

export function SLAAlertsPanel({ alerts, onPaymentClick }: SLAAlertsPanelProps) {
  const breachedCount = alerts.filter(a => a.slaStatus === 'breached').length;
  const criticalCount = alerts.filter(a => a.slaStatus === 'critical').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base">Alertas SLA</CardTitle>
          </div>
          <div className="flex gap-2">
            {breachedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {breachedCount} vencidos
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge className="text-xs bg-orange-500">
                {criticalCount} críticos
              </Badge>
            )}
            {alerts.length === 0 && (
              <Badge variant="secondary" className="text-xs">
                Sin alertas
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos los pagos dentro del SLA
          </p>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {alerts.map(alert => (
              <div
                key={alert.paymentId}
                className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onPaymentClick?.(alert.paymentId)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getSLABadge(alert.slaStatus)}
                    <span className="text-sm font-medium truncate">
                      {alert.paymentReference}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {alert.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      &middot; {alert.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-medium">
                    {formatAmount(alert.amount, alert.currency)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs ${alert.hoursRemaining <= 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {formatTimeRemaining(alert.hoursRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
