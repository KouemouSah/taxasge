/**
 * Recent Activity Component
 * Display recent audit log entries with i18n support
 *
 * @module modules/admin/components
 * @author Claude Code
 * @date 2025-11-24
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function RecentActivity() {
  const t = useTranslations('admin.dashboard')

  // Mock data - replace with actual data from API
  const activities = [
    {
      id: 1,
      user: 'Admin System',
      action: t('activityRoleCreated'),
      target: 'ADMIN',
      time: t('time5min'),
      type: 'create',
    },
    {
      id: 2,
      user: 'Jean Dupont',
      action: t('activityPermissionsModified'),
      target: 'USER',
      time: t('time12min'),
      type: 'update',
    },
    {
      id: 3,
      user: 'Marie Martin',
      action: t('activityUserDeleted'),
      target: 'user@example.com',
      time: t('time1hour'),
      type: 'delete',
    },
    {
      id: 4,
      user: 'Admin System',
      action: t('activityTempPermissionGranted'),
      target: 'declarations:submit',
      time: t('time2hours'),
      type: 'grant',
    },
    {
      id: 5,
      user: 'Pierre Durand',
      action: t('activityLoginSuccess'),
      target: 'Dashboard',
      time: t('time3hours'),
      type: 'login',
    },
  ]

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'grant':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.user
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activity.user}</span>
                  <Badge variant="outline" className={getActionColor(activity.type)}>
                    {activity.action}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {t('target')}: <span className="font-mono">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
