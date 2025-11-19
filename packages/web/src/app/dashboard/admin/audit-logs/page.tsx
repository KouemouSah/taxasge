'use client'

/**
 * Audit Logs Admin Page
 * View and filter system audit logs
 *
 * @module dashboard/admin/audit-logs
 * @author Claude Code
 * @date 2025-11-19
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  FileText,
  RefreshCw,
  AlertTriangle,
  Search,
  UserPlus,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Shield,
  Settings,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import auditLogsApi from '@/modules/audit-logs-admin/services/api'
import type { AuditLog, AuditAction } from '@/modules/audit-logs-admin/types'

export default function AuditLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all')

  // Fetch audit logs
  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: { action?: AuditAction; search?: string } = {}

      if (actionFilter !== 'all') {
        params.action = actionFilter
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const data = await auditLogsApi.getAll(params)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les logs d&apos;audit',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getActionBadge = (action: AuditAction, success: boolean) => {
    const actionConfig: Partial<Record<AuditAction, { icon: React.ReactNode; label: string; className: string }>> = {
      'user.login': { icon: <LogIn className="h-3 w-3" />, label: 'Connexion', className: 'bg-blue-100 text-blue-700' },
      'user.logout': { icon: <LogOut className="h-3 w-3" />, label: 'Déconnexion', className: 'bg-gray-100 text-gray-700' },
      'user.register': { icon: <UserPlus className="h-3 w-3" />, label: 'Inscription', className: 'bg-green-100 text-green-700' },
      'user.update': { icon: <Edit className="h-3 w-3" />, label: 'Modif. User', className: 'bg-yellow-100 text-yellow-700' },
      'user.delete': { icon: <Trash2 className="h-3 w-3" />, label: 'Suppr. User', className: 'bg-red-100 text-red-700' },
      'role.create': { icon: <Shield className="h-3 w-3" />, label: 'Créer Rôle', className: 'bg-purple-100 text-purple-700' },
      'role.update': { icon: <Shield className="h-3 w-3" />, label: 'Modif. Rôle', className: 'bg-purple-100 text-purple-700' },
      'role.delete': { icon: <Trash2 className="h-3 w-3" />, label: 'Suppr. Rôle', className: 'bg-red-100 text-red-700' },
      'permission.grant': { icon: <Shield className="h-3 w-3" />, label: 'Perm. Accordée', className: 'bg-green-100 text-green-700' },
      'permission.revoke': { icon: <Shield className="h-3 w-3" />, label: 'Perm. Révoquée', className: 'bg-orange-100 text-orange-700' },
      'settings.update': { icon: <Settings className="h-3 w-3" />, label: 'Config', className: 'bg-blue-100 text-blue-700' },
      'declaration.create': { icon: <FileText className="h-3 w-3" />, label: 'Créer Décl.', className: 'bg-green-100 text-green-700' },
      'declaration.update': { icon: <Edit className="h-3 w-3" />, label: 'Modif. Décl.', className: 'bg-yellow-100 text-yellow-700' },
      'declaration.submit': { icon: <FileText className="h-3 w-3" />, label: 'Soumettre Décl.', className: 'bg-blue-100 text-blue-700' },
      'declaration.approve': { icon: <FileText className="h-3 w-3" />, label: 'Approuver Décl.', className: 'bg-green-100 text-green-700' },
      'declaration.reject': { icon: <FileText className="h-3 w-3" />, label: 'Rejeter Décl.', className: 'bg-red-100 text-red-700' },
    }

    const config = actionConfig[action] || {
      icon: <FileText className="h-3 w-3" />,
      label: action,
      className: 'bg-gray-100 text-gray-700'
    }
    const className = success ? config.className : 'bg-red-100 text-red-700'

    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length,
    today: logs.filter(l => {
      const logDate = new Date(l.timestamp)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs d&apos;Audit</h1>
        <p className="text-muted-foreground mt-2">
          Consulter l&apos;historique des actions système
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd&apos;hui</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réussis</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échoués</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historique d&apos;audit</CardTitle>
              <CardDescription>
                {filteredLogs.length} entrée(s) trouvée(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as typeof actionFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="user.login">Connexion</SelectItem>
                  <SelectItem value="user.logout">Déconnexion</SelectItem>
                  <SelectItem value="user.register">Inscription</SelectItem>
                  <SelectItem value="user.update">Modif. User</SelectItem>
                  <SelectItem value="role.create">Créer Rôle</SelectItem>
                  <SelectItem value="permission.grant">Perm. Accordée</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
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

          {!isLoading && !error && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun log trouvé</p>
            </div>
          )}

          {!isLoading && !error && filteredLogs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell>{getActionBadge(log.action, log.success)}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Réussi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Échoué
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
