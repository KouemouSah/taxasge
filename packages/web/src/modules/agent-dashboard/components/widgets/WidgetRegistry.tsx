/**
 * Widget Registry
 * Maps widget IDs to React components for dynamic dashboard rendering
 *
 * @module agent-dashboard/components/widgets
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import type { WidgetConfig } from '../../types/menu-config';
import type { EntityCode } from '../../types';

// Import widget components
import { UrgentRequestsWidget } from './UrgentRequestsWidget';
import { TodayAppointmentsWidget } from './TodayAppointmentsWidget';
import { WorkflowDistributionWidget } from './WorkflowDistributionWidget';
import { AlertsWidget } from './AlertsWidget';
import { PersonalStatsWidget } from './PersonalStatsWidget';
import { TeamWorkloadWidget } from './TeamWorkloadWidget';
import { EscalationsWidget } from './EscalationsWidget';
import { PendingPaymentsWidget } from './PendingPaymentsWidget';
import { AnomalySummaryWidget } from './AnomalySummaryWidget';
import { CalendarWeekWidget } from './CalendarWeekWidget';
import { CalendarSlotsWidget } from './CalendarSlotsWidget';

// =============================================================================
// TYPES
// =============================================================================

export interface WidgetProps {
  entityCode: EntityCode;
  config: WidgetConfig;
  className?: string;
}

export type WidgetComponent = React.ComponentType<WidgetProps>;

// =============================================================================
// WIDGET REGISTRY
// Maps widget IDs to their React components
// =============================================================================

export const WIDGET_REGISTRY: Record<string, WidgetComponent> = {
  // Urgent/Priority widgets
  urgent_requests: ({ entityCode, className }) => (
    <UrgentRequestsWidget entityCode={entityCode} className={className} />
  ),

  // Appointments widgets
  today_appointments: ({ entityCode, className }) => (
    <TodayAppointmentsWidget entityCode={entityCode} className={className} />
  ),

  // Distribution widgets
  workflow_distribution: ({ entityCode, className }) => (
    <WorkflowDistributionWidget entityCode={entityCode} className={className} />
  ),

  // Alerts widgets
  alerts: ({ entityCode, className }) => (
    <AlertsWidget entityCode={entityCode} className={className} />
  ),
  system_alerts: ({ entityCode, className }) => (
    <AlertsWidget entityCode={entityCode} className={className} />
  ),

  // Personal Performance widgets
  personal_stats: ({ className }) => (
    <PersonalStatsWidget className={className} />
  ),

  // Team Management widgets (for supervisors)
  team_workload: ({ entityCode, className }) => (
    <TeamWorkloadWidget entityCode={entityCode} className={className} />
  ),

  // Escalation widgets (for supervisors)
  escalations: ({ entityCode, className }) => (
    <EscalationsWidget entityCode={entityCode} className={className} />
  ),

  // Treasury widgets
  pending_payments: ({ className }) => (
    <PendingPaymentsWidget className={className} />
  ),
  anomaly_summary: ({ className }) => (
    <AnomalySummaryWidget className={className} />
  ),

  // Calendar widgets
  calendar_week: ({ entityCode, className }) => (
    <CalendarWeekWidget entityCode={entityCode} className={className} />
  ),
  calendar_slots: ({ entityCode, className }) => (
    <CalendarSlotsWidget entityCode={entityCode} className={className} />
  ),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a widget ID has a registered component
 */
export function hasWidget(widgetId: string): boolean {
  return widgetId in WIDGET_REGISTRY;
}

/**
 * Get widget component by ID
 */
export function getWidget(widgetId: string): WidgetComponent | null {
  return WIDGET_REGISTRY[widgetId] || null;
}

/**
 * Render a widget by ID with props
 */
export function renderWidget(
  widgetId: string,
  entityCode: EntityCode,
  config: WidgetConfig,
  className?: string
): React.ReactNode | null {
  const Widget = getWidget(widgetId);
  if (!Widget) {
    console.warn(`[WidgetRegistry] Unknown widget ID: ${widgetId}`);
    return null;
  }

  return (
    <Widget
      key={widgetId}
      entityCode={entityCode}
      config={config}
      className={className}
    />
  );
}

// =============================================================================
// SIZE CLASSES - Consistent with DynamicDashboard
// =============================================================================

export const WIDGET_SIZE_CLASSES: Record<string, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-full',
};

// =============================================================================
// DEFAULT WIDGET CONFIGS
// Fallback configurations when dashboard_config is not defined
// =============================================================================

export const DEFAULT_ENTITY_WIDGETS: WidgetConfig[] = [
  { id: 'urgent_requests', visible: true, position: 1, size: 'medium' },
  { id: 'today_appointments', visible: true, position: 2, size: 'medium' },
  { id: 'workflow_distribution', visible: true, position: 3, size: 'medium' },
  { id: 'alerts', visible: true, position: 4, size: 'medium' },
];

export default WIDGET_REGISTRY;
