'use client';

/**
 * Supervisor AI Assistant Page
 * Route: /[locale]/dashboard/agent/[entityCode]/assistant
 *
 * Resolves entityCode from URL and renders SupervisorAssistantTab
 * with entity context (name, code).
 */

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchClient } from '@/core/api';
import { SupervisorAssistantTab } from '@/modules/agent-dashboard/components/SupervisorAssistantTab';
import { slugToEntityCode } from '@/modules/agent-dashboard/utils';

interface MenuConfigResponse {
  entity_code: string | null;
  entity_name: string | null;
}

export default function SupervisorAssistantPage() {
  const params = useParams();
  const entitySlug = (params?.entityCode as string) || '';
  const entityCode = slugToEntityCode(entitySlug);

  // Fetch entity name from menu-config (already cached by sidebar)
  const { data, isLoading } = useQuery({
    queryKey: ['menu-config', 'me'],
    queryFn: () => fetchClient.get<MenuConfigResponse>('/menu-config/me'),
    staleTime: 5 * 60 * 1000,
  });

  const entityName = data?.entity_name || entityCode;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SupervisorAssistantTab entityCode={entityCode} entityName={entityName} />;
}
