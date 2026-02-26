'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import {
  StatsCards,
  QuickActions,
  OperationalOverview,
  SystemStatusBar,
} from '@/modules/admin/components'

export default function AdminDashboard() {
  const t = useTranslations('admin')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('pageSubtitle')}</p>
      </div>

      {/* Stats Cards — 4 actionable KPIs */}
      <StatsCards />

      {/* Operational Overview — alerts + workload by entity */}
      <OperationalOverview />

      {/* Quick Actions */}
      <QuickActions />

      {/* System Status — compact single-line bar */}
      <SystemStatusBar />
    </div>
  )
}
