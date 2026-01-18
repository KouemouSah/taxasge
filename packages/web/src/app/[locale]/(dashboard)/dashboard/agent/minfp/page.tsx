/**
 * MINFP (Civil Service) Agent Dashboard
 * Main dashboard for agents handling civil servant verification
 *
 * @route /[locale]/dashboard/agent/minfp
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function MinfpAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="MINFP" />;
}
