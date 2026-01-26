/**
 * CNEDOGE Passport Appointments Page
 * Appointments management for passport agents
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte/appointments
 * @date 2026-01-26
 */

'use client';

import { AppointmentsPage } from '@/modules/agent-dashboard/components/appointments';

export default function CnedogePasaporteAppointmentsPage() {
  return <AppointmentsPage entityCode="CNEDOGE_PASAPORTE" />;
}
