/**
 * Extranjeria (Immigration) Agent Dashboard
 * Main dashboard for agents handling residence permits
 *
 * @route /[locale]/dashboard/agent/extranjeria
 * @date 2025-01-18
 */

'use client';

import { GenericEntityDashboard } from '@/modules/agent-dashboard';

export default function ExtranjeriaAgentDashboardPage() {
  return <GenericEntityDashboard entityCode="EXTRANJERIA" />;
}
