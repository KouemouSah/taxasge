'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

interface AgentScheduleFieldsProps {
  form: UseFormReturn<any>;
}

const DAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

export function AgentScheduleFields({ form }: AgentScheduleFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Working hours start */}
        <FormField
          control={form.control}
          name="working_hours_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure de début</FormLabel>
              <FormControl>
                <Input type="time" {...field} value={field.value || '08:00'} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Working hours end */}
        <FormField
          control={form.control}
          name="working_hours_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure de fin</FormLabel>
              <FormControl>
                <Input type="time" {...field} value={field.value || '17:00'} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Working days toggle */}
      <FormField
        control={form.control}
        name="working_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jours de travail</FormLabel>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={field.value?.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const current: number[] = field.value || [];
                    const updated = current.includes(day.value)
                      ? current.filter((d: number) => d !== day.value)
                      : [...current, day.value];
                    field.onChange(updated);
                  }}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
