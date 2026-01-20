/**
 * Menu Template Create Page
 * Admin page for creating new menu templates
 *
 * @page /dashboard/admin/menu-templates/new
 * @date 2026-01-19
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuTemplateForm } from '@/modules/admin/components/MenuTemplateForm';
import { useCreateMenuTemplate } from '@/modules/admin/hooks/useMenuTemplates';
import type {
  MenuTemplateCreateRequest,
  MenuTemplateUpdateRequest,
} from '@/modules/admin/services/menuConfigService';

export default function MenuTemplateCreatePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('menuConfig');

  // Create mutation
  const createMutation = useCreateMenuTemplate();

  const handleSubmit = async (
    data: MenuTemplateCreateRequest | MenuTemplateUpdateRequest
  ) => {
    try {
      await createMutation.mutateAsync(data as MenuTemplateCreateRequest);
      router.push(`/${locale}/dashboard/admin/menu-templates`);
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/admin/menu-templates`);
  };

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
            {t('templates.createTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('templates.createDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <MenuTemplateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMutation.isPending}
        mode="create"
      />
    </div>
  );
}
