/**
 * Workflow Mapping Form Component
 * Form for creating and editing workflow-to-menu mappings
 *
 * @module admin/components
 * @date 2026-01-19
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { WorkflowMenuMapping } from '@/modules/agent-dashboard/types/menu-config';
import type {
  WorkflowMappingCreateRequest,
  WorkflowMappingUpdateRequest,
} from '../services/menuConfigService';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const workflowMappingSchema = z.object({
  workflow_pattern: z
    .string()
    .min(1, 'Workflow pattern is required')
    .max(100, 'Pattern must be at most 100 characters'),
  menu_group_id: z
    .string()
    .min(1, 'Menu group ID is required')
    .max(50, 'Menu group ID must be at most 50 characters'),
  menu_title_key: z
    .string()
    .min(1, 'Menu title key is required')
    .max(100, 'Title key must be at most 100 characters'),
  menu_icon: z
    .string()
    .min(1, 'Menu icon is required')
    .max(50, 'Icon must be at most 50 characters'),
  display_order: z.coerce.number().int().min(0).default(0),
  include_pending: z.boolean().default(true),
  include_validation: z.boolean().default(true),
  include_appointments: z.boolean().default(false),
  include_history: z.boolean().default(true),
  permission_prefix: z.string().max(50).optional(),
  is_active: z.boolean().default(true),
});

type WorkflowMappingFormValues = z.infer<typeof workflowMappingSchema>;

// =============================================================================
// ICON OPTIONS
// =============================================================================

const ICON_OPTIONS = [
  { value: 'Plane', label: 'Plane (Passports)' },
  { value: 'Globe', label: 'Globe (Residences/Visas)' },
  { value: 'Car', label: 'Car (Vehicles/Licenses)' },
  { value: 'FileSignature', label: 'FileSignature (Contracts)' },
  { value: 'Briefcase', label: 'Briefcase (Work Permits)' },
  { value: 'Building2', label: 'Building2 (Businesses)' },
  { value: 'FileText', label: 'FileText (Documents)' },
  { value: 'CreditCard', label: 'CreditCard (Payments)' },
  { value: 'Users', label: 'Users (People)' },
  { value: 'Shield', label: 'Shield (Security)' },
  { value: 'Settings', label: 'Settings (Configuration)' },
];

// =============================================================================
// PROPS
// =============================================================================

interface WorkflowMappingFormProps {
  /** Existing mapping for editing (undefined for create mode) */
  mapping?: WorkflowMenuMapping;
  /** Called when form is submitted */
  onSubmit: (data: WorkflowMappingCreateRequest | WorkflowMappingUpdateRequest) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Mode: create or edit */
  mode?: 'create' | 'edit';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WorkflowMappingForm({
  mapping,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: WorkflowMappingFormProps) {
  const t = useTranslations('menuConfig');

  const form = useForm<WorkflowMappingFormValues>({
    resolver: zodResolver(workflowMappingSchema),
    defaultValues: {
      workflow_pattern: mapping?.workflow_pattern ?? '',
      menu_group_id: mapping?.menu_group_id ?? '',
      menu_title_key: mapping?.menu_title_key ?? '',
      menu_icon: mapping?.menu_icon ?? 'FileText',
      display_order: mapping?.display_order ?? 0,
      include_pending: mapping?.include_pending ?? true,
      include_validation: mapping?.include_validation ?? true,
      include_appointments: mapping?.include_appointments ?? false,
      include_history: mapping?.include_history ?? true,
      permission_prefix: mapping?.permission_prefix ?? 'service_requests',
      is_active: mapping?.is_active ?? true,
    },
  });

  const handleSubmit = (values: WorkflowMappingFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'create' ? t('mappings.create') : t('mappings.edit')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workflow pattern */}
            <FormField
              control={form.control}
              name="workflow_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.workflowPattern')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="PASAPORTE_%, RESIDENCIA_%"
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.workflowPatternDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu group ID */}
            <FormField
              control={form.control}
              name="menu_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuGroupId')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pasaportes, residencias" />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuGroupIdDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu title key */}
            <FormField
              control={form.control}
              name="menu_title_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuTitleKey')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="agent.nav.passports" />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuTitleKeyDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu icon */}
            <FormField
              control={form.control}
              name="menu_icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuIcon')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display order */}
            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.displayOrder')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} />
                  </FormControl>
                  <FormDescription>
                    {t('fields.displayOrderDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission prefix */}
            <FormField
              control={form.control}
              name="permission_prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.permissionPrefix')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="service_requests" />
                  </FormControl>
                  <FormDescription>
                    {t('fields.permissionPrefixDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sub-menu toggles */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">
                {t('fields.subMenuOptions')}
              </h4>

              <FormField
                control={form.control}
                name="include_pending"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includePending')}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includePendingDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_validation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includeValidation')}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includeValidationDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_appointments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includeAppointments')}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includeAppointmentsDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_history"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includeHistory')}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includeHistoryDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Is active switch */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('fields.isActive')}</FormLabel>
                    <FormDescription>
                      {t('fields.isActiveDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? t('actions.create') : t('actions.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default WorkflowMappingForm;
