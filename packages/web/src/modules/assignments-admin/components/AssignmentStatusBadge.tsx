/**
 * AssignmentStatusBadge Component
 * Status badge for assignments
 *
 * @module assignments-admin/components
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import type { AssignmentStatus } from '../types'

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus
}

const statusColors: Record<AssignmentStatus, string> = {
  assigned: 'bg-purple-500 hover:bg-purple-600',
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  in_progress: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-gray-500 hover:bg-gray-600',
  reassigned: 'bg-orange-500 hover:bg-orange-600',
}

export function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
  const t = useTranslations('assignments')

  return (
    <Badge className={statusColors[status]}>
      {t(`status.${status}`)}
    </Badge>
  )
}
