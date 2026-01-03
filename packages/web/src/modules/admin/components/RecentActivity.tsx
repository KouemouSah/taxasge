/**
 * Recent Activity Component
 * Display recent audit log entries with real backend data
 *
 * BACKEND INTEGRATION:
 * - Audit logs: GET /api/v1/audit-logs (audit-logs-admin module)
 *
 * @module modules/admin/components
 * @author Claude Code
 * @date 2025-11-27
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, Activity } from 'lucide-react'
import auditLogsApi from '@/modules/audit-logs-admin/services/api'
import type { AuditLog } from '@/modules/audit-logs-admin/types'

export default function RecentActivity() {
  const t = useTranslations('admin.dashboard')
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const logs = await auditLogsApi.getAll({
          page: 1,
          page_size: 5,
        })
        setActivities(logs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching activities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('register')) {
      return 'bg-green-100 text-green-800'
    }
    if (actionLower.includes('update') || actionLower.includes('modify')) {
      return 'bg-blue-100 text-blue-800'
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'bg-red-100 text-red-800'
    }
    if (actionLower.includes('grant') || actionLower.includes('permission')) {
      return 'bg-purple-100 text-purple-800'
    }
    if (actionLower.includes('login') || actionLower.includes('auth')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getActionLabel = (action: string) => {
    // Try to get translation, fallback to action name
    const key = `activityType.${action}`
    const translated = t(key as Parameters<typeof t>[0])
    // If translation returns the key itself, use the action name
    return translated === key ? action.replace(/_/g, ' ') : translated
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('timeJustNow') || 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  const getUserInitials = (userId: string) => {
    // For now, use first 2 chars of user ID
    return userId.substring(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivityTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivityTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivityTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>{t('noRecentActivity')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentActivityTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getUserInitials(activity.user_id)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {activity.user_id.substring(0, 8)}...
                  </span>
                  <Badge variant="outline" className={getActionColor(activity.action)}>
                    {getActionLabel(activity.action)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {activity.resource_type && (
                    <>
                      <span className="font-mono">{activity.resource_type}</span>
                      {activity.resource_id && (
                        <span className="text-gray-400"> / {activity.resource_id.substring(0, 8)}...</span>
                      )}
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
