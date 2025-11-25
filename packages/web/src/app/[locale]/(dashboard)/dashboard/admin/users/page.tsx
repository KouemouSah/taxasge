'use client'

/**
 * Users Admin Page
 * Complete CRUD for user management with i18n support
 *
 * MIGRATED: Phase 4 - Full i18n + role-based delete constraints
 * CRITICAL: citizen/business = SOFT DELETE only, other roles = full CRUD
 *
 * @module dashboard/admin/users
 * @author Claude Code
 * @date 2025-11-24
 */

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { Users, RefreshCw, AlertTriangle, Search, Shield, Ban, UserPlus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import usersApi from '@/modules/users-admin/services/api'
import type { User, UserRole } from '@/modules/users-admin/types'
import { UserRole as UserRoleEnum, UserStatus, isCitizenOrBusiness, canPhysicallyDelete } from '@/types/user'
import { useUserLabels } from '@/hooks/use-user-labels'
import { CreateUserDialog } from '@/modules/users-admin/components/CreateUserDialog'
import { EditUserDialog } from '@/modules/users-admin/components/EditUserDialog'
import { BackendUnavailableAlert } from '@/components/admin/BackendUnavailableAlert'

export default function UsersPage() {
  const locale = useLocale()
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('admin')
  const { toast } = useToast()
  const { getRoleLabel, getStatusLabel, getRoleOptions } = useUserLabels()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: { role?: UserRole; search?: string } = {}

      if (roleFilter !== 'all') {
        params.role = roleFilter
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const data = await usersApi.getAll(params)
      setUsers(data)
      setIsBackendUnavailable(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoading')
      setError(errorMessage)

      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed')) {
        setIsBackendUnavailable(true)
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorLoadingUsers'),
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
    const roleConfig: Record<UserRole, { className: string }> = {
      admin: { className: 'bg-red-100 text-red-700' },
      dgi_agent: { className: 'bg-purple-100 text-purple-700' },
      accountant: { className: 'bg-blue-100 text-blue-700' },
      business: { className: 'bg-green-100 text-green-700' },
      citizen: { className: 'bg-gray-100 text-gray-700' },
      supervisor_dgi: { className: 'bg-indigo-100 text-indigo-700' },
      supervisor_senior: { className: 'bg-pink-100 text-pink-700' },
      supervisor_junior_dgi: { className: 'bg-cyan-100 text-cyan-700' },
      supervisor_readonly: { className: 'bg-slate-100 text-slate-700' },
      ministry_agent: { className: 'bg-teal-100 text-teal-700' },
    }

    const config = roleConfig[role]
    return (
      <Badge variant="outline" className={config.className}>
        {getRoleLabel(role)}
      </Badge>
    )
  }

  const getDeleteButtonText = (role: UserRole) => {
    if (role === 'admin') return t('cannotDelete')
    if (isCitizenOrBusiness(role as any)) return t('deactivate')
    return t('delete')
  }

  const getDeleteButtonVariant = (role: UserRole) => {
    if (role === 'admin') return 'ghost' as const
    return 'destructive' as const
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (user.role === 'admin') {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('adminCannotBeDeleted'),
      })
      return
    }

    const isSoftDelete = isCitizenOrBusiness(user.role as any)

    const confirmMessage = isSoftDelete
      ? t('confirmDeactivate', { name: `${user.first_name} ${user.last_name}` })
      : t('confirmDelete', { name: `${user.first_name} ${user.last_name}` })

    if (!confirm(confirmMessage)) return

    try {
      if (isSoftDelete) {
        // Soft delete: set status to inactive
        await usersApi.setActive(user.id, false)
        toast({
          title: t('successTitle'),
          description: t('userDeactivated'),
        })
      } else {
        // Hard delete: physical deletion
        await usersApi.delete(user.id)
        toast({
          title: t('successTitle'),
          description: t('userDeleted'),
        })
      }
      fetchUsers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDeleting'),
      })
    }
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
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsTotal')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsActive')}</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsInactive')}</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsWith2FA')}</CardTitle>
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
              <CardTitle>{t('listTitle')}</CardTitle>
              <CardDescription>
                {t('usersFound', { count: filteredUsers.length })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('filterByRole')} />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('createUser')}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('loading')}</span>
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
              <p>{t('noUsersFound')}</p>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableFullName')}</TableHead>
                  <TableHead>{t('tableEmail')}</TableHead>
                  <TableHead>{t('tableRole')}</TableHead>
                  <TableHead>{t('tableStatus')}</TableHead>
                  <TableHead>{t('table2FA')}</TableHead>
                  <TableHead>{t('tableLastLogin')}</TableHead>
                  <TableHead className="text-right">{t('tableActions')}</TableHead>
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
                          {t('statusActive')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {t('statusInactive')}
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
                        new Date(user.last_login).toLocaleDateString(locale, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-muted-foreground">{t('never')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {t('edit')}
                        </Button>
                        <Button
                          variant={getDeleteButtonVariant(user.role)}
                          size="sm"
                          onClick={() => handleDelete(user)}
                          disabled={user.role === 'admin'}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {getDeleteButtonText(user.role)}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchUsers}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  )
}
