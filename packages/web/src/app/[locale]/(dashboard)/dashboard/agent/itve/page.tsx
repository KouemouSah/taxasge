/**
 * ITV (Vehicle Inspection) Agent Dashboard
 * Main dashboard for agents handling ITV renewals
 *
 * @route /[locale]/dashboard/agent/itve
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function ItveAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="ITV" />;
}
