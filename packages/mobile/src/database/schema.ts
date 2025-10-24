/**
 * TaxasGE Mobile - SQLite Schema v4.0.0
 * Date: 2025-10-17
 * ALIGNED WITH SUPABASE PRODUCTION SCHEMA v4.1
 *
 * Description: Schema optimisé pour mode offline-first avec sync Supabase
 *
 * CRITICAL FIXES:
 * - IDs kept as TEXT (INTEGER from Supabase converted to TEXT in SyncService)
 * - All FK references corrected
 * - Removed phantom columns (is_amount_verified, etc.)
 * - Added missing columns (website_url, contact_email, etc.)
 * - Corrected table/column names (calculation_history, service_document_assignments, etc.)
 * - entity_translations for i18n support
 *
 * Architecture:
 * - Tables principales (fiscal_services, ministries, categories)
 * - Tables templates (procedure_templates, document_templates)
 * - Tables utilisateur (user_favorites, calculation_history)
 * - Tables i18n (entity_translations, service_keywords)
 * - Tables cache (sync_queue, sync_metadata)
 */

export const DATABASE_NAME = 'taxasge.db';
export const DATABASE_VERSION = 4;

// ============================================
// SCHEMA SQL PARTS - ALIGNED WITH SUPABASE v4.1
// Divided into parts to avoid SQLite execution limits
// ============================================

