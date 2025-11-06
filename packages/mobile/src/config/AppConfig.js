/**
 * TaxasGE Mobile - Centralized App Configuration
 * Dual-Version Architecture: Offline vs Pro
 *
 * Configuration determined at BUILD TIME using environment variables
 * from .env.offline or .env.pro (via react-native-dotenv)
 */

import {
  APP_VERSION,
  APP_NAME,
  BUNDLE_ID,
  SYNC_MODE,
  SYNC_INTERVAL,
  ENABLE_CLOUD_SYNC,
  ENABLE_REALTIME_SYNC,
  ENABLE_DECLARATIONS,
  ENABLE_USER_PROFILES,
  REQUIRE_AUTH,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  DEFAULT_USER_ID
} from '@env';

/**
 * Parse boolean string to actual boolean
 * @param {string} value - 'true' or 'false' string
 * @returns {boolean}
 */
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

/**
 * Parse integer string safely
 * @param {string} value - String number
 * @param {number} defaultValue - Fallback value
 * @returns {number}
 */
const parseIntSafe = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Main Application Configuration Object
 * All values are frozen at build time based on ENVFILE
 */
export const APP_CONFIG = {
  // App Identity
  version: APP_VERSION || 'offline',
  appName: APP_NAME || 'TaxasGE',
  bundleId: BUNDLE_ID || 'com.taxasge.dev',

  // Synchronization Strategy
  syncMode: SYNC_MODE || 'monthly',
  syncInterval: parseIntSafe(SYNC_INTERVAL, 2592000000), // 30 days default
  enableCloudSync: parseBoolean(ENABLE_CLOUD_SYNC || 'false'),
  enableRealtimeSync: parseBoolean(ENABLE_REALTIME_SYNC || 'false'),

  // Feature Flags
  enableDeclarations: parseBoolean(ENABLE_DECLARATIONS || 'false'),
  enableUserProfiles: parseBoolean(ENABLE_USER_PROFILES || 'false'),
  requireAuth: parseBoolean(REQUIRE_AUTH || 'false'),

  // Supabase Configuration
  supabaseUrl: SUPABASE_URL || 'https://bpdzfkymgydjxxwlctam.supabase.co',
  supabaseAnonKey: SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg',

  // User Management
  defaultUserId: DEFAULT_USER_ID || 'offline_user_local',
};

/**
 * Tables to sync based on app version
 *
 * UPDATED: 2025-11-06 - Corrected based on Supabase inspection
 *
 * Offline: 11 public reference tables (~15,154 records, ~1.4 MB)
 *   - Core hierarchy: ministries (14), sectors (16), categories (98)
 *   - Fiscal services: fiscal_services (850)
 *   - Keywords: service_keywords (100 filtered from 7,014)
 *   - Templates: procedure_templates (703), procedure_template_steps (2,077),
 *                document_templates (792)
 *   - Assignments: service_procedure_assignments (850),
 *                  service_document_assignments (1,234)
 *   - Translations: entity_translations (~8,420 filtered from 8,486)
 *
 * Pro: All 11 offline tables + user-specific tables
 */
export const SYNC_TABLES = {
  offline: [
    // Administrative hierarchy (128 records)
    'ministries',              // 14 records
    'sectors',                 // 16 records
    'categories',              // 98 records

    // Fiscal services (850 records)
    'fiscal_services',         // 850 records

    // Keywords (100 records - FILTERED from 7,014)
    'service_keywords',        // Top 100 keywords by weight

    // Procedure templates (2,780 records)
    'procedure_templates',     // 703 records
    'procedure_template_steps', // 2,077 records

    // Document templates (792 records)
    'document_templates',      // 792 records

    // Service assignments (2,084 records)
    'service_procedure_assignments', // 850 records
    'service_document_assignments',  // 1,234 records

    // Translations (~8,420 records - FILTERED from 8,486)
    'entity_translations',     // FR/EN translations for ES-only entities
  ],
  pro: [
    // Public reference tables (same as offline)
    'ministries',
    'sectors',
    'categories',
    'fiscal_services',
    'service_keywords',
    'procedure_templates',
    'procedure_template_steps',
    'document_templates',
    'service_procedure_assignments',
    'service_document_assignments',
    'entity_translations',

    // User-specific tables (Pro only)
    'user_favorites',
    'calculation_history',
    'declarations',
    'user_profiles',
  ],
};

