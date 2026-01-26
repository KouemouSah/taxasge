/**
 * CalendarTab Component
 * Weekly calendar view of existing appointments
 *
 * @module agent-dashboard/components/appointments
 * @date 2026-01-26
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { useCalendarWeek } from '../../hooks/useWidgetData';
import { AppointmentPreviewSheet } from './AppointmentPreviewSheet';
import type { EntityCode } from '../../types';
import type { WeekAppointmentItem } from '../../hooks/useWidgetData';

// =============================================================================
// PROPS
// =============================================================================

interface CalendarTabProps {
  entityCode: EntityCode;
  locationId?: string;
}

// =============================================================================
// STATUS STYLES
// =============================================================================

const STATUS_STYLES: Record<string, { bg: string; border: string }> = {
  confirmed: { bg: 'bg-blue-50', border: 'border-l-blue-500' },
  pending: { bg: 'bg-yellow-50', border: 'border-l-yellow-500' },
  completed: { bg: 'bg-green-50', border: 'border-l-green-500' },
  cancelled: { bg: 'bg-red-50', border: 'border-l-red-500' },
  no_show: { bg: 'bg-gray-50', border: 'border-l-gray-500' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function CalendarTab({ entityCode, locationId: _locationId }: CalendarTabProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<WeekAppointmentItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Note: useCalendarWeek doesn't support locationId filter currently
  const { data, isLoading, isError, refetch } = useCalendarWeek(entityCode, {
    weekOffset,
  });

  const handleAppointmentClick = (appointment: WeekAppointmentItem) => {
    setSelectedAppointment(appointment);
    setPreviewOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">
            Erreur lors du chargement du calendrier
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const days = data?.days || [];

  // Format week range
  const formatWeekRange = () => {
    if (!data?.week_start || !data?.week_end) return '';
    const start = new Date(data.week_start);
    const end = new Date(data.week_end);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  // Count total appointments
  const totalAppointments = days.reduce((sum, day) => sum + day.appointments.length, 0);

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {formatWeekRange()}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Cette semaine
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {totalAppointments} rendez-vous cette semaine
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <DayColumn
                key={day.date}
                day={day}
                onAppointmentClick={handleAppointmentClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Confirmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Terminé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Annulé</span>
        </div>
      </div>

      {/* Preview Sheet */}
      {selectedAppointment && (
        <AppointmentPreviewSheet
          appointment={{
            id: selectedAppointment.id,
            requestId: selectedAppointment.id, // Using id as requestId for calendar view
            reference: selectedAppointment.reference,
            workflowCode: selectedAppointment.workflow_code,
            citizenName: selectedAppointment.citizen_name,
            citizenEmail: null,
            citizenPhone: null,
            appointmentTime: selectedAppointment.cita_time || '',
            status: selectedAppointment.appointment_status || selectedAppointment.status,
            locationName: selectedAppointment.cita_location || '',
            locationId: '',
            notes: null,
            createdAt: '',
          }}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onReschedule={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// DAY COLUMN COMPONENT
// =============================================================================

interface DayColumnProps {
  day: {
    date: string;
    day_name: string;
    day_number: number;
    is_today: boolean;
    is_past: boolean;
    appointments: WeekAppointmentItem[];
  };
  onAppointmentClick: (appointment: WeekAppointmentItem) => void;
}

function DayColumn({ day, onAppointmentClick }: DayColumnProps) {
  const dayNames: Record<string, string> = {
    lunes: 'Lun',
    martes: 'Mar',
    miércoles: 'Mer',
    jueves: 'Jeu',
    viernes: 'Ven',
    sábado: 'Sam',
    domingo: 'Dim',
  };

  return (
    <div
      className={`
        rounded-lg border overflow-hidden min-h-[300px]
        ${day.is_today ? 'ring-2 ring-primary ring-offset-1' : ''}
        ${day.is_past ? 'opacity-60' : ''}
      `}
    >
      {/* Day Header */}
      <div
        className={`
          p-2 text-center border-b
          ${day.is_today ? 'bg-primary text-primary-foreground' : 'bg-muted'}
        `}
      >
        <p className="text-xs uppercase tracking-wide">
          {dayNames[day.day_name] || day.day_name.slice(0, 3)}
        </p>
        <p className="text-lg font-bold">{day.day_number}</p>
      </div>

      {/* Appointments */}
      <div className="p-1 max-h-[280px] overflow-y-auto">
        {day.appointments.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Aucun RDV
          </div>
        ) : (
          day.appointments.map((appointment) => {
            const statusKey = appointment.appointment_status || appointment.status;
            const style = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;

            return (
              <button
                key={appointment.id}
                onClick={() => onAppointmentClick(appointment)}
                className={`
                  w-full p-2 mb-1 rounded text-left text-xs
                  border-l-4 transition-all hover:shadow-sm
                  ${style.bg} ${style.border}
                `}
              >
                {/* Time */}
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono font-medium">
                    {(appointment.cita_time || '').slice(0, 5)}
                  </span>
                </div>

                {/* Citizen Name */}
                <div className="flex items-center gap-1 truncate">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {appointment.citizen_name}
                  </span>
                </div>

                {/* Reference */}
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{appointment.reference}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Day Footer */}
      <div className="p-2 border-t bg-muted/50 text-center">
        <Badge variant="secondary" className="text-xs">
          {day.appointments.length} RDV
        </Badge>
      </div>
    </div>
  );
}

export default CalendarTab;
