/**
 * Smart Workflow Mapping Form
 * Grouped workflow selector + auto-derivation + real-time pattern matching
 *
 * @module admin/components
 * @date 2026-02-17
 */

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Loader2,
  Check,
  ChevronsUpDown,
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
  Truck,
  AlertTriangle,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowCodesGrouped } from '@/modules/admin/hooks/useWorkflowCodes';
import { sqlLikeToRegex } from '@/core/utils/sql-like';
import apiClient from '@/core/api/client';
import type { WorkflowMenuMapping } from '@/modules/agent-dashboard/types/menu-config';
import type {
  WorkflowMappingCreateRequest,
  WorkflowMappingUpdateRequest,
} from '../services/menuConfigService';

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Plane,
  Globe,
  Car,
  Truck,
  FileSignature,
  Briefcase,
  Building2,
  FileText,
  CreditCard,
  Users,
  Shield,
  Settings,
  AlertTriangle,
  Layers,
};

const ICON_OPTIONS = Object.keys(ICON_MAP).map((name) => ({
  value: name,
  label: name,
}));

/**
 * Find an existing mapping whose pattern matches the given workflow code.
 * This enables dynamic auto-derivation: no hardcoded category→group maps needed.
 */
function findMatchingMapping(
  code: string,
  mappings: WorkflowMenuMapping[]
): WorkflowMenuMapping | undefined {
  for (const m of mappings) {
    if (!m.is_active) continue;
    try {
      const regex = sqlLikeToRegex(m.workflow_pattern);
      if (regex.test(code)) return m;
    } catch { /* skip invalid patterns */ }
  }
  return undefined;
}

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
  include_escalation: z.boolean().default(true),
  include_batch: z.boolean().default(false),
  permission_prefix: z.string().max(50).optional(),
  is_active: z.boolean().default(true),
});

type WorkflowMappingFormValues = z.infer<typeof workflowMappingSchema>;

// =============================================================================
// PROPS
// =============================================================================

