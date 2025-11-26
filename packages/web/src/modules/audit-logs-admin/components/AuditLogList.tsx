/**
 * AuditLogList Component
 * Displays a list of audit logs
 *
 * @module audit-logs-admin/components
 */

'use client'

import { useTranslations } from 'next-intl'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuditLogItem } from './AuditLogItem'
import { useAuditLogs } from '../hooks/useAuditLogs'
import type { AuditLog, AuditAction } from '../types'

interface AuditLogListProps {
  filters?: {
    action?: AuditAction
    user_id?: string
    resource_type?: string
    success?: boolean
    start_date?: string
    end_date?: string
    search?: string
  }
  onSelect?: (log: AuditLog) => void
}

export function AuditLogList({ filters, onSelect }: AuditLogListProps) {
  const t = useTranslations('auditLogs')

  const { data, isLoading, error } = useAuditLogs({
    action: filters?.action,
    user_id: filters?.user_id,
    resource_type: filters?.resource_type,
    success: filters?.success,
    start_date: filters?.start_date,
    end_date: filters?.end_date,
    search: filters?.search,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('errorLoading')}: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noLogs')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((log) => (
        <AuditLogItem
          key={log.id}
          log={log}
          onClick={() => onSelect?.(log)}
        />
      ))}
    </div>
  )
}
