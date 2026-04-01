/**
 * Chatbot React Hook
 *
 * Manages conversation state: messages, conversationId, send/loading.
 * Builds history from previous messages for context continuity.
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { sendChatMessage } from './chatbot-api';
import type { ChatMessage, ChatResponse } from '../types/chatbot.types';

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg_${Date.now()}_${messageCounter}`;
}

export function useChatbot() {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: nextId(),
        text: text.trim(),
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build history from last 10 messages for context (omit if empty)
        const historyItems = messages.slice(-10).map((m) => ({
          role: (m.isBot ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.text,
        }));

        const lang = (i18n.language || 'es') as 'es' | 'fr' | 'en';

        const LANG_INSTRUCTIONS: Record<string, string> = {
          fr: 'Réponds entièrement en français. Traduis tous les noms de services, catégories et suggestions en français. Ne mélange jamais avec l\'espagnol.',
          en: 'Reply entirely in English. Translate all service names, categories and suggestions to English. Never mix with Spanish.',
          es: '',
        };

        const response: ChatResponse = await sendChatMessage({
          message: text.trim(),
          ...(conversationIdRef.current ? { conversation_id: conversationIdRef.current } : {}),
          language: lang,
          ...(historyItems.length > 0 ? { history: historyItems } : {}),
          ...(LANG_INSTRUCTIONS[lang] ? { context: { language_instruction: LANG_INSTRUCTIONS[lang] } } : {}),
        });

        // Store conversation_id for continuity
        if (response.conversation_id) {
          conversationIdRef.current = response.conversation_id;
        }

        // Add bot response
        const botMsg: ChatMessage = {
          id: nextId(),
          text: response.response,
          isBot: true,
          timestamp: new Date(),
          suggestions: response.suggestions?.length > 0 ? response.suggestions : undefined,
          relatedServices:
            response.related_services?.length > 0
              ? response.related_services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  service_code: s.service_code,
                }))
              : undefined,
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err: any) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
        console.error('[Chatbot] Send error:', status, detail);
        if (status === 429) {
          setError('rate_limited');
        } else {
          setError('send_failed');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, i18n.language],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = undefined;
    setError(null);
  }, []);

  return { messages, isLoading, error, send, clearChat };
}
