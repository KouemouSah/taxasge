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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Key, Search, Loader2, AlertCircle, AlertTriangle, Shield, ChevronRight } from 'lucide-react'
import { usePermissions, usePermissionsByResource, useModuleNames } from '@/modules/permissions-admin'
import type { Permission } from '@/modules/permissions-admin'

export default function PermissionsPage() {
  const t = useTranslations('admin.permissions')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [criticalFilter, setCriticalFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped')

  // Queries
  const { data: permissions = [], isLoading, error, refetch } = usePermissions({
    module_name: moduleFilter === 'all' ? undefined : moduleFilter,
    is_critical: criticalFilter === 'all' ? undefined : criticalFilter === 'critical',
    search: searchQuery || undefined,
  })

  const { data: _permissionsByResource = {} } = usePermissionsByResource()
  const moduleNames = useModuleNames()

  // Filter permissions by search
  const filteredPermissions = permissions.filter((perm) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      perm.name.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query) ||
      perm.resource.toLowerCase().includes(query) ||
      perm.action.toLowerCase().includes(query)
    )
  })

  // Group by module for grouped view
  const groupedByModule = filteredPermissions.reduce((acc, perm) => {
    const module = perm.module_name || 'other'
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  // Stats
  const totalPermissions = permissions.length
  const criticalPermissions = permissions.filter(p => p.is_critical).length
  const uniqueModules = new Set(permissions.map(p => p.module_name)).size

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
              <span>{error instanceof Error ? error.message : 'Error loading permissions'}</span>
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPermissions') || 'Total Permissions'}</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('criticalPermissions') || 'Critical Permissions'}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalPermissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('modules') || 'Modules'}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueModules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description') || 'View and manage all system permissions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder') || 'Search permissions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allModules') || 'All Modules'}</SelectItem>
                {moduleNames.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={criticalFilter} onValueChange={setCriticalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
                <SelectItem value="critical">{t('criticalOnly') || 'Critical Only'}</SelectItem>
                <SelectItem value="normal">{t('normalOnly') || 'Normal Only'}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                {t('grouped') || 'Grouped'}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                {t('list') || 'List'}
              </Button>
            </div>
          </div>

          {/* Permissions Display */}
          {viewMode === 'grouped' ? (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedByModule).map(([module, perms]) => (
                <AccordionItem key={module} value={module}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {module}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {perms.length} {t('permissionsCount') || 'permissions'}
                      </span>
                      {perms.some(p => p.is_critical) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {perms.filter(p => p.is_critical).length} {t('critical') || 'critical'}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-md mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('name') || 'Name'}</TableHead>
                            <TableHead>{t('resource') || 'Resource'}</TableHead>
                            <TableHead>{t('action') || 'Action'}</TableHead>
                            <TableHead>{t('description') || 'Description'}</TableHead>
                            <TableHead>{t('type') || 'Type'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perms.map((perm) => (
                            <TableRow key={perm.id}>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {perm.name}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{perm.resource}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  {perm.action}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <span className="text-sm text-muted-foreground truncate block">
                                  {perm.description || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {perm.is_critical ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t('critical') || 'Critical'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{t('normal') || 'Normal'}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name') || 'Name'}</TableHead>
                    <TableHead>{t('module') || 'Module'}</TableHead>
                    <TableHead>{t('resource') || 'Resource'}</TableHead>
                    <TableHead>{t('action') || 'Action'}</TableHead>
                    <TableHead>{t('description') || 'Description'}</TableHead>
                    <TableHead>{t('type') || 'Type'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t('noPermissionsFound') || 'No permissions found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {perm.name}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {perm.module_name || 'other'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{perm.resource}</Badge>
                        </TableCell>
                        <TableCell>{perm.action}</TableCell>
                        <TableCell className="max-w-[250px]">
                          <span className="text-sm text-muted-foreground truncate block">
                            {perm.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {perm.is_critical ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t('critical') || 'Critical'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{t('normal') || 'Normal'}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
