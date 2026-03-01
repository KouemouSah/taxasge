'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import type { SLAAlertItem } from '../types';

const MAX_DISPLAY = 5;

interface SLAAlertsPanelProps {
  alerts: SLAAlertItem[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

function getSLABadge(status: string, t: SLAAlertsPanelProps['t']) {
  switch (status) {
    case 'breached':
      return <Badge variant="destructive" className="text-xs">{t('overview.slaBreached')}</Badge>;
    case 'critical':
      return <Badge className="text-xs bg-orange-500 hover:bg-orange-600">{t('overview.slaCritical')}</Badge>;
    case 'warning':
      return <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600 text-black">{t('overview.slaWarning')}</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{t('overview.slaOk')}</Badge>;
  }
}

function formatTimeRemaining(hours: number, t: SLAAlertsPanelProps['t']): string {
  if (hours <= 0) return t('overview.timeExpired');
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}h`;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SLAAlertsPanel({ alerts, t }: SLAAlertsPanelProps) {
  const breachedCount = alerts.filter(a => a.slaStatus === 'breached').length;
  const criticalCount = alerts.filter(a => a.slaStatus === 'critical').length;
  const displayAlerts = alerts.slice(0, MAX_DISPLAY);
  const remaining = alerts.length - MAX_DISPLAY;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base">{t('overview.slaAlerts')}</CardTitle>
          </div>
          <div className="flex gap-2">
            {breachedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {t('overview.breachedCount', { count: breachedCount })}
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge className="text-xs bg-orange-500">
                {t('overview.criticalCount', { count: criticalCount })}
              </Badge>
            )}
            {alerts.length === 0 && (
              <Badge variant="secondary" className="text-xs">
                {t('overview.noAlerts')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4" role="status">
            {t('overview.allWithinSLA')}
          </p>
        ) : (
          <div className="space-y-2">
            {displayAlerts.map(alert => (
              <div
                key={alert.paymentId}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getSLABadge(alert.slaStatus, t)}
                    {/* F6: Truncated reference with title tooltip */}
                    <span className="text-sm font-medium truncate" title={alert.paymentReference}>
                      {alert.paymentReference}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate" title={alert.userName}>
                      {alert.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      &middot; {alert.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-sm font-medium">
                    {formatAmount(alert.amount, alert.currency)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs ${alert.hoursRemaining <= 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {formatTimeRemaining(alert.hoursRemaining, t)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {t('overview.moreItems', { count: remaining })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
