/**
 * ChatSidebar — Slim icon-only sidebar inspired by claude.ai.
 *
 * Desktop: narrow strip (w-14) with icon buttons + tooltips.
 * Mobile: full Sheet with labels (via ChatPage).
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
  BookOpen,
  Calculator,
  LogIn,
  Plus,
  User,
} from 'lucide-react';
import { getAuthData } from '@/core/auth/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatSidebarProps {
  onNavigate?: () => void;
  className?: string;
  expanded?: boolean; // true = mobile Sheet (show labels)
}

// ---------------------------------------------------------------------------
// Navigation items — grouped
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: Globe },
  { key: 'services', href: '/services', icon: Search },
  { key: 'ministries', href: '/ministere', icon: Landmark },
  { key: 'companies', href: '/annuaire', icon: Building2 },
  { key: 'guide', href: '/categories', icon: BookOpen },
  { key: 'calculator', href: '/calculateur', icon: Calculator },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onNavigate,
  className = '',
  expanded = false,
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

  // Expanded mode (mobile Sheet) — show labels
  if (expanded) {
    return (
      <aside className={`flex flex-col h-full bg-card w-64 ${className}`}>
        <div className="h-14 flex items-center px-4 border-b shrink-0">
          <span className="font-semibold text-sm">Facil</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t(`chatPage.nav_${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-3 space-y-1">
          {isAuthenticated ? (
            <>
              <Link href={`/${locale}/dashboard/services`} onClick={onNavigate}>
                <Button variant="default" size="sm" className="w-full justify-start gap-2">
                  <Plus className="w-4 h-4" />
                  {t('chatPage.new_request')}
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard`} onClick={onNavigate}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <Link href={`/${locale}/login`} onClick={onNavigate}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <LogIn className="w-4 h-4" />
                {t('chatPage.login_cta')}
              </Button>
            </Link>
          )}
        </div>
      </aside>
    );
  }

  // Collapsed mode (desktop) — icons only with tooltips
  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={`flex flex-col items-center h-full bg-card/50 border-r w-14 py-3 ${className}`}
      >
        {/* New chat */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/${locale}/chat`}>
              <Button variant="ghost" size="icon" className="w-9 h-9 mb-2">
                <Plus className="w-5 h-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="text-xs">{t('newConversation')}</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="w-8 mb-2" />

        {/* Navigation icons */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <Link href={`/${locale}${item.href}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-9 h-9 ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p className="text-xs">{t(`chatPage.nav_${item.key}`)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom: auth */}
        <div className="flex flex-col items-center gap-1">
          {isAuthenticated ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
                    <User className="w-[18px] h-[18px]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="text-xs">Dashboard</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
                    <LogIn className="w-[18px] h-[18px]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="text-xs">{t('chatPage.login_cta')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};
