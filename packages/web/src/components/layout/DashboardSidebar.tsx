'use client'

/**
 * Dashboard Sidebar Navigation
 * Main navigation menu for authenticated users
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { authApi } from '@/lib/api/auth'
import { getAuthData, clearAuthData } from '@/lib/auth/storage'
import { useLocale, useTranslations } from 'next-intl'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const locale = useLocale()
  const t = useTranslations('dashboard')

  const navItems: NavItem[] = [
    {
      titleKey: 'overview',
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      titleKey: 'declarations',
      href: `/${locale}/dashboard/declarations`,
      icon: FileText,
    },
    {
      titleKey: 'support',
      href: `/${locale}/dashboard/support`,
      icon: HelpCircle,
    },
    {
      titleKey: 'profile',
      href: `/${locale}/dashboard/profile`,
      icon: User,
    },
    {
      titleKey: 'settings',
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
    },
  ]

  const handleLogout = async () => {
    const authData = getAuthData()

    if (!authData) {
      router.push(`/${locale}/auth`)
      return
    }

    try {
      await authApi.logout({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      })

      clearAuthData()

      toast({
        title: t('logoutSuccess'),
        description: t('logoutMessage'),
      })

      router.push(`/${locale}`)
    } catch (error: unknown) {
      // Even if logout fails on backend, clear local storage
      clearAuthData()
      router.push(`/${locale}`)
    }
  }

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <aside className={cn('h-full border-r bg-card', className)}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
            <Image src="/logo.png" alt="TaxasGE Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-semibold">TaxasGE</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent',
                    active
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(item.titleKey)}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Logout Button */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t('logout')}
          </Button>
        </div>
      </div>
    </aside>
  )
}

// Mobile Sidebar
export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <DashboardSidebar />
      </SheetContent>
    </Sheet>
  )
}
