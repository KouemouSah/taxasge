/**
 * AuditActionBadge Component
 * Badge for audit action types
 *
 * @module audit-logs-admin/components
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import type { AuditAction } from '../types'

interface AuditActionBadgeProps {
  action: AuditAction
  success?: boolean
}

const actionColors: Record<string, string> = {
  'user.login': 'bg-green-500',
  'user.logout': 'bg-gray-500',
  'user.register': 'bg-blue-500',
  'user.update': 'bg-yellow-500',
  'user.delete': 'bg-red-500',
  'role.create': 'bg-purple-500',
  'role.update': 'bg-purple-400',
  'role.delete': 'bg-purple-600',
  'permission.grant': 'bg-indigo-500',
  'permission.revoke': 'bg-indigo-600',
  'settings.update': 'bg-orange-500',
  'declaration.create': 'bg-teal-500',
  'declaration.update': 'bg-teal-400',
  'declaration.submit': 'bg-teal-600',
  'declaration.approve': 'bg-green-600',
  'declaration.reject': 'bg-red-600',
}

export function AuditActionBadge({ action, success = true }: AuditActionBadgeProps) {
  const t = useTranslations('auditLogs')

  const baseColor = actionColors[action] || 'bg-gray-500'
  const colorClass = success ? baseColor : 'bg-red-500'

  return (
    <Badge className={colorClass}>
      {t(`actions.${action.replace('.', '_')}`)}
    </Badge>
  )
}
