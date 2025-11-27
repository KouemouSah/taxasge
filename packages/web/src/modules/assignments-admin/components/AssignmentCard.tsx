/**
 * AssignmentCard Component
 * Displays a single assignment as a card
 *
 * @module assignments-admin/components
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Calendar, Edit, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AssignmentStatusBadge } from './AssignmentStatusBadge'
import type { Assignment, AssignmentPriority } from '../types'

interface AssignmentCardProps {
  assignment: Assignment
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const priorityColors: Record<AssignmentPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export function AssignmentCard({
  assignment,
  onClick,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const t = useTranslations('assignments')

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">
            {t('declarationId')}: {assignment.declaration_id}
          </CardTitle>
          <AssignmentStatusBadge status={assignment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{assignment.assignee_name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={priorityColors[assignment.priority]}>
            {t(`priority.${assignment.priority}`)}
          </Badge>

          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {assignment.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {assignment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
