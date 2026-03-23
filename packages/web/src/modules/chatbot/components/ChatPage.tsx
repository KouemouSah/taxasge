/**
 * ChatPage — Full-page chat-first experience (like claude.ai).
 *
 * Layout:
 * - Desktop: sidebar (w-72) + central chat area
 * - Mobile: full-width chat + hamburger menu for sidebar
 *
 * Features:
 * - Reuses existing chatbot hooks (useChat, useChatSettings)
 * - Reuses existing components (MessageList, ChatInput, TypingIndicator)
 * - Anonymous mode (localStorage) + authenticated mode (backend persistence)
 * - Suggestion chips in welcome state + sidebar
 * - Markdown rendering in bot responses
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  Globe,
  LogIn,
  User,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Chatbot module imports
import { useChat } from '../hooks/useChat';
import { useChatSettings } from '../hooks/useChatSettings';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestionChips } from './SuggestionChips';
import { ChatSidebar } from './ChatSidebar';
import { ChatWelcome } from './ChatWelcome';
import { getAuthData } from '@/core/auth/storage';

// =============================================================================
// COMPONENT
// =============================================================================

export const ChatPage: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations('chatbot');
  const { settings, updateSettings } = useChatSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authData = getAuthData();
  const isAuthenticated = !!authData?.user;

  const {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    clearChat,
  } = useChat({
    language: settings.language || (locale as 'es' | 'fr' | 'en'),
    persistToStorage: true,
  });

  const hasMessages = messages.length > 0;

  // Handle suggestion click — send as a chat message
  const handleSuggestionClick = useCallback(
    (message: string) => {
      sendMessage(message);
      setMobileMenuOpen(false);
    },
    [sendMessage]
  );

  // Language switcher
  const handleLanguageChange = (lang: 'es' | 'fr' | 'en') => {
    updateSettings({ language: lang });
  };

  const LANG_LABELS: Record<string, string> = {
    es: 'Español',
    fr: 'Français',
    en: 'English',
  };

  return (
    <div className="flex h-full">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <ChatSidebar
        onSuggestionClick={handleSuggestionClick}
        className="hidden md:flex"
      />

      {/* ── Main Chat Area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Header (mobile + desktop) ──────────────────────────── */}
        <header className="h-14 flex items-center justify-between px-4 border-b shrink-0 bg-card/80 backdrop-blur-sm">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <ChatSidebar
                  onSuggestionClick={handleSuggestionClick}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link
              href={`/${locale}/chat`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo_chat.png"
                alt="Facil"
                width={28}
                height={28}
                className="rounded"
              />
              <span className="font-semibold text-sm hidden sm:inline">
                {t('chatPage.title')}
              </span>
            </Link>
          </div>

          {/* Right: actions + language + auth */}
          <div className="flex items-center gap-2">
            {/* Clear chat */}
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={clearChat}
                title={t('clearChat')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}

            {/* New service request (authenticated only) */}
            {isAuthenticated && (
              <Link href={`/${locale}/dashboard/services`}>
                <Button variant="default" size="sm" className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {t('chatPage.new_request')}
                  </span>
                </Button>
              </Link>
            )}

            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="uppercase">{settings.language || locale}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['es', 'fr', 'en'] as const).map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={settings.language === lang ? 'bg-accent' : ''}
                  >
                    {LANG_LABELS[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth button */}
            {isAuthenticated ? (
              <Link href={`/${locale}/dashboard`}>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link href={`/${locale}/login`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {t('chatPage.login_cta')}
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* ── Chat Content ───────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {hasMessages ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto w-full">
                  <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    locale={locale}
                  />
                  {isLoading && (
                    <div className="px-4 py-2">
                      <TypingIndicator />
                    </div>
                  )}
                </div>
              </div>

              {/* AI suggestions */}
              {suggestions.length > 0 && !isLoading && (
                <div className="max-w-3xl mx-auto w-full px-4 py-2">
                  <SuggestionChips
                    suggestions={suggestions}
                    onSelect={handleSuggestionClick}
                  />
                </div>
              )}
            </>
          ) : (
            /* Welcome state */
            <ChatWelcome onSuggestionClick={handleSuggestionClick} />
          )}
        </div>

        {/* ── Input Area ─────────────────────────────────────────── */}
        <div className="border-t bg-card/50 shrink-0">
          <div className="max-w-3xl mx-auto w-full px-4 py-3">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder={t('chatPage.input_placeholder')}
            />
          </div>
          <div className="text-center pb-2">
            <p className="text-[10px] text-muted-foreground">
              © 2026 Facil - Plataforma Digital AI de Tramites. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
