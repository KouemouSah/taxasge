/**
 * CNEDOGE Residencia Appointments Page
 * Appointments management for residence permit agents
 *
 * @route /[locale]/dashboard/agent/cnedoge-residencia/appointments
 * @date 2026-01-26
 */

'use client';

import { AppointmentsPage } from '@/modules/agent-dashboard/components/appointments';

export default function CnedogeResidenciaAppointmentsPage() {
  return <AppointmentsPage entityCode="CNEDOGE_RESIDENCIA" />;
}
