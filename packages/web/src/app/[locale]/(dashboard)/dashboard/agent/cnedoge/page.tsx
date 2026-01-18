/**
 * CNEDOGE Agent Dashboard
 * Main dashboard for agents handling passports and residence documents
 *
 * @route /[locale]/dashboard/agent/cnedoge
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function CnedogeAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="CNEDOGE" />;
}
