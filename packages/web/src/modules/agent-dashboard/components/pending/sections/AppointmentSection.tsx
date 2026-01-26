/**
 * AppointmentSection - Appointment information display
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { RequestPreviewAppointment } from '../../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface AppointmentSectionProps {
  appointment: RequestPreviewAppointment;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AppointmentSection({ appointment }: AppointmentSectionProps) {
  const t = useTranslations('agent.pending.preview');

  // Format date
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-green-700">
          <Calendar className="h-5 w-5" />
          {t('appointment')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium capitalize">
            {formatDate(appointment.date)}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">{appointment.time}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{appointment.locationName}</p>
            {appointment.locationAddress && (
              <p className="text-xs text-muted-foreground">
                {appointment.locationAddress}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AppointmentSection;