export const SCHEMA_PARTS = {
  // PART 1: Administrative hierarchy tables
  hierarchy: `
-- ============================================
-- 1. TABLES RÉFÉRENCE (hiérarchie administrative)
-- ============================================

-- Ministères (SPANISH ONLY - aligned with Supabase v4.1)
CREATE TABLE IF NOT EXISTS ministries (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase, converted to TEXT
  ministry_code TEXT NOT NULL UNIQUE,

  -- SPANISH ONLY (FR/EN via entity_translations)
  name_es TEXT NOT NULL,
  description_es TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  website_url TEXT,                         -- ADDED: missing in old schema
  contact_email TEXT,                       -- ADDED: missing in old schema
  contact_phone TEXT,                       -- ADDED: missing in old schema

  -- Status
  is_active INTEGER DEFAULT 1,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ministries_code ON ministries(ministry_code);
CREATE INDEX IF NOT EXISTS idx_ministries_active ON ministries(is_active) WHERE is_active = 1;

-- Secteurs (SPANISH ONLY - aligned with Supabase v4.1)
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  sector_code TEXT NOT NULL UNIQUE,
  ministry_id TEXT NOT NULL,                -- FK to ministries.id (TEXT)

  -- SPANISH ONLY
  name_es TEXT NOT NULL,
  description_es TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,

  -- Status
  is_active INTEGER DEFAULT 1,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sectors_ministry ON sectors(ministry_id);
CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(sector_code);

-- Catégories (SPANISH ONLY - aligned with Supabase v4.1)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  category_code TEXT NOT NULL UNIQUE,
  sector_id TEXT,                           -- Nullable - FK to sectors.id
  ministry_id TEXT,                         -- Nullable - FK to ministries.id (direct link OR via sector)
  service_type TEXT,

  -- SPANISH ONLY
  name_es TEXT NOT NULL,
  description_es TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,

  -- Status
  is_active INTEGER DEFAULT 1,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE,
  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_sector ON categories(sector_id);
CREATE INDEX IF NOT EXISTS idx_categories_ministry ON categories(ministry_id);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(category_code);
  `,

  // PART 2: Fiscal services table
  fiscalServices: `
-- ============================================
-- 2. SERVICES FISCAUX (MAIN TABLE)
-- ============================================

CREATE TABLE IF NOT EXISTS fiscal_services (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  service_code TEXT NOT NULL UNIQUE,        -- FIXED: was nullable in old schema
  category_id TEXT NOT NULL,                -- FK to categories.id

  -- SPANISH ONLY (FR/EN via entity_translations)
  name_es TEXT NOT NULL,
  description_es TEXT,

  -- Classification
  service_type TEXT CHECK(service_type IN (
    'document_processing', 'license_permit', 'residence_permit',
    'registration_fee', 'inspection_fee', 'administrative_tax',
    'customs_duty', 'declaration_tax'
  )),

  calculation_method TEXT NOT NULL CHECK(calculation_method IN (
    'fixed_expedition', 'fixed_renewal', 'fixed_both',
    'percentage_based', 'unit_based', 'tiered_rates',
    'formula_based', 'fixed_plus_unit'
  )),

  -- TARIFICATION EXPEDITION
  tasa_expedicion REAL DEFAULT 0,
  expedition_formula TEXT,
  expedition_unit_measure TEXT,

  -- TARIFICATION RENOUVELLEMENT
  tasa_renovacion REAL DEFAULT 0,
  renewal_formula TEXT,
  renewal_unit_measure TEXT,

  -- CONFIGURATION CALCUL
  calculation_config TEXT,                  -- JSON
  rate_tiers TEXT,                          -- JSON array
  base_percentage REAL,
  percentage_of TEXT,
  unit_rate REAL,
  unit_type TEXT,

  -- CONSOLIDATION SERVICES TRANCHES
  parent_service_id TEXT,                   -- FK to fiscal_services.id
  tier_group_name TEXT,
  is_tier_component INTEGER DEFAULT 0,

  -- VALIDITÉ ET PÉRIODICITÉ
  validity_period_months INTEGER,
  renewal_frequency_months INTEGER,
  grace_period_days INTEGER DEFAULT 0,

  -- PÉNALITÉS
  late_penalty_percentage REAL,
  late_penalty_fixed REAL,
  penalty_calculation_rules TEXT,           -- JSON

  -- CONDITIONS
  eligibility_criteria TEXT,                -- JSON
  exemption_conditions TEXT,                -- JSON array

  -- BASE LÉGALE
  legal_reference TEXT,
  regulatory_articles TEXT,                 -- JSON array (TEXT[] in Supabase)

  -- DATES VALIDITÉ TARIF
  tariff_effective_from TEXT,               -- DATE in Supabase
  tariff_effective_to TEXT,

  -- STATUS
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'draft', 'deprecated')),
  priority INTEGER DEFAULT 0,
  complexity_level INTEGER DEFAULT 1 CHECK(complexity_level BETWEEN 1 AND 5),
  processing_time_days INTEGER DEFAULT 1,

  -- STATISTICS (for mobile analytics)
  view_count INTEGER DEFAULT 0,
  calculation_count INTEGER DEFAULT 0,
  payment_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  -- NOTE: created_by, updated_by excluded (backend only)

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_service_id) REFERENCES fiscal_services(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_services_code ON fiscal_services(service_code);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_category ON fiscal_services(category_id, status);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_active ON fiscal_services(status, service_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_fiscal_services_popularity ON fiscal_services(favorite_count DESC, view_count DESC);
  `,

  // PART 3: Templates tables
  templates: `
-- ============================================
-- 3. TEMPLATES ARCHITECTURE (ALIGNED WITH SUPABASE)
-- ============================================

-- Procedure Templates (CORRECTED - removed phantom columns)
CREATE TABLE IF NOT EXISTS procedure_templates (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  template_code TEXT NOT NULL UNIQUE,

  -- SPANISH (FR/EN via entity_translations)
  name_es TEXT NOT NULL,
  description_es TEXT,

  -- Classification
  category TEXT,                            -- ADDED: missing in old schema

  -- Stats
  usage_count INTEGER NOT NULL DEFAULT 0,  -- ADDED: missing in old schema
  is_active INTEGER DEFAULT 1,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
  -- NOTE: created_by excluded (backend only)
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_code ON procedure_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(is_active) WHERE is_active = 1;

-- Procedure Template Steps
CREATE TABLE IF NOT EXISTS procedure_template_steps (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  template_id TEXT NOT NULL,                -- FK to procedure_templates.id
  step_number INTEGER NOT NULL CHECK(step_number > 0 AND step_number <= 100),

  -- SPANISH (FR/EN via entity_translations with code 'TEMPLATE_CODE:step_N')
  description_es TEXT NOT NULL,
  instructions_es TEXT,

  -- Configuration
  estimated_duration_minutes INTEGER,
  location_address TEXT,
  office_hours TEXT,
  requires_appointment INTEGER DEFAULT 0,
  is_optional INTEGER DEFAULT 0,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (template_id) REFERENCES procedure_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_procedure_steps_template ON procedure_template_steps(template_id, step_number);

-- Service Procedure Assignments (N:M)
CREATE TABLE IF NOT EXISTS service_procedure_assignments (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  fiscal_service_id TEXT NOT NULL,
  template_id TEXT NOT NULL,                -- FK to procedure_templates.id
  applies_to TEXT CHECK(applies_to IN ('expedition', 'renewal', 'both')),
  display_order INTEGER DEFAULT 1,
  custom_notes TEXT,
  override_steps TEXT,                      -- JSON
  assigned_at TEXT DEFAULT (datetime('now')),
  -- NOTE: assigned_by excluded (backend only)

  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES procedure_templates(id) ON DELETE CASCADE,
  UNIQUE(fiscal_service_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_spa_service ON service_procedure_assignments(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_spa_template ON service_procedure_assignments(template_id);

-- Document Templates (CORRECTED - fixed column names and structure)
CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  template_code TEXT NOT NULL UNIQUE,       -- FIXED: was "document_code" in old schema

  -- SPANISH
  document_name_es TEXT NOT NULL,
  description_es TEXT,

  -- Classification
  category TEXT,                            -- FIXED: was "document_type" in old schema

  -- VALIDITY (v4.1)
  validity_duration_months INTEGER,
  validity_notes TEXT,                      -- ADDED: missing in old schema

  -- Stats
  usage_count INTEGER NOT NULL DEFAULT 0,  -- ADDED: missing in old schema
  is_active INTEGER DEFAULT 1,              -- ADDED: missing in old schema

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
  -- NOTE: created_by excluded (backend only)
);

CREATE INDEX IF NOT EXISTS idx_document_templates_code ON document_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active) WHERE is_active = 1;

-- Service Document Assignments (RENAMED from required_documents, CORRECTED structure)
CREATE TABLE IF NOT EXISTS service_document_assignments (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  fiscal_service_id TEXT NOT NULL,
  document_template_id TEXT NOT NULL,
  is_required_expedition INTEGER DEFAULT 1, -- FIXED: was "is_optional" inverted logic
  is_required_renewal INTEGER DEFAULT 0,    -- ADDED: missing in old schema
  display_order INTEGER DEFAULT 1,          -- FIXED: was "order_index"
  custom_notes TEXT,                        -- FIXED: was "notes_es/notes_fr/notes_en"
  assigned_at TEXT DEFAULT (datetime('now')),
  -- NOTE: assigned_by excluded (backend only)

  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  FOREIGN KEY (document_template_id) REFERENCES document_templates(id) ON DELETE CASCADE,
  UNIQUE(fiscal_service_id, document_template_id)
);

CREATE INDEX IF NOT EXISTS idx_sda_service ON service_document_assignments(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_sda_template ON service_document_assignments(document_template_id);
  `,

  // PART 4: i18n tables
  i18n: `
-- ============================================
-- 4. i18n OPTIMIZED (ALIGNED WITH SUPABASE v4.1)
-- ============================================

-- Entity Translations (for FR/EN translations of ES-only entities)
CREATE TABLE IF NOT EXISTS entity_translations (
  entity_type TEXT NOT NULL CHECK(entity_type IN (
    'ministry', 'sector', 'category', 'service',
    'procedure_template', 'procedure_step', 'document_template'
  )),
  entity_code TEXT NOT NULL,                -- SHORT: 'T-001', 'PAYMENT_STD', 'PAYMENT_STD:step_4'
  language_code TEXT NOT NULL CHECK(language_code IN ('fr', 'en')),
  field_name TEXT NOT NULL CHECK(field_name IN ('name', 'description', 'instructions')),
  translation_text TEXT NOT NULL,

  -- Quality tracking
  translation_source TEXT DEFAULT 'manual' CHECK(translation_source IN ('manual', 'import', 'ai', 'google_translate')),
  translation_quality REAL,

  -- Audit
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  PRIMARY KEY (entity_type, entity_code, language_code, field_name)
);

-- Service Keywords (multilingue natif) - CORRECTED: removed is_active, updated_at
CREATE TABLE IF NOT EXISTS service_keywords (
  id TEXT PRIMARY KEY,                      -- INTEGER in Supabase
  fiscal_service_id TEXT NOT NULL,          -- FK to fiscal_services.id
  keyword TEXT NOT NULL,
  language_code TEXT NOT NULL CHECK(language_code IN ('es', 'fr', 'en')),
  weight INTEGER DEFAULT 1,
  is_auto_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  -- NOTE: is_active, updated_at REMOVED (don't exist in Supabase v4.1)

  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  UNIQUE(fiscal_service_id, keyword, language_code)
);

CREATE INDEX IF NOT EXISTS idx_keywords_service ON service_keywords(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON service_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_language ON service_keywords(language_code);
  `,

  // PART 5: User data tables
  userData: `
-- ============================================
-- 5. USER DATA (MOBILE ONLY)
-- ============================================

-- User Favorites (CORRECTED - uses service_code, composite PK)
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,                    -- UUID in Supabase
  fiscal_service_code TEXT NOT NULL,        -- FIXED: was "fiscal_service_id", references service_code NOT id
  notes TEXT,
  tags TEXT,                                -- JSON array (mobile only - for local organization)
  created_at TEXT DEFAULT (datetime('now')), -- FIXED: was "added_at"

  -- Sync metadata (mobile only)
  synced INTEGER DEFAULT 0,
  sync_timestamp TEXT,

  PRIMARY KEY(user_id, fiscal_service_code),
  FOREIGN KEY (fiscal_service_code) REFERENCES fiscal_services(service_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_synced ON user_favorites(synced) WHERE synced = 0;

-- Calculation History (CORRECTED - renamed table, fixed columns)
CREATE TABLE IF NOT EXISTS calculation_history (  -- FIXED: was "calculations_history"
  id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Local only (UUID in Supabase)
  user_id TEXT NOT NULL,                    -- UUID in Supabase
  fiscal_service_code TEXT NOT NULL,        -- FIXED: was "fiscal_service_id", references service_code
  calculation_type TEXT NOT NULL CHECK(calculation_type IN ('expedition', 'renewal')), -- FIXED: was "payment_type"
  input_parameters TEXT NOT NULL,           -- JSON
  calculated_amount REAL NOT NULL,
  calculation_details TEXT,                 -- FIXED: was "breakdown"
  saved_for_later INTEGER DEFAULT 0,        -- ADDED: missing in old schema
  created_at TEXT DEFAULT (datetime('now')), -- FIXED: was "calculated_at"

  -- Sync metadata (mobile only)
  synced INTEGER DEFAULT 0,

  FOREIGN KEY (fiscal_service_code) REFERENCES fiscal_services(service_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calculations_user ON calculation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_service ON calculation_history(fiscal_service_code);
CREATE INDEX IF NOT EXISTS idx_calculations_synced ON calculation_history(synced) WHERE synced = 0;
  `,

  // PART 6: Sync infrastructure
  sync: `
-- ============================================
-- 6. SYNC INFRASTRUCTURE (MOBILE ONLY)
-- ============================================

-- Sync Queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data TEXT,                                -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(retry_count) WHERE retry_count < 5;

-- Sync Metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Cache des recherches
CREATE TABLE IF NOT EXISTS search_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL UNIQUE,
  results TEXT NOT NULL,                    -- JSON array of service codes
  result_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 1,
  last_searched TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_search_cache_count ON search_cache(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);
  `,

  // PART 7: Chatbot FAQ
  chatbot: `
-- ============================================
-- 7. CHATBOT FAQ (MVP1 - Offline)
-- ============================================

CREATE TABLE IF NOT EXISTS chatbot_faq (
  id TEXT PRIMARY KEY,
  question_pattern TEXT NOT NULL,
  intent TEXT NOT NULL,
  response_es TEXT NOT NULL,
  response_fr TEXT,
  response_en TEXT,
  follow_up_suggestions TEXT,               -- JSON array
  actions TEXT,                             -- JSON
  keywords TEXT NOT NULL,                   -- JSON array
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_faq_intent ON chatbot_faq(intent);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_active ON chatbot_faq(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_priority ON chatbot_faq(priority DESC);
  `,

  // PART 8: Views
  views: `
-- ============================================
-- 8. VIEWS (OPTIMIZED QUERIES)
-- ============================================

-- Vue complète services avec hiérarchie
CREATE VIEW IF NOT EXISTS v_fiscal_services_complete AS
SELECT
  fs.*,
  c.name_es as category_name,
  c.category_code,
  COALESCE(s.ministry_id, c.ministry_id) as ministry_id,
  m.name_es as ministry_name,
  m.ministry_code,
  m.color as ministry_color
FROM fiscal_services fs
LEFT JOIN categories c ON fs.category_id = c.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON (s.ministry_id = m.id OR c.ministry_id = m.id);

-- Vue services populaires
CREATE VIEW IF NOT EXISTS v_popular_services AS
SELECT * FROM fiscal_services
WHERE status = 'active'
ORDER BY favorite_count DESC, view_count DESC
LIMIT 20;

-- Vue favoris utilisateur avec détails
CREATE VIEW IF NOT EXISTS v_user_favorites_detail AS
SELECT
  uf.*,
  fs.name_es,
  fs.service_type,
  fs.tasa_expedicion,
  fs.tasa_renovacion,
  m.name_es as ministry_name,
  m.color as ministry_color
FROM user_favorites uf
LEFT JOIN fiscal_services fs ON uf.fiscal_service_code = fs.service_code
LEFT JOIN categories c ON fs.category_id = c.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON (s.ministry_id = m.id OR c.ministry_id = m.id);

-- Vue procédures par service
CREATE VIEW IF NOT EXISTS v_service_procedures AS
SELECT
  spa.fiscal_service_id,
  spa.applies_to,
  pt.template_code,
  pt.name_es as procedure_name,
  COUNT(pts.id) as steps_count
FROM service_procedure_assignments spa
LEFT JOIN procedure_templates pt ON spa.template_id = pt.id
LEFT JOIN procedure_template_steps pts ON pt.id = pts.template_id
GROUP BY spa.fiscal_service_id, spa.applies_to, pt.id, pt.template_code, pt.name_es;

-- Vue documents requis par service
CREATE VIEW IF NOT EXISTS v_service_documents AS
SELECT
  sda.fiscal_service_id,
  dt.template_code as document_code,
  dt.document_name_es as document_name,
  sda.is_required_expedition,
  sda.is_required_renewal,
  dt.validity_duration_months
FROM service_document_assignments sda
LEFT JOIN document_templates dt ON sda.document_template_id = dt.id
ORDER BY sda.display_order;
  `,

  // PART 9: Initial data
  initialData: `
-- Initial metadata
INSERT OR IGNORE INTO sync_metadata (key, value) VALUES
  ('last_full_sync', NULL),
  ('last_favorites_sync', NULL),
  ('last_calculations_sync', NULL),
  ('database_version', '4.0.0'),
  ('schema_aligned_with_supabase', 'v4.1'),
  ('migration_date', datetime('now'));
  `,
};

