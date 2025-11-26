/**
 * ChatInput Component
 * Multi-line text area with character counter and send button
 *
 * @module chatbot/components
 * @author Claude Code
 * @date 2025-11-26
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>
  isLoading?: boolean
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  isStreaming = false,
  disabled = false,
  placeholder,
  maxLength = 2000,
  className = '',
}) => {
  const t = useTranslations('chatbot')
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = disabled || isLoading || isStreaming
  const charCount = message.length
  const isOverLimit = charCount > maxLength

  useEffect(() => {
    if (!isLoading && !isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isLoading, isStreaming])

  const handleSend = async () => {
    if (!message.trim() || isDisabled || isOverLimit) return

    await onSend(message)
    setMessage('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`p-4 border-t flex gap-2 bg-background ${className}`}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || t('inputPlaceholder')}
          disabled={isDisabled}
          className="min-h-[44px] max-h-[120px] resize-none pr-16"
          rows={1}
        />
        <div
          className={`absolute bottom-2 right-2 text-xs ${
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {charCount}/{maxLength}
        </div>
      </div>
      <Button
        onClick={handleSend}
        disabled={isDisabled || !message.trim() || isOverLimit}
        size="icon"
        className="flex-shrink-0"
      >
        {isLoading || isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export default ChatInput
