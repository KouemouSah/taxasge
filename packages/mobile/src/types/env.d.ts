/**
 * TypeScript declarations for react-native-dotenv
 * Environment variables from .env.offline or .env.pro
 */
declare module '@env' {
  export const APP_VERSION: string;
  export const APP_NAME: string;
  export const BUNDLE_ID: string;

  export const SYNC_MODE: string;
  export const SYNC_INTERVAL: string;
  export const ENABLE_CLOUD_SYNC: string;
  export const ENABLE_REALTIME_SYNC: string;

  export const ENABLE_DECLARATIONS: string;
  export const ENABLE_USER_PROFILES: string;
  export const REQUIRE_AUTH: string;

  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;

  export const DEFAULT_USER_ID: string;
}
