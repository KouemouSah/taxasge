/**
 * Generic Entity Agent Dashboard Landing Page
 * Resolves entityCode from URL and renders GenericEntityDashboard
 *
 * Replaces all entity-specific landing pages (cnedoge-pasaporte, dgt, etc.)
 *
 * @route /[locale]/dashboard/agent/[entityCode]
 * @date 2026-02-21
 */

'use client';

import { useParams } from 'next/navigation';
import { GenericEntityDashboard } from '@/modules/agent-dashboard';
import type { EntityCode } from '@/modules/agent-dashboard/types';

const ENTITY_CODE_MAP: Record<string, EntityCode> = {
  'cnedoge': 'CNEDOGE',
  'cnedoge-pasaporte': 'CNEDOGE_PASAPORTE',
  'cnedoge-residencia': 'CNEDOGE_RESIDENCIA',
  'dgt': 'DGT',
  'dgi': 'DGI',
  'extranjeria': 'EXTRANJERIA',
  'policia': 'POLICIA',
  'minfp': 'MINFP',
  'itv': 'ITV',
  'ofive': 'OFIVE',
  'onrc': 'ONRC',
  'itve': 'ITV',
};

export default function EntityAgentDashboardPage() {
  const params = useParams();
  const entitySlug = (params?.entityCode as string) || '';
  const entityCode = ENTITY_CODE_MAP[entitySlug] || entitySlug.toUpperCase().replace(/-/g, '_') as EntityCode;

  return <GenericEntityDashboard entityCode={entityCode} />;
}
