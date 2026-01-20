'use client'

/**
 * Assignment Detail Page
 * View full details of an assignment with navigation and actions
 *
 * @route /[locale]/dashboard/admin/assignments/[id]
 * @date 2026-01-20
 *
 * FEATURES:
 * - Full assignment details
 * - Navigation to previous/next assignment
 * - Quick actions (start, complete, reassign, cancel)
 * - History timeline
 */

import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es, fr, enUS } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ArrowRightLeft,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Calendar,
  Target,
  History,
  Ban,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAssignment,
  useAssignments,
  useStartAssignment,
  useCompleteAssignment,
  useCancelAssignment,
} from '@/modules/assignments-admin'
import type { AssignmentStatus, PriorityLevel } from '@/modules/assignments-admin'

// Status configuration
const statusConfig: Record<AssignmentStatus, { color: string; icon: typeof Clock; label: string }> = {
  assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Assigned' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Play, label: 'In Progress' },
  pending_review: { color: 'bg-purple-100 text-purple-800', icon: Eye, label: 'Pending Review' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
  reassigned: { color: 'bg-orange-100 text-orange-800', icon: ArrowRightLeft, label: 'Reassigned' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
  rejected: { color: 'bg-red-100 text-red-800', icon: Ban, label: 'Rejected' },
}

function getPriorityConfig(level: PriorityLevel): { color: string; label: string } {
  if (level <= 3) return { color: 'bg-slate-100 text-slate-600', label: 'Low' }
  if (level <= 6) return { color: 'bg-blue-100 text-blue-600', label: 'Medium' }
  if (level <= 8) return { color: 'bg-orange-100 text-orange-600', label: 'High' }
  return { color: 'bg-red-100 text-red-600', label: 'Urgent' }
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.assignments')
  const tCommon = useTranslations('common')

  const assignmentId = params.id as string
  const dateLocale = locale === 'es' ? es : locale === 'fr' ? fr : enUS

  // Fetch current assignment
  const { data: assignment, isLoading, error, refetch } = useAssignment(assignmentId)

  // Fetch all assignments for navigation
  const { data: allAssignments = [] } = useAssignments({ limit: 200 })

  // Mutations
  const startMutation = useStartAssignment()
  const completeMutation = useCompleteAssignment()
  const cancelMutation = useCancelAssignment()

  // Find current index and prev/next
  const currentIndex = allAssignments.findIndex((a) => a.id === assignmentId)
  const prevAssignment = currentIndex > 0 ? allAssignments[currentIndex - 1] : null
  const nextAssignment = currentIndex < allAssignments.length - 1 ? allAssignments[currentIndex + 1] : null

  // Handlers
  const handleStart = async () => {
    try {
      await startMutation.mutateAsync({ id: assignmentId })
      toast.success(t('startSuccess'))
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        id: assignmentId,
        data: { validation_status: 'approved' },
      })
      toast.success(t('completedSuccess') || 'Assignment completed')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(assignmentId)
      toast.success(t('cancelSuccess'))
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'PPpp', { locale: dateLocale })
    } catch {
      return dateString
    }
  }

  const formatRelative = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: dateLocale })
    } catch {
      return dateString
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error
  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/assignments`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : t('notFound') || 'Assignment not found'}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              {tCommon('back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[assignment.status]
  const priorityInfo = getPriorityConfig(assignment.priority_level)
  const StatusIcon = statusInfo.icon

  const canStart = assignment.status === 'assigned'
  const canComplete = assignment.status === 'in_progress'
  const canReassign = !['completed', 'cancelled', 'rejected'].includes(assignment.status)
  const canCancel = !['completed', 'cancelled', 'rejected'].includes(assignment.status)
  const canEdit = !['completed', 'cancelled', 'rejected'].includes(assignment.status)

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/assignments`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {t('detail') || 'Assignment Detail'}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{assignmentId}</p>
          </div>
        </div>

        {/* Navigation between items */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {allAssignments.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={!prevAssignment}
            onClick={() => prevAssignment && router.push(`/${locale}/dashboard/admin/assignments/${prevAssignment.id}`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!nextAssignment}
            onClick={() => nextAssignment && router.push(`/${locale}/dashboard/admin/assignments/${nextAssignment.id}`)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {canStart && (
              <Button onClick={handleStart} disabled={startMutation.isPending}>
                {startMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {t('start')}
              </Button>
            )}
            {canComplete && (
              <Button onClick={handleComplete} disabled={completeMutation.isPending} variant="default" className="bg-green-600 hover:bg-green-700">
                {completeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t('complete') || 'Complete'}
              </Button>
            )}
            {canReassign && (
              <Link href={`/${locale}/dashboard/admin/assignments/${assignmentId}/reassign`}>
                <Button variant="outline">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  {t('reassign')}
                </Button>
              </Link>
            )}
            {canEdit && (
              <Link href={`/${locale}/dashboard/admin/assignments/${assignmentId}/edit`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </Button>
              </Link>
            )}
            {canCancel && (
              <Button onClick={handleCancel} disabled={cancelMutation.isPending} variant="destructive">
                {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                {t('cancel')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('itemInfo') || 'Item Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('item') || 'Item ID'}</label>
                <p className="font-mono text-sm">{assignment.item_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('itemType.label') || 'Item Type'}</label>
                <p>{t(`itemType.${assignment.item_type}`) || assignment.item_type}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('status')}</label>
                <div className="mt-1">
                  <Badge className={`gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {t(assignment.status) || statusInfo.label}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('priority')}</label>
                <div className="mt-1">
                  <Badge className={priorityInfo.color}>
                    {t(priorityInfo.label.toLowerCase()) || priorityInfo.label} ({assignment.priority_level})
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('assignmentMethod') || 'Method'}</label>
              <p className="capitalize">{assignment.assignment_method}</p>
            </div>
            {assignment.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('notes')}</label>
                  <p className="text-sm mt-1">{assignment.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Agent Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('agentInfo') || 'Agent Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('agent')}</label>
              <p className="font-medium">{assignment.agent_name || '-'}</p>
              <p className="font-mono text-xs text-muted-foreground">{assignment.agent_profile_id}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('assignedBy') || 'Assigned By'}</label>
              <p className="font-medium">{assignment.assigned_by_name || '-'}</p>
              {assignment.assigned_by_profile_id && (
                <p className="font-mono text-xs text-muted-foreground">{assignment.assigned_by_profile_id}</p>
              )}
            </div>
            {assignment.reassigned_to_profile_id && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('reassignedTo') || 'Reassigned To'}</label>
                  <p className="font-mono text-xs">{assignment.reassigned_to_profile_id}</p>
                  {assignment.reassignment_reason && (
                    <Badge variant="outline" className="mt-1">
                      {t(`reasons.${assignment.reassignment_reason}`) || assignment.reassignment_reason}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('timestamps') || 'Timeline'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('assignedAt')}</label>
                <p className="text-sm">{formatDate(assignment.assigned_at)}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(assignment.assigned_at)}</p>
              </div>
              {assignment.started_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('startedAt') || 'Started'}</label>
                  <p className="text-sm">{formatDate(assignment.started_at)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(assignment.started_at)}</p>
                </div>
              )}
            </div>
            {assignment.completed_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('completedAt') || 'Completed'}</label>
                <p className="text-sm">{formatDate(assignment.completed_at)}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(assignment.completed_at)}</p>
              </div>
            )}
            {assignment.deadline && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('deadline')}</label>
                <p className="text-sm">{formatDate(assignment.deadline)}</p>
                {assignment.deadline_met !== undefined && (
                  <Badge variant={assignment.deadline_met ? 'default' : 'destructive'} className="mt-1">
                    {assignment.deadline_met ? (t('deadlineMet') || 'Met') : (t('deadlineMissed') || 'Missed')}
                  </Badge>
                )}
              </div>
            )}
            {assignment.reassigned_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('reassignedAt') || 'Reassigned'}</label>
                <p className="text-sm">{formatDate(assignment.reassigned_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('performance') || 'Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.processing_duration_hours !== undefined && assignment.processing_duration_hours !== null && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('processingTime') || 'Processing Time'}</label>
                <p className="text-lg font-semibold">{assignment.processing_duration_hours.toFixed(1)}h</p>
              </div>
            )}
            {assignment.quality_score !== undefined && assignment.quality_score !== null && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('qualityScore') || 'Quality Score'}</label>
                <p className="text-lg font-semibold">{assignment.quality_score}/100</p>
              </div>
            )}
            {assignment.auto_assignment_score !== undefined && assignment.auto_assignment_score !== null && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('autoScore') || 'Auto-Assignment Score'}</label>
                <p className="text-lg font-semibold">{assignment.auto_assignment_score}</p>
              </div>
            )}
            {assignment.validation_status && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('validationStatus') || 'Validation'}</label>
                <Badge variant={assignment.validation_status === 'approved' ? 'default' : 'destructive'}>
                  {assignment.validation_status}
                </Badge>
              </div>
            )}
            {assignment.rule_applied_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('ruleApplied') || 'Rule Applied'}</label>
                <p className="font-mono text-xs">{assignment.rule_applied_id}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('auditInfo') || 'Audit Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">{tCommon('createdAt')}</label>
              <p>{formatDate(assignment.created_at)}</p>
            </div>
            <div>
              <label className="text-muted-foreground">{tCommon('updatedAt')}</label>
              <p>{formatDate(assignment.updated_at)}</p>
            </div>
            {assignment.reassignment_notes && (
              <div className="col-span-2">
                <label className="text-muted-foreground">{t('reassignmentNotes') || 'Reassignment Notes'}</label>
                <p>{assignment.reassignment_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
