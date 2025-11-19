/**
 * TaxasGE Mobile - Sync Service
 * Service de synchronisation bidirectionnelle SQLite <-> Supabase
 *
 * DUAL-VERSION SUPPORT:
 * - Offline: Syncs only 4 public tables (download-only)
 * - Pro: Syncs 8+ tables including user data (bidirectional)
 *
 * PROGRESSIVE SYNC (2025-11-06):
 * - Phase 1 (CRITICAL - 5s): Core data for immediate app usage
 * - Phase 2 (BACKGROUND - 20s): Translations for multilingual support
 * - Phase 3 (DEFERRED - 30s): Extended features (keywords, procedures, documents)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import { db } from './DatabaseManager';
import { TABLE_NAMES, SYNC_STATUS } from './schema';
import { APP_CONFIG, getSyncTables, getSyncStrategy } from '../config/AppConfig';

// Supabase credentials from AppConfig (configured via .env.offline or .env.pro)
const SUPABASE_URL = APP_CONFIG.supabaseUrl || 'https://bpdzfkymgydjxxwlctam.supabase.co';
const SUPABASE_ANON_KEY = APP_CONFIG.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg';

interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
}

interface ProgressiveSyncResult extends SyncResult {
  phase: 1 | 2 | 3;
  phaseName: string;
  tablesSync: string[];
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
   * Sync reference data based on app version configuration
   * Offline: Syncs only 4 public tables
   * Pro: Syncs all tables including user data
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
      const syncStrategy = getSyncStrategy();
      const tablesToSync = getSyncTables();

      console.log('[Sync] ========================================');
      console.log('[Sync] Starting sync with configuration:');
      console.log('[Sync] Version:', APP_CONFIG.version);
      console.log('[Sync] Direction:', syncStrategy.direction);
      console.log('[Sync] Frequency:', syncStrategy.frequency);
      console.log('[Sync] Tables to sync:', tablesToSync);
      console.log('[Sync] ========================================');

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

      // DYNAMIC TABLE SYNC based on configuration
      // Always sync: ministries, categories, fiscal_services, entity_translations
      // Pro only: user_favorites, calculation_history, declarations, user_profiles

      // PHASE 1: HIERARCHY (if needed)
      if (tablesToSync.includes('ministries')) {
        await this.syncTable('ministries', result, since);
      }
      if (tablesToSync.includes('sectors')) {
        await this.syncTable('sectors', result, since);
      }
      if (tablesToSync.includes('categories')) {
        await this.syncTable('categories', result, since);
      }

      // PHASE 2: FISCAL SERVICES (main data)
      if (tablesToSync.includes('fiscal_services')) {
        await this.syncFiscalServices(result, since);
      }
      if (tablesToSync.includes('service_keywords')) {
        await this.syncTable('service_keywords', result, since);
      }

      // PHASE 3: TEMPLATES (Pro version or explicit)
      if (tablesToSync.includes('procedure_templates')) {
        await this.syncTable('procedure_templates', result, since);
      }
      if (tablesToSync.includes('procedure_template_steps')) {
        await this.syncTable('procedure_template_steps', result, since);
      }
      if (tablesToSync.includes('document_templates')) {
        await this.syncTable('document_templates', result, since);
      }

      // PHASE 4: ASSIGNMENTS (Pro version or explicit)
      if (tablesToSync.includes('service_procedure_assignments')) {
        await this.syncTable('service_procedure_assignments', result, since);
      }
      if (tablesToSync.includes('service_document_assignments')) {
        await this.syncTable('service_document_assignments', result, since);
      }

      // PHASE 5: TRANSLATIONS (i18n support - filtered for active entities only)
      if (tablesToSync.includes('entity_translations')) {
        await this.syncEntityTranslations(result, since);
      }

      // PHASE 6: USER DATA (Pro version only)
      if (tablesToSync.includes('user_favorites')) {
        console.log('[Sync] Syncing user_favorites (Pro version only)...');
        await this.syncTable('user_favorites', result, since);
      }
      if (tablesToSync.includes('calculation_history')) {
        console.log('[Sync] Syncing calculation_history (Pro version only)...');
        await this.syncTable('calculation_history', result, since);
      }
      if (tablesToSync.includes('declarations')) {
        console.log('[Sync] Syncing declarations (Pro version only)...');
        await this.syncTable('declarations', result, since);
      }
      if (tablesToSync.includes('user_profiles')) {
        console.log('[Sync] Syncing user_profiles (Pro version only)...');
        await this.syncTable('user_profiles', result, since);
      }

      // Update last sync timestamp
      await db.setMetadata('last_full_sync', new Date().toISOString());

      console.log('[Sync] ========================================');
      console.log('[Sync] Sync complete!');
      console.log('[Sync] Total inserted:', result.inserted);
      console.log('[Sync] Total updated:', result.updated);
      console.log('[Sync] Version:', APP_CONFIG.version);
      console.log('[Sync] ========================================');
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
        chatbot_faq: 'id,question_pattern,intent,response_es,response_fr,response_en,follow_up_suggestions,actions,keywords,priority,is_active,created_at,updated_at',
      };

      const selectColumns = columnMappings[tableName] || '*';

      // Tables that have 'updated_at' column (for incremental sync)
      const tablesWithUpdatedAt = [
        'ministries', 'sectors', 'categories', 'fiscal_services',
        'procedure_templates', 'procedure_template_steps', 'document_templates',
        'entity_translations', 'user_favorites', 'declarations', 'user_profiles', 'chatbot_faq'
      ];

      // Check if table is empty locally (force full sync if empty)
      let isTableEmpty = false;
      try {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`, []);
        isTableEmpty = countResult[0]?.count === 0;
      } catch (error) {
        console.log(`[Sync] Could not count ${tableName}, treating as empty`);
        isTableEmpty = true;
      }

      // Pagination: Fetch ALL rows in batches
      // CRITICAL: Supabase limits to 1000 rows by default
      // Some tables have >10k rows (service_keywords: 7014, entity_translations: 8486)
      const BATCH_SIZE = 1000;
      let allData: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        let query = this.supabase
          .from(tableName)
          .select(selectColumns)
          .range(offset, offset + BATCH_SIZE - 1);

        // Only apply updated_at filter for tables that have this column AND are not empty
        if (since && !isTableEmpty && tablesWithUpdatedAt.includes(tableName)) {
          query = query.gte('updated_at', since.toISOString());
        }

        const { data: batchData, error } = await query;

        if (error) {
          throw error;
        }

        if (batchData && batchData.length > 0) {
          allData.push(...batchData);
          offset += BATCH_SIZE;
          hasMore = batchData.length === BATCH_SIZE; // Continue if we got a full batch
        } else {
          hasMore = false;
        }
      }

      const data = allData;

      console.log(`[Sync] ${tableName} query returned: ${data?.length || 0} rows`);

      if (data && data.length > 0) {
        // Map Supabase fields to SQLite fields
        let mapped;
        if (selectColumns === '*') {
          // Full table sync - add ID conversion and defaults
          mapped = data.map(item => {
            const mappedItem: any = { ...item };

            // CRITICAL: Convert INTEGER IDs to TEXT - only for fields that exist
            if ('id' in mappedItem && mappedItem.id) mappedItem.id = String(mappedItem.id);
            if ('ministry_id' in mappedItem && mappedItem.ministry_id) mappedItem.ministry_id = String(mappedItem.ministry_id);
            if ('sector_id' in mappedItem && mappedItem.sector_id) mappedItem.sector_id = String(mappedItem.sector_id);
            if ('category_id' in mappedItem && mappedItem.category_id) mappedItem.category_id = String(mappedItem.category_id);
            if ('fiscal_service_id' in mappedItem && mappedItem.fiscal_service_id) mappedItem.fiscal_service_id = String(mappedItem.fiscal_service_id);
            if ('template_id' in mappedItem && mappedItem.template_id) mappedItem.template_id = String(mappedItem.template_id);
            if ('procedure_template_id' in mappedItem && mappedItem.procedure_template_id) mappedItem.procedure_template_id = String(mappedItem.procedure_template_id);
            if ('document_template_id' in mappedItem && mappedItem.document_template_id) mappedItem.document_template_id = String(mappedItem.document_template_id);

            // Convert booleans to integers - only for fields that exist
            if ('is_active' in mappedItem && typeof mappedItem.is_active === 'boolean') {
              mappedItem.is_active = mappedItem.is_active ? 1 : 0;
            }
            if ('is_optional' in mappedItem && typeof mappedItem.is_optional === 'boolean') {
              mappedItem.is_optional = mappedItem.is_optional ? 1 : 0;
            }
            if ('requires_appointment' in mappedItem && typeof mappedItem.requires_appointment === 'boolean') {
              mappedItem.requires_appointment = mappedItem.requires_appointment ? 1 : 0;
            }
            if ('can_be_done_online' in mappedItem && typeof mappedItem.can_be_done_online === 'boolean') {
              mappedItem.can_be_done_online = mappedItem.can_be_done_online ? 1 : 0;
            }
            if ('is_mandatory' in mappedItem && typeof mappedItem.is_mandatory === 'boolean') {
              mappedItem.is_mandatory = mappedItem.is_mandatory ? 1 : 0;
            }
            if ('accepts_digital_copy' in mappedItem && typeof mappedItem.accepts_digital_copy === 'boolean') {
              mappedItem.accepts_digital_copy = mappedItem.accepts_digital_copy ? 1 : 0;
            }
            if ('is_required' in mappedItem && typeof mappedItem.is_required === 'boolean') {
              mappedItem.is_required = mappedItem.is_required ? 1 : 0;
            }

            // Add defaults for timestamp fields if missing
            if (!mappedItem.created_at) mappedItem.created_at = new Date().toISOString();
            if (!mappedItem.updated_at) mappedItem.updated_at = new Date().toISOString();

            return mappedItem;
          });
        } else {
          // Explicit column mapping - convert only present fields
          mapped = data.map(item => {
            const mappedItem: any = { ...item };
            // Convert IDs
            if ('id' in mappedItem) mappedItem.id = String(mappedItem.id);
            if ('fiscal_service_id' in mappedItem) mappedItem.fiscal_service_id = String(mappedItem.fiscal_service_id);
            // Convert booleans
            if ('is_active' in mappedItem && typeof mappedItem.is_active === 'boolean') {
              mappedItem.is_active = mappedItem.is_active ? 1 : 0;
            }
            if ('is_auto_generated' in mappedItem && typeof mappedItem.is_auto_generated === 'boolean') {
              mappedItem.is_auto_generated = mappedItem.is_auto_generated ? 1 : 0;
            }
            return mappedItem;
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
          service_code: item.service_code || `T-${String(item.id).padStart(3, '0')}`,  // FIXED: Use service_code (not code), fallback to T-XXX format
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
          calculation_config: item.calculation_config
            ? (typeof item.calculation_config === 'string' ? item.calculation_config : JSON.stringify(item.calculation_config))
            : null,
          rate_tiers: item.rate_tiers
            ? (typeof item.rate_tiers === 'string' ? item.rate_tiers : JSON.stringify(item.rate_tiers))
            : null,
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
          penalty_calculation_rules: item.penalty_calculation_rules
            ? (typeof item.penalty_calculation_rules === 'string' ? item.penalty_calculation_rules : JSON.stringify(item.penalty_calculation_rules))
            : null,

          // Conditions
          eligibility_criteria: item.eligibility_criteria
            ? (typeof item.eligibility_criteria === 'string' ? item.eligibility_criteria : JSON.stringify(item.eligibility_criteria))
            : null,
          exemption_conditions: item.exemption_conditions
            ? (typeof item.exemption_conditions === 'string' ? item.exemption_conditions : JSON.stringify(item.exemption_conditions))
            : null,

          // Legal basis
          legal_reference: item.legal_reference || null,
          regulatory_articles: item.regulatory_articles
            ? (typeof item.regulatory_articles === 'string' ? item.regulatory_articles : JSON.stringify(item.regulatory_articles))
            : null,

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
   * Sync entity_translations with filtering for active entities
   *
   * NOTE: Currently syncs ALL translations (~8,486 records) for simplicity
   * Alternative: Filter by active entity codes (saves ~66 records but adds 7+ queries)
   *
   * Trade-off analysis:
   * - Full sync: ~800 KB, 1 query, ~2-3 seconds
   * - Filtered sync: ~794 KB, 8 queries, ~10-12 seconds
   * - Benefit: Save ~6 KB (0.75%)
   * - Cost: +7-9 seconds sync time
   *
   * Decision: Full sync (performance > minimal space savings)
   */
  private async syncEntityTranslations(result: SyncResult, since: Date | null): Promise<void> {
    try {
      console.log('[Sync] Syncing entity_translations (all translations)...');

      // Sync all translations - simpler and faster than filtering
      await this.syncTable('entity_translations', result, since);

      console.log('[Sync] entity_translations: Synced successfully');
    } catch (error) {
      console.error('[Sync] Error syncing entity_translations:', error);
      result.errors.push(`entity_translations: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
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

  /**
   * PROGRESSIVE SYNC - Phase 1 (CRITICAL - ~5 seconds)
   * Core data needed for immediate app usage
   *
   * Tables: ministries, sectors, categories, fiscal_services (850)
   * Total: ~1,000 records (~150 KB)
   * Use case: Chatbot functional in Spanish only
   */
  async syncPhase1(): Promise<ProgressiveSyncResult> {
    const result: ProgressiveSyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      phase: 1,
      phaseName: 'CRITICAL',
      tablesSync: ['ministries', 'sectors', 'categories', 'fiscal_services'],
    };

    try {
      console.log('[Sync Phase 1] Starting CRITICAL sync...');
      const startTime = Date.now();

      await this.syncTable('ministries', result, null);
      await this.syncTable('sectors', result, null);
      await this.syncTable('categories', result, null);
      await this.syncFiscalServices(result, null);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Sync Phase 1] ✅ Complete in ${duration}s`);
      console.log(`[Sync Phase 1] Inserted: ${result.inserted} records`);

      await db.setMetadata('sync_phase_1_complete', new Date().toISOString());
    } catch (error) {
      console.error('[Sync Phase 1] ❌ Failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * PROGRESSIVE SYNC - Phase 2 (BACKGROUND - ~20 seconds)
   * Translations for multilingual support
   *
   * Tables: entity_translations (8,486)
   * Use case: Chatbot functional in FR/EN
   */
  async syncPhase2(): Promise<ProgressiveSyncResult> {
    const result: ProgressiveSyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      phase: 2,
      phaseName: 'BACKGROUND',
      tablesSync: ['entity_translations'],
    };

    try {
      console.log('[Sync Phase 2] Starting BACKGROUND sync...');
      const startTime = Date.now();

      await this.syncEntityTranslations(result, null);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Sync Phase 2] ✅ Complete in ${duration}s`);

      await db.setMetadata('sync_phase_2_complete', new Date().toISOString());
    } catch (error) {
      console.error('[Sync Phase 2] ❌ Failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * PROGRESSIVE SYNC - Phase 3 (DEFERRED - ~30 seconds)
   * Extended features (keywords, procedures, documents)
   *
   * Tables: service_keywords (7,014), procedure_templates (703),
   *         procedure_template_steps (2,077), document_templates (792),
   *         service_procedure_assignments (850), service_document_assignments (1,234)
   * Use case: Advanced search, procedures, documents available
   */
  async syncPhase3(): Promise<ProgressiveSyncResult> {
    const result: ProgressiveSyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      phase: 3,
      phaseName: 'DEFERRED',
      tablesSync: [
        'service_keywords',
        'procedure_templates',
        'procedure_template_steps',
        'document_templates',
        'service_procedure_assignments',
        'service_document_assignments',
      ],
    };

    try {
      console.log('[Sync Phase 3] Starting DEFERRED sync...');
      const startTime = Date.now();

      await this.syncTable('service_keywords', result, null);
      await this.syncTable('procedure_templates', result, null);
      await this.syncTable('procedure_template_steps', result, null);
      await this.syncTable('document_templates', result, null);
      await this.syncTable('service_procedure_assignments', result, null);
      await this.syncTable('service_document_assignments', result, null);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Sync Phase 3] ✅ Complete in ${duration}s`);

      await db.setMetadata('sync_phase_3_complete', new Date().toISOString());
      await db.setMetadata('last_full_sync', new Date().toISOString());
    } catch (error) {
      console.error('[Sync Phase 3] ❌ Failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Progressive Sync - Full workflow
   * Executes all 3 phases sequentially with callbacks
   */
  async progressiveSync(
    onPhaseComplete?: (phase: 1 | 2 | 3, result: ProgressiveSyncResult) => void
  ): Promise<SyncResult> {
    console.log('[Progressive Sync] ========================================');
    console.log('[Progressive Sync] Starting 3-phase progressive sync...');
    console.log('[Progressive Sync] ========================================');

    const totalResult: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    const startTime = Date.now();

    // Phase 1: CRITICAL
    const phase1 = await this.syncPhase1();
    totalResult.inserted += phase1.inserted;
    totalResult.updated += phase1.updated;
    totalResult.errors.push(...phase1.errors);
    onPhaseComplete?.(1, phase1);

    if (!phase1.success) {
      totalResult.success = false;
      console.error('[Progressive Sync] Phase 1 failed, aborting remaining phases');
      return totalResult;
    }

    // Phase 2: BACKGROUND
    const phase2 = await this.syncPhase2();
    totalResult.inserted += phase2.inserted;
    totalResult.updated += phase2.updated;
    totalResult.errors.push(...phase2.errors);
    onPhaseComplete?.(2, phase2);

    // Phase 3: DEFERRED
    const phase3 = await this.syncPhase3();
    totalResult.inserted += phase3.inserted;
    totalResult.updated += phase3.updated;
    totalResult.errors.push(...phase3.errors);
    onPhaseComplete?.(3, phase3);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('[Progressive Sync] ========================================');
    console.log('[Progressive Sync] ✅ ALL PHASES COMPLETE');
    console.log(`[Progressive Sync] Total time: ${totalDuration}s`);
    console.log(`[Progressive Sync] Total records: ${totalResult.inserted}`);
    console.log('[Progressive Sync] ========================================');

    totalResult.success = phase1.success && phase2.success && phase3.success;
    return totalResult;
  }
}

// Export singleton instance
export const syncService = new SyncService();
export type { ProgressiveSyncResult };

// Export for testing
export { SyncService };
