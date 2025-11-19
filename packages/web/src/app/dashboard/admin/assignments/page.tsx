'use client'

/**
 * Assignments Admin Page
 * View and manage declaration assignments to agents
 *
 * @module dashboard/admin/assignments
 * @author Claude Code
 * @date 2025-11-19
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { ClipboardList, RefreshCw, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Assignment status types
type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

interface Assignment {
  id: string
  declaration_id: string
  assignee_id: string
  assignee_name: string
  status: AssignmentStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_at: string
  completed_at?: string
  cancelled_at?: string
}

export default function AssignmentsPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all')

  // Fetch assignments
  const fetchAssignments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For now, show mock data since the API endpoint needs to be verified
      // TODO: Replace with actual API call when endpoint is confirmed
      const mockData: Assignment[] = [
        {
          id: '1',
          declaration_id: 'DECL-2025-001',
          assignee_id: 'agent-1',
          assignee_name: 'Agent DGI 1',
          status: 'in_progress',
          priority: 'high',
          assigned_at: '2025-11-19T10:00:00Z',
        },
        {
          id: '2',
          declaration_id: 'DECL-2025-002',
          assignee_id: 'agent-2',
          assignee_name: 'Agent DGI 2',
          status: 'pending',
          priority: 'medium',
          assigned_at: '2025-11-19T11:00:00Z',
        },
        {
          id: '3',
          declaration_id: 'DECL-2025-003',
          assignee_id: 'agent-1',
          assignee_name: 'Agent DGI 1',
          status: 'completed',
          priority: 'low',
          assigned_at: '2025-11-18T09:00:00Z',
          completed_at: '2025-11-19T08:00:00Z',
        },
      ]

      setAssignments(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les assignments',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const getStatusBadge = (status: AssignmentStatus) => {
    const variants: Record<AssignmentStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      pending: {
        variant: 'outline',
        icon: <Clock className="h-3 w-3" />,
        label: 'En attente',
      },
      in_progress: {
        variant: 'default',
        icon: <RefreshCw className="h-3 w-3" />,
        label: 'En cours',
      },
      completed: {
        variant: 'secondary',
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: 'Terminé',
      },
      cancelled: {
        variant: 'destructive',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Annulé',
      },
    }

    const config = variants[status]

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }

    return (
      <Badge variant="outline" className={colors[priority] || ''}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const filteredAssignments = statusFilter === 'all'
    ? assignments
    : assignments.filter(a => a.status === statusFilter)

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-2">
          Gérer les assignments de déclarations aux agents
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des assignments</CardTitle>
              <CardDescription>
                {filteredAssignments.length} assignment(s) trouvé(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="cancelled">Annulés</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchAssignments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chargement...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {!isLoading && !error && filteredAssignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun assignment trouvé</p>
            </div>
          )}

          {!isLoading && !error && filteredAssignments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Déclaration</TableHead>
                  <TableHead>Agent assigné</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Date d&apos;assignment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.declaration_id}</TableCell>
                    <TableCell>{assignment.assignee_name}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-700 text-base">
            Note de développement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-600">
            Cette page affiche actuellement des données de test. L&apos;intégration avec l&apos;API backend
            du module assignment sera effectuée lors de la prochaine itération.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
