/**
 * ChatWidget Component - Refactored with Hooks
 * Floating AI assistant widget with full RAG support
 *
 * @module chatbot/components
 * @author Claude Code
 * @date 2025-11-26
 *
 * Features:
 * - useChat hook integration
 * - Streaming support (optional)
 * - Suggestions and related services
 * - Error handling with retry
 * - i18n support
 * - Persistent settings
 * - Floating widget pattern
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Settings,
  Bot,
  User,
  FileText,
} from 'lucide-react'
import { useChat, useChatSettings } from '../hooks'
import { formatTimestamp } from '@/types/chatbot'
import type { ChatWidgetProps, ServiceReference } from '@/types/chatbot'

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ChatWidget = ({
  initialLanguage,
  position = 'bottom-right',
  theme = 'light',
  enableHistory = true,
  enableStreaming = false,
  maxHeight = '600px',
  onClose,
}: ChatWidgetProps = {}) => {
  const locale = useLocale()
  const t = useTranslations('chatbot')

  // State
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { settings, setLanguage } = useChatSettings({
    persistToStorage: enableHistory,
  })

  const {
    messages,
    isLoading,
    error,
    suggestions,
    relatedServices,
    confidence,
    sendMessage: sendChatMessage,
    clearChat,
    retry,
  } = useChat({
    language: (initialLanguage || settings.language) as any,
    persistToStorage: enableHistory,
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync language with locale
  useEffect(() => {
    if (locale && locale !== settings.language) {
      setLanguage(locale as any)
    }
  }, [locale, settings.language, setLanguage])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    await sendChatMessage(message)
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) {
      onClose()
    }
  }

  // =============================================================================
  // POSITION STYLES
  // =============================================================================

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  // =============================================================================
  // FLOATING BUTTON (CLOSED STATE)
  // =============================================================================

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} rounded-full h-14 w-14 shadow-lg z-50 hover:scale-110 transition-transform`}
        aria-label={t('openChat') || 'Open chat'}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  // =============================================================================
  // CHAT WIDGET (OPEN STATE)
  // =============================================================================

  return (
    <Card
      className={`fixed ${positionClasses[position]} w-96 shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4`}
      style={{ maxHeight, height: maxHeight }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-primary text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">{t('title') || 'Assistant TaxasGE'}</h3>
            {confidence && (
              <p className="text-xs opacity-80">
                {t('confidence') || 'Confidence'}: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="text-white hover:bg-white/20 h-8 w-8"
            title={t('clearChat') || 'Clear chat'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b bg-muted/50 space-y-2">
          <div className="text-xs font-medium">{t('settings') || 'Settings'}</div>
          <div className="flex gap-2">
            {(['es', 'fr', 'en'] as const).map((lang) => (
              <Button
                key={lang}
                size="sm"
                variant={settings.language === lang ? 'default' : 'outline'}
                onClick={() => setLanguage(lang)}
                className="text-xs"
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('welcomeMessage') || '¡Hola! ¿En qué puedo ayudarte hoy?'}</p>
            </div>
          )}

          {messages.map((msg, i) => (
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
                <p className="text-xs opacity-70 mt-1">
                  {formatTimestamp(msg.timestamp, locale)}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retry}
                  className="mt-2 h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('retry') || 'Retry'}
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {settings.enableSuggestions && suggestions.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="text-xs font-medium mb-2 text-muted-foreground">
            {t('suggestions') || 'Suggestions'}
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 3).map((suggestion, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Related Services */}
      {settings.enableRelatedServices && relatedServices.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {t('relatedServices') || 'Related Services'}
          </div>
          <div className="space-y-1">
            {relatedServices.slice(0, 3).map((service: ServiceReference, i) => (
              <div
                key={i}
                className="text-xs p-2 rounded bg-white border hover:border-primary/50 cursor-pointer transition-colors"
              >
                <div className="font-medium">{service.name}</div>
                {service.similarity && (
                  <div className="text-muted-foreground">
                    {Math.round(service.similarity * 100)}% {t('match') || 'match'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t flex gap-2 bg-background">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('inputPlaceholder') || 'Posez votre question...'}
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}

export default ChatWidget
