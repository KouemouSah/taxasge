'use client'
import React from 'react'

/**
 * Chat Assistant Page — Dashboard version
 * Uses the same components as the public chat (MessageItem, TypingIndicator)
 * for consistent rendering (markdown, DOMPurify, action buttons, feedback).
 *
 * @module dashboard/chat
 */

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MessageCircle, Bot, Lightbulb, FileText, Calculator, HelpCircle, Send, Loader2,
  FolderOpen, Clock, BarChart3, FileSearch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat, useChatSettings } from '@/modules/chatbot/hooks'
import { MessageItem } from '@/modules/chatbot/components/MessageItem'
import { TypingIndicator } from '@/modules/chatbot/components/TypingIndicator'
import { SuggestionChips } from '@/modules/chatbot/components/SuggestionChips'
import type { ChatMessage } from '@/modules/chatbot/types'
import type { LucideIcon } from 'lucide-react'

/** Ref handle exposed by ChatWidgetEmbedded so the parent can inject messages */
interface ChatWidgetHandle {
  sendMessage: (text: string) => Promise<void>
}

interface QuickAction {
  icon: LucideIcon
  titleKey: string
  descKey: string
  /** The message that will be sent to the chatbot when the user clicks this action */
  message: string
  /** Optional accent colour class for the icon (defaults to text-primary) */
  iconColor?: string
}

export default function ChatPage() {
  const locale = useLocale()
  const t = useTranslations('chatbot')
  const tDashboard = useTranslations('dashboard')

  const chatRef = React.useRef<ChatWidgetHandle>(null)

  // General quick action suggestions
  const quickActions: QuickAction[] = [
    {
      icon: FileText,
      titleKey: 'askAboutDocuments',
      descKey: 'quickActionDescDocuments',
      message: t('askAboutDocuments'),
    },
    {
      icon: Calculator,
      titleKey: 'askAboutCosts',
      descKey: 'quickActionDescCosts',
      message: t('askAboutCosts'),
    },
    {
      icon: Lightbulb,
      titleKey: 'askAboutProcedures',
      descKey: 'quickActionDescProcedures',
      message: t('askAboutProcedures'),
    },
    {
      icon: HelpCircle,
      titleKey: 'askAboutServices',
      descKey: 'quickActionDescServices',
      message: t('askAboutServices'),
    },
  ]

  // Vault-specific quick actions
  const vaultActions: QuickAction[] = [
    {
      icon: Clock,
      titleKey: 'vaultExpiring',
      descKey: 'vaultExpiringDesc',
      message: t('vaultExpiring'),
      iconColor: 'text-orange-500',
    },
    {
      icon: FileSearch,
      titleKey: 'vaultReadiness',
      descKey: 'vaultReadinessDesc',
      message: t('vaultReadiness'),
      iconColor: 'text-green-600',
    },
    {
      icon: BarChart3,
      titleKey: 'vaultStats',
      descKey: 'vaultStatsDesc',
      message: t('vaultStats'),
      iconColor: 'text-blue-500',
    },
    {
      icon: FolderOpen,
      titleKey: 'vaultMissing',
      descKey: 'vaultMissingDesc',
      message: t('vaultMissing'),
      iconColor: 'text-purple-500',
    },
  ]

  const handleQuickAction = (action: QuickAction) => {
    chatRef.current?.sendMessage(action.message)
  }

  const renderActionButton = (action: QuickAction, index: number) => {
    const Icon = action.icon
    return (
      <button
        key={index}
        onClick={() => handleQuickAction(action)}
        className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${action.iconColor ?? 'text-primary'}`} strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">{t(action.titleKey)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(action.descKey)}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          {tDashboard('chatAssistant')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('welcomeMessage')}
        </p>
      </div>

      {/* Main Chat Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Widget - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              {t('askAboutServices')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Embedded Chat Widget - non-floating version */}
            <div className="h-[500px] border-t">
              <ChatWidgetEmbedded ref={chatRef} locale={locale} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* General suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {t('suggestions')}
              </CardTitle>
              <CardDescription>
                {t('askAboutServices')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => renderActionButton(action, index))}
            </CardContent>
          </Card>

          {/* Vault quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" strokeWidth={1.5} />
                {t('vaultActionsTitle')}
              </CardTitle>
              <CardDescription>
                {t('vaultActionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vaultActions.map((action, index) => renderActionButton(action, index))}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <span className="font-medium text-foreground">Tip 1:</span> Be specific about which tax service you need help with.
              </p>
              <p>
                <span className="font-medium text-foreground">Tip 2:</span> Include service codes like PAT-001 for faster answers.
              </p>
              <p>
                <span className="font-medium text-foreground">Tip 3:</span> Ask about required documents before starting any procedure.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * Embedded Chat Widget — uses same components as public chat
 * (MessageItem with markdown/DOMPurify/actions, TypingIndicator, SuggestionChips)
 *
 * Exposes `sendMessage` via ref so parent quick-action buttons can inject messages.
 */
const ChatWidgetEmbedded = React.forwardRef<ChatWidgetHandle, { locale: string }>(
  function ChatWidgetEmbedded({ locale }, ref) {
    const t = useTranslations('chatbot')
    useChatSettings({ persistToStorage: true })

    const {
      messages,
      isLoading,
      error,
      suggestions,
      sendMessage,
      retry,
      statusText,
      statusStep,
    } = useChat({
      language: locale as 'es' | 'fr' | 'en',
      persistToStorage: true,
    })

    const [message, setMessage] = React.useState('')
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    // Expose sendMessage to parent via ref
    React.useImperativeHandle(ref, () => ({
      sendMessage: async (text: string) => {
        if (isLoading) return
        await sendMessage(text)
      },
    }), [sendMessage, isLoading])

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
      if (!message.trim() || isLoading) return
      await sendMessage(message)
      setMessage('')
    }

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Messages — reuses MessageItem for markdown, actions, feedback */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('welcomeMessage')}</p>
            </div>
          )}

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

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
              <button onClick={retry} className="ml-2 underline">{t('retry')}</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <SuggestionChips
            suggestions={suggestions}
            onSelect={(s) => sendMessage(s)}
          />
        )}

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={t('inputPlaceholder')}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }
)

