/**
 * ChatSidebar — Navigation + suggestion chips for the chat-first page.
 *
 * Desktop: fixed left sidebar (w-72).
 * Mobile: hidden, opened via Sheet trigger from ChatPage header.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  FileText,
  Landmark,
  Building2,
  MapPin,
  BookOpen,
  Calculator,
  Globe,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatSidebarProps {
  onSuggestionClick: (message: string) => void;
  onNavigate?: () => void; // close mobile sheet after nav
  className?: string;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: Globe },
  { key: 'services', href: '/services', icon: FileText },
  { key: 'ministries', href: '/ministere', icon: Landmark },
  { key: 'companies', href: '/annuaire', icon: Building2 },
  { key: 'offices', href: '/guide', icon: MapPin },
  { key: 'guide', href: '/categories', icon: BookOpen },
  { key: 'calculator', href: '/calculateur', icon: Calculator },
];

// ---------------------------------------------------------------------------
// Suggestion items — clicking sends the message to the chat
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { key: 'passport', icon: '🛂' },
  { key: 'license', icon: '📄' },
  { key: 'residence', icon: '🏠' },
  { key: 'companies', icon: '🏢' },
  { key: 'ministries', icon: '🏛' },
  { key: 'costs', icon: '💰' },
  { key: 'what_is', icon: '❓' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onSuggestionClick,
  onNavigate,
  className = '',
}) => {
  const t = useTranslations('chatbot');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    return pathname === localizedHref;
  };

  const handleSuggestion = (key: string) => {
    const message = t(`chatPage.suggestion_${key}`);
    onSuggestionClick(message);
    onNavigate?.();
  };

  return (
    <aside
      className={`flex flex-col h-full bg-card border-r w-72 ${className}`}
    >
      {/* Logo header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b shrink-0">
        <Image
          src="/logo_chat.png"
          alt="Facil"
          width={32}
          height={32}
          className="rounded"
        />
        <div>
          <h2 className="font-semibold text-sm">{t('chatPage.title')}</h2>
          <p className="text-[10px] text-muted-foreground">Guinea Ecuatorial</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Navigation */}
        <div className="px-3 py-4">
          <p className="px-2 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {t('chatPage.nav_title')}
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t(`chatPage.nav_${item.key}`)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator className="mx-3" />

        {/* Suggestions */}
        <div className="px-3 py-4">
          <p className="px-2 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {t('chatPage.suggestions_title')}
          </p>
          <div className="space-y-1">
            {SUGGESTIONS.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-sm font-normal text-muted-foreground hover:text-foreground"
                onClick={() => handleSuggestion(item.key)}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">
                  {t(`chatPage.suggestion_${item.key}`)}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-4 py-3 shrink-0">
        <p className="text-[10px] text-center text-muted-foreground">
          {t('chatPage.powered_by')}
        </p>
      </div>
    </aside>
  );
};
