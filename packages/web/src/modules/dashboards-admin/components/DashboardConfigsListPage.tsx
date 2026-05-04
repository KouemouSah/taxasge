/**
 * DashboardConfigsListPage — wraps the admin /dashboards/config view.
 *
 * Lists the 3 registered dashboards with their current config + an
 * inline edit form per row. Backend gates on `dashboards.manage`; a
 * 403 surfaces as a clear access-denied banner.
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Lock, Settings } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { useDashboardConfigs } from '../hooks/useDashboardConfigs'
import { DashboardConfigForm } from './DashboardConfigForm'

export function DashboardConfigsListPage() {
  const t = useTranslations('admin.dashboards.config')
  const { data, isLoading, error } = useDashboardConfigs()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      return (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>{t('forbiddenTitle')}</AlertTitle>
          <AlertDescription>{t('forbiddenHelp')}</AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message ?? t('errorGeneric')}
        </AlertDescription>
      </Alert>
    )
  }

  const configs = data?.configs ?? []

  if (configs.length === 0) {
    return (
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertTitle>{t('emptyTitle')}</AlertTitle>
        <AlertDescription>{t('emptyHelp')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <DashboardConfigForm key={config.dashboard_id} config={config} />
      ))}
    </div>
  )
}
