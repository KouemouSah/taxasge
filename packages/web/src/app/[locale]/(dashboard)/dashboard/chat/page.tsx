'use client'
import React from 'react'

/**
 * Chat Assistant Page
 * Full-page chat interface with the TaxasGE AI assistant
 *
 * @module dashboard/chat
 * @author Claude Code
 * @date 2025-11-26
 */

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Bot, Lightbulb, FileText, Calculator, HelpCircle } from 'lucide-react'
import { useChat, useChatSettings } from '@/modules/chatbot/hooks'
import type { ChatMessage } from '@/modules/chatbot/types'

export default function ChatPage() {
  const locale = useLocale()
  const t = useTranslations('chatbot')
  const tDashboard = useTranslations('dashboard')

  // Quick action suggestions
  const quickActions = [
    {
      icon: FileText,
      titleKey: 'askAboutDocuments',
      descKey: 'What documents do I need for my tax declaration?',
    },
    {
      icon: Calculator,
      titleKey: 'askAboutCosts',
      descKey: 'Calculate fees for your tax services',
    },
    {
      icon: Lightbulb,
      titleKey: 'askAboutProcedures',
      descKey: 'Learn step-by-step procedures',
    },
    {
      icon: HelpCircle,
      titleKey: 'askAboutServices',
      descKey: 'Discover available tax services',
    },
  ]

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
              <ChatWidgetEmbedded locale={locale} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
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
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{t(action.titleKey)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.descKey}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
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
 * Embedded Chat Widget (non-floating version)
 */
function ChatWidgetEmbedded({ locale }: { locale: string }) {
  const t = useTranslations('chatbot')

  // Import and use hooks from chatbot module
  // Hooks already imported at top

  useChatSettings({ persistToStorage: true })
  const {
    messages,
    isLoading,
    error,
    suggestions,
    
    sendMessage,
    
    retry,
  } = useChat({
    language: locale as 'es' | 'fr' | 'en',
    persistToStorage: true,
  })

  const [message, setMessage] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return
    await sendMessage(message)
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('welcomeMessage')}</p>
          </div>
        )}

        {messages.map((msg: ChatMessage, i: number) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
              <span className="text-xs text-muted-foreground ml-2">{t('typing')}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
            <button onClick={retry} className="ml-2 underline">
              {t('retry')}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 flex flex-wrap gap-2">
          {suggestions.slice(0, 3).map((suggestion: string, i: number) => (
            <button
              key={i}
              onClick={() => setMessage(suggestion)}
              className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('inputPlaceholder')}
          disabled={isLoading}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? t('sending') : 'Send'}
        </button>
      </div>
    </div>
  )
}

