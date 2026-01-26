/**
 * ContactSection - Contact information display
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// PROPS
// =============================================================================

interface ContactSectionProps {
  name: string;
  email?: string | null;
  phone?: string | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContactSection({ name, email, phone }: ContactSectionProps) {
  const t = useTranslations('agent.pending.preview');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t('contact')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Name */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{name}</span>
        </div>

        {/* Email */}
        {email && (
          <div className="flex items-center gap-2 group">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {email}
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(email, 'Email')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-center gap-2 group">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:${phone}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {phone}
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(phone, 'Teléfono')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {!email && !phone && (
          <p className="text-sm text-muted-foreground">{t('noContactInfo')}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ContactSection;
