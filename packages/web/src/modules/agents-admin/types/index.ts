/**
 * Agents Admin Module Types
 * Type definitions for agent and admin user management
 *
 * @module agents-admin/types
 * @date 2025-01-14
 *
 * BACKEND ALIGNMENT:
 * - Schemas from: app/modules/agents/models/agent_profile.py
 * - Routes from: app/modules/agents/api/agent_routes.py
 *
 * BUSINESS RULES:
 * - Menu "Agents & Admins" manages users with roles: admin, agent
 * - Agents have agent_profiles linked to their user account
 * - Admins do not have agent profiles (full system access via role)
 */

// =============================================================================
// ENUMS - Aligned with backend enums
// =============================================================================

/**
 * Agent type based on organizational affiliation
 * BACKEND: AgentType in agent_profile.py
 */
export enum AgentType {
  MINISTRY_AGENT = 'ministry_agent',
  ENTITY_AGENT = 'entity_agent',
}

/**
 * Functional role of the agent
 * BACKEND: AgentRole in agent_profile.py
 */
export enum AgentRole {
  VALIDATOR = 'validator',
  APPROVER = 'approver',
  AUDITOR = 'auditor',
  REVIEWER = 'reviewer',
}

/**
 * Agent availability status
 * BACKEND: AgentAvailability in agent.py
 */
export enum AgentAvailability {
  AVAILABLE = 'available',
  ON_LEAVE = 'on_leave',
  SICK_LEAVE = 'sick_leave',
  TRAINING = 'training',
  MISSION = 'mission',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
}

/**
 * Workload status
 * BACKEND: WorkloadStatus in agent.py
 */
export enum WorkloadStatus {
  AVAILABLE = 'available',
  NORMAL = 'normal',
  BUSY = 'busy',
  OVERLOADED = 'overloaded',
  UNAVAILABLE = 'unavailable',
}

// =============================================================================
// AGENT PROFILE TYPES
// =============================================================================

/**
 * Agent profile response from API
 * BACKEND: AgentProfileWithDetails in agent_profile.py
 */
export interface AgentProfile {
  id: string;
  user_id: string;
  agent_type: AgentType;
  is_supervisor: boolean;
  entity_id?: string;
  ministry_id?: number;
  agent_role: AgentRole | string;
  can_approve_unlimited: boolean;
  max_approval_amount?: number;
  can_escalate: boolean;
  can_assign_tasks: boolean;
  can_reassign: boolean;
  specializations: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  working_days: number[];
  is_active: boolean;
  is_backup_agent: boolean;
  backup_for_profile_id?: string;
  assigned_at: string;
  assigned_by?: string;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined user details
  user_email?: string;
  user_full_name?: string;
  user_phone?: string;
  // Joined entity/ministry details
  entity_code?: string;
  entity_name?: string;
  ministry_code?: string;
  ministry_name?: string;
  // Computed category
  agent_category?: 'dgi' | 'treasury' | 'entity' | 'ministry';
  // Workload info (if joined)
  current_assignments?: number;
  capacity_percentage?: number;
  workload_status?: WorkloadStatus | string;
  availability?: AgentAvailability | string;
}

/**
 * Agent workload data
 * BACKEND: AgentWorkload in agent.py
 */
export interface AgentWorkload {
  id: string;
  agent_profile_id: string;
  current_assignments: number;
  pending_declarations: number;
  in_progress_declarations: number;
  max_concurrent_assignments: number;
  capacity_percentage: number;
  workload_status: WorkloadStatus | string;
  availability: AgentAvailability | string;
  availability_reason?: string;
  unavailable_until?: string;
  avg_processing_time_hours?: number;
  avg_daily_completions: number;
  completion_rate_7d: number;
  quality_score_avg: number;
  success_rate: number;
  deadline_compliance_rate: number;
  active_specializations: string[];
  preferred_declaration_types: string[];
  oldest_pending_assignment_date?: string;
  avg_pending_duration_hours?: number;
  last_assignment_at?: string;
  last_completion_at?: string;
  last_updated_at: string;
}

/**
 * Agent performance statistics
 * BACKEND: AgentPerformanceStats in agent.py
 */
