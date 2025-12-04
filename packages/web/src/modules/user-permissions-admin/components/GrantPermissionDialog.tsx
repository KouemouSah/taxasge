'use client'

/**
 * GrantPermissionDialog Component
 * Dialog for granting a permission to a user
 *
 * @module user-permissions-admin/components
 * @author Claude Code
 * @date 2025-12-04
 */

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

import { usePermissions } from '@/modules/permissions-admin/hooks/usePermissions'
import { useGrantPermission } from '../hooks/useUserPermissions'
import type { Permission } from '@/modules/permissions-admin/types'
import type { SimpleUser } from '../types'

interface GrantPermissionDialogProps {
  user: SimpleUser | null
  existingPermissionIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DurationType = 'permanent' | '24h' | '7d' | '30d' | 'custom'

export function GrantPermissionDialog({
  user,
  existingPermissionIds,
  open,
  onOpenChange,
}: GrantPermissionDialogProps) {
  const t = useTranslations('admin.userPermissions')
  const tCommon = useTranslations('common')

  // State
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null)
  const [granted, setGranted] = useState<boolean>(true)
  const [durationType, setDurationType] = useState<DurationType>('permanent')
  const [customDays, setCustomDays] = useState<number>(7)
  const [reason, setReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Queries
  const { data: allPermissions = [], isLoading: isLoadingPermissions } = usePermissions()
  const grantMutation = useGrantPermission()

  // Filter permissions: exclude already assigned ones
  const availablePermissions = useMemo(() => {
    return allPermissions.filter((perm) => {
      // Exclude already assigned
      if (existingPermissionIds.includes(perm.id)) return false

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          perm.name.toLowerCase().includes(query) ||
          perm.description.toLowerCase().includes(query) ||
          perm.resource.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [allPermissions, existingPermissionIds, searchQuery])

  // Group by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    availablePermissions.forEach((perm) => {
      const module = perm.module_name || 'other'
      if (!groups[module]) groups[module] = []
      groups[module].push(perm)
    })
    return groups
  }, [availablePermissions])

  // Calculate expiration date
  const calculateExpiresAt = (): string | null => {
    if (durationType === 'permanent') return null

    const now = new Date()
    let days = 0

    switch (durationType) {
      case '24h':
        days = 1
        break
      case '7d':
        days = 7
        break
      case '30d':
        days = 30
        break
      case 'custom':
        days = customDays
        break
    }

    now.setDate(now.getDate() + days)
    return now.toISOString()
  }

  // Handlers
  const handleGrant = async () => {
    if (!user || !selectedPermissionId) return

    try {
      await grantMutation.mutateAsync({
        userId: user.id,
        data: {
          permission_id: selectedPermissionId,
          granted,
          expires_at: calculateExpiresAt(),
          reason: reason.trim() || undefined,
        },
      })

      toast.success(
        granted
          ? t('permissionGranted') || 'Permission granted successfully'
          : t('permissionDenied') || 'Permission denied successfully'
      )
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to grant permission')
    }
  }

  const handleClose = () => {
    setSelectedPermissionId(null)
    setGranted(true)
    setDurationType('permanent')
    setCustomDays(7)
    setReason('')
    setSearchQuery('')
    onOpenChange(false)
  }

  const selectedPermission = allPermissions.find((p) => p.id === selectedPermissionId)

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('grantPermission') || 'Grant Permission'}
          </DialogTitle>
          <DialogDescription>
            {t('grantPermissionDescription', {
              name: `${user.first_name} ${user.last_name}`,
            }) || `Grant or deny a specific permission to ${user.first_name} ${user.last_name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Permission Selection */}
          <div className="space-y-2">
            <Label>{t('selectPermission') || 'Select Permission'}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPermissions') || 'Search permissions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[200px] border rounded-md">
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availablePermissions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {searchQuery
                    ? t('noPermissionsFound') || 'No permissions found'
                    : t('allPermissionsAssigned') || 'All permissions are already assigned'}
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {Object.entries(groupedPermissions)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([module, perms]) => (
                      <div key={module}>
                        <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          {module.replace(/_/g, ' ')}
                        </div>
                        <div className="space-y-1">
                          {perms.map((perm) => (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => setSelectedPermissionId(perm.id)}
                              className={`w-full text-left p-2 rounded-md transition-colors ${
                                selectedPermissionId === perm.id
                                  ? 'bg-primary/10 border border-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {perm.name}
                                </code>
                                {perm.is_critical && (
                                  <Badge variant="destructive" className="text-xs gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t('critical') || 'Critical'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {perm.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected Permission Warning */}
          {selectedPermission?.is_critical && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {t('criticalPermissionWarning') ||
                  'This is a critical permission. Make sure you understand the implications.'}
              </span>
            </div>
          )}

          {/* Grant/Deny Toggle */}
          <div className="space-y-2">
            <Label>{t('action') || 'Action'}</Label>
            <RadioGroup
              value={granted ? 'grant' : 'deny'}
              onValueChange={(v) => setGranted(v === 'grant')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grant" id="grant" />
                <Label htmlFor="grant" className="cursor-pointer">
                  {t('grant') || 'Grant'} - {t('allowAccess') || 'Allow access'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deny" id="deny" />
                <Label htmlFor="deny" className="cursor-pointer">
                  {t('deny') || 'Deny'} - {t('blockAccess') || 'Block access'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>{t('duration') || 'Duration'}</Label>
            <Select value={durationType} onValueChange={(v) => setDurationType(v as DurationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">{t('permanent') || 'Permanent'}</SelectItem>
                <SelectItem value="24h">{t('24hours') || '24 hours'}</SelectItem>
                <SelectItem value="7d">{t('7days') || '7 days'}</SelectItem>
                <SelectItem value="30d">{t('30days') || '30 days'}</SelectItem>
                <SelectItem value="custom">{t('custom') || 'Custom'}</SelectItem>
              </SelectContent>
            </Select>

            {durationType === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('days') || 'days'}</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('reason') || 'Reason'} ({t('optional') || 'optional'})</Label>
            <Textarea
              id="reason"
              placeholder={t('reasonPlaceholder') || 'Why is this permission being granted/denied?'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={grantMutation.isPending}>
            {tCommon('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!selectedPermissionId || grantMutation.isPending}
            variant={granted ? 'default' : 'destructive'}
          >
            {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {granted ? t('grantPermission') || 'Grant Permission' : t('denyPermission') || 'Deny Permission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GrantPermissionDialog