interface WorkflowMappingFormProps {
  mapping?: WorkflowMenuMapping;
  onSubmit: (data: WorkflowMappingCreateRequest | WorkflowMappingUpdateRequest) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

// =============================================================================
// HELPER: Pattern Match Preview
// =============================================================================

function PatternMatchPreview({
  pattern,
  workflows,
}: {
  pattern: string;
  workflows: { code: string; name_es: string }[] | undefined;
}) {
  const matches = useMemo(() => {
    if (!pattern || !workflows?.length) return [];
    try {
      const regex = sqlLikeToRegex(pattern);
      return workflows.filter((wf) => regex.test(wf.code));
    } catch {
      return [];
    }
  }, [pattern, workflows]);

  if (!pattern) return null;

  if (matches.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
        <AlertTriangle className="h-3 w-3" />
        <span>Este patrón no coincide con ningún workflow activo</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3 w-3" />
        <span>Coincide con {matches.length} workflow(s)</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {matches.slice(0, 8).map((m) => (
          <Badge key={m.code} variant="outline" className="text-[10px] font-mono">
            {m.code}
          </Badge>
        ))}
        {matches.length > 8 && (
          <Badge variant="outline" className="text-[10px]">
            +{matches.length - 8} más
          </Badge>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER: Icon Preview
// =============================================================================

function IconPreview({ iconName }: { iconName: string }) {
  const Icon = ICON_MAP[iconName];
  if (!Icon) return null;
  return <Icon className="h-4 w-4" />;
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
  const t = useTranslations('admin.menuConfig');
  const [patternMode, setPatternMode] = useState<'select' | 'custom'>(
    mode === 'edit' ? 'custom' : 'select'
  );
  const [comboOpen, setComboOpen] = useState(false);

  // Fetch workflows grouped by category
  const { grouped, categories, workflows } = useWorkflowCodesGrouped();

  // Fetch ALL existing mappings for dynamic auto-derivation
  const { data: existingMappingsData } = useQuery({
    queryKey: ['workflow-mappings', 'all-for-form'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: WorkflowMenuMapping[] }>(
        '/menu-config/workflow-mappings',
        { params: { page: 1, page_size: 100 } }
      );
      return response.data.items;
    },
    staleTime: 10 * 60 * 1000,
  });
  const existingMappings = useMemo(
    () => existingMappingsData ?? [],
    [existingMappingsData]
  );

  // Compute next display_order for new mappings
  const nextDisplayOrder = useMemo(() => {
    if (!existingMappings.length) return 0;
    return Math.max(...existingMappings.map((m) => m.display_order)) + 1;
  }, [existingMappings]);

  const form = useForm<WorkflowMappingFormValues>({
    resolver: zodResolver(workflowMappingSchema),
    defaultValues: {
      workflow_pattern: mapping?.workflow_pattern ?? '',
      menu_group_id: mapping?.menu_group_id ?? '',
      menu_title_key: mapping?.menu_title_key ?? '',
      menu_icon: mapping?.menu_icon ?? 'FileText',
      display_order: mapping?.display_order ?? nextDisplayOrder,
      include_pending: mapping?.include_pending ?? true,
      include_validation: mapping?.include_validation ?? true,
      include_appointments: mapping?.include_appointments ?? false,
      include_history: mapping?.include_history ?? true,
      include_escalation: mapping?.include_escalation ?? true,
      include_batch: mapping?.include_batch ?? false,
      permission_prefix: mapping?.permission_prefix ?? 'service_request',
      is_active: mapping?.is_active ?? true,
    },
  });

  const watchedPattern = form.watch('workflow_pattern');

  // Auto-derive fields when workflow is selected — 100% dynamic from existing DB data
  const handleWorkflowSelect = useCallback(
    (code: string, _category: string) => {
      form.setValue('workflow_pattern', code, { shouldValidate: true });

      // Try to find an existing mapping that already covers this code
      const match = findMatchingMapping(code, existingMappings);

      if (match) {
        // Auto-derive from existing mapping (same group, icon, title, toggles)
        form.setValue('menu_group_id', match.menu_group_id);
        form.setValue('menu_title_key', match.menu_title_key);
        form.setValue('menu_icon', match.menu_icon);
        form.setValue('display_order', match.display_order);
        form.setValue('permission_prefix', match.permission_prefix ?? 'service_request');
        form.setValue('include_appointments', match.include_appointments);
        form.setValue('include_escalation', match.include_escalation);
        form.setValue('include_batch', match.include_batch);
      } else {
        // No existing mapping — derive from category
        const groupId = _category.toLowerCase().replace(/\s+/g, '_');
        form.setValue('menu_group_id', groupId);
        form.setValue('menu_title_key', `agent.nav.${groupId}`);
        form.setValue('display_order', nextDisplayOrder);
      }

      setComboOpen(false);
    },
    [form, existingMappings, nextDisplayOrder]
  );

  // Auto-derive title_key when group_id changes
  const handleGroupIdChange = useCallback(
    (value: string) => {
      const currentTitleKey = form.getValues('menu_title_key');
      // Only auto-derive if title_key follows the pattern or is empty
      if (!currentTitleKey || currentTitleKey.startsWith('agent.nav.')) {
        form.setValue('menu_title_key', `agent.nav.${value}`);
      }
    },
    [form]
  );

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
            {/* ============================================= */}
            {/* Workflow Pattern - Smart Selector              */}
            {/* ============================================= */}
            <FormField
              control={form.control}
              name="workflow_pattern"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('fields.workflowPattern')}</FormLabel>
                    {mode === 'create' && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant={patternMode === 'select' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => setPatternMode('select')}
                        >
                          {t('patternMode.select', { defaultValue: 'Seleccionar workflow' })}
                        </Button>
                        <Button
                          type="button"
                          variant={patternMode === 'custom' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => setPatternMode('custom')}
                        >
                          {t('patternMode.custom', { defaultValue: 'Patrón personalizado' })}
                        </Button>
                      </div>
                    )}
                  </div>

                  <FormControl>
                    {patternMode === 'select' && mode === 'create' ? (
                      <Popover open={comboOpen} onOpenChange={setComboOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboOpen}
                            className="w-full justify-between font-normal"
                          >
                            {field.value ? (
                              <span className="font-mono text-sm">{field.value}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                {t('patternMode.selectPlaceholder', {
                                  defaultValue: 'Seleccionar un workflow...',
                                })}
                              </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder={t('patternMode.searchPlaceholder', {
                                defaultValue: 'Buscar workflow...',
                              })}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t('patternMode.noResults', {
                                  defaultValue: 'No se encontraron workflows',
                                })}
                              </CommandEmpty>
                              {categories.map((category) => (
                                <CommandGroup key={category} heading={category}>
                                  {grouped[category]?.map((wf) => (
                                    <CommandItem
                                      key={wf.code}
                                      value={`${wf.code} ${wf.name_es}`}
                                      onSelect={() =>
                                        handleWorkflowSelect(wf.code, category)
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === wf.code
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                      <span className="font-mono text-xs mr-2">
                                        {wf.code}
                                      </span>
                                      <span className="text-muted-foreground text-xs truncate">
                                        {wf.name_es}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Input
                        {...field}
                        placeholder="PASAPORTE_%, RESIDENCIA_%, PRORROGA_VISADO"
                        disabled={mode === 'edit'}
                        className="font-mono"
                      />
                    )}
                  </FormControl>

                  <FormDescription>
                    {t('fields.workflowPatternDescription')}
                  </FormDescription>

                  {/* Real-time match preview */}
                  <PatternMatchPreview
                    pattern={watchedPattern}
                    workflows={workflows}
                  />

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ============================================= */}
            {/* Menu Group ID - Auto-derived                  */}
            {/* ============================================= */}
            <FormField
              control={form.control}
              name="menu_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuGroupId')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="pasaportes, residencias, vehiculos"
                      onChange={(e) => {
                        field.onChange(e);
                        handleGroupIdChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.menuGroupIdDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Menu title key - Auto-derived */}
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

            {/* ============================================= */}
            {/* Menu Icon - Visual preview                    */}
            {/* ============================================= */}
            <FormField
              control={form.control}
              name="menu_icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.menuIcon')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon">
                          <div className="flex items-center gap-2">
                            <IconPreview iconName={field.value} />
                            <span>{field.value}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconPreview iconName={icon.value} />
                            <span>{icon.label}</span>
                          </div>
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
                    <Input {...field} placeholder="service_request" />
                  </FormControl>
                  <FormDescription>
                    {t('fields.permissionPrefixDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ============================================= */}
            {/* Sub-menu toggles                              */}
            {/* ============================================= */}
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

              <FormField
                control={form.control}
                name="include_escalation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includeEscalation', { defaultValue: 'Incluir Escalaciones' })}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includeEscalationDescription', {
                          defaultValue: 'Mostrar submenú de escalaciones',
                        })}
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
                name="include_batch"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('fields.includeBatch', { defaultValue: 'Incluir Lotes' })}
                      </FormLabel>
                      <FormDescription>
                        {t('fields.includeBatchDescription', {
                          defaultValue: 'Mostrar menú de solicitudes por lotes',
                        })}
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
