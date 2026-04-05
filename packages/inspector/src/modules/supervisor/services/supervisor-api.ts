/**
 * Supervisor API — Analytics, Missions, Export
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@core/api/client';
import { API_ENDPOINTS } from '@core/api/endpoints';

// ---------------------------------------------------------------------------
// Analytics types (mirrors backend Pydantic models)
// ---------------------------------------------------------------------------

export interface AgentPerformanceItem {
  agent_id: string;
  agent_name: string;
  entity_code: string;
  inspections_count: number;
  conforme_count: number;
  non_conforme_count: number;
  conformity_rate: number;
  avg_duration_minutes: number;
  total_collected: number;
  seals_proposed: number;
  med_issued: number;
}

export interface AgentPerformanceResponse {
  items: AgentPerformanceItem[];
  total: number;
  period: { date_from: string; date_to: string };
}

export interface ZoneItem {
  zone_code: string;
  zone_name: string | null;
  inspections_count: number;
  conformity_rate: number;
  total_collected: number;
  companies_inspected: number;
}

export interface TrendPoint {
  date: string;
  inspections: number;
  conforme: number;
  non_conforme: number;
  collected: number;
}

export interface TrendResponse {
  points: TrendPoint[];
  granularity: string;
}

export interface PriorityZone {
  zone_code: string;
  zone_name: string | null;
  priority_score: number;
  uninspected_companies: number;
  overdue_obligations_amount: number;
  last_inspection_date: string | null;
}

// ---------------------------------------------------------------------------
// Mission types
// ---------------------------------------------------------------------------

export interface Mission {
  id: string;
  mission_date: string;
  title: string | null;
  notes: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  agents: MissionAgent[];
  created_at: string;
}

export interface MissionAgent {
  agent_id: string;
  agent_name: string;
  assigned_zones: string[] | null;
  target_inspections: number | null;
}

export interface MissionListResponse {
  items: Mission[];
  total: number;
}

export interface ZoneSuggestion {
  zone_code: string;
  zone_name: string | null;
  priority_score: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const supervisorApi = {
  // --- Analytics ---
  getAgentPerformance: (params?: { date_from?: string; date_to?: string }) =>
    apiGet<AgentPerformanceResponse>(API_ENDPOINTS.analytics.agents, params as Record<string, unknown>),

  getZoneAnalytics: (params?: { date_from?: string; date_to?: string }) =>
    apiGet<{ items: ZoneItem[] }>(API_ENDPOINTS.analytics.zones, params as Record<string, unknown>),

  getTrends: (params?: { date_from?: string; date_to?: string; granularity?: string }) =>
    apiGet<TrendResponse>(API_ENDPOINTS.analytics.trends, params as Record<string, unknown>),

  getPriorityZones: (limit = 10) =>
    apiGet<{ items: PriorityZone[] }>(API_ENDPOINTS.analytics.priorityZones, { limit }),

  // --- Export ---
  exportCsv: (params?: Record<string, string>) =>
    apiGet<Blob>(API_ENDPOINTS.export.csv, params),

  exportPdf: (params?: Record<string, string>) =>
    apiGet<Blob>(API_ENDPOINTS.export.pdf, params),

  // --- Missions ---
  listMissions: (params?: { date_from?: string; date_to?: string; status?: string }) =>
    apiGet<MissionListResponse>(API_ENDPOINTS.missions.list, params as Record<string, unknown>),

  createMission: (data: { mission_date: string; title?: string; notes?: string }) =>
    apiPost<Mission>(API_ENDPOINTS.missions.create, data),

  getMission: (id: string) =>
    apiGet<Mission>(API_ENDPOINTS.missions.detail(id)),

  completeMission: (id: string, notes?: string) =>
    apiPost<Mission>(API_ENDPOINTS.missions.complete(id), { notes }),

  suggestZones: () =>
    apiGet<ZoneSuggestion[]>(API_ENDPOINTS.missions.suggestZones),
};
