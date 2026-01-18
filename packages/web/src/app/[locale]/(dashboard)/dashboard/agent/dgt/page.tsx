/**
 * DGT (Traffic) Agent Dashboard
 * Main dashboard for agents handling driver licenses and vehicle registration
 *
 * @route /[locale]/dashboard/agent/dgt
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function DgtAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="DGT" />;
}
