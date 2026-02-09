/**
 * Workflow Mapping Form Component
 * Form for creating and editing workflow-to-menu mappings
 *
 * Dynamic fields powered by backend API:
 * - workflow_pattern: Select from workflow categories (derived from GET /menu-config/workflows)
 * - menu_group_id: Auto-suggested based on selected pattern
 * - menu_title_key: Auto-suggested based on selected pattern
 * - menu_icon: Select with visual preview
 *
 * @module admin/components
 * @date 2026-01-19
 * @updated 2026-02-09 - Dynamic dropdowns from API, auto-fill logic
 */

'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  Plane,
  Globe,
  Car,
  FileSignature,
  Briefcase,
  Building2,
  FileText,
  CreditCard,
  Users,
  Shield,
  Settings,
  BadgeCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { WorkflowMenuMapping } from '@/modules/agent-dashboard/types/menu-config';
import type {
  WorkflowMappingCreateRequest,
  WorkflowMappingUpdateRequest,
} from '../services/menuConfigService';
import { useWorkflowCodesGrouped } from '../hooks/useWorkflowCodes';

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
// ICON OPTIONS WITH COMPONENTS (for visual preview)
// =============================================================================

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Plane', label: 'Pasaportes', icon: Plane },
  { value: 'Globe', label: 'Residencias / Visados', icon: Globe },
  { value: 'Car', label: 'Vehículos / Licencias', icon: Car },
  { value: 'Truck', label: 'Transporte', icon: Truck },
  { value: 'FileSignature', label: 'Contratos', icon: FileSignature },
  { value: 'BadgeCheck', label: 'Funcionarios', icon: BadgeCheck },
  { value: 'Briefcase', label: 'Permisos de Trabajo', icon: Briefcase },
  { value: 'Building2', label: 'Empresas', icon: Building2 },
  { value: 'FileText', label: 'Documentos', icon: FileText },
  { value: 'CreditCard', label: 'Pagos', icon: CreditCard },
  { value: 'Users', label: 'Personas', icon: Users },
  { value: 'Shield', label: 'Seguridad', icon: Shield },
  { value: 'Settings', label: 'Configuración', icon: Settings },
];

// =============================================================================
// AUTO-FILL PRESETS: pattern → suggested defaults
// Derived from existing workflow_menu_mapping DB entries
// =============================================================================

const PATTERN_PRESETS: Record<string, {
  menu_group_id: string;
  menu_title_key: string;
  menu_icon: string;
  include_appointments: boolean;
}> = {
  'PASAPORTE_%': {
    menu_group_id: 'pasaportes',
    menu_title_key: 'agent.nav.passports',
    menu_icon: 'Plane',
    include_appointments: true,
  },
  'RESIDENCIA_%': {
    menu_group_id: 'residencias',
    menu_title_key: 'agent.nav.residences',
    menu_icon: 'Globe',
    include_appointments: true,
  },
  'CONDUCIR_%': {
    menu_group_id: 'licencias',
    menu_title_key: 'agent.nav.driverLicenses',
    menu_icon: 'Car',
    include_appointments: false,
  },
  'VEHICULO_%': {
    menu_group_id: 'vehiculos',
    menu_title_key: 'agent.nav.vehicles',
    menu_icon: 'Car',
    include_appointments: false,
  },
  'CONTRATO_%': {
    menu_group_id: 'contratos',
    menu_title_key: 'agent.nav.contracts',
    menu_icon: 'FileSignature',
    include_appointments: false,
  },
  'FP_%': {
    menu_group_id: 'funcionarios',
    menu_title_key: 'agent.nav.civilServants',
    menu_icon: 'BadgeCheck',
    include_appointments: false,
  },
  'PRORROGA_%': {
    menu_group_id: 'visados',
    menu_title_key: 'agent.nav.visas',
    menu_icon: 'Globe',
    include_appointments: false,
  },
  'VISADO_%': {
    menu_group_id: 'visados',
    menu_title_key: 'agent.nav.visas',
    menu_icon: 'Globe',
    include_appointments: false,
  },
};

// =============================================================================
// PROPS
// =============================================================================