export interface AgentPerformance {
  agent_profile_id: string;
  ministry_id: number;
  current_month_processed: number;
  current_month_approved: number;
  current_month_rejected: number;
  current_month_escalated: number;
  avg_processing_minutes?: number;
  avg_lock_duration_minutes?: number;
  sla_respected_count: number;
  sla_missed_count: number;
  sla_respect_percentage?: number;
  current_active_locks: number;
  max_concurrent_locks: number;
  last_action_at?: string;
  last_login_at?: string;
  stats_period_start: string;
  stats_period_end?: string;
  updated_at: string;
}

// =============================================================================
// CREATION TYPES
// =============================================================================

/**
 * User info for agent/admin creation
 * BACKEND: AgentUserInfo in agent_profile.py
 */
export interface AgentUserInfo {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  preferred_language?: 'es' | 'fr' | 'en';
}

/**
 * Complete agent creation request (user + profile)
 * BACKEND: AgentCompleteCreate in agent_profile.py
 */
export interface AgentCompleteCreateRequest {
  user: AgentUserInfo;
  agent_type: AgentType;
  is_supervisor?: boolean;
  entity_id?: string;
  ministry_id?: number;
  agent_role?: AgentRole | string;
  /** RBAC role ID for defining agent permissions */
  rbac_role_id?: string;
  can_approve_unlimited?: boolean;
  max_approval_amount?: number;
  can_escalate?: boolean;
  can_assign_tasks?: boolean;
  can_reassign?: boolean;
  specializations?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
}

/**
 * Response for complete agent creation
 * BACKEND: AgentCompleteResponse in agent_profile.py
 */
export interface AgentCompleteResponse {
  user_id: string;
  user_email: string;
  user_full_name: string;
  profile_id: string;
  agent_type: AgentType;
  is_supervisor: boolean;
  message: string;
}

/**
 * Admin creation request
 * BACKEND: AdminCreateRequest in agent_profile.py
 */
export interface AdminCreateRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  preferred_language?: 'es' | 'fr' | 'en';
}

/**
 * Admin creation response
 * BACKEND: AdminCreateResponse in agent_profile.py
 */
export interface AdminCreateResponse {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin';
  message: string;
}

// =============================================================================
// UPDATE TYPES
// =============================================================================

/**
 * Agent profile update request
 * BACKEND: AgentProfileUpdate in agent_profile.py
 */
export interface AgentProfileUpdateRequest {
  agent_type?: AgentType;
  is_supervisor?: boolean;
  entity_id?: string;
  ministry_id?: number;
  agent_role?: AgentRole | string;
  can_approve_unlimited?: boolean;
  max_approval_amount?: number;
  can_escalate?: boolean;
  can_assign_tasks?: boolean;
  can_reassign?: boolean;
  specializations?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
  is_active?: boolean;
  is_backup_agent?: boolean;
  backup_for_profile_id?: string;
}

/**
 * Agent workload update request
 * BACKEND: AgentWorkloadUpdate in agent.py
 */
export interface AgentWorkloadUpdateRequest {
  current_assignments?: number;
  pending_declarations?: number;
  in_progress_declarations?: number;
  max_concurrent_assignments?: number;
  capacity_percentage?: number;
  workload_status?: WorkloadStatus;
  availability?: AgentAvailability;
  availability_reason?: string;
  unavailable_until?: string;
  active_specializations?: string[];
  preferred_declaration_types?: string[];
}

// =============================================================================
// LIST & FILTER TYPES
// =============================================================================

/**
 * Filters for listing agents
 * BACKEND: AgentListFilters in agent_profile.py
 */
export interface AgentListFilters {
  agent_type?: AgentType;
  is_supervisor?: boolean;
  ministry_id?: number;
  entity_id?: string;
  agent_category?: 'dgi' | 'treasury' | 'entity' | 'ministry';
  is_active?: boolean;
  availability?: AgentAvailability;
  page?: number;
  page_size?: number;
}

/**
 * Paginated agent list response
 */
export interface AgentListResponse {
  items: AgentProfile[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * Agent statistics for ministry/entity
 */
export interface AgentStats {
  total: number;
  active: number;
  supervisors: number;
  available: number;
  busy: number;
  overloaded: number;
  unavailable: number;
}

// =============================================================================
// ADMIN USER TYPES (for listing admins in the same page)
// =============================================================================

import { UserRole, UserStatus } from '@/types/user';
export { UserRole, UserStatus };

/**
 * Admin user for display in agents page
 * Uses UserResponse from backend
 */
export interface AdminUser {
  id: string;
  email: string;
  role: UserRole.ADMIN;
  status: UserStatus;
  first_name: string;
  last_name: string;
  phone_number?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  email_verified?: boolean;
}
