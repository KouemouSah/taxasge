/**
 * Assignments Admin Module
 * Assignment management for administrators
 *
 * @module assignments-admin
 */

// Components
export {
  AssignmentCard,
  AssignmentList,
  AssignmentForm,
  AssignmentFilters as AssignmentFiltersComponent,
  AssignmentStatusBadge,
} from './components'

// Hooks
export * from './hooks'

// Types - Re-export with explicit names to avoid conflicts
export type {
  AssignmentStatus,
  AssignmentPriority,
  DeclarationType,
  ReassignmentReason,
  Assignment,
  ManualAssignmentRequest,
  AutoAssignmentRequest,
  CompleteAssignmentRequest,
  ReassignmentRequest,
  UpdatePriorityRequest,
  ExtendDeadlineRequest,
  PaginatedAssignmentsResponse,
  AssignmentFilters,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
} from './types'

// Services
export { assignmentsApi } from './services/api'
export { default as assignmentsAdminApi } from './services/api'
