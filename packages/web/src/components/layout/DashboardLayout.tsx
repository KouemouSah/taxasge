'use client'

/**
 * Dashboard Layout
 * Main layout wrapper for all dashboard pages with sidebar navigation
 * Renders appropriate sidebar based on user role:
 * - AdminSidebar for admin users
 * - AgentSidebar for ministry_agent (Treasury, DGI agents)
 * - DashboardSidebar for citizens/businesses
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { DashboardSidebar, MobileSidebar } from './DashboardSidebar'
import { AgentSidebar } from './AgentSidebar'
import { AdminSidebar } from '@/modules/admin/components'
import { getAuthData } from '@/core/auth/storage'
import { APP_CONSTANTS } from '@/core/config/constants'
import type { User } from '@/types/auth'
import { useLocale, useTranslations } from 'next-intl'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const _tCommon = useTranslations('common')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authData = getAuthData()

    if (!authData) {
      router.push(`/${locale}/auth`)
      return
    }

    // Map backend status to is_active boolean for UI compatibility
    const userData = {
      ...authData.user,
      is_active: authData.user.status === 'active',
      email_verified: authData.user.email_verified ?? false,
    }

    setUser(userData as User)
    setIsLoading(false)
  }, [router, locale])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Determine which sidebar to show based on user role
  const isAdmin = user?.role === APP_CONSTANTS.USER_ROLES.ADMIN
  const isMinistryAgent = user?.role === APP_CONSTANTS.USER_ROLES.MINISTRY_AGENT
  const isDgiAgent = user?.role === APP_CONSTANTS.USER_ROLES.DGI_AGENT

  // Determine sidebar and title
  const getSidebar = () => {
    if (isAdmin) return <AdminSidebar />
    if (isMinistryAgent || isDgiAgent) return <AgentSidebar />
    return <DashboardSidebar />
  }

  const getTitle = () => {
    if (isAdmin) return 'TaxasGE Admin'
    if (isMinistryAgent) return 'TaxasGE Agent'
    return 'TaxasGE'
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Role-based */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        {getSidebar()}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:hidden">
          <MobileSidebar />
          <Image src="/logo.png" alt="TaxasGE Logo" width={32} height={32} className="h-8 w-8" />
          <h1 className="text-lg font-semibold">{getTitle()}</h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t('copyright')}
          </p>
        </footer>
      </div>
    </div>
  )
}
