/**
 * DGI (Tax) Agent Dashboard
 * Main dashboard for agents handling tax declarations
 *
 * @route /[locale]/dashboard/agent/dgi
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function DgiAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="DGI" />;
}
