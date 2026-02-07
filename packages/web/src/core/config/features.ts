/**
 * Feature Flags Configuration
 * Controls progressive rollout of new features
 *
 * @module core/config
 * @date 2026-01-25
 *
 * USAGE:
 * - Set NEXT_PUBLIC_FEATURE_* in .env.local for development
 * - Set in environment variables for production
 * - Default to false for safety (fallback to existing behavior)
 */

// =============================================================================
// MENU AND DASHBOARD FEATURES
// =============================================================================

/**
 * Enable dynamic menu configuration from backend API.
 * When enabled (true/undefined): Agent sidebars fetch menu config from /menu-config/me
 * When disabled (false): Forces use of static entity-menus.ts
 *
 * Default: true (enabled) - set NEXT_PUBLIC_FEATURE_DYNAMIC_MENUS=false to disable
 */
export const FEATURE_DYNAMIC_MENUS =
  process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_MENUS !== 'false';

/**
 * Enable dynamic dashboard widgets from backend API.
 * When enabled: Dashboard widgets are configurable per role
 * When disabled: Uses hardcoded widget layout
 */
export const FEATURE_DYNAMIC_WIDGETS =
  process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_WIDGETS === 'true';

// =============================================================================
// WIZARD FEATURES
// =============================================================================

/**
 * Enable dynamic form rendering in service request wizard.
 * When enabled (true/undefined): Uses DynamicFormRenderer with backend config
 * When disabled (false): Uses hardcoded step2Fields/step1Fields (legacy)
 *
 * Default: true (enabled) - set NEXT_PUBLIC_FEATURE_DYNAMIC_FORM=false to disable
 * @since v1.7 - Dynamic form_review with N steps support
 */
export const FEATURE_DYNAMIC_FORM_RENDERER =
  process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_FORM !== 'false';

/**
 * Enable cache-first wizard (persist-only-on-payment architecture).
 * When enabled: All wizard data stays in Redis cache until payment is initiated.
 *               No DB/Firebase writes until user confirms payment.
 * When disabled: Current behavior - DB record created at wizard start.
 *
 * Default: true (enabled) - set NEXT_PUBLIC_FEATURE_CACHE_FIRST_WIZARD=false to disable
 * @since v2.0 - Cache-first wizard migration
 * @see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
 */
export const FEATURE_CACHE_FIRST_WIZARD =
  process.env.NEXT_PUBLIC_FEATURE_CACHE_FIRST_WIZARD !== 'false';

// =============================================================================
// OTHER FEATURES
// =============================================================================

/**
 * Enable Redis caching for API responses.
 * When enabled: Uses Upstash Redis for session and data caching
 * When disabled: Falls back to in-memory caching
 */
export const FEATURE_REDIS_CACHE =
  process.env.NEXT_PUBLIC_FEATURE_REDIS_CACHE === 'true';

// =============================================================================
// FEATURE FLAGS OBJECT (for convenience)
// =============================================================================

export const FEATURES = {
  DYNAMIC_MENUS: FEATURE_DYNAMIC_MENUS,
  DYNAMIC_WIDGETS: FEATURE_DYNAMIC_WIDGETS,
  DYNAMIC_FORM_RENDERER: FEATURE_DYNAMIC_FORM_RENDERER,
  REDIS_CACHE: FEATURE_REDIS_CACHE,
  CACHE_FIRST_WIZARD: FEATURE_CACHE_FIRST_WIZARD,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a feature is enabled.
 *
 * @param feature - Feature name from FEATURES object
 * @returns true if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get all enabled features.
 *
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(): (keyof typeof FEATURES)[] {
  return (Object.keys(FEATURES) as (keyof typeof FEATURES)[]).filter(
    (key) => FEATURES[key] === true
  );
}

export default FEATURES;
