/**
 * CNEDOGE Passport Department Agent Dashboard
 * Main dashboard for agents handling passport workflows
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function CnedogePasaporteAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="CNEDOGE_PASAPORTE" />;
}
