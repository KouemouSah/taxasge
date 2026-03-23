/**
 * ChatWelcome — Initial state when no messages yet.
 * Shows logo, greeting, and suggestion chips.
 * Disappears once the first message is sent.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (message: string) => void;
}

const QUICK_SUGGESTIONS = [
  { key: 'passport', emoji: '🛂' },
  { key: 'license', emoji: '📄' },
  { key: 'residence', emoji: '🏠' },
  { key: 'companies', emoji: '🏢' },
  { key: 'ministries', emoji: '🏛' },
  { key: 'what_is', emoji: '❓' },
];

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onSuggestionClick }) => {
  const t = useTranslations('chatbot');

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-2xl mx-auto">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Greeting */}
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        {t('chatPage.greeting')}
      </h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-md">
        {t('chatPage.subtitle')}
      </p>

      {/* Suggestion chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
        {QUICK_SUGGESTIONS.map((item) => (
          <Button
            key={item.key}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-4 text-left justify-start gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
            onClick={() => onSuggestionClick(t(`chatPage.suggestion_${item.key}`))}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-xs text-muted-foreground leading-tight">
              {t(`chatPage.suggestion_${item.key}`)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};
