/**
 * TaxasGE Mobile - Sync Service
 * Service de synchronisation bidirectionnelle SQLite <-> Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import { db } from './DatabaseManager';
import { TABLE_NAMES, SYNC_STATUS } from './schema';

// Supabase credentials - fallback values from .env
// TODO: Configure react-native-dotenv properly for production
const SUPABASE_URL = 'https://bpdzfkymgydjxxwlctam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg';

interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
}

interface FiscalService {
  id: string;
  code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  service_type?: string;
  tasa_expedicion?: number;
  tasa_renovacion?: number;
  calculation_method?: string;
  category_id?: string;
  [key: string]: any;
}

class SyncService {
  private supabase: SupabaseClient;
  private isSyncing: boolean = false;
  private lastSyncTimestamp: string | null = null;

  constructor() {
    // Initialize Supabase with custom options for React Native compatibility
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        // Use React Native's fetch directly
        fetch: fetch.bind(globalThis),
      },
    });

    console.log('[SyncService] Supabase client initialized successfully');
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  /**
   * Sync all reference data (ministries, services, etc.)
   */
  async syncReferenceData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: ['Sync already in progress'],
      };
    }

    const online = await this.isOnline();
    if (!online) {
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: ['Device is offline'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      console.log('[Sync] Starting reference data sync...');

      // Get last sync timestamp
      this.lastSyncTimestamp = await db.getMetadata('last_full_sync');

      // Check if this is a fresh sync
      let isFreshSync = false;
      try {
        const serviceCount = await db.query('SELECT COUNT(*) as count FROM fiscal_services', []);
        isFreshSync = serviceCount[0]?.count === 0;
      } catch (error) {
        console.log('[Sync] Could not count services, treating as fresh sync');
        isFreshSync = true;
      }

      const since = (this.lastSyncTimestamp && !isFreshSync) ? new Date(this.lastSyncTimestamp) : null;

      console.log('[Sync] Last sync:', since?.toISOString() || 'never');
      console.log('[Sync] Fresh sync mode:', isFreshSync);

      // PHASE 1: HIERARCHY (116 records)
      await this.syncTable('ministries', result, since);
      await this.syncTable('sectors', result, since);
      await this.syncTable('categories', result, since);

      // PHASE 2: FISCAL SERVICES (7,561 records)
      await this.syncFiscalServices(result, since);
      await this.syncTable('service_keywords', result, since);

      // PHASE 3: TEMPLATES (4,814 records)
      await this.syncTable('procedure_templates', result, since);
      await this.syncTable('procedure_template_steps', result, since);
      await this.syncTable('document_templates', result, since);

      // PHASE 4: ASSIGNMENTS (5,547 records)
      await this.syncTable('service_procedure_assignments', result, since);
      await this.syncTable('service_document_assignments', result, since);

      // PHASE 5: TRANSLATIONS (i18n support)
      await this.syncTable('entity_translations', result, since);

      // Update last sync timestamp
      await db.setMetadata('last_full_sync', new Date().toISOString());

      console.log('[Sync] Reference data sync complete:', result);
      console.log('[Sync] Total records synced:', result.inserted);
    } catch (error) {
      console.error('[Sync] Reference data sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single table
   */
  private async syncTable(
    tableName: string,
    result: SyncResult,
    since: Date | null
  ): Promise<void> {
    try {
      console.log(`[Sync] Syncing ${tableName}...`);

      // Define column mappings for each table to match SQLite schema
      // CRITICAL: SELECT only columns that exist in BOTH Supabase and SQLite
      // EXCLUDE: created_by, updated_by, assigned_by (backend-only columns)
      const columnMappings: Record<string, string> = {
        ministries: 'id,ministry_code,name_es,description_es,display_order,icon,color,website_url,contact_email,contact_phone,is_active,created_at,updated_at',
        sectors: 'id,ministry_id,sector_code,name_es,description_es,display_order,icon,color,is_active,created_at,updated_at',
        categories: 'id,sector_id,ministry_id,category_code,name_es,description_es,service_type,display_order,is_active,created_at,updated_at',
        service_keywords: 'id,fiscal_service_id,keyword,language_code,weight,is_auto_generated,created_at',
        procedure_templates: 'id,template_code,name_es,description_es,category,usage_count,is_active,created_at,updated_at',
        procedure_template_steps: 'id,template_id,step_number,description_es,instructions_es,estimated_duration_minutes,location_address,office_hours,requires_appointment,is_optional,created_at,updated_at',
        document_templates: 'id,template_code,document_name_es,description_es,category,validity_duration_months,validity_notes,usage_count,is_active,created_at,updated_at',
        service_procedure_assignments: 'id,fiscal_service_id,template_id,applies_to,display_order,custom_notes,override_steps,assigned_at',
        service_document_assignments: 'id,fiscal_service_id,document_template_id,is_required_expedition,is_required_renewal,display_order,custom_notes,assigned_at',
        entity_translations: 'entity_type,entity_code,language_code,field_name,translation_text,translation_source,translation_quality,created_at,updated_at',
      };

      const selectColumns = columnMappings[tableName] || '*';

      // Fetch ALL rows - set high range to avoid pagination limits
      // For large tables like service_keywords (7014 rows), use higher limit
      let query = this.supabase
        .from(tableName)
        .select(selectColumns)
        .range(0, 19999);

      if (since) {
        query = query.gte('updated_at', since.toISOString());
      }

      const { data, error } = await query;

      console.log(`[Sync] ${tableName} query returned: ${data?.length || 0} rows`);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Map Supabase fields to SQLite fields
        let mapped;
        if (selectColumns === '*') {
          // Full table sync - add ID conversion and defaults
          mapped = data.map(item => {
            const result: any = { ...item };

            // CRITICAL: Convert INTEGER IDs to TEXT - only for fields that exist
            if ('id' in result && result.id) result.id = String(result.id);
            if ('ministry_id' in result && result.ministry_id) result.ministry_id = String(result.ministry_id);
            if ('sector_id' in result && result.sector_id) result.sector_id = String(result.sector_id);
            if ('category_id' in result && result.category_id) result.category_id = String(result.category_id);
            if ('fiscal_service_id' in result && result.fiscal_service_id) result.fiscal_service_id = String(result.fiscal_service_id);
            if ('template_id' in result && result.template_id) result.template_id = String(result.template_id);
            if ('procedure_template_id' in result && result.procedure_template_id) result.procedure_template_id = String(result.procedure_template_id);
            if ('document_template_id' in result && result.document_template_id) result.document_template_id = String(result.document_template_id);

            // Convert booleans to integers - only for fields that exist
            if ('is_active' in result && typeof result.is_active === 'boolean') {
              result.is_active = result.is_active ? 1 : 0;
            }
            if ('is_optional' in result && typeof result.is_optional === 'boolean') {
              result.is_optional = result.is_optional ? 1 : 0;
            }
            if ('requires_appointment' in result && typeof result.requires_appointment === 'boolean') {
              result.requires_appointment = result.requires_appointment ? 1 : 0;
            }
            if ('can_be_done_online' in result && typeof result.can_be_done_online === 'boolean') {
              result.can_be_done_online = result.can_be_done_online ? 1 : 0;
            }
            if ('is_mandatory' in result && typeof result.is_mandatory === 'boolean') {
              result.is_mandatory = result.is_mandatory ? 1 : 0;
            }
            if ('accepts_digital_copy' in result && typeof result.accepts_digital_copy === 'boolean') {
              result.accepts_digital_copy = result.accepts_digital_copy ? 1 : 0;
            }
            if ('is_required' in result && typeof result.is_required === 'boolean') {
              result.is_required = result.is_required ? 1 : 0;
            }

            // Add defaults for timestamp fields if missing
            if (!result.created_at) result.created_at = new Date().toISOString();
            if (!result.updated_at) result.updated_at = new Date().toISOString();

            return result;
          });
        } else {
          // Explicit column mapping - convert only present fields
          mapped = data.map(item => {
            const result: any = { ...item };
            // Convert IDs
            if ('id' in result) result.id = String(result.id);
            if ('fiscal_service_id' in result) result.fiscal_service_id = String(result.fiscal_service_id);
            // Convert booleans
            if ('is_active' in result && typeof result.is_active === 'boolean') {
              result.is_active = result.is_active ? 1 : 0;
            }
            if ('is_auto_generated' in result && typeof result.is_auto_generated === 'boolean') {
              result.is_auto_generated = result.is_auto_generated ? 1 : 0;
            }
            return result;
          });
        }

        await db.insertBatch(tableName, mapped);
        result.inserted += mapped.length;

        console.log(`[Sync] ${tableName}: ${mapped.length} rows synced`);
      } else {
        console.log(`[Sync] ${tableName}: No changes`);
      }
    } catch (error) {
      console.error(`[Sync] Error syncing ${tableName}:`, error);
      result.errors.push(`${tableName}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Sync fiscal services with FTS update
   */
  private async syncFiscalServices(result: SyncResult, since: Date | null): Promise<void> {
    try {
      console.log('[Sync] Syncing fiscal services...');

      // Fetch ALL rows - Supabase default limit is 1000, so we need to fetch all
      // Set a high range to get all records
      let query = this.supabase
        .from('fiscal_services')
        .select('*')
        .range(0, 19999); // Get up to 20,000 records

      if (since) {
        query = query.gte('updated_at', since.toISOString());
      }

      const { data, error } = await query;

      console.log(`[Sync] fiscal_services query returned: ${data?.length || 0} rows`);

      if (error) {
        console.error('[Sync] Supabase error:', JSON.stringify(error));
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`[Sync] Mapping ${data.length} fiscal services...`);
        const mapped = data.map((item: any) => ({
          // IDs (INTEGER → TEXT)
          id: String(item.id),
          service_code: item.code || `SVC-${item.id}`,  // FIXED: Use id as fallback if code is NULL
          category_id: String(item.category_id),

          // Basic info (SPANISH ONLY)
          name_es: item.name_es,
          description_es: item.description_es || null,
          service_type: item.service_type || null,

          // Calculation config
          calculation_method: item.calculation_method || 'fixed_expedition',
          tasa_expedicion: item.tasa_expedicion || 0,
          expedition_formula: item.expedition_formula || null,
          expedition_unit_measure: item.expedition_unit_measure || null,
          tasa_renovacion: item.tasa_renovacion || 0,
          renewal_formula: item.renewal_formula || null,
          renewal_unit_measure: item.renewal_unit_measure || null,
          calculation_config: item.calculation_config || null,
          rate_tiers: item.rate_tiers || null,
          base_percentage: item.base_percentage || null,
          percentage_of: item.percentage_of || null,
          unit_rate: item.unit_rate || null,
          unit_type: item.unit_type || null,

          // Consolidation (tier services)
          parent_service_id: item.parent_service_id ? String(item.parent_service_id) : null,
          tier_group_name: item.tier_group_name || null,
          is_tier_component: item.is_tier_component ? 1 : 0,

          // Validity and renewal
          validity_period_months: item.validity_period_months || null,
          renewal_frequency_months: item.renewal_frequency_months || null,
          grace_period_days: item.grace_period_days || 0,

          // Penalties
          late_penalty_percentage: item.late_penalty_percentage || null,
          late_penalty_fixed: item.late_penalty_fixed || null,
          penalty_calculation_rules: item.penalty_calculation_rules || null,

          // Conditions
          eligibility_criteria: item.eligibility_criteria || null,
          exemption_conditions: item.exemption_conditions || null,

          // Legal basis
          legal_reference: item.legal_reference || null,
          regulatory_articles: item.regulatory_articles || null,

          // Tariff validity dates
          tariff_effective_from: item.tariff_effective_from || null,
          tariff_effective_to: item.tariff_effective_to || null,

          // Status and meta
          status: item.status || 'active',
          priority: item.priority || 0,
          complexity_level: item.complexity_level || 1,
          processing_time_days: item.processing_time_days || 1,

          // Statistics (mobile analytics)
          view_count: item.view_count || 0,
          calculation_count: item.calculation_count || 0,
          payment_count: item.payment_count || 0,
          favorite_count: item.favorite_count || 0,

          // Audit
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        console.log(`[Sync] Mapped ${mapped.length} services, starting batch insert...`);
        await db.insertBatch('fiscal_services', mapped);
        result.inserted += mapped.length;

        console.log(`[Sync] fiscal_services: ${mapped.length} rows synced`);
      } else {
        console.log('[Sync] fiscal_services: No changes');
      }
    } catch (error) {
      console.error('[Sync] Error syncing fiscal_services:', error);
      result.errors.push(`fiscal_services: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Sync user favorites to Supabase
   */
  async syncFavorites(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const online = await this.isOnline();
      if (!online) {
        console.log('[Sync] Offline - favorites will sync later');
        return result;
      }

      // Get unsynced favorites
      const favorites = await db.query<{
        id: number;
        fiscal_service_code: string;   // FIXED: was fiscal_service_id
        notes: string | null;
        tags: string | null;
        created_at: string;             // FIXED: was added_at
      }>(
        `SELECT * FROM ${TABLE_NAMES.USER_FAVORITES}
         WHERE user_id = ? AND synced = ?`,
        [userId, SYNC_STATUS.PENDING]
      );

      if (favorites.length === 0) {
        console.log('[Sync] No favorites to sync');
        return result;
      }

      console.log(`[Sync] Syncing ${favorites.length} favorites...`);

      // Sync each favorite
      for (const favorite of favorites) {
        try {
          const { error } = await this.supabase.from('user_favorites').upsert({
            user_id: userId,
            fiscal_service_code: favorite.fiscal_service_code,  // FIXED: was fiscal_service_id
            notes: favorite.notes,
            tags: favorite.tags,
            created_at: favorite.created_at,                     // FIXED: was added_at
          });

          if (error) {
            throw error;
          }

          // Mark as synced
          await db.update(
            TABLE_NAMES.USER_FAVORITES,
            {
              synced: SYNC_STATUS.SYNCED,
              sync_timestamp: new Date().toISOString(),
            },
            'id = ?',
            [favorite.id]
          );

          result.inserted++;
        } catch (error) {
          console.error('[Sync] Error syncing favorite:', error);
          result.errors.push(
            `Favorite ${favorite.id}: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      console.log('[Sync] Favorites sync complete:', result);
    } catch (error) {
      console.error('[Sync] Favorites sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Sync calculations history to Supabase
   * UPDATED: Aligned with new calculation_history structure (v4.0.0)
   */
  async syncCalculationsHistory(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const online = await this.isOnline();
      if (!online) {
        console.log('[Sync] Offline - calculations will sync later');
        return result;
      }

      // Get unsynced calculations
      const calculations = await db.query<any>(
        `SELECT * FROM ${TABLE_NAMES.CALCULATION_HISTORY}
         WHERE user_id = ? AND synced = ?`,
        [userId, SYNC_STATUS.PENDING]
      );

      if (calculations.length === 0) {
        console.log('[Sync] No calculations to sync');
        return result;
      }

      console.log(`[Sync] Syncing ${calculations.length} calculations...`);

      // Sync each calculation
      for (const calc of calculations) {
        try {
          // Map SQLite columns to Supabase columns
          const { error } = await this.supabase.from('calculation_history').insert({
            user_id: userId,
            fiscal_service_code: calc.fiscal_service_code,    // FIXED: was fiscal_service_id
            calculation_type: calc.calculation_type,           // FIXED: was payment_type
            input_parameters: calc.input_parameters,           // FIXED: was parameters
            calculated_amount: calc.calculated_amount,
            calculation_details: calc.calculation_details,     // FIXED: was breakdown
            saved_for_later: calc.saved_for_later || false,   // NEW
            created_at: calc.created_at,                       // FIXED: was calculated_at
          });

          if (error) {
            throw error;
          }

          // Mark as synced
          await db.update(
            TABLE_NAMES.CALCULATION_HISTORY,
            { synced: SYNC_STATUS.SYNCED },
            'id = ?',
            [calc.id]
          );

          result.inserted++;
        } catch (error) {
          console.error('[Sync] Error syncing calculation:', error);
          result.errors.push(
            `Calculation ${calc.id}: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      console.log('[Sync] Calculations sync complete:', result);
    } catch (error) {
      console.error('[Sync] Calculations sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Full sync (all data)
   */
  async fullSync(userId?: string): Promise<SyncResult> {
    console.log('[Sync] Starting full sync...');

    // Sync reference data
    const refResult = await this.syncReferenceData();

    if (!userId) {
      return refResult;
    }

    // Sync user data
    const favResult = await this.syncFavorites(userId);
    const calcResult = await this.syncCalculationsHistory(userId);

    return {
      success: refResult.success && favResult.success && calcResult.success,
      inserted: refResult.inserted + favResult.inserted + calcResult.inserted,
      updated: refResult.updated + favResult.updated + calcResult.updated,
      deleted: refResult.deleted + favResult.deleted + calcResult.deleted,
      errors: [...refResult.errors, ...favResult.errors, ...calcResult.errors],
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Export for testing
export { SyncService };