// Backward compatibility: SCHEMA_SQL as concatenation
export const SCHEMA_SQL = Object.values(SCHEMA_PARTS).join('\n\n');

// ============================================
// QUERIES UTILITAIRES
// ============================================

export const QUERIES = {
  getActiveMinistries: `
    SELECT * FROM ministries
    WHERE is_active = 1
    ORDER BY display_order, name_es
  `,

  searchServices: `
    SELECT * FROM fiscal_services
    WHERE status = 'active'
    AND (
      name_es LIKE ? OR
      description_es LIKE ? OR
      service_code LIKE ?
    )
    ORDER BY favorite_count DESC, view_count DESC
    LIMIT ?
  `,

  getServicesByCategory: `
    SELECT * FROM v_fiscal_services_complete
    WHERE category_id = ? AND status = 'active'
    ORDER BY name_es
  `,

  getPopularServices: `
    SELECT * FROM v_popular_services
  `,

  getServiceDetail: `
    SELECT * FROM v_fiscal_services_complete
    WHERE id = ? OR service_code = ?
    LIMIT 1
  `,

  getServiceProcedures: `
    SELECT
      pt.*,
      spa.applies_to,
      spa.display_order
    FROM service_procedure_assignments spa
    JOIN procedure_templates pt ON spa.template_id = pt.id
    WHERE spa.fiscal_service_id = ?
    ORDER BY spa.display_order, pt.template_code
  `,

  getProcedureSteps: `
    SELECT * FROM procedure_template_steps
    WHERE template_id = ?
    ORDER BY step_number
  `,

  getServiceDocuments: `
    SELECT * FROM v_service_documents
    WHERE fiscal_service_id = ?
  `,

  getUserFavorites: `
    SELECT * FROM v_user_favorites_detail
    WHERE user_id = ?
    ORDER BY created_at DESC
  `,

  getCalculationsHistory: `
    SELECT
      ch.*,
      fs.name_es as service_name,
      fs.service_code,
      fs.calculation_method
    FROM calculation_history ch
    LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
    WHERE ch.user_id = ?
    ORDER BY ch.created_at DESC
    LIMIT ?
  `,

  getPendingSyncQueue: `
    SELECT * FROM sync_queue
    WHERE retry_count < 5
    ORDER BY created_at ASC
  `,

  checkFavoriteExists: `
    SELECT 1 FROM user_favorites
    WHERE user_id = ? AND fiscal_service_code = ?
    LIMIT 1
  `,

  // Chatbot FAQ queries
  searchChatbotFAQ: `
    SELECT * FROM chatbot_faq
    WHERE is_active = 1
    AND (
      keywords LIKE ? OR
      response_es LIKE ?
    )
    ORDER BY priority DESC
    LIMIT ?
  `,

  getChatbotFAQByIntent: `
    SELECT * FROM chatbot_faq
    WHERE intent = ? AND is_active = 1
    ORDER BY priority DESC
    LIMIT ?
  `,

  // Translation queries
  getTranslations: `
    SELECT * FROM entity_translations
    WHERE entity_type = ?
    AND entity_code = ?
    AND language_code = ?
  `,
};

