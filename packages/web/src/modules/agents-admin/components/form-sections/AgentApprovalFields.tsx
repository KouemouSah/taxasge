'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface AgentApprovalFieldsProps {
  form: UseFormReturn<any>;
}

/**
 * Approval limits: can_approve_unlimited + max_approval_amount.
 * Only rendered for payment-processing entities (no workflow_codes).
 * Parent controls visibility.
 */
export function AgentApprovalFields({ form }: AgentApprovalFieldsProps) {
  const watchCanApproveUnlimited = form.watch('can_approve_unlimited');

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="can_approve_unlimited"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Peut approuver des montants illimités</FormLabel>
              <FormDescription>
                Si activé, l&apos;agent peut approuver tout montant sans plafond.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {!watchCanApproveUnlimited && (
        <FormField
          control={form.control}
          name="max_approval_amount"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Montant maximum (XAF)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100000"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Plafond d&apos;approbation par transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
