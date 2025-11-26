/**
 * TypingIndicator Component
 * Animated "Bot is typing..." indicator
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Bot } from 'lucide-react'

export const TypingIndicator: React.FC = () => {
  const t = useTranslations('chatbot')

  return (
    <div className="flex gap-2 justify-start">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
        <div className="flex gap-1">
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">{t('typing') || 'Typing...'}</span>
      </div>
    </div>
  )
}

export default TypingIndicator
