/**
 * CNEDOGE Residence Department Agent Dashboard
 * Main dashboard for agents handling residence permit workflows
 *
 * @route /[locale]/dashboard/agent/cnedoge-residencia
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function CnedogeResidenciaAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="CNEDOGE_RESIDENCIA" />;
}
