'use client'

/**
 * Users Admin Page
 * Manage system users, roles, and permissions
 *
 * @module dashboard/admin/users
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
import { Users, RefreshCw, AlertTriangle, Search, Shield, Ban } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type UserRole = 'citizen' | 'business' | 'accountant' | 'admin' | 'dgi_agent'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  two_factor_enabled: boolean
  created_at: string
  last_login?: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Mock data - will be replaced with API call
      const mockData: User[] = [
        {
          id: '1',
          email: 'sah@emacsah.com',
          first_name: 'Admin',
          last_name: 'System',
          role: 'admin',
          is_active: true,
          two_factor_enabled: true,
          created_at: '2025-01-01T00:00:00Z',
          last_login: '2025-11-19T10:00:00Z',
        },
        {
          id: '2',
          email: 'agent@dgi.cm',
          first_name: 'Agent',
          last_name: 'DGI',
          role: 'dgi_agent',
          is_active: true,
          two_factor_enabled: false,
          created_at: '2025-02-15T00:00:00Z',
          last_login: '2025-11-18T14:30:00Z',
        },
        {
          id: '3',
          email: 'citizen@example.com',
          first_name: 'Jean',
          last_name: 'Dupont',
          role: 'citizen',
          is_active: true,
          two_factor_enabled: false,
          created_at: '2025-03-01T00:00:00Z',
          last_login: '2025-11-19T09:15:00Z',
        },
        {
          id: '4',
          email: 'business@company.cm',
          first_name: 'Marie',
          last_name: 'Martin',
          role: 'business',
          is_active: true,
          two_factor_enabled: true,
          created_at: '2025-03-10T00:00:00Z',
        },
        {
          id: '5',
          email: 'inactive@example.com',
          first_name: 'Inactive',
          last_name: 'User',
          role: 'citizen',
          is_active: false,
          two_factor_enabled: false,
          created_at: '2025-01-15T00:00:00Z',
        },
      ]

      setUsers(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRoleBadge = (role: UserRole) => {
    const roleConfig: Record<UserRole, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-red-100 text-red-700' },
      dgi_agent: { label: 'Agent DGI', className: 'bg-purple-100 text-purple-700' },
      accountant: { label: 'Comptable', className: 'bg-blue-100 text-blue-700' },
      business: { label: 'Entreprise', className: 'bg-green-100 text-green-700' },
      citizen: { label: 'Citoyen', className: 'bg-gray-100 text-gray-700' },
    }

    const config = roleConfig[role]
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    with2fa: users.filter(u => u.two_factor_enabled).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground mt-2">
          Gérer les utilisateurs du système
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec 2FA</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.with2fa}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                {filteredUsers.length} utilisateur(s) trouvé(s)
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
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dgi_agent">Agent DGI</SelectItem>
                  <SelectItem value="accountant">Comptable</SelectItem>
                  <SelectItem value="business">Entreprise</SelectItem>
                  <SelectItem value="citizen">Citoyen</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
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

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.two_factor_enabled ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Gérer
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
            Cette page affiche actuellement des données de test. L&apos;intégration avec l&apos;API backend sera effectuée une fois le module permissions déployé sur Cloud Run.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
