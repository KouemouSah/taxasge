/**
 * Workflow Group Landing Page
 * Redirects to the pending view for the workflow group
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte/[workflowGroup]
 * @date 2026-01-25
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';

export default function WorkflowGroupPage() {
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const workflowGroup = params.workflowGroup as string;

  useEffect(() => {
    // Redirect to pending view by default
    router.replace(`/${locale}/dashboard/agent/cnedoge-pasaporte/${workflowGroup}/pending`);
  }, [router, locale, workflowGroup]);

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
