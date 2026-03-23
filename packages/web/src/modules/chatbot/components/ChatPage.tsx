/**
 * ChatPage — Claude.ai-inspired chat-first experience.
 *
 * Layout:
 * - Desktop: slim icon sidebar (w-14) + full-width chat area
 * - Mobile: full-width chat + hamburger menu Sheet
 *
 * Welcome state: large centered greeting + wide input + suggestion chips below
 * Chat state: messages scroll + input bottom-anchored
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Menu,
  Globe,
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
import { ChatWelcome, WelcomeSuggestions } from './ChatWelcome';

// =============================================================================
// COMPONENT
// =============================================================================

export const ChatPage: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations('chatbot');
  const { settings, updateSettings } = useChatSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleSuggestionClick = useCallback(
    (message: string) => {
      sendMessage(message);
      setMobileMenuOpen(false);
    },
    [sendMessage]
  );

  const handleLanguageChange = (lang: 'es' | 'fr' | 'en') => {
    updateSettings({ language: lang });
  };

  const LANG_LABELS: Record<string, string> = {
    es: 'ES',
    fr: 'FR',
    en: 'EN',
  };

  return (
    <div className="flex h-full bg-background">
      {/* ── Desktop Sidebar (slim, icons only) ──────────────────── */}
      <ChatSidebar className="hidden md:flex" />

      {/* ── Main Chat Area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 relative">

        {/* ── Top bar (minimal, no logo) ─────────────────────────── */}
        <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-3 py-2">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden w-8 h-8"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ChatSidebar
                expanded
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Right: language + clear */}
          <div className="flex items-center gap-1 ml-auto">
            {hasMessages && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={clearChat}
                title={t('clearChat')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8 px-2">
                  <Globe className="w-3.5 h-3.5 mr-1" />
                  {LANG_LABELS[settings.language || locale] || 'ES'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['es', 'fr', 'en'] as const).map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={settings.language === lang ? 'bg-accent' : ''}
                  >
                    {lang === 'es' ? 'Español' : lang === 'fr' ? 'Français' : 'English'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Chat Content ───────────────────────────────────────── */}
        {hasMessages ? (
          <>
            {/* Messages — scrollable, full height */}
            <div className="flex-1 overflow-y-auto pt-12 pb-4">
              <div className="max-w-3xl mx-auto w-full px-4">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  locale={locale}
                />
                {isLoading && (
                  <div className="py-2">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            </div>

            {/* AI suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <div className="max-w-3xl mx-auto w-full px-4 pb-2">
                <SuggestionChips
                  suggestions={suggestions}
                  onSelect={handleSuggestionClick}
                />
              </div>
            )}

            {/* Input — bottom anchored */}
            <div className="shrink-0 pb-4">
              <div className="max-w-3xl mx-auto w-full px-4">
                <div className="bg-card border rounded-2xl shadow-sm">
                  <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading}
                    placeholder={t('chatPage.input_placeholder')}
                    className="border-0 shadow-none rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Welcome State (claude.ai style) ──────────────────── */
          <div className="flex-1 flex flex-col justify-center pb-8">
            {/* Greeting */}
            <ChatWelcome onSuggestionClick={handleSuggestionClick} />

            {/* Input — centered, wide (like claude.ai) */}
            <div className="max-w-3xl mx-auto w-full px-6 mb-4">
              <div className="bg-card border rounded-2xl shadow-sm">
                <ChatInput
                  onSend={sendMessage}
                  isLoading={isLoading}
                  placeholder={t('chatPage.input_placeholder')}
                  className="border-0 shadow-none rounded-2xl"
                />
              </div>
            </div>

            {/* Suggestion chips — below input (like claude.ai) */}
            <div className="mb-4">
              <WelcomeSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="text-center py-2 shrink-0">
          <p className="text-[10px] text-muted-foreground">
            © 2026 Facil - Plataforma Digital AI de Tramites. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
