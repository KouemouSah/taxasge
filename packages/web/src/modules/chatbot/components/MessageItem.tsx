/**
 * MessageItem Component
 * Individual chat message with rich formatting
 *
 * @module chatbot/components
 * @author Claude Code
 * @date 2025-11-26
 *
 * Features:
 * - User vs Bot message styling
 * - Markdown rendering with code highlighting
 * - Service code highlighting (PAT-001, etc.)
 * - Timestamp display
 * - Copy button
 */

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { User, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTimestamp } from '../types'
import type { ChatMessage } from '../types'

// =============================================================================
// TYPES
// =============================================================================

export interface MessageItemProps {
  message: ChatMessage
  locale?: string
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Highlight service codes (e.g., PAT-001, IVA-002)
 */
const highlightServiceCodes = (text: string): string => {
  return text.replace(
    /\b([A-Z]{2,5}-\d{3,4})\b/g,
    '<span class="inline-block px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono text-xs font-semibold">$1</span>'
  )
}

/**
 * Simple Markdown rendering (bold, italic, code, lists)
 * Note: For production, consider using a library like react-markdown
 */
const renderMarkdown = (text: string): string => {
  let html = text

  // Code blocks ```code```
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-2 rounded text-sm overflow-x-auto my-2"><code>$1</code></pre>')

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

  // Bullet lists - item
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
  // Use [\s\S] instead of /s flag for ES2017 compatibility
  html = html.replace(/(<li[\s\S]*<\/li>)/, '<ul class="list-disc my-2">$1</ul>')

  // Numbered lists 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')

  // Highlight service codes
  html = highlightServiceCodes(html)

  return html
}

// =============================================================================
// COMPONENT
// =============================================================================

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  locale = 'es',
  className = '',
}) => {
  const t = useTranslations('chatbot')
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isBot = message.role === 'assistant'

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
    >
      {/* Bot Avatar - App Logo */}
      {isBot && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border">
          <Image
            src="/logo.png"
            alt="TaxasGE"
            width={32}
            height={32}
            className="h-6 w-6 object-contain"
          />
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[75%] group relative`}>
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground'
          }`}
        >
          {/* Message Content */}
          {isBot ? (
            <div
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-1 ${isUser ? 'opacity-80' : 'text-muted-foreground'}`}>
            {formatTimestamp(message.timestamp, locale)}
          </p>
        </div>

        {/* Copy Button */}
        {isBot && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
            onClick={handleCopy}
            title={t('copyMessage') || 'Copy message'}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}

export default MessageItem
