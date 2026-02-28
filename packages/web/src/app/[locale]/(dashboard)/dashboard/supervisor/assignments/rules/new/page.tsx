'use client';

/**
 * Create New Assignment Rule Page
 * Full page form for creating a new auto-assignment rule
 *
 * Backend Model (from assignment_rule.py):
 * - name: str (required, 1-100 chars)
 * - description: Optional[str]
 * - rule_type: RuleType enum (round_robin, load_balance, specialization, priority_based)
 * - criteria: Dict[str, Any] (flexible JSON)
 * - priority: int (1-100, default 10)
 * - is_active: bool (default true)
 *
 * @route /[locale]/dashboard/supervisor/assignments/rules/new
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Settings2,
  Info,
  Code,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import Link from 'next/link';
import { toast } from 'sonner';

// ============================================================================
// TYPES - Aligned with backend assignment_rule.py
// ============================================================================

type RuleType = 'round_robin' | 'load_balance' | 'specialization' | 'priority_based';

interface AssignmentRuleCreate {
  name: string;
  description?: string;
  rule_type: RuleType;
  criteria: Record<string, unknown>;
  priority: number;
  is_active: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RULE_TYPE_VALUES: RuleType[] = ['round_robin', 'load_balance', 'specialization', 'priority_based'];

// Criteria templates per rule type — labels come from i18n (supervisor.criteriaLabel.*)
const CRITERIA_TEMPLATES: Record<RuleType, { key: string; type: 'number' | 'text' | 'array' }[]> = {
  round_robin: [],
  load_balance: [
    { key: 'max_workload_pct', type: 'number' },
    { key: 'balance_threshold', type: 'number' },
  ],
  specialization: [
    { key: 'required_specializations', type: 'array' },
    { key: 'min_experience_months', type: 'number' },
  ],
  priority_based: [
    { key: 'high_priority_min_level', type: 'number' },
    { key: 'escalation_hours', type: 'number' },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewRulePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  // Form state
  const [formData, setFormData] = useState<AssignmentRuleCreate>({
    name: '',
    description: '',
    rule_type: 'round_robin',
    criteria: {},
    priority: 50,
    is_active: true,
  });

  const [criteriaJson, setCriteriaJson] = useState('{}');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AssignmentRuleCreate) => {
      const response = await apiClient.post('/supervisor/rules', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('rules.created') || 'Rule created successfully');
      router.push(`/${locale}/dashboard/supervisor/assignments/rules`);
    },
    onError: (err: Error) => {
      toast.error(err.message || tCommon('error'));
    },
  });

  // Handle rule type change
  const handleRuleTypeChange = (value: RuleType) => {
    setFormData((prev) => ({
      ...prev,
      rule_type: value,
      criteria: {},  // Reset criteria when type changes
    }));
    setCriteriaJson('{}');
    setJsonError(null);
  };

  // Handle criteria field change (template mode)
  const handleCriteriaFieldChange = (key: string, value: string, type: 'number' | 'text' | 'array') => {
    setFormData((prev) => {
      const newCriteria = { ...prev.criteria };

      if (type === 'number') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          newCriteria[key] = numValue;
        } else if (value === '') {
          delete newCriteria[key];
        }
      } else if (type === 'array') {
        const arrayValue = value.split(',').map((s) => s.trim()).filter(Boolean);
        if (arrayValue.length > 0) {
          newCriteria[key] = arrayValue;
        } else {
          delete newCriteria[key];
        }
      } else {
        if (value) {
          newCriteria[key] = value;
        } else {
          delete newCriteria[key];
        }
      }

      return { ...prev, criteria: newCriteria };
    });
  };

  // Handle JSON editor change
  const handleJsonChange = (value: string) => {
    setCriteriaJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => ({ ...prev, criteria: parsed }));
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('rules.nameRequired') || 'Name is required');
      return;
    }

    if (formData.name.length > 100) {
      toast.error(t('rules.nameTooLong') || 'Name must be less than 100 characters');
      return;
    }

    if (useJsonEditor && jsonError) {
      toast.error(t('rules.invalidCriteria') || 'Please fix the criteria JSON');
      return;
    }

    createMutation.mutate(formData);
  };

  const criteriaFields = CRITERIA_TEMPLATES[formData.rule_type];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/supervisor/assignments/rules`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            {t('rules.createRule')}
          </h1>
          <p className="text-muted-foreground">
            {t('rules.createDescription') || 'Create a new automatic assignment rule'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('rules.basicInfo') || 'Basic Information'}</CardTitle>
            <CardDescription>
              {t('rules.basicInfoDescription') || 'Configure the basic settings for this rule'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{tCommon('name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Passport Priority Assignment"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/100 {tCommon('characters')}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{tCommon('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does and when it applies..."
                rows={3}
              />
            </div>

            {/* Rule Type */}
            <div className="space-y-2">
              <Label htmlFor="rule_type">{t('rules.ruleType')} *</Label>
              <Select value={formData.rule_type} onValueChange={handleRuleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPE_VALUES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {t('ruleType.' + rt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.rule_type && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('ruleTypeDescription.' + formData.rule_type)}</p>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('rules.priority')}</Label>
                <span className="text-sm font-medium">{formData.priority}</span>
              </div>
              <Slider
                value={[formData.priority]}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value[0] }))}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('rules.priorityHelp') || 'Lower values = higher priority. Rules are evaluated in priority order.'}
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('rules.activeOnCreate') || 'Activate immediately'}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('rules.activeOnCreateHelp') || 'Rule will start processing assignments right away'}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Criteria Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('rules.criteria')}</CardTitle>
                <CardDescription>
                  {t('rules.criteriaDescription') || 'Define the matching criteria for this rule'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="json-mode" className="text-sm">JSON</Label>
                <Switch
                  id="json-mode"
                  checked={useJsonEditor}
                  onCheckedChange={(checked) => {
                    setUseJsonEditor(checked);
                    if (checked) {
                      setCriteriaJson(JSON.stringify(formData.criteria, null, 2));
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {useJsonEditor ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Code className="h-4 w-4" />
                  <span>Advanced JSON editor</span>
                </div>
                <Textarea
                  value={criteriaJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="font-mono text-sm"
                  rows={10}
                  placeholder='{"key": "value"}'
                />
                {jsonError && (
                  <p className="text-sm text-destructive">{jsonError}</p>
                )}
              </div>
            ) : criteriaFields.length === 0 ? (
              <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                <p>{t('rules.noCriteriaNeeded') || 'No additional criteria needed for this rule type.'}</p>
                <p className="text-sm mt-1">{t('rules.roundRobinExplanation') || 'Round Robin distributes work equally among all agents.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {criteriaFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{t('criteriaLabel.' + field.key)}</Label>
                    <Input
                      id={field.key}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={
                        field.type === 'array'
                          ? (formData.criteria[field.key] as string[] || []).join(', ')
                          : (formData.criteria[field.key] as string | number) ?? ''
                      }
                      onChange={(e) => handleCriteriaFieldChange(field.key, e.target.value, field.type)}
                      placeholder={
                        field.type === 'array'
                          ? 'value1, value2, value3'
                          : field.type === 'number'
                          ? '0'
                          : ''
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href={`/${locale}/dashboard/supervisor/assignments/rules`}>
            <Button type="button" variant="outline">
              {tCommon('cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('rules.createRule')}
          </Button>
        </div>
      </form>
    </div>
  );
}
