/**
 * Appointments Page
 * Main page with 3 tabs: Today, Schedule, Calendar
 *
 * @module agent-dashboard/components/appointments
 * @date 2026-01-26
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, CalendarPlus, CalendarDays, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TodayTab } from './TodayTab';
import { ScheduleTab } from './ScheduleTab';
import { CalendarTab } from './CalendarTab';
import { useSlotsDetailed } from '../../hooks/useAppointments';
import type { EntityCode } from '../../types';

// =============================================================================
// PROPS
// =============================================================================

interface AppointmentsPageProps {
  entityCode: EntityCode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AppointmentsPage({ entityCode }: AppointmentsPageProps) {
  const t = useTranslations('agent.pages.appointments');
  const [activeTab, setActiveTab] = useState<string>('today');
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);

  // Fetch slots data to get available locations
  const { data: slotsData } = useSlotsDetailed(entityCode, {
    weekOffset: 0,
    locationId: selectedLocationId,
  });

  const locations = slotsData?.locationsAvailable || [];
  const currentLocation = slotsData?.location;

  // Set initial location if not set
  React.useEffect(() => {
    if (!selectedLocationId && currentLocation) {
      setSelectedLocationId(currentLocation.id);
    }
  }, [selectedLocationId, currentLocation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('pageTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('pageSubtitle', { entity: entityCode.replace('_', ' ') })}
          </p>
        </div>

        {/* Location Selector */}
        {locations.length > 1 && (
          <Select
            value={selectedLocationId || currentLocation?.id || ''}
            onValueChange={(val) => setSelectedLocationId(val || undefined)}
          >
            <SelectTrigger className="w-[220px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('selectLocation')} />
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.today')}</span>
            <span className="sm:hidden">{t('tabs.today')}</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.schedule')}</span>
            <span className="sm:hidden">{t('tabs.schedule')}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.calendar')}</span>
            <span className="sm:hidden">{t('tabs.calendar')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <TodayTab
            entityCode={entityCode}
            locationId={selectedLocationId}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <ScheduleTab
            entityCode={entityCode}
            locationId={selectedLocationId}
            onLocationChange={setSelectedLocationId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarTab
            entityCode={entityCode}
            locationId={selectedLocationId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AppointmentsPage;
