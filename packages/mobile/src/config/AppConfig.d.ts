/**
 * TypeScript definitions for AppConfig module
 */

export interface AppConfiguration {
  version: 'offline' | 'pro';
  appName: string;
  bundleId: string;
  syncMode: 'monthly' | 'instant';
  syncInterval: number;
  enableCloudSync: boolean;
  enableRealtimeSync: boolean;
  enableDeclarations: boolean;
  enableUserProfiles: boolean;
  requireAuth: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  defaultUserId: string;
}

export interface SyncStrategy {
  direction: 'download' | 'bidirectional';
  frequency: 'monthly' | 'instant';
  automatic: boolean;
  requireNetwork: boolean;
  retryAttempts: number;
}

export const APP_CONFIG: AppConfiguration;

export const SYNC_TABLES: {
  offline: string[];
  pro: string[];
};

export function getSyncTables(): string[];

export function getUserId(authenticatedUserId?: string | null): string | null;

export const SYNC_STRATEGY: {
  offline: SyncStrategy;
  pro: SyncStrategy;
};

export function getSyncStrategy(): SyncStrategy;

export function isFeatureEnabled(featureName: string): boolean;

export function logConfiguration(): void;

export default APP_CONFIG;
