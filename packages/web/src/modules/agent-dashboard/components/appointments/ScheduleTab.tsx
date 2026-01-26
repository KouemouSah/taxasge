/**
 * ScheduleTab Component
 * Calendar view for scheduling new appointments
 *
 * @module agent-dashboard/components/appointments
 * @date 2026-01-26
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Badge removed - not currently used
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Search,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useSlotsDetailed,
  useBookForCitizen,
  DaySlotDetail,
  SlotTimeDetail,
} from '../../hooks/useAppointments';
import type { EntityCode } from '../../types';

// =============================================================================
// PROPS
// =============================================================================

interface ScheduleTabProps {
  entityCode: EntityCode;
  locationId?: string;
  onLocationChange?: (locationId: string) => void;
}

// =============================================================================
// SLOT STATUS COLORS
// =============================================================================

function getSlotColor(slot: SlotTimeDetail): string {
  if (!slot.isAvailable) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
  if (slot.available === slot.capacity) return 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer';
  if (slot.available > 0) return 'bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer';
  return 'bg-red-50 text-red-700 cursor-not-allowed';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ScheduleTab({
  entityCode,
  locationId,
  onLocationChange,
}: ScheduleTabProps) {
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    dayName: string;
  } | null>(null);
  const [requestId, setRequestId] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError, refetch } = useSlotsDetailed(entityCode, {
    weekOffset,
    locationId,
  });

  const bookMutation = useBookForCitizen();

  const handleSlotClick = (day: DaySlotDetail, slot: SlotTimeDetail) => {
    if (!slot.isAvailable) return;
    setSelectedSlot({
      date: day.date,
      time: slot.time,
      dayName: day.dayName,
    });
  };

  const handleBook = async () => {
    if (!selectedSlot || !requestId.trim() || !locationId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un créneau et entrer un numéro de demande',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await bookMutation.mutateAsync({
        requestId: requestId.trim(),
        entityLocationId: locationId,
        appointmentDate: selectedSlot.date,
        appointmentTime: selectedSlot.time,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast({
          title: 'Rendez-vous créé',
          description: `RDV confirmé pour le ${selectedSlot.date} à ${selectedSlot.time}`,
        });
        setSelectedSlot(null);
        setRequestId('');
        setNotes('');
        refetch();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de créer le rendez-vous',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSelection = () => {
    setSelectedSlot(null);
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
  const locations = data?.locationsAvailable || [];
  const currentLocation = data?.location;

  // Format week range
  const formatWeekRange = () => {
    if (!data?.weekStart || !data?.weekEnd) return '';
    const start = new Date(data.weekStart);
    const end = new Date(data.weekEnd);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Location Selector */}
          {locations.length > 1 && (
            <Select
              value={locationId || currentLocation?.id || ''}
              onValueChange={(val) => onLocationChange?.(val)}
            >
              <SelectTrigger className="w-[200px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Localisation" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Week Navigation */}
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
                Aujourd&apos;hui
              </Button>
            )}
          </div>
        </div>

        {/* Capacity Info */}
        <div className="text-sm text-muted-foreground">
          {data?.totalAvailable} créneaux disponibles / {data?.totalCapacity} total
        </div>
      </div>

      {/* Calendar Grid + Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <DayColumn
                    key={day.date}
                    day={day}
                    selectedSlot={selectedSlot}
                    onSlotClick={(slot) => handleSlotClick(day, slot)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span>Limité</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span>Complet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              <span>Fermé</span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nouvelle Réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSlot ? (
                <>
                  {/* Selected Slot Info */}
                  <div className="p-3 bg-primary/5 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium capitalize">
                        {selectedSlot.dayName}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedSlot.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-mono font-semibold">{selectedSlot.time}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={handleCancelSelection}
                    >
                      Changer créneau
                    </Button>
                  </div>

                  {/* Request ID Input */}
                  <div className="space-y-2">
                    <Label htmlFor="requestId">
                      N° de demande <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="requestId"
                        placeholder="REQ-..."
                        value={requestId}
                        onChange={(e) => setRequestId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notes pour ce rendez-vous..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Book Button */}
                  <Button
                    className="w-full"
                    onClick={handleBook}
                    disabled={!requestId.trim() || bookMutation.isPending}
                  >
                    {bookMutation.isPending ? (
                      'Création...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmer le RDV
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sélectionnez un créneau dans le calendrier</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DAY COLUMN COMPONENT
// =============================================================================

interface DayColumnProps {
  day: DaySlotDetail;
  selectedSlot: { date: string; time: string } | null;
  onSlotClick: (slot: SlotTimeDetail) => void;
}

function DayColumn({ day, selectedSlot, onSlotClick }: DayColumnProps) {
  const isSelected = (slot: SlotTimeDetail) =>
    selectedSlot?.date === day.date && selectedSlot?.time === slot.time;

  return (
    <div
      className={`
        rounded-lg border overflow-hidden
        ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
        ${day.isPast ? 'opacity-50' : ''}
      `}
    >
      {/* Day Header */}
      <div
        className={`
          p-2 text-center border-b
          ${day.isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}
        `}
      >
        <p className="text-xs uppercase tracking-wide">
          {day.dayName.slice(0, 3)}
        </p>
        <p className="text-lg font-bold">{day.dayNumber}</p>
      </div>

      {/* Slots */}
      <div className="p-1 max-h-64 overflow-y-auto">
        {day.slots.length === 0 ? (
          <div className="p-2 text-center text-xs text-muted-foreground">
            Fermé
          </div>
        ) : (
          day.slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => onSlotClick(slot)}
              disabled={!slot.isAvailable}
              className={`
                w-full px-2 py-1.5 mb-1 rounded text-xs font-medium
                transition-all
                ${getSlotColor(slot)}
                ${isSelected(slot) ? 'ring-2 ring-primary ring-offset-1' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">{slot.time}</span>
                <span className="text-[10px]">
                  {slot.available}/{slot.capacity}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Day Summary */}
      <div className="p-2 border-t bg-muted/50 text-center">
        <span className="text-xs text-muted-foreground">
          {day.totalAvailable} dispo
        </span>
      </div>
    </div>
  );
}

export default ScheduleTab;