// ============================================
// CONSTANTS
// ============================================

export const TABLE_NAMES = {
  MINISTRIES: 'ministries',
  SECTORS: 'sectors',
  CATEGORIES: 'categories',
  FISCAL_SERVICES: 'fiscal_services',
  PROCEDURE_TEMPLATES: 'procedure_templates',
  PROCEDURE_TEMPLATE_STEPS: 'procedure_template_steps',
  SERVICE_PROCEDURE_ASSIGNMENTS: 'service_procedure_assignments',
  DOCUMENT_TEMPLATES: 'document_templates',
  SERVICE_DOCUMENT_ASSIGNMENTS: 'service_document_assignments',
  ENTITY_TRANSLATIONS: 'entity_translations',
  SERVICE_KEYWORDS: 'service_keywords',
  USER_FAVORITES: 'user_favorites',
  CALCULATION_HISTORY: 'calculation_history',
  SYNC_QUEUE: 'sync_queue',
  SYNC_METADATA: 'sync_metadata',
  SEARCH_CACHE: 'search_cache',
  CHATBOT_FAQ: 'chatbot_faq',
} as const;

export const SYNC_STATUS = {
  PENDING: 0,
  SYNCED: 1,
  ERROR: -1,
} as const;

export const MAX_SYNC_RETRIES = 5;

