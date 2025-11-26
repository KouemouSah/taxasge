/**
 * AuditLogItem Component
 * Displays a single audit log entry
 *
 * @module audit-logs-admin/components
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Clock, Globe, Monitor, CheckCircle, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuditActionBadge } from './AuditActionBadge'
import type { AuditLog } from '../types'

interface AuditLogItemProps {
  log: AuditLog
  onClick?: () => void
}

export function AuditLogItem({ log, onClick }: AuditLogItemProps) {
  const t = useTranslations('auditLogs')

  const StatusIcon = log.success ? CheckCircle : XCircle
  const statusColor = log.success ? 'text-green-500' : 'text-red-500'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <StatusIcon className={`h-5 w-5 mt-0.5 ${statusColor}`} />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <AuditActionBadge action={log.action} success={log.success} />
              <span className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{log.user_email}</span>
            </div>

            {log.resource_type && (
              <div className="text-sm text-muted-foreground">
                {t('resource')}: {log.resource_type}
                {log.resource_id && ` (${log.resource_id})`}
              </div>
            )}

            {log.details && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {log.details}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {log.ip_address && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{log.ip_address}</span>
                </div>
              )}
              {log.user_agent && (
                <div className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{log.user_agent}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
