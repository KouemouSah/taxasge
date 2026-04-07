'use client';

/**
 * Dashboard Chat — Full-width ChatGPT/Claude-inspired assistant.
 *
 * Pattern: welcome state → chat state (full width within dashboard layout).
 * Sidebar dashboard remains visible. Quick actions in welcome only.
 * History drawer slides from left. Agent settings via gear icon.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bot, Send, Loader2, History, Settings2, Trash2, ArrowDown,
  FileText, Calculator, Lightbulb, HelpCircle,
  FolderOpen, Clock, BarChart3, FileSearch,
  X, MessageSquare, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useChat, useChatSettings } from '@/modules/chatbot/hooks';
import { MessageItem } from '@/modules/chatbot/components/MessageItem';
import { TypingIndicator } from '@/modules/chatbot/components/TypingIndicator';
import { SuggestionChips } from '@/modules/chatbot/components/SuggestionChips';
import type { ChatMessage } from '@/modules/chatbot/types';

// =============================================================================
// TYPES
// =============================================================================

interface QuickAction {
  icon: LucideIcon;
  titleKey: string;
  message: string;
  iconColor?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GENERAL_ACTIONS: QuickAction[] = [
  { icon: FileText, titleKey: 'askAboutDocuments', message: '', iconColor: 'text-blue-500' },
  { icon: Calculator, titleKey: 'askAboutCosts', message: '', iconColor: 'text-emerald-500' },
  { icon: Lightbulb, titleKey: 'askAboutProcedures', message: '', iconColor: 'text-amber-500' },
  { icon: HelpCircle, titleKey: 'askAboutServices', message: '', iconColor: 'text-violet-500' },
];

const VAULT_ACTIONS: QuickAction[] = [
  { icon: Clock, titleKey: 'vaultExpiring', message: '', iconColor: 'text-orange-500' },
  { icon: FileSearch, titleKey: 'vaultReadiness', message: '', iconColor: 'text-green-600' },
  { icon: BarChart3, titleKey: 'vaultStats', message: '', iconColor: 'text-blue-500' },
  { icon: FolderOpen, titleKey: 'vaultMissing', message: '', iconColor: 'text-purple-500' },
];

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ChatPage() {
  const locale = useLocale();
  const t = useTranslations('chatbot');
  const tDash = useTranslations('dashboard');

  useChatSettings({ persistToStorage: true });

  const {
    messages,
    isLoading,
    isStreaming,
    suggestions,
    sendMessage,
    clearChat,
    statusText,
    statusStep,
  } = useChat({
    language: (locale as 'es' | 'fr' | 'en') || 'es',
    persistToStorage: true,
  });

  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  // Resolve action messages (need t() which is only available in component)
  const generalActions = GENERAL_ACTIONS.map((a) => ({ ...a, message: t(a.titleKey) }));
  const vaultActions = VAULT_ACTIONS.map((a) => ({ ...a, message: t(a.titleKey) }));

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleQuickAction = useCallback(async (message: string) => {
    if (isLoading) return;
    await sendMessage(message);
  }, [isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] -m-4 md:-m-6">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-4 h-12 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <History className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ConversationHistory onClose={() => setHistoryOpen(false)} />
            </SheetContent>
          </Sheet>
          <Bot className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="font-semibold text-sm">Facil Assistant</span>
        </div>

        <div className="flex items-center gap-1">
          {hasMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('clearChat')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* ─── CONTENT AREA ─── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'thin' }}
      >
        {!hasMessages ? (
          /* ─── WELCOME STATE ─── */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <div className="max-w-2xl w-full space-y-8">
              {/* Logo + Greeting */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                  <Bot className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t('welcomeTitle') || tDash('chatAssistant')}
                </h1>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {t('welcomeMessage')}
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  {t('suggestions')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {generalActions.map((action, i) => (
                    <QuickActionPill key={i} action={action} onClick={handleQuickAction} />
                  ))}
                </div>
              </div>

              {/* Vault Actions Grid */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  {t('vaultActionsTitle') || 'Mon coffre-fort'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {vaultActions.map((action, i) => (
                    <QuickActionPill key={i} action={action} onClick={handleQuickAction} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── CHAT STATE ─── */
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">
            {messages.map((msg: ChatMessage, i: number) => (
              <MessageItem
                key={`${msg.timestamp}-${i}`}
                message={msg}
                locale={locale}
              />
            ))}

            {isLoading && (
              <TypingIndicator
                statusText={statusText ?? undefined}
                statusStep={statusStep ?? undefined}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom FAB */}
        {showScrollBtn && hasMessages && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 z-10 p-2 rounded-full bg-background border shadow-md hover:bg-accent transition-colors"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* ─── BOTTOM BAR ─── */}
      <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm">
        {/* Suggestion chips */}
        {suggestions.length > 0 && !isLoading && hasMessages && (
          <div className="px-4 pt-2">
            <SuggestionChips
              suggestions={suggestions}
              onSelect={(s) => sendMessage(s)}
            />
          </div>
        )}

        {/* Input area */}
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('inputPlaceholder')}
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-xl border bg-background px-4 py-3 pr-12 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           disabled:opacity-50 min-h-[48px] max-h-[160px]
                           placeholder:text-muted-foreground/60"
                style={{ scrollbarWidth: 'thin' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
            Facil Assistant — {t('disclaimer') || 'Powered by Sah Emac'}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// QUICK ACTION PILL
// =============================================================================

function QuickActionPill({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: (message: string) => void;
}) {
  const t = useTranslations('chatbot');
  const Icon = action.icon;

  return (
    <button
      onClick={() => onClick(action.message)}
      className="flex items-center gap-3 p-3 rounded-xl border bg-background
                 hover:bg-accent hover:border-primary/30 hover:shadow-sm
                 transition-all duration-150 text-left group"
    >
      <div className={`shrink-0 ${action.iconColor ?? 'text-primary'}`}>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
        {t(action.titleKey)}
      </span>
    </button>
  );
}

// =============================================================================
// CONVERSATION HISTORY (Sheet content)
// =============================================================================

function ConversationHistory({ onClose }: { onClose: () => void }) {
  const t = useTranslations('chatbot');

  // For now, show current conversation info.
  // Multi-conversation support can be added later.
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-4 py-3 border-b">
        <SheetTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" strokeWidth={1.5} />
          {t('conversationHistory') || 'Historique'}
        </SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-1 px-3 py-2">
        {/* Current conversation */}
        <div className="space-y-1">
          <button
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent/50 text-left"
            onClick={onClose}
          >
            <MessageSquare className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {t('currentConversation') || 'Conversation actuelle'}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('active') || 'Active'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          </button>
        </div>

        <Separator className="my-3" />

        <p className="text-xs text-muted-foreground text-center py-4">
          {t('historyComingSoon') || 'L\'historique multi-conversations sera disponible prochainement.'}
        </p>
      </ScrollArea>
    </div>
  );
}