interface WorkflowMappingFormProps {
  /** Existing mapping for editing (undefined for create mode) */
  mapping?: WorkflowMenuMapping;
  /** Called when form is submitted */
  onSubmit: (data: WorkflowMappingCreateRequest | WorkflowMappingUpdateRequest) => void | Promise<void>;
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

  // Fetch workflow codes from backend API for dynamic pattern options
  const {
    grouped: workflowsByCategory,
    categories,
    isLoading: codesLoading,
  } = useWorkflowCodesGrouped();

  // Build pattern options from API workflow categories
  const patternOptions = useMemo(() => {
    if (!categories.length) return Object.keys(PATTERN_PRESETS).map(p => ({
      value: p,
      label: p,
      count: 0,
    }));

    return categories.map((category) => {
      const workflows = workflowsByCategory[category] || [];
      const pattern = `${category}_%`;
      return {
        value: pattern,
        label: `${category} (${workflows.length} workflows)`,
        count: workflows.length,
        workflows: workflows.map(w => w.code),
      };
    });
  }, [categories, workflowsByCategory]);

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

  // Auto-fill fields when workflow_pattern changes (create mode only)
  const selectedPattern = form.watch('workflow_pattern');

  useEffect(() => {
    if (mode !== 'create' || !selectedPattern) return;

    const preset = PATTERN_PRESETS[selectedPattern];
    if (preset) {
      form.setValue('menu_group_id', preset.menu_group_id);
      form.setValue('menu_title_key', preset.menu_title_key);
      form.setValue('menu_icon', preset.menu_icon);
      form.setValue('include_appointments', preset.include_appointments);
    } else {
      // Generate defaults from pattern
      const category = selectedPattern.replace('_%', '').toLowerCase();
      form.setValue('menu_group_id', category);
      form.setValue('menu_title_key', `agent.nav.${category}`);
    }
  }, [selectedPattern, mode, form]);

  const handleSubmit = (values: WorkflowMappingFormValues) => {
    onSubmit(values);
  };

  // Get current icon for preview
  const currentIcon = form.watch('menu_icon');
  const IconPreview = ICON_OPTIONS.find(i => i.value === currentIcon)?.icon || FileText;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Main Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'create' ? t('mappings.create') : t('mappings.edit')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workflow pattern — Dynamic Select from API */}
            <FormField
              control={form.control}
              name="workflow_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.workflowPattern')}</FormLabel>
                  {codesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('fields.selectWorkflowPattern')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorías de workflows</SelectLabel>
                          {patternOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <span>{opt.value}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {opt.count}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                  <FormDescription>
                    {t('fields.workflowPatternDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu group ID — Auto-filled, editable */}
            <FormField
              control={form.control}
              name="menu_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuGroupId')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuGroupIdDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu title key — Auto-filled, editable */}
            <FormField
              control={form.control}
              name="menu_title_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuTitleKey')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuTitleKeyDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu icon — Select with visual preview */}
            <FormField
              control={form.control}
              name="menu_icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuIcon')}</FormLabel>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg border bg-muted">
                      <IconPreview className="h-5 w-5 text-primary" />
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar icono" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ICON_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{opt.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'service_requests'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service_requests">service_requests</SelectItem>
                        <SelectItem value="treasury">treasury</SelectItem>
                        <SelectItem value="declarations">declarations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('fields.permissionPrefixDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sub-menu toggles */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">
                {t('fields.subMenuOptions')}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="include_pending"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">
                          {t('fields.includePending')}
                        </FormLabel>
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
                        <FormLabel className="text-sm">
                          {t('fields.includeValidation')}
                        </FormLabel>
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
                        <FormLabel className="text-sm">
                          {t('fields.includeAppointments')}
                        </FormLabel>
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
                        <FormLabel className="text-sm">
                          {t('fields.includeHistory')}
                        </FormLabel>
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

        {/* Preview Card — Shows what workflows will be matched */}
        {selectedPattern && patternOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Workflows correspondants</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const matchedCategory = selectedPattern.replace('_%', '');
                const matchedWorkflows = workflowsByCategory[matchedCategory] || [];
                if (matchedWorkflows.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Aucun workflow actif correspond au pattern {selectedPattern}
                    </p>
                  );
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {matchedWorkflows.map((wf) => (
                      <Badge key={wf.code} variant="outline" className="text-xs">
                        {wf.code}
                      </Badge>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

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
