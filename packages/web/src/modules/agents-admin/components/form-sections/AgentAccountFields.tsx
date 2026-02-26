'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SafeSelect } from '@/components/ui/safe-select';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

interface AgentAccountFieldsProps {
  form: UseFormReturn<any>;
}

export function AgentAccountFields({ form }: AgentAccountFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input type="email" placeholder="agent@taxasge.gq" {...field} />
              </FormControl>
              <FormDescription>
                Un email d&apos;activation sera envoyé à cette adresse.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First Name */}
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Prénom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Nom de famille" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="222XXXXXX" {...field} />
              </FormControl>
              <FormDescription>Format GE: 222/555/551/333 + 6 chiffres</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language */}
        <FormField
          control={form.control}
          name="preferred_language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Langue préférée</FormLabel>
              <FormControl>
                <SafeSelect
                  value={field.value || 'es'}
                  onValueChange={field.onChange}
                  items={LANGUAGE_OPTIONS}
                  placeholder="Sélectionner la langue"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
