/**
 * ChatWelcome — Claude.ai-inspired welcome state.
 *
 * Large centered greeting + input area + suggestion chips below.
 * Disappears once the first message is sent.
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Landmark,
  Building2,
  Home,
  HelpCircle,
  DollarSign,
} from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (message: string) => void;
}

const QUICK_SUGGESTIONS = [
  { key: 'passport', icon: FileText },
  { key: 'license', icon: FileText },
  { key: 'residence', icon: Home },
  { key: 'companies', icon: Building2 },
  { key: 'ministries', icon: Landmark },
  { key: 'what_is', icon: HelpCircle },
];

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onSuggestionClick }) => {
  const t = useTranslations('chatbot');

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-3xl mx-auto w-full">
      {/* Greeting — large, centered like claude.ai */}
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-16 text-center">
        {t('chatPage.greeting')}
      </h1>

      {/* Suggestion chips — horizontal row below input area (rendered by ChatPage) */}
      {/* These are shown BELOW the input in ChatPage, not here */}
    </div>
  );
};

/**
 * SuggestionRow — Horizontal chips shown below the input (claude.ai pattern).
 * Separate component so ChatPage can position it correctly.
 */
export const WelcomeSuggestions: React.FC<{
  onSuggestionClick: (message: string) => void;
}> = ({ onSuggestionClick }) => {
  const t = useTranslations('chatbot');

  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {QUICK_SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.key}
            variant="outline"
            size="sm"
            className="gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full px-4 h-8 border-border/50"
            onClick={() => onSuggestionClick(t(`chatPage.suggestion_${item.key}`))}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(`chatPage.suggestion_${item.key}`)}
          </Button>
        );
      })}
    </div>
  );
};