/**
 * MIGRATION NOTES v3 → v4:
 * ========================================
 *
 * CRITICAL CHANGES:
 * 1. ✅ All IDs kept as TEXT (INTEGER→TEXT conversion in SyncService)
 * 2. ✅ Added missing columns:
 *    - ministries: website_url, contact_email, contact_phone
 *    - procedure_templates: category, usage_count
 *    - document_templates: validity_notes, usage_count, is_active
 *    - calculation_history: saved_for_later
 * 3. ✅ Removed phantom columns:
 *    - fiscal_services: is_amount_verified
 *    - procedure_templates: applies_to, estimated_total_duration_minutes, etc.
 *    - document_templates: document_type, is_mandatory, etc.
 *    - calculation_history: calculation_method, calculation_base
 * 4. ✅ Fixed table/column names:
 *    - calculations_history → calculation_history
 *    - required_documents → service_document_assignments
 *    - document_code → template_code
 *    - fiscal_service_id → fiscal_service_code (where applicable)
 * 5. ✅ Fixed FK references:
 *    - user_favorites: fiscal_service_code → fiscal_services.service_code
 *    - calculation_history: fiscal_service_code → fiscal_services.service_code
 * 6. ✅ service_keywords: removed is_active, updated_at (don't exist in Supabase v4.1)
 * 7. ✅ entity_translations: CORRECT structure for i18n support
 *
 * MIGRATION STRATEGY:
 * - Database must be cleared and resynced from Supabase
 * - User data (favorites, calculations) will be lost (or export first)
 * - SyncService must convert INTEGER IDs to TEXT
 */
