/**
 * ChatWelcome — Claude.ai-inspired welcome state.
 *
 * Logo + large centered greeting.
 * WelcomeSuggestions: horizontal pill chips below input.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Stamp,
  ScrollText,
  MapPin,
  Building2,
  Landmark,
  Info,
} from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (message: string) => void;
}

const QUICK_SUGGESTIONS = [
  { key: 'passport', icon: Stamp },
  { key: 'license', icon: ScrollText },
  { key: 'residence', icon: MapPin },
  { key: 'companies', icon: Building2 },
  { key: 'ministries', icon: Landmark },
  { key: 'what_is', icon: Info },
];

export const ChatWelcome: React.FC<ChatWelcomeProps> = () => {
  const t = useTranslations('chatbot');

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-3xl mx-auto w-full">
      {/* Logo */}
      <Image
        src="/logo_chat.png"
        alt="Facil"
        width={64}
        height={64}
        className="mb-6"
        priority
      />

      {/* Greeting */}
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2 text-center">
        {t('chatPage.greeting')}
      </h1>
      <p className="text-sm text-muted-foreground mb-16 text-center max-w-md">
        {t('chatPage.subtitle')}
      </p>
    </div>
  );
};

/**
 * WelcomeSuggestions — Horizontal pill chips below input (claude.ai pattern).
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
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t(`chatPage.suggestion_${item.key}`)}
          </Button>
        );
      })}
    </div>
  );
};
