/**
 * ONRC (Contracts) Agent Dashboard
 * Main dashboard for agents handling contract registration
 *
 * @route /[locale]/dashboard/agent/onrc
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function OnrcAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="ONRC" />;
}
