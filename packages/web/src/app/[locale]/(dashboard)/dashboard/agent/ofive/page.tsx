/**
 * OFIVE (Vehicle Documents) Agent Dashboard
 * Main dashboard for agents handling CUVE documents
 *
 * @route /[locale]/dashboard/agent/ofive
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function OfiveAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="OFIVE" />;
}
