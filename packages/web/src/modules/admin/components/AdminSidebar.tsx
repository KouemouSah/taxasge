/**
 * Admin Sidebar Navigation
 * Main navigation for admin dashboard with i18n support
 * Features collapsible accordion menus with nested sub-categories
 *
 * @module modules/admin/components
 * @author Claude Code
 * @date 2025-11-24
 */

'use client'

import React, { useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/core/utils'
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  ClipboardList,
  ListOrdered,
  UserCog,
  Building2,
  Layers,
  FolderTree,
  Languages,
  MessageSquare,
  Mail,
  MessageCircle,
  Webhook,
  Phone,
  Bell,
  Send,
  Headphones,
  TicketIcon,
  ListChecks,
  GitBranch,
  DollarSign,
  CalendarClock,
  Landmark,
  Radio,
  Workflow,
  Cog,
  LayoutList,
  Link2,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAuthData } from '@/core/auth/storage'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

// Type definitions for navigation items
interface NavSubItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSubCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavSubItem[]
}

interface NavGroup {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavSubItem[]
  subCategories?: NavSubCategory[]
}

interface NavSingleItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type NavItem = NavGroup | NavSingleItem

// Type guard to check if item is a group
function isNavGroup(item: NavItem): item is NavGroup {
  return 'id' in item && ('items' in item || 'subCategories' in item)
}

