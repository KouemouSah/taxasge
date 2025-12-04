'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ClipboardList,
  Search,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
  User,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { useAssignments, useStartAssignment, useCancelAssignment } from '@/modules/assignments-admin'
import type { AssignmentStatus } from '@/modules/assignments-admin'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Status colors and icons
const statusConfig: Record<AssignmentStatus, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'bg-slate-100 text-slate-800', icon: Clock, label: 'Pending' },
  assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Assigned' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Play, label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
  reassigned: { color: 'bg-purple-100 text-purple-800', icon: ArrowRightLeft, label: 'Reassigned' },
}

// Priority colors
const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-slate-100 text-slate-600', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-600', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-600', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-600', label: 'Urgent' },
}

export default function AssignmentsPage() {
  const t = useTranslations('admin.assignments')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Queries
  const { data: assignments = [], isLoading, error, refetch } = useAssignments({
    status: statusFilter === 'all' ? undefined : statusFilter as AssignmentStatus,
    limit: 100,
  })

  // Mutations
  const startMutation = useStartAssignment()
  const cancelMutation = useCancelAssignment()

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        assignment.id.toLowerCase().includes(query) ||
        assignment.declaration_id?.toLowerCase().includes(query) ||
        assignment.agent_id?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Priority filter
    if (priorityFilter !== 'all' && assignment.priority_level !== priorityFilter) {
      return false
    }

    return true
  })

  // Stats
  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === 'assigned').length,
    inProgress: assignments.filter((a) => a.status === 'in_progress').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
  }

  // Handlers
  const handleStartAssignment = async (id: string) => {
    try {
      await startMutation.mutateAsync(id)
      toast.success(t('startSuccess') || 'Assignment started')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start assignment')
    }
  }

  const handleCancelAssignment = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id)
      toast.success(t('cancelSuccess') || 'Assignment cancelled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel assignment')
    }
  }

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return dateString
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : 'Error loading assignments'}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {tCommon('retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tCommon('refresh') || 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalAssignments') || 'Total'}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('assigned') || 'Assigned'}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inProgress') || 'In Progress'}</CardTitle>
            <Play className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completed') || 'Completed'}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description') || 'Manage declaration assignments to agents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder') || 'Search by ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                <SelectItem value="assigned">{t('assigned') || 'Assigned'}</SelectItem>
                <SelectItem value="in_progress">{t('inProgress') || 'In Progress'}</SelectItem>
                <SelectItem value="completed">{t('completed') || 'Completed'}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled') || 'Cancelled'}</SelectItem>
                <SelectItem value="reassigned">{t('reassigned') || 'Reassigned'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allPriorities') || 'All Priorities'}</SelectItem>
                <SelectItem value="low">{t('low') || 'Low'}</SelectItem>
                <SelectItem value="medium">{t('medium') || 'Medium'}</SelectItem>
                <SelectItem value="high">{t('high') || 'High'}</SelectItem>
                <SelectItem value="urgent">{t('urgent') || 'Urgent'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignments Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('declaration') || 'Declaration'}</TableHead>
                  <TableHead>{t('agent') || 'Agent'}</TableHead>
                  <TableHead>{t('status') || 'Status'}</TableHead>
                  <TableHead>{t('priority') || 'Priority'}</TableHead>
                  <TableHead>{t('assignedAt') || 'Assigned'}</TableHead>
                  <TableHead>{t('deadline') || 'Deadline'}</TableHead>
                  <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('noAssignmentsFound') || 'No assignments found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const statusInfo = statusConfig[assignment.status] || statusConfig.assigned
                    const priorityInfo = priorityConfig[assignment.priority_level] || priorityConfig.medium
                    const StatusIcon = statusInfo.icon

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-mono text-xs">
                                {assignment.declaration_id?.slice(0, 8)}...
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.declaration_type || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {assignment.agent_id?.slice(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(assignment.assigned_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.deadline ? formatDate(assignment.deadline) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('actions') || 'Actions'}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {assignment.status === 'assigned' && (
                                <DropdownMenuItem
                                  onClick={() => handleStartAssignment(assignment.id)}
                                  disabled={startMutation.isPending}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  {t('start') || 'Start'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                {t('reassign') || 'Reassign'}
                              </DropdownMenuItem>
                              {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  onClick={() => handleCancelAssignment(assignment.id)}
                                  disabled={cancelMutation.isPending}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {t('cancel') || 'Cancel'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
