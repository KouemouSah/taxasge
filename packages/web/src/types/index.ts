/**
 * Shared Types - Used across multiple modules
 *
 * NOTE: Module-specific types should be in their respective module's types/ folder
 * - chatbot types → modules/chatbot/types/
 * Only truly shared types belong here.
 */

export * from './auth';
export * from './user';
export * from './declaration';
export * from './fiscal-service';

// Re-export ApiError from auth (primary definition)
export type { ApiError } from './auth';