// Type guard to check if group has sub-categories
function hasSubCategories(group: NavGroup): group is NavGroup & { subCategories: NavSubCategory[] } {
  return 'subCategories' in group && Array.isArray(group.subCategories)
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [collapsed, setCollapsed] = React.useState(false)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const [expandedSubCategories, setExpandedSubCategories] = React.useState<Set<string>>(new Set())

  // Navigation items with i18n
  const navigationItems: NavItem[] = useMemo(() => [
    {
      title: t('nav.dashboard'),
      href: `/${locale}/dashboard/admin`,
      icon: LayoutDashboard,
    },
    {
      id: 'access',
      title: t('nav.accessManagement'),
      icon: Shield,
      items: [
        {
          title: t('nav.agents'),
          href: `/${locale}/dashboard/admin/agents`,
          icon: UserCog,
        },
        {
          title: t('nav.users'),
          href: `/${locale}/dashboard/admin/users`,
          icon: Users,
        },
        {
          title: t('nav.rolesPermissions'),
          href: `/${locale}/dashboard/admin/roles`,
          icon: Key,
        },
        {
          title: t('nav.assignments'),
          href: `/${locale}/dashboard/admin/assignments`,
          icon: ClipboardList,
        },
      ],
    },
    // SERVICES FISCAUX
    {
      id: 'fiscal',
      title: t('nav.fiscalServices'),
      icon: FileText,
      items: [
        {
          title: t('nav.catalog'),
          href: `/${locale}/dashboard/admin/fiscal-services`,
          icon: FileText,
        },
        {
          title: t('nav.ministries'),
          href: `/${locale}/dashboard/admin/ministries`,
          icon: Building2,
        },
        {
          title: t('nav.sectors'),
          href: `/${locale}/dashboard/admin/sectors`,
          icon: Layers,
        },
        {
          title: t('nav.categories'),
          href: `/${locale}/dashboard/admin/categories`,
          icon: FolderTree,
        },
        {
          title: t('nav.documentTemplates'),
          href: `/${locale}/dashboard/admin/document-templates`,
          icon: FileText,
        },
        {
          title: t('nav.procedureTemplates'),
          href: `/${locale}/dashboard/admin/procedure-templates`,
          icon: ListOrdered,
        },
      ],
    },
    // CONFIGURATION - with sub-categories
    {
      id: 'config',
      title: t('nav.configuration'),
      icon: Settings,
      subCategories: [
        // Communications sub-category
        {
          id: 'communications',
          title: t('nav.communications'),
          icon: Radio,
          items: [
            {
              title: t('nav.emailTemplates'),
              href: `/${locale}/dashboard/admin/communications/email-templates`,
              icon: Mail,
            },
            {
              title: t('nav.smsTemplates'),
              href: `/${locale}/dashboard/admin/communications/sms-templates`,
              icon: MessageCircle,
            },
            {
              title: t('nav.notificationTemplates'),
              href: `/${locale}/dashboard/admin/communications/notification-templates`,
              icon: Bell,
            },
            {
              title: t('nav.pushTemplates'),
              href: `/${locale}/dashboard/admin/communications/push-templates`,
              icon: Send,
            },
            {
              title: t('nav.webhooks'),
              href: `/${locale}/dashboard/admin/communications/webhooks`,
              icon: Webhook,
            },
            {
              title: t('nav.ussdConfig'),
              href: `/${locale}/dashboard/admin/communications/ussd`,
              icon: Phone,
            },
            {
              title: t('nav.providerSettings'),
              href: `/${locale}/dashboard/admin/communications/provider-settings`,
              icon: MessageSquare,
            },
          ],
        },
        // Workflows sub-category
        {
          id: 'workflows',
          title: t('nav.workflowsConfig'),
          icon: Workflow,
          items: [
            {
              title: t('nav.workflows'),
              href: `/${locale}/dashboard/admin/service-requests/workflows`,
              icon: GitBranch,
            },
            {
              title: t('nav.tariffs'),
              href: `/${locale}/dashboard/admin/service-requests/tariffs`,
              icon: DollarSign,
            },
            {
              title: t('nav.appointments'),
              href: `/${locale}/dashboard/admin/service-requests/appointments`,
              icon: CalendarClock,
            },
            {
              title: t('nav.entities'),
              href: `/${locale}/dashboard/admin/entities`,
              icon: Landmark,
            },
          ],
        },
        // System sub-category
        {
          id: 'system',
          title: t('nav.system'),
          icon: Cog,
          items: [
            {
              title: t('nav.auditLogs'),
              href: `/${locale}/dashboard/admin/audit-logs`,
              icon: FileText,
            },
            {
              title: t('nav.translations'),
              href: `/${locale}/dashboard/admin/translations`,
              icon: Languages,
            },
            {
              title: t('nav.settings'),
              href: `/${locale}/dashboard/admin/settings`,
              icon: Settings,
            },
            {
              title: t('nav.monitoring'),
              href: `/${locale}/dashboard/admin/monitoring`,
              icon: Activity,
            },
          ],
        },
        // Menu Configuration sub-category
        {
          id: 'menuConfig',
          title: t('nav.menuConfiguration'),
          icon: LayoutList,
          items: [
            {
              title: t('nav.workflowMappings'),
              href: `/${locale}/dashboard/admin/menu-config`,
              icon: Link2,
            },
          ],
        },
      ],
    },
    // SUPPORT
    {
      id: 'support',
      title: t('nav.support'),
      icon: Headphones,
      items: [
        {
          title: t('nav.supportTickets'),
          href: `/${locale}/dashboard/admin/support`,
          icon: TicketIcon,
        },
        {
          title: t('nav.supportCategories'),
          href: `/${locale}/dashboard/admin/support/categories`,
          icon: ListChecks,
        },
      ],
    },
  ], [t, locale])

  // Check if a path is active in sub-items
  const isPathActiveInItems = useCallback((items: NavSubItem[]) => {
    return items.some(sub => pathname === sub.href || pathname?.startsWith(sub.href + '/'))
  }, [pathname])

  // Find which group/subCategory contains the active route and expand it on mount
  React.useEffect(() => {
    for (const item of navigationItems) {
      if (isNavGroup(item)) {
        if (hasSubCategories(item)) {
          // Check sub-categories
          for (const subCat of item.subCategories) {
            if (isPathActiveInItems(subCat.items)) {
              setExpandedGroups(prev => new Set(prev).add(item.id))
              setExpandedSubCategories(prev => new Set(prev).add(subCat.id))
              return
            }
          }
        } else if (item.items && isPathActiveInItems(item.items)) {
          setExpandedGroups(prev => new Set(prev).add(item.id))
          return
        }
      }
    }
  }, [pathname, navigationItems, isPathActiveInItems])

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }, [])

  // Toggle sub-category expansion
  const toggleSubCategory = useCallback((subCatId: string) => {
    setExpandedSubCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subCatId)) {
        newSet.delete(subCatId)
      } else {
        newSet.add(subCatId)
      }
      return newSet
    })
  }, [])

  const handleLogout = () => {
    clearAuthData()
    toast({
      title: t('nav.logoutSuccess'),
      description: t('nav.logoutMessage'),
    })
    router.push(`/${locale}`)
  }

  // Check if any item in the group is active
  const isGroupActive = useCallback((group: NavGroup) => {
    if (hasSubCategories(group)) {
      return group.subCategories.some(subCat => isPathActiveInItems(subCat.items))
    }
    return group.items ? isPathActiveInItems(group.items) : false
  }, [isPathActiveInItems])

  // Render sub-items
  const renderSubItems = (items: NavSubItem[], indentLevel: number = 1) => (
    <div className={cn('space-y-1 mt-1', !collapsed && indentLevel === 1 && 'ml-4', !collapsed && indentLevel === 2 && 'ml-6')}>
      {items.map((subItem) => {
        const SubIcon = subItem.icon
        const isActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/')

        return (
          <Link
            key={subItem.href}
            href={subItem.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:text-gray-900'
            )}
            title={collapsed ? subItem.title : undefined}
          >
            <SubIcon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{subItem.title}</span>}
          </Link>
        )
      })}
    </div>
  )

  // Render sub-categories
  const renderSubCategories = (subCategories: NavSubCategory[]) => (
    <div className={cn('space-y-1 mt-1', !collapsed && 'ml-2')}>
      {subCategories.map((subCat) => {
        const SubCatIcon = subCat.icon
        const isSubCatExpanded = expandedSubCategories.has(subCat.id)
        const hasActiveChild = isPathActiveInItems(subCat.items)

        return (
          <div key={subCat.id}>
            {/* Sub-category header */}
            <button
              onClick={() => toggleSubCategory(subCat.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs w-full transition-all hover:bg-gray-100',
                hasActiveChild
                  ? 'text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title={collapsed ? subCat.title : undefined}
            >
              <SubCatIcon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left font-medium">{subCat.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      isSubCatExpanded ? 'rotate-180' : ''
                    )}
                  />
                </>
              )}
            </button>

            {/* Sub-category items */}
            {!collapsed && (
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  isSubCatExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                {renderSubItems(subCat.items, 2)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <aside
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{t('pageTitle')}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation with ScrollArea */}
      <ScrollArea className="flex-1">
        <nav className="py-4">
          <div className="space-y-1 px-2">
            {navigationItems.map((item) => {
              // Group with collapsible sub-items or sub-categories
              if (isNavGroup(item)) {
                const GroupIcon = item.icon
                const isExpanded = expandedGroups.has(item.id)
                const hasActiveChild = isGroupActive(item)

                return (
                  <div key={item.id} className="pt-2">
                    {/* Group header - clickable */}
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full transition-all hover:bg-gray-100',
                        hasActiveChild
                          ? 'text-primary font-medium'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <GroupIcon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              isExpanded ? 'rotate-180' : ''
                            )}
                          />
                        </>
                      )}
                    </button>

                    {/* Collapsible content */}
                    {!collapsed && (
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200 ease-in-out',
                          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        {hasSubCategories(item)
                          ? renderSubCategories(item.subCategories)
                          : item.items && renderSubItems(item.items)
                        }
                      </div>
                    )}
                  </div>
                )
              }

              // Single item (Dashboard link)
              const singleItem = item as NavSingleItem
              const Icon = singleItem.icon
              const isActive = pathname === singleItem.href

              return (
                <Link
                  key={singleItem.href}
                  href={singleItem.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:text-gray-900'
                  )}
                  title={collapsed ? singleItem.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{singleItem.title}</span>}
                </Link>
              )
            })}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
        {/* Logout Button */}
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleLogout}
          title={collapsed ? t('nav.logout') : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">{t('nav.logout')}</span>}
        </Button>

        {/* Version */}
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center">
            Admin Panel v1.0
          </div>
        )}
      </div>
    </aside>
  )
}

// =============================================================================
// MOBILE ADMIN SIDEBAR
// =============================================================================

/**
 * Mobile Admin Sidebar
 * Sheet-based sidebar for mobile viewports
 */
export function MobileAdminSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle admin menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <AdminSidebar />
      </SheetContent>
    </Sheet>
  );
}
