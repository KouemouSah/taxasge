'use client'

/**
 * User Permissions Admin Page
 * Manage individual user permission overrides
 *
 * @page /dashboard/admin/user-permissions
 * @author Claude Code
 * @date 2025-12-04
 */

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Key, Plus, Shield, User, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

import {
  UserSelector,
  GrantPermissionDialog,
  UserPermissionList,
  useUserPermissions,
} from '@/modules/user-permissions-admin'
import type { SimpleUser } from '@/modules/user-permissions-admin'

export default function UserPermissionsPage() {
  const t = useTranslations('admin.userPermissions')
  const tCommon = useTranslations('common')

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null)
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)

  // Query user permissions when a user is selected
  const {
    data: userPermissionsData,
    isLoading,
    error,
    refetch,
  } = useUserPermissions(selectedUserId)

  // Extract permission IDs already assigned to the user
  const existingPermissionIds = useMemo(() => {
    if (!userPermissionsData?.user_permissions) return []
    return userPermissionsData.user_permissions.map((p) => p.permission_id)
  }, [userPermissionsData])

  // Handlers
  const handleUserSelect = (userId: string | null, user: SimpleUser | null) => {
    setSelectedUserId(userId)
    setSelectedUser(user)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8" />
            {t('title') || 'User Permissions'}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle') || 'Manage individual permission overrides for users'}
          </p>
        </div>
      </div>

      {/* User Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('selectUserTitle') || 'Select User'}
          </CardTitle>
          <CardDescription>
            {t('selectUserDescription') || 'Search and select a user to manage their permission overrides.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <UserSelector
                value={selectedUserId}
                onValueChange={handleUserSelect}
              />
            </div>
            {selectedUserId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                title={tCommon('refresh') || 'Refresh'}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Permissions Management */}
      {selectedUserId && selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('permissionsFor', { name: `${selectedUser.first_name} ${selectedUser.last_name}` }) ||
                    `Permissions for ${selectedUser.first_name} ${selectedUser.last_name}`}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{selectedUser.email}</span>
                  <Badge variant="secondary">{selectedUser.role}</Badge>
                </CardDescription>
              </div>
              <Button onClick={() => setIsGrantDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addOverride') || 'Add Override'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center gap-2 text-destructive py-8 justify-center">
                <AlertCircle className="h-5 w-5" />
                <span>{error instanceof Error ? error.message : 'Error loading permissions'}</span>
              </div>
            ) : (
              <Tabs defaultValue="overrides" className="w-full">
                <TabsList>
                  <TabsTrigger value="overrides">
                    {t('overridesTab') || 'Overrides'}
                    {userPermissionsData?.user_permissions && (
                      <Badge variant="secondary" className="ml-2">
                        {userPermissionsData.user_permissions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="effective">
                    {t('effectiveTab') || 'Effective Permissions'}
                  </TabsTrigger>
                  <TabsTrigger value="role">
                    {t('roleTab') || 'From Role'}
                  </TabsTrigger>
                </TabsList>

                {/* Overrides Tab */}
                <TabsContent value="overrides" className="mt-4">
                  <UserPermissionList
                    permissions={userPermissionsData?.user_permissions || []}
                    userId={selectedUserId}
                    isLoading={isLoading}
                    onRefresh={() => refetch()}
                  />
                </TabsContent>

                {/* Effective Permissions Tab */}
                <TabsContent value="effective" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {t('effectiveDescription') ||
                          'These are all the permissions this user has from their role and individual overrides combined.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userPermissionsData?.effective_permissions?.length ? (
                          userPermissionsData.effective_permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            {t('noEffectivePermissions') || 'No effective permissions'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Role Permissions Tab */}
                <TabsContent value="role" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t('roleLabel') || 'Role'}:</span>
                        <Badge variant="secondary">
                          {userPermissionsData?.role_name || userPermissionsData?.role || selectedUser.role}
                        </Badge>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        {t('rolePermissionsDescription') ||
                          'Permissions inherited from the user\'s assigned role.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userPermissionsData?.role_permissions?.length ? (
                          userPermissionsData.role_permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            {t('noRolePermissions') || 'No permissions from role'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedUserId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {t('noUserSelected') || 'No user selected'}
              </p>
              <p className="text-sm mt-2">
                {t('noUserSelectedHint') || 'Select a user above to manage their permission overrides.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grant Permission Dialog */}
      <GrantPermissionDialog
        user={selectedUser}
        existingPermissionIds={existingPermissionIds}
        open={isGrantDialogOpen}
        onOpenChange={setIsGrantDialogOpen}
      />
    </div>
  )
}
