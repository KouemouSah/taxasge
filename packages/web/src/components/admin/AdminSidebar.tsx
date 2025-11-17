/**
 * Admin Sidebar Navigation
 * Main navigation for admin dashboard
 *
 * @module components/admin
 * @author Claude Code
 * @date 2025-11-18
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Navigation items
const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestion',
    items: [
      {
        title: 'Utilisateurs',
        href: '/dashboard/admin/users',
        icon: Users,
      },
      {
        title: 'Rôles',
        href: '/dashboard/admin/roles',
        icon: Shield,
      },
      {
        title: 'Permissions',
        href: '/dashboard/admin/permissions',
        icon: Key,
      },
    ],
  },
  {
    title: 'Système',
    items: [
      {
        title: 'Logs d\'Audit',
        href: '/dashboard/admin/audit-logs',
        icon: FileText,
      },
      {
        title: 'Paramètres',
        href: '/dashboard/admin/settings',
        icon: Settings,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin</span>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navigationItems.map((item, index) => {
            // Group header
            if ('items' in item) {
              return (
                <div key={index} className="pt-4">
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {item.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {item.items.map((subItem) => {
                      const Icon = subItem.icon;
                      const isActive = pathname === subItem.href;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-gray-700 hover:text-gray-900'
                          )}
                          title={collapsed ? subItem.title : undefined}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span>{subItem.title}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Single item
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center">
            Admin Panel v1.0
          </div>
        )}
      </div>
    </aside>
  );
}
