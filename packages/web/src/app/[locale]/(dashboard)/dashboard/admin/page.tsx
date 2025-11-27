/**
 * Admin Dashboard Index Page
 * Main dashboard with statistics and overview
 *
 * MIGRATED: Phase 4 - Full i18n
 *
 * @module dashboard/admin
 * @author Claude Code
 * @date 2025-11-24
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { StatsCards, RecentActivity, QuickActions } from '@/modules/admin/components'

export default function AdminDashboard() {
  const t = useTranslations('admin')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('pageTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('pageSubtitle')}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity />

        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.systemHealth')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('dashboard.apiBackend')}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                {t('dashboard.operational')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('dashboard.database')}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                {t('dashboard.operational')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('dashboard.storage')}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                {t('dashboard.operational')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('dashboard.email')}</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                {t('dashboard.degraded')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
