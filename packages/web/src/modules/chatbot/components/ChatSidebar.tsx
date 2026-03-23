/**
 * ChatSidebar — Collapsible sidebar with monographic vector icons.
 *
 * Desktop: toggles between collapsed (w-14, icons) and expanded (w-56, icons + labels).
 * Mobile: always expanded in Sheet.
 *
 * Icons: Lucide monographic outline (strokeWidth=1.5) for clean aesthetic.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Globe,
  Search,
  Landmark,
  Building2,
  Layers,
  Calculator,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  User,
  Plus,
} from 'lucide-react';
import { getAuthData } from '@/core/auth/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatSidebarProps {
  onNavigate?: () => void;
  className?: string;
  expanded?: boolean;       // forced expanded (mobile Sheet)
  collapsed?: boolean;      // desktop collapsed state
  onToggle?: () => void;    // toggle collapsed/expanded
}

// ---------------------------------------------------------------------------
// Navigation items — monographic vector icons
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: Globe },
  { key: 'services', href: '/services', icon: Search },
  { key: 'ministries', href: '/ministere', icon: Landmark },
  { key: 'companies', href: '/annuaire', icon: Building2 },
  { key: 'guide', href: '/categories', icon: Layers },
  { key: 'calculator', href: '/calculateur', icon: Calculator },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onNavigate,
  className = '',
  expanded = false,
  collapsed = false,
  onToggle,
}) => {
  const t = useTranslations('chatbot');
  const locale = useLocale();
  const pathname = usePathname();

  const authData = getAuthData();
  const isAuthenticated = !!authData?.user;

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    return pathname === localizedHref;
  };

  // Whether to show labels (expanded mobile OR desktop not collapsed)
  const showLabels = expanded || !collapsed;
  const sidebarWidth = expanded ? 'w-56' : collapsed ? 'w-14' : 'w-56';

  const iconProps = { className: 'w-[18px] h-[18px] shrink-0', strokeWidth: 1.5 };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={`flex flex-col h-full bg-card/50 border-r transition-all duration-200 ${sidebarWidth} ${className}`}
      >
        {/* Top: toggle + new chat */}
        <div className={`flex items-center ${showLabels ? 'justify-between px-3' : 'justify-center'} h-12 shrink-0`}>
          {/* Toggle button (desktop only, not in mobile Sheet) */}
          {!expanded && onToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={onToggle}
                >
                  {collapsed
                    ? <PanelLeftOpen {...iconProps} />
                    : <PanelLeftClose {...iconProps} />
                  }
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p className="text-xs">Expandir</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* New chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/${locale}/chat`} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                >
                  <SquarePen {...iconProps} />
                </Button>
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                <p className="text-xs">{t('newConversation')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col ${showLabels ? 'px-2' : 'items-center'} py-3 gap-0.5`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = t(`chatPage.nav_${item.key}`);

            const btn = (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onNavigate}
                className={`flex items-center ${showLabels ? 'gap-3 px-3' : 'justify-center'} rounded-lg py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon {...iconProps} />
                {showLabels && <span className="truncate">{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <p className="text-xs">{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <React.Fragment key={item.key}>{btn}</React.Fragment>;
          })}
        </nav>

        {/* Bottom: auth actions */}
        <div className={`border-t ${showLabels ? 'px-2' : ''} py-3 shrink-0 space-y-1`}>
          {isAuthenticated ? (
            <>
              {showLabels ? (
                <>
                  <Link href={`/${locale}/dashboard/services`} onClick={onNavigate}>
                    <Button variant="default" size="sm" className="w-full justify-start gap-2 text-xs">
                      <Plus {...iconProps} />
                      {t('chatPage.new_request')}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/dashboard`} onClick={onNavigate}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-muted-foreground">
                      <User {...iconProps} />
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/${locale}/dashboard`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
                          <User {...iconProps} />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="text-xs">Dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </>
          ) : (
            <>
              {showLabels ? (
                <Link href={`/${locale}/login`} onClick={onNavigate}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                    <LogIn {...iconProps} />
                    {t('chatPage.login_cta')}
                  </Button>
                </Link>
              ) : (
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/${locale}/login`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
                          <LogIn {...iconProps} />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="text-xs">{t('chatPage.login_cta')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};
