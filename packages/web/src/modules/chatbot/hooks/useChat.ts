/**
 * useChat Hook
 * Core state management for chatbot conversations
 *
 * @module chatbot/hooks
 * @author Claude Code
 * @date 2025-11-26
 *
 * Features:
 * - Message history management
 * - Conversation persistence
 * - API integration with error handling
 * - Suggestions and related services
 * - localStorage persistence
 * - Auto-retry on failure
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatbotApi } from '../services/api'
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ServiceReference,
  LanguageCode,
  MessageRole,
} from '@/types/chatbot'

// =============================================================================
// TYPES
// =============================================================================

export interface UseChatOptions {
  conversationId?: string
  language?: LanguageCode
  persistToStorage?: boolean
  autoLoadHistory?: boolean
  onError?: (error: Error) => void
  onSuccess?: (response: ChatResponse) => void
}

export interface UseChatReturn {
  // State
  messages: ChatMessage[]
  conversationId: string | null
  isLoading: boolean
  error: string | null
  suggestions: string[]
  relatedServices: ServiceReference[]
  confidence: number | null

  // Actions
  sendMessage: (message: string, context?: Record<string, any>) => Promise<void>
  clearChat: () => void
  retry: () => Promise<void>
  loadHistory: (conversationId: string) => void
  setLanguage: (language: LanguageCode) => void
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  MESSAGES: 'chatbot_messages',
  CONVERSATION_ID: 'chatbot_conversation_id',
  LANGUAGE: 'chatbot_language',
} as const

// =============================================================================
// HOOK
// =============================================================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    conversationId: initialConversationId,
    language: initialLanguage = 'es',
    persistToStorage = true,
    autoLoadHistory = true,
    onError,
    onSuccess,
  } = options

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  )
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [relatedServices, setRelatedServices] = useState<ServiceReference[]>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [lastRequest, setLastRequest] = useState<ChatRequest | null>(null)

  // =============================================================================
  // STORAGE HELPERS
  // =============================================================================

  const saveToStorage = useCallback(() => {
    if (!persistToStorage || typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
      if (conversationId) {
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, conversationId)
      }
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
    } catch (err) {
      console.error('Failed to save to storage:', err)
    }
  }, [messages, conversationId, language, persistToStorage])

  const loadFromStorage = useCallback(() => {
    if (!persistToStorage || typeof window === 'undefined') return

    try {
      const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      const storedConversationId = localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID)
      const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE)

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages))
      }
      if (storedConversationId) {
        setConversationId(storedConversationId)
      }
      if (storedLanguage) {
        setLanguage(storedLanguage as LanguageCode)
      }
    } catch (err) {
      console.error('Failed to load from storage:', err)
    }
  }, [persistToStorage])

  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES)
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID)
    } catch (err) {
      console.error('Failed to clear storage:', err)
    }
  }, [])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Load history on mount
  useEffect(() => {
    if (autoLoadHistory) {
      loadFromStorage()
    }
  }, [autoLoadHistory, loadFromStorage])

  // Save to storage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage()
    }
  }, [messages, saveToStorage])

  // =============================================================================
  // ACTIONS
  // =============================================================================

  /**
   * Send a message to the chatbot
   */
  const sendMessage = useCallback(
    async (message: string, context?: Record<string, any>) => {
      if (!message.trim()) return

      setIsLoading(true)
      setError(null)

      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user' as MessageRole,
        content: message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])

      // Prepare request
      const request: ChatRequest = {
        message,
        conversationId: conversationId || undefined,
        language,
        context,
      }

      setLastRequest(request)

      try {
        const response = await chatbotApi.chat(request)

        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant' as MessageRole,
          content: response.response,
          timestamp: response.timestamp,
        }

        setMessages((prev) => [...prev, assistantMessage])
        setConversationId(response.conversationId)
        setSuggestions(response.suggestions || [])
        setRelatedServices(response.relatedServices || [])
        setConfidence(response.confidence)

        if (onSuccess) {
          onSuccess(response)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage))
        }

        // Add error message to chat
        const errorChatMessage: ChatMessage = {
          role: 'assistant' as MessageRole,
          content: `Error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, errorChatMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, language, onError, onSuccess]
  )

  /**
   * Clear the entire chat
   */
  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setSuggestions([])
    setRelatedServices([])
    setConfidence(null)
    setError(null)
    setLastRequest(null)
    clearStorage()
  }, [clearStorage])

  /**
   * Retry the last failed request
   */
  const retry = useCallback(async () => {
    if (!lastRequest) {
      setError('No previous request to retry')
      return
    }

    // Remove the last error message
    setMessages((prev) => prev.slice(0, -1))

    // Retry with the same request
    await sendMessage(lastRequest.message, lastRequest.context)
  }, [lastRequest, sendMessage])

  /**
   * Load conversation history
   */
  const loadHistory = useCallback((newConversationId: string) => {
    setConversationId(newConversationId)
    // In a real implementation, this would fetch from the backend
    // For now, we rely on localStorage
    loadFromStorage()
  }, [loadFromStorage])

  /**
   * Change language
   */
  const changeLanguage = useCallback((newLanguage: LanguageCode) => {
    setLanguage(newLanguage)
  }, [])

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    messages,
    conversationId,
    isLoading,
    error,
    suggestions,
    relatedServices,
    confidence,

    // Actions
    sendMessage,
    clearChat,
    retry,
    loadHistory,
    setLanguage: changeLanguage,
  }
}

export default useChat
