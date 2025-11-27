'use client'

/**
 * Dashboard Layout
 * Main layout wrapper for all dashboard pages with sidebar navigation
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { DashboardSidebar, MobileSidebar } from './DashboardSidebar'
import { getAuthData } from '@/core/auth/storage'
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <DashboardSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:hidden">
          <MobileSidebar />
          <Image src="/logo.png" alt="TaxasGE Logo" width={32} height={32} className="h-8 w-8" />
          <h1 className="text-lg font-semibold">TaxasGE</h1>
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
