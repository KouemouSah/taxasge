'use client'

/**
 * Assignment Detail Page — Compact single-viewport layout
 *
 * @route /[locale]/dashboard/admin/assignments/[id]
 * @date 2026-02-27
 *
 * Redesigned: no scrolling on 1080p, actions in header,
 * agent names from JOINs, conditional Performance section.
 */

import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es, fr, enUS } from 'date-fns/locale'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Asignado' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Play, label: 'En curso' },
  pending_review: { color: 'bg-purple-100 text-purple-800', icon: Eye, label: 'Revisión' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completado' },
  reassigned: { color: 'bg-orange-100 text-orange-800', icon: ArrowRightLeft, label: 'Reasignado' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelado' },
  rejected: { color: 'bg-red-100 text-red-800', icon: Ban, label: 'Rechazado' },
}

function getPriorityConfig(level: PriorityLevel): { color: string; label: string } {
  if (level <= 3) return { color: 'bg-slate-100 text-slate-600', label: 'Baja' }
  if (level <= 6) return { color: 'bg-blue-100 text-blue-600', label: 'Media' }
  if (level <= 8) return { color: 'bg-orange-100 text-orange-600', label: 'Alta' }
  return { color: 'bg-red-100 text-red-600', label: 'Urgente' }
}

/** Compact key-value row */
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
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
  const { data: allAssignments = [] } = useAssignments({ limit: 100 })

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
      toast.success(t('completedSuccess'))
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

  // Format date helper — short format for compact layout
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: dateLocale })
    } catch {
      return dateString
    }
  }

  const formatRelative = (dateString?: string) => {
    if (!dateString) return null
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
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/assignments`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{t('title')}</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : t('notFound')}</span>
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

  // Check if there's any performance data to show
  const hasPerformance =
    (assignment.processing_duration_hours !== undefined && assignment.processing_duration_hours !== null) ||
    (assignment.quality_score !== undefined && assignment.quality_score !== null) ||
    (assignment.auto_assignment_score !== undefined && assignment.auto_assignment_score !== null) ||
    assignment.validation_status ||
    assignment.rule_applied_id

  return (
    <div className="space-y-4">
      {/* Header: Back + Title + Status + Actions + Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}/dashboard/admin/assignments`}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{t('detail')}</h1>
              <Badge className={`gap-1 shrink-0 ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {t(`statuses.${assignment.status}`) || statusInfo.label}
              </Badge>
              <Badge className={`shrink-0 ${priorityInfo.color}`}>
                P{assignment.priority_level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{assignmentId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Actions */}
          {canStart && (
            <Button size="sm" onClick={handleStart} disabled={startMutation.isPending}>
              {startMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
              {t('start')}
            </Button>
          )}
          {canComplete && (
            <Button size="sm" onClick={handleComplete} disabled={completeMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {completeMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
              {t('complete')}
            </Button>
          )}
          {canReassign && (
            <Link href={`/${locale}/dashboard/admin/assignments/${assignmentId}/reassign`}>
              <Button size="sm" variant="outline">
                <ArrowRightLeft className="mr-1 h-3 w-3" />
                {t('reassign')}
              </Button>
            </Link>
          )}
          {canEdit && (
            <Link href={`/${locale}/dashboard/admin/assignments/${assignmentId}/edit`}>
              <Button size="sm" variant="outline">
                <Pencil className="mr-1 h-3 w-3" />
                {tCommon('edit')}
              </Button>
            </Link>
          )}
          {canCancel && (
            <Button size="sm" onClick={handleCancel} disabled={cancelMutation.isPending} variant="destructive">
              {cancelMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
              {t('cancel')}
            </Button>
          )}

          {/* Separator + Nav */}
          <div className="h-6 w-px bg-border mx-1" />
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1}/{allAssignments.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!prevAssignment}
            onClick={() => prevAssignment && router.push(`/${locale}/dashboard/admin/assignments/${prevAssignment.id}`)}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!nextAssignment}
            onClick={() => nextAssignment && router.push(`/${locale}/dashboard/admin/assignments/${nextAssignment.id}`)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main content: 3-column compact layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Column 1: Item + Method */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4 space-y-0.5">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('itemInfo')}</span>
            </div>
            <InfoRow label={t('itemType.tax_declaration') === assignment.item_type ? 'Tipo' : 'Tipo'} value={
              <Badge variant="outline" className="text-xs">
                {t(`itemType.${assignment.item_type}`) || assignment.item_type}
              </Badge>
            } />
            <InfoRow label="ID" value={assignment.item_id} mono />
            <InfoRow label={t('assignmentMethod')} value={
              assignment.assignment_method === 'auto' ? 'Automática' :
              assignment.assignment_method === 'manual' ? 'Manual' :
              assignment.assignment_method === 'escalated' ? 'Escalada' :
              assignment.assignment_method
            } />
            {assignment.notes && (
              <div className="pt-1 border-t mt-1">
                <span className="text-xs text-muted-foreground">{t('notes')}</span>
                <p className="text-xs mt-0.5">{assignment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Agent Info */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4 space-y-0.5">
            <div className="flex items-center gap-1.5 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('agentInfo')}</span>
            </div>
            <InfoRow label={t('agent')} value={assignment.agent_name || assignment.agent_profile_id} />
            {assignment.agent_name && (
              <InfoRow label="Profile ID" value={assignment.agent_profile_id} mono />
            )}
            <InfoRow label={t('assignedBy')} value={assignment.assigned_by_name || (assignment.assigned_by_profile_id ? assignment.assigned_by_profile_id : null)} />
            {assignment.reassigned_to_profile_id && (
              <>
                <div className="border-t my-1" />
                <InfoRow label={t('reassignedTo')} value={assignment.reassigned_to_profile_id} mono />
                {assignment.reassignment_reason && (
                  <InfoRow label={t('reason')} value={
                    <Badge variant="outline" className="text-xs">
                      {t(`reasons.${assignment.reassignment_reason}`) || assignment.reassignment_reason}
                    </Badge>
                  } />
                )}
                {assignment.reassignment_notes && (
                  <InfoRow label={t('reassignmentNotes')} value={assignment.reassignment_notes} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Column 3: Timeline */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4 space-y-0.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('timestamps')}</span>
            </div>
            <InfoRow label={t('assignedAt')} value={
              <span title={formatDate(assignment.assigned_at) || ''}>
                {formatRelative(assignment.assigned_at)}
              </span>
            } />
            {assignment.started_at && (
              <InfoRow label={t('startedAt')} value={
                <span title={formatDate(assignment.started_at) || ''}>
                  {formatRelative(assignment.started_at)}
                </span>
              } />
            )}
            {assignment.completed_at && (
              <InfoRow label={t('completedAt')} value={
                <span title={formatDate(assignment.completed_at) || ''}>
                  {formatRelative(assignment.completed_at)}
                </span>
              } />
            )}
            {assignment.reassigned_at && (
              <InfoRow label={t('reassignedAt')} value={formatDate(assignment.reassigned_at)} />
            )}
            {assignment.deadline && (
              <InfoRow label={t('deadline')} value={
                <span className="flex items-center gap-1">
                  {formatDate(assignment.deadline)}
                  {assignment.deadline_met !== undefined && assignment.deadline_met !== null && (
                    <Badge variant={assignment.deadline_met ? 'default' : 'destructive'} className="text-[10px] px-1 py-0">
                      {assignment.deadline_met ? t('deadlineMet') : t('deadlineMissed')}
                    </Badge>
                  )}
                </span>
              } />
            )}
            <div className="border-t my-1" />
            <InfoRow label="Creado" value={formatDate(assignment.created_at)} />
            <InfoRow label="Actualizado" value={formatDate(assignment.updated_at)} />
          </CardContent>
        </Card>
      </div>

      {/* Performance — only shown when there's data */}
      {hasPerformance && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('performance')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {assignment.processing_duration_hours !== undefined && assignment.processing_duration_hours !== null && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('processingTime')}</span>
                  <p className="text-lg font-semibold">{assignment.processing_duration_hours.toFixed(1)}h</p>
                </div>
              )}
              {assignment.quality_score !== undefined && assignment.quality_score !== null && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('qualityScore')}</span>
                  <p className="text-lg font-semibold">{assignment.quality_score}/100</p>
                </div>
              )}
              {assignment.auto_assignment_score !== undefined && assignment.auto_assignment_score !== null && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('autoScore')}</span>
                  <p className="text-lg font-semibold">{assignment.auto_assignment_score}</p>
                </div>
              )}
              {assignment.validation_status && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('validationStatus')}</span>
                  <div className="mt-1">
                    <Badge variant={assignment.validation_status === 'approved' ? 'default' : 'destructive'}>
                      {assignment.validation_status}
                    </Badge>
                  </div>
                </div>
              )}
              {assignment.rule_applied_id && (
                <div>
                  <span className="text-xs text-muted-foreground">{t('ruleApplied')}</span>
                  <p className="font-mono text-xs mt-1">{assignment.rule_applied_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
