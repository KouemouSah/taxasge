/**
 * Menu Template Edit Page
 * Admin page for editing existing menu templates
 *
 * @page /dashboard/admin/menu-templates/[id]
 * @date 2026-01-19
 */

'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MenuTemplateForm } from '@/modules/admin/components/MenuTemplateForm';
import { useMenuTemplate, useUpdateMenuTemplate } from '@/modules/admin/hooks/useMenuTemplates';
import type { MenuTemplateUpdateRequest } from '@/modules/admin/services/menuConfigService';

export default function MenuTemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('menuConfig');

  const templateId = params.id as string;

  // Fetch template data
  const {
    data: template,
    isLoading,
    isError,
    error,
  } = useMenuTemplate(templateId);

  // Update mutation
  const updateMutation = useUpdateMenuTemplate();

  const handleSubmit = async (data: MenuTemplateUpdateRequest) => {
    try {
      await updateMutation.mutateAsync({ id: templateId, data });
      router.push(`/${locale}/dashboard/admin/menu-templates`);
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/admin/menu-templates`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (isError || !template) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t('errors.loadError')}</AlertTitle>
          <AlertDescription>
            {error?.message || t('errors.templateNotFound')}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/admin/menu-templates`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('actions.backToList')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${locale}/dashboard/admin/menu-templates`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('templates.editTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('templates.editDescription', { code: template.code })}
          </p>
        </div>
      </div>

      {/* Form */}
      <MenuTemplateForm
        template={template}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
        mode="edit"
      />
    </div>
  );
}
