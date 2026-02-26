'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

interface AgentCapabilitiesFieldsProps {
  form: UseFormReturn<any>;
}

const CAPABILITIES = [
  {
    name: 'can_escalate' as const,
    label: 'Peut escalader',
    description: 'Escalader les demandes au superviseur ou à un autre agent.',
  },
  {
    name: 'can_assign_tasks' as const,
    label: 'Peut assigner des tâches',
    description: 'Assigner des demandes à d\'autres agents de l\'équipe.',
  },
  {
    name: 'can_reassign' as const,
    label: 'Peut réassigner',
    description: 'Transférer une demande assignée vers un autre agent.',
  },
] as const;

/**
 * Supervisor capabilities: can_escalate, can_assign_tasks, can_reassign.
 * Only rendered when `is_supervisor = true` (handled by parent).
 */
export function AgentCapabilitiesFields({ form }: AgentCapabilitiesFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CAPABILITIES.map((cap) => (
          <FormField
            key={cap.name}
            control={form.control}
            name={cap.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">{cap.label}</FormLabel>
                  <FormDescription className="text-xs">
                    {cap.description}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
