/**
 * Generic Entity Appointments Page
 * Resolves entityCode from URL and renders AppointmentsPage
 *
 * Replaces: cnedoge-pasaporte/appointments, cnedoge-residencia/appointments, dgt/appointments
 *
 * @route /[locale]/dashboard/agent/[entityCode]/appointments
 * @date 2026-02-21
 */

'use client';

import { useParams } from 'next/navigation';
import { AppointmentsPage } from '@/modules/agent-dashboard/components/appointments';
import type { EntityCode } from '@/modules/agent-dashboard/types';

const ENTITY_CODE_MAP: Record<string, EntityCode> = {
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

export default function EntityAppointmentsPage() {
  const params = useParams();
  const entitySlug = (params?.entityCode as string) || '';
  const entityCode = ENTITY_CODE_MAP[entitySlug] || entitySlug.toUpperCase().replace(/-/g, '_') as EntityCode;

  return <AppointmentsPage entityCode={entityCode} />;
}
