'use client';

/**
 * New Escalation Page
 * Form to create a new escalation for a case
 *
 * @route /[locale]/dashboard/agent/escalations/new
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import { getApiErrorMessage } from '@/core/api/errors';
import Link from 'next/link';
import { toast } from 'sonner';

// Queue item from GET /agent/service-requests/my-queue
interface QueueItem {
  queue_id: string;
  item_id: string;
  reference_number: string;
  workflow_code: string;
  status: string;
  created_at: string;
  citizen_name: string;
}

const ESCALATION_REASON_KEYS = [
  'complex_case',
  'policy_exception',
  'technical_issue',
  'customer_complaint',
  'fraud_suspicion',
  'urgent_deadline',
  'missing_documentation',
  'other',
] as const;

export default function NewEscalationPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations('agent');
  const tSupervisor = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  // Pre-fill request from URL params
  const prefilledRequestId = searchParams.get('request_id');

  const [formData, setFormData] = useState({
    request_id: prefilledRequestId || '',
    reason: '',
    priority_boost: 10,  // Matches backend EscalationRequest.priority_boost
  });

  // Fetch my active queue items for selection
  // Uses GET /agent/service-requests/my-queue
  const { data: queueItems, isLoading: queueLoading } = useQuery<QueueItem[]>({
    queryKey: ['agent', 'queue', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/agent/service-requests/my-queue');
      return response.data;
    },
  });

  // Escalate mutation - uses POST /agent/service-requests/{request_id}/escalate
  const escalateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const reasonLabel = t(`escalation.reasons.${data.reason}`);
      const response = await apiClient.post(`/agent/service-requests/${data.request_id}/escalate`, {
        reason: reasonLabel,
        priority_boost: data.priority_boost,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('escalation.created'));
      router.push(`/${locale}/dashboard/agent/escalations`);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, tCommon('error'), tCommon));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.request_id || !formData.reason) {
      toast.error(t('escalation.fillRequired'));
      return;
    }
    escalateMutation.mutate(formData);
  };

  const selectedItem = queueItems?.find(q => q.item_id === formData.request_id);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/agent/escalations`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            {t('nav.createEscalation')}
          </h1>
          <p className="text-muted-foreground">
            {t('escalation.subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('escalation.formTitle')}</CardTitle>
            <CardDescription>
              {t('escalation.formDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Queue Item Selection */}
            <div className="space-y-2">
              <Label htmlFor="assignment">{t('escalation.selectCase')} *</Label>
              {queueLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </div>
              ) : queueItems?.length === 0 ? (
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {t('escalation.noQueueItems')}
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.request_id}
                  onValueChange={(value) => setFormData({ ...formData, request_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('escalation.selectCasePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {queueItems?.map((item) => (
                      <SelectItem key={item.item_id} value={item.item_id}>
                        {item.reference_number || item.item_id.slice(0, 8)} - {item.workflow_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedItem && (
                <div className="p-3 border rounded-md bg-muted/50 mt-2">
                  <p className="text-sm font-medium">{selectedItem.reference_number || selectedItem.item_id}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.workflow_code}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.citizen_name}</p>
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <Label>{tSupervisor('escalations.reason')} *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('escalation.selectReasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ESCALATION_REASON_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`escalation.reasons.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Boost */}
            <div className="space-y-3">
              <Label>{tSupervisor('escalations.priority')} *</Label>
              <p className="text-sm text-muted-foreground">
                {t('escalation.priorityDescription')}
              </p>
              <RadioGroup
                value={String(formData.priority_boost)}
                onValueChange={(value) => setFormData({ ...formData, priority_boost: parseInt(value) })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="priority-low" />
                  <Label htmlFor="priority-low" className="font-normal cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      {tSupervisor('escalations.low')} (+10)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20" id="priority-medium" />
                  <Label htmlFor="priority-medium" className="font-normal cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {tSupervisor('escalations.medium')} (+20)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="35" id="priority-high" />
                  <Label htmlFor="priority-high" className="font-normal cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      {tSupervisor('escalations.high')} (+35)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="50" id="priority-critical" />
                  <Label htmlFor="priority-critical" className="font-normal cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {tSupervisor('escalations.critical')} (+50)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Warning */}
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-md">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">{t('escalation.warningTitle')}</p>
                  <p className="mt-1">
                    {t('escalation.warningMessage')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={escalateMutation.isPending || !formData.request_id || !formData.reason}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {escalateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('nav.escalate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