/**
 * Get tables to sync for current app version
 * @returns {string[]} Array of table names
 */
export const getSyncTables = () => {
  const version = APP_CONFIG.version === 'pro' ? 'pro' : 'offline';
  return SYNC_TABLES[version];
};

/**
 * Get user ID based on app version
 * Offline: Always returns default_user_local
 * Pro: Returns authenticated user ID or null
 *
 * @param {string|null} authenticatedUserId - User ID from auth system
 * @returns {string|null}
 */
export const getUserId = (authenticatedUserId = null) => {
  if (APP_CONFIG.version === 'offline') {
    // Offline version: Use local user ID
    return APP_CONFIG.defaultUserId;
  }

  // Pro version: Require authenticated user ID
  return authenticatedUserId || null;
};

/**
 * Sync strategies configuration
 */
export const SYNC_STRATEGY = {
  offline: {
    direction: 'download', // One-way: Supabase → SQLite
    frequency: 'monthly',
    automatic: true,
    requireNetwork: true,
    retryAttempts: 3,
  },
  pro: {
    direction: 'bidirectional', // Two-way: SQLite ↔ Supabase
    frequency: 'instant',
    automatic: true,
    requireNetwork: false, // Queue offline actions
    retryAttempts: 5,
  },
};

/**
 * Get sync strategy for current version
 * @returns {object} Sync strategy configuration
 */
export const getSyncStrategy = () => {
  const version = APP_CONFIG.version === 'pro' ? 'pro' : 'offline';
  return SYNC_STRATEGY[version];
};

/**
 * Check if a specific feature is enabled
 * @param {string} featureName - Name of the feature
 * @returns {boolean}
 */
export const isFeatureEnabled = (featureName) => {
  switch (featureName) {
    case 'declarations':
      return APP_CONFIG.enableDeclarations;
    case 'userProfiles':
      return APP_CONFIG.enableUserProfiles;
    case 'cloudSync':
      return APP_CONFIG.enableCloudSync;
    case 'realtimeSync':
      return APP_CONFIG.enableRealtimeSync;
    case 'auth':
      return APP_CONFIG.requireAuth;
    default:
      return false;
  }
};

/**
 * Log current configuration (for debugging)
 */
export const logConfiguration = () => {
  console.log('[AppConfig] ========================================');
  console.log('[AppConfig] TaxasGE Mobile Configuration');
  console.log('[AppConfig] ========================================');
  console.log('[AppConfig] Version:', APP_CONFIG.version);
  console.log('[AppConfig] App Name:', APP_CONFIG.appName);
  console.log('[AppConfig] Bundle ID:', APP_CONFIG.bundleId);
  console.log('[AppConfig] ========================================');
  console.log('[AppConfig] Sync Mode:', APP_CONFIG.syncMode);
  console.log('[AppConfig] Sync Interval:', APP_CONFIG.syncInterval, 'ms');
  console.log('[AppConfig] Cloud Sync:', APP_CONFIG.enableCloudSync);
  console.log('[AppConfig] Realtime Sync:', APP_CONFIG.enableRealtimeSync);
  console.log('[AppConfig] ========================================');
  console.log('[AppConfig] Require Auth:', APP_CONFIG.requireAuth);
  console.log('[AppConfig] Declarations:', APP_CONFIG.enableDeclarations);
  console.log('[AppConfig] User Profiles:', APP_CONFIG.enableUserProfiles);
  console.log('[AppConfig] ========================================');
  console.log('[AppConfig] Default User ID:', APP_CONFIG.defaultUserId);
  console.log('[AppConfig] Sync Tables:', getSyncTables());
  console.log('[AppConfig] ========================================');
};

// Default export for convenience
export default APP_CONFIG;
