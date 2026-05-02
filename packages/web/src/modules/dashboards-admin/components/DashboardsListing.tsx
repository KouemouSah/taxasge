'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, BarChart3, Construction, Lock } from 'lucide-react'
import { useReportsConfig } from '../hooks/useReportsConfig'
import type { DashboardRlsMode } from '../types'

const RLS_BADGE_VARIANT: Record<DashboardRlsMode, 'default' | 'secondary' | 'outline'> = {
  entity: 'default',
  agent_via_join: 'default',
  admin_only: 'secondary',
  public: 'outline',
}

export function DashboardsListing() {
  const t = useTranslations('admin.dashboards')
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const { data, isLoading, error } = useReportsConfig()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-full" />
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

  const reports = data?.reports ?? []

  if (reports.length === 0) {
    return (
      <Alert>
        <Construction className="h-4 w-4" />
        <AlertTitle>{t('emptyTitle')}</AlertTitle>
        <AlertDescription>{t('emptyHelp')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => {
        const ready = !!report.looker_report_id
        const card = (
          <Card className={ready ? 'transition hover:shadow-md cursor-pointer' : 'opacity-70'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {ready ? (
                    <BarChart3 className="h-5 w-5 text-primary" />
                  ) : (
                    <Construction className="h-5 w-5 text-amber-500" />
                  )}
                  {report.label}
                </span>
                <Badge variant={RLS_BADGE_VARIANT[report.rls_mode]}>
                  {t(`rls.${report.rls_mode}`)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
              {!ready && (
                <p className="mt-3 text-xs text-amber-600">
                  {t('awaitingSetup')}
                </p>
              )}
            </CardContent>
          </Card>
        )
        if (!ready) return <div key={report.dashboard_id}>{card}</div>
        return (
          <Link
            key={report.dashboard_id}
            href={`/${locale}/dashboard/admin/dashboards/${report.dashboard_id}`}
          >
            {card}
          </Link>
        )
      })}
    </div>
  )
}
