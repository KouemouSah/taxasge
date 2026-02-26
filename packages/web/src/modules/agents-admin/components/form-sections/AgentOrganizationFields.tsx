'use client';

import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SafeSelect } from '@/components/ui/safe-select';
import { AgentType } from '@/modules/agents-admin/types';

interface EntityOption {
  id: string;
  code: string;
  name: string;
  entity_type: string;
  workflow_codes?: string[];
}

interface MinistryOption {
  id: number;
  name: string;
}

interface LocationOption {
  id: string;
  location_name: string;
  city: string;
  is_main_office?: boolean;
}

interface AgentOrganizationFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  ministries: MinistryOption[];
  entities: EntityOption[];
  entityLocations: LocationOption[] | undefined;
  isLoadingMinistries: boolean;
  isLoadingEntities: boolean;
  isLoadingLocations: boolean;
  /** Whether the form is in edit mode (skip cascade resets on initial load) */
  isEditMode?: boolean;
}

export function AgentOrganizationFields({
  form,
  ministries,
  entities,
  entityLocations,
  isLoadingMinistries,
  isLoadingEntities,
  isLoadingLocations,
  isEditMode = false,
}: AgentOrganizationFieldsProps) {
  const t = useTranslations('admin.agents');
  const watchAgentType = form.watch('agent_type');
  const watchEntityId = form.watch('entity_id');

  const selectedEntity = entities.find(e => e.id === watchEntityId);
  const isDepartmentEntity = selectedEntity?.entity_type === 'department';

  const agentTypeOptions = [
    { value: AgentType.MINISTRY_AGENT, label: t('form.agentMinistry') },
    { value: AgentType.ENTITY_AGENT, label: t('form.agentEntity') },
  ];

  // Cascade: when entity changes, reset location
  useEffect(() => {
    if (!isEditMode) {
      form.setValue('entity_location_id', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchEntityId]);

  const ministryItems = ministries.map(m => ({
    value: m.id.toString(),
    label: m.name,
  }));

  const entityItems = entities.map(e => ({
    value: e.id,
    label: `${e.name} (${e.code})`,
    description: e.entity_type === 'department' ? t('form.department') : t('form.rootEntity'),
  }));

  const locationItems = (entityLocations || []).map(loc => ({
    value: loc.id,
    label: `${loc.location_name} — ${loc.city}${loc.is_main_office ? ` (${t('form.mainOffice')})` : ''}`,
  }));

  return (
    <div className="space-y-4">
      {/* Agent Type */}
      <FormField
        control={form.control}
        name="agent_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.agentType')} <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <SafeSelect
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  // Reset organization fields on type change
                  form.setValue('ministry_id', undefined);
                  form.setValue('entity_id', '');
                  form.setValue('entity_location_id', '');
                }}
                items={agentTypeOptions}
                placeholder={t('form.selectType')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Ministry (for MINISTRY_AGENT) */}
      {watchAgentType === AgentType.MINISTRY_AGENT && (
        <FormField
          control={form.control}
          name="ministry_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.ministry')} <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <SafeSelect
                  value={field.value?.toString() || ''}
                  onValueChange={(val) => field.onChange(parseInt(val, 10))}
                  items={ministryItems}
                  isLoading={isLoadingMinistries}
                  emptyMessage={t('form.noMinistry')}
                  placeholder={t('form.selectMinistry')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Entity (for ENTITY_AGENT) */}
      {watchAgentType === AgentType.ENTITY_AGENT && (
        <>
          <FormField
            control={form.control}
            name="entity_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.entity')} <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SafeSelect
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    items={entityItems}
                    isLoading={isLoadingEntities}
                    emptyMessage={t('form.noEntity')}
                    placeholder={t('form.selectEntity')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entity Location */}
          {watchEntityId && (
            <FormField
              control={form.control}
              name="entity_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.site')}
                    {isDepartmentEntity && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    <SafeSelect
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      items={locationItems}
                      isLoading={isLoadingLocations}
                      emptyMessage={t('form.noSite')}
                      placeholder={isDepartmentEntity ? t('form.selectSiteRequired') : t('form.selectSiteOptional')}
                      allOption={!isDepartmentEntity ? { value: 'ALL_SITES', label: t('form.allSites') } : undefined}
                    />
                  </FormControl>
                  <FormDescription>
                    {isDepartmentEntity
                      ? t('form.siteDeptRequired')
                      : t('form.siteOptional')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
