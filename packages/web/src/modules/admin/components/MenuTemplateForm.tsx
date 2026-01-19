/**
 * Menu Template Form Component
 * Form for creating and editing menu templates
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
import type { MenuTemplate } from '@/modules/agent-dashboard/types/menu-config';
import type { MenuTemplateCreateRequest, MenuTemplateUpdateRequest } from '../services/menuConfigService';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const menuTemplateSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Code must be lowercase with underscores only'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().optional(),
  template_type: z.enum(['workflow', 'module', 'custom']),
  entity_code: z.string().optional(),
  menu_structure: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ),
  dashboard_widgets: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ),
  is_active: z.boolean().default(true),
});

type MenuTemplateFormValues = z.infer<typeof menuTemplateSchema>;

// =============================================================================
// PROPS
// =============================================================================

interface MenuTemplateFormProps {
  /** Existing template for editing (undefined for create mode) */
  template?: MenuTemplate;
  /** Called when form is submitted */
  onSubmit: (data: MenuTemplateCreateRequest | MenuTemplateUpdateRequest) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Mode: create or edit */
  mode?: 'create' | 'edit';
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_MENU_STRUCTURE = JSON.stringify(
  {
    version: '1.0',
    source: 'custom',
    menus: [
      {
        id: 'dashboard',
        titleKey: 'agent.nav.dashboard',
        href: '/dashboard/agent',
        icon: 'LayoutDashboard',
      },
    ],
  },
  null,
  2
);

const DEFAULT_DASHBOARD_WIDGETS = JSON.stringify(
  {
    version: '1.0',
    layout: 'grid',
    widgets: [
      { id: 'stats_card', visible: true, position: 1, size: 'medium' },
    ],
  },
  null,
  2
);

// =============================================================================
// COMPONENT
// =============================================================================

export function MenuTemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: MenuTemplateFormProps) {
  const t = useTranslations('menuConfig');

  const form = useForm<MenuTemplateFormValues>({
    resolver: zodResolver(menuTemplateSchema),
    defaultValues: {
      code: template?.code ?? '',
      name: template?.name ?? '',
      description: template?.description ?? '',
      template_type: template?.template_type ?? 'custom',
      entity_code: template?.entity_code ?? '',
      menu_structure: template?.menu_structure
        ? JSON.stringify(template.menu_structure, null, 2)
        : DEFAULT_MENU_STRUCTURE,
      dashboard_widgets: template?.dashboard_widgets
        ? JSON.stringify(template.dashboard_widgets, null, 2)
        : DEFAULT_DASHBOARD_WIDGETS,
      is_active: template?.is_active ?? true,
    },
  });

  const handleSubmit = (values: MenuTemplateFormValues) => {
    const data = {
      ...values,
      menu_structure: JSON.parse(values.menu_structure),
      dashboard_widgets: values.dashboard_widgets
        ? JSON.parse(values.dashboard_widgets)
        : undefined,
    };

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'create' ? t('templates.create') : t('templates.edit')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code field - readonly in edit mode */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.code')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="my_template_code"
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.codeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Template Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Template description..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template type */}
            <FormField
              control={form.control}
              name="template_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.templateType')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="workflow">
                        {t('fields.types.workflow')}
                      </SelectItem>
                      <SelectItem value="module">
                        {t('fields.types.module')}
                      </SelectItem>
                      <SelectItem value="custom">
                        {t('fields.types.custom')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('fields.templateTypeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entity code (optional) */}
            <FormField
              control={form.control}
              name="entity_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.entityCode')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="TESORO, CNEDOGE, etc." />
                  </FormControl>
                  <FormDescription>
                    {t('fields.entityCodeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu structure JSON */}
            <FormField
              control={form.control}
              name="menu_structure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuStructure')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="{...}"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuStructureDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dashboard widgets JSON */}
            <FormField
              control={form.control}
              name="dashboard_widgets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.dashboardWidgets')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="{...}"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.dashboardWidgetsDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

export default MenuTemplateForm;
