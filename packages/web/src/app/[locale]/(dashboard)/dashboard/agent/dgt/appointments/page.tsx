/**
 * DGT Appointments Page
 * Appointments management for driving license agents
 *
 * @route /[locale]/dashboard/agent/dgt/appointments
 * @date 2026-01-26
 */

'use client';

import { AppointmentsPage } from '@/modules/agent-dashboard/components/appointments';

export default function DgtAppointmentsPage() {
  return <AppointmentsPage entityCode="DGT" />;
}
