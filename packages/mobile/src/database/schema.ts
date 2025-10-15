/**
 * TaxasGE Mobile - SQLite Schema v2.0.0
 * Date: 2025-10-13
 * ALIGNED WITH SUPABASE PRODUCTION SCHEMA
 *
 * Description: Schema optimisé pour mode offline-first avec sync Supabase
 * Changes from v1.0.0:
 * - Renamed: expedition_amount → tasa_expedicion
 * - Renamed: renewal_amount → tasa_renovacion
 * - Added: calculation_method, base_percentage, percentage_of, tier_group_name, is_tier_component
 * - Added tables: procedure_templates, procedure_template_steps, service_procedure_assignments, document_templates
 * - Added: is_amount_verified flag for disclaimer UI
 *
 * Architecture:
 * - Tables principales (fiscal_services, ministries, categories)
 * - Tables utilisateur (favorites, calculations_history)
 * - Tables procedures & documents (NEW)
 * - Tables cache (translations, sync_queue)
 */

export const DATABASE_NAME = 'taxasge.db';
export const DATABASE_VERSION = 3; // v3: Added chatbot_faq table for MVP1

// ============================================
// SCHEMA SQL COMPLET - ALIGNED WITH SUPABASE
// ============================================

export const SCHEMA_SQL = `
-- ============================================
-- 1. TABLES RÉFÉRENCE (données fiscales)
-- ============================================

-- Ministères
CREATE TABLE IF NOT EXISTS ministries (
  id TEXT PRIMARY KEY,
  ministry_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  icon_url TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ministries_code ON ministries(ministry_code);
CREATE INDEX IF NOT EXISTS idx_ministries_active ON ministries(is_active);

-- Secteurs
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  ministry_id TEXT NOT NULL,
  sector_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  icon_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sectors_ministry ON sectors(ministry_id);
CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(sector_code);

-- Catégories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  sector_id TEXT NOT NULL,
  category_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  service_type TEXT, -- NEW: Aligned with Supabase
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_sector ON categories(sector_id);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(category_code);

-- Services fiscaux (table principale) - ALIGNED WITH SUPABASE
CREATE TABLE IF NOT EXISTS fiscal_services (
  id TEXT PRIMARY KEY,
  service_code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL,

  -- Noms et descriptions
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,

  -- Classification
  service_type TEXT CHECK(service_type IN (
    'document_processing', 'license_permit', 'residence_permit',
    'registration_fee', 'inspection_fee', 'administrative_tax',
    'customs_duty', 'declaration_tax'
  )),

  -- CALCULATION METHOD (NEW - CRITICAL FOR CALCULATOR)
  calculation_method TEXT NOT NULL CHECK(calculation_method IN (
    'fixed_expedition', 'fixed_renewal', 'fixed_both',
    'percentage_based', 'unit_based', 'tiered_rates',
    'formula_based', 'fixed_plus_unit'
  )),

  -- TARIFICATION EXPEDITION (RENAMED FROM expedition_amount)
  tasa_expedicion REAL DEFAULT 0,
  expedition_formula TEXT,
  expedition_unit_measure TEXT,

  -- TARIFICATION RENOUVELLEMENT (RENAMED FROM renewal_amount)
  tasa_renovacion REAL DEFAULT 0,
  renewal_formula TEXT,
  renewal_unit_measure TEXT,

  -- CONFIGURATION CALCUL (NEW)
  calculation_config TEXT, -- JSON
  rate_tiers TEXT, -- JSON array
  base_percentage REAL, -- NEW: For percentage-based calculations
  percentage_of TEXT, -- NEW: What the percentage applies to
  unit_rate REAL,
  unit_type TEXT,

  -- CONSOLIDATION SERVICES TRANCHES (NEW)
  parent_service_id TEXT,
  tier_group_name TEXT, -- NEW: For tiered services
  is_tier_component INTEGER DEFAULT 0, -- NEW: Boolean as INTEGER

  -- VALIDITÉ ET PÉRIODICITÉ
  validity_period_months INTEGER,
  renewal_frequency_months INTEGER,
  grace_period_days INTEGER DEFAULT 0,

  -- PÉNALITÉS
  late_penalty_percentage REAL,
  late_penalty_fixed REAL,
  penalty_calculation_rules TEXT, -- JSON

  -- CONDITIONS
  eligibility_criteria TEXT, -- JSON
  exemption_conditions TEXT, -- JSON array

  -- BASE LÉGALE
  legal_reference TEXT,
  regulatory_text TEXT,
  applicable_law TEXT,

  -- Prix legacy (DEPRECATED - use tasa_expedicion/tasa_renovacion)
  currency TEXT DEFAULT 'XAF',
  urgent_amount REAL DEFAULT 0,

  -- Délais
  processing_time_days INTEGER,
  processing_time_text TEXT,
  urgent_processing_days INTEGER,

  -- Disponibilité
  is_online_available INTEGER DEFAULT 0,
  is_urgent_available INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,

  -- NEW: Flag for 60 services with default amount (Decision #2)
  is_amount_verified INTEGER DEFAULT 1, -- 0 = needs verification, 1 = verified

  -- Métadonnées
  popularity_score INTEGER DEFAULT 0,
  last_updated TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_service_id) REFERENCES fiscal_services(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_services_code ON fiscal_services(service_code);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_category ON fiscal_services(category_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_type ON fiscal_services(service_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_active ON fiscal_services(is_active);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_popularity ON fiscal_services(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_verified ON fiscal_services(is_amount_verified);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_calculation_method ON fiscal_services(calculation_method);

-- ============================================
-- 2. TABLES PROCEDURES & DOCUMENTS (NEW)
-- ============================================

-- Procedure Templates (NEW - from Supabase)
CREATE TABLE IF NOT EXISTS procedure_templates (
  id TEXT PRIMARY KEY,
  template_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  applies_to TEXT CHECK(applies_to IN ('expedition', 'renewal', 'both')),
  estimated_total_duration_minutes INTEGER,
  complexity_level TEXT CHECK(complexity_level IN ('simple', 'moderate', 'complex')),
  requires_appointment INTEGER DEFAULT 0,
  can_be_done_online INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_code ON procedure_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(is_active);

-- Procedure Template Steps (NEW - from Supabase)
CREATE TABLE IF NOT EXISTS procedure_template_steps (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  title_es TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  estimated_duration_minutes INTEGER,
  location_address TEXT,
  office_hours TEXT,
  additional_cost REAL DEFAULT 0,
  requires_documents TEXT, -- JSON array of document IDs
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (template_id) REFERENCES procedure_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_procedure_steps_template ON procedure_template_steps(template_id);

-- Service Procedure Assignments (NEW - from Supabase)
CREATE TABLE IF NOT EXISTS service_procedure_assignments (
  id TEXT PRIMARY KEY,
  fiscal_service_id TEXT NOT NULL,
  procedure_template_id TEXT NOT NULL,
  applies_to TEXT CHECK(applies_to IN ('expedition', 'renewal', 'both')),
  is_required INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  FOREIGN KEY (procedure_template_id) REFERENCES procedure_templates(id) ON DELETE CASCADE,
  UNIQUE(fiscal_service_id, procedure_template_id, applies_to)
);

CREATE INDEX IF NOT EXISTS idx_spa_service ON service_procedure_assignments(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_spa_template ON service_procedure_assignments(procedure_template_id);

-- Document Templates (NEW - from Supabase)
CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  document_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  document_type TEXT,
  is_mandatory INTEGER DEFAULT 1,
  accepts_digital_copy INTEGER DEFAULT 1,
  validity_period_months INTEGER,
  file_size_max_mb REAL,
  accepted_formats TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_document_templates_code ON document_templates(document_code);

-- Required Documents (relation service → document)
CREATE TABLE IF NOT EXISTS required_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fiscal_service_id TEXT NOT NULL,
  document_template_id TEXT NOT NULL,
  applies_to TEXT CHECK(applies_to IN ('expedition', 'renewal', 'both')),
  is_mandatory INTEGER DEFAULT 1,
  quantity INTEGER DEFAULT 1,
  notes_es TEXT,
  notes_fr TEXT,
  notes_en TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  FOREIGN KEY (document_template_id) REFERENCES document_templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_required_docs_service ON required_documents(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_required_docs_template ON required_documents(document_template_id);

-- ============================================
-- 3. TABLES UTILISATEUR
-- ============================================

-- Favoris utilisateur
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  fiscal_service_id TEXT NOT NULL,
  notes TEXT,
  tags TEXT, -- JSON array
  added_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  sync_timestamp TEXT,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  UNIQUE(user_id, fiscal_service_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_synced ON user_favorites(synced);

-- Historique des calculs
CREATE TABLE IF NOT EXISTS calculations_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  fiscal_service_id TEXT NOT NULL,
  calculation_method TEXT NOT NULL, -- NEW: Store method used
  calculation_base REAL NOT NULL,
  calculated_amount REAL NOT NULL,
  payment_type TEXT CHECK(payment_type IN ('expedition', 'renewal')),
  input_parameters TEXT, -- JSON: all inputs used
  breakdown TEXT, -- JSON: detailed calculation breakdown
  calculated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calculations_user ON calculations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_date ON calculations_history(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_synced ON calculations_history(synced);
CREATE INDEX IF NOT EXISTS idx_calculations_method ON calculations_history(calculation_method);

-- Mots-clés des services (recherche)
CREATE TABLE IF NOT EXISTS service_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fiscal_service_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  language_code TEXT NOT NULL CHECK(language_code IN ('es', 'fr', 'en')),
  weight INTEGER DEFAULT 1,
  is_auto_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  UNIQUE(fiscal_service_id, keyword, language_code)
);

CREATE INDEX IF NOT EXISTS idx_keywords_service ON service_keywords(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON service_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_language ON service_keywords(language_code);

-- ============================================
-- 4. TABLES CACHE & SYNC
-- ============================================

-- Queue de synchronisation
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_queue_operation ON sync_queue(operation);

-- Métadonnées de synchronisation
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert initial sync metadata
INSERT OR IGNORE INTO sync_metadata (key, value) VALUES
  ('last_full_sync', NULL),
  ('last_favorites_sync', NULL),
  ('last_calculations_sync', NULL),
  ('database_version', '2.0.0'),
  ('schema_aligned_with_supabase', 'true'),
  ('migration_date', datetime('now'));

-- Cache des recherches populaires
CREATE TABLE IF NOT EXISTS search_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL UNIQUE,
  results TEXT NOT NULL, -- JSON array of service IDs
  result_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 1,
  last_searched TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_search_cache_count ON search_cache(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- ============================================
-- 5. FULL-TEXT SEARCH (FTS5) - DISABLED FOR MVP1
-- ============================================
-- NOTE: FTS5 not available in react-native-sqlite-storage by default
-- Will use LIKE queries for search in MVP1
-- TODO: Enable FTS5 in future versions or use alternative search

-- ============================================
-- 6. CHATBOT FAQ (MVP1 - Offline)
-- ============================================

-- Table FAQ pour chatbot local stateless
CREATE TABLE IF NOT EXISTS chatbot_faq (
  id TEXT PRIMARY KEY,
  question_pattern TEXT NOT NULL, -- Regex pattern pour détecter l'intention
  intent TEXT NOT NULL, -- get_price, get_procedure, get_documents, greeting, thanks, etc.
  response_es TEXT NOT NULL,
  response_fr TEXT,
  response_en TEXT,
  follow_up_suggestions TEXT, -- JSON array: ["¿Cuánto cuesta?", "¿Qué documentos necesito?"]
  actions TEXT, -- JSON: {type: 'navigate', screen: 'Calculator', params: {...}}
  keywords TEXT NOT NULL, -- JSON array pour FTS5: ["precio", "coste", "cuánto", "cuesta"]
  priority INTEGER DEFAULT 0, -- Pour ordonner les réponses en cas de match multiple
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_faq_intent ON chatbot_faq(intent);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_active ON chatbot_faq(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_priority ON chatbot_faq(priority DESC);

-- Table FTS5 disabled for MVP1 (FTS5 not available in react-native-sqlite-storage)
-- Will use regex pattern matching instead

-- ============================================
-- 7. VUES UTILITAIRES
-- ============================================

-- Vue complète services avec hiérarchie
CREATE VIEW IF NOT EXISTS v_fiscal_services_complete AS
SELECT
  fs.*,
  c.name_es as category_name,
  c.name_fr as category_name_fr,
  c.name_en as category_name_en,
  s.name_es as sector_name,
  s.name_fr as sector_name_fr,
  s.name_en as sector_name_en,
  m.name_es as ministry_name,
  m.name_fr as ministry_name_fr,
  m.name_en as ministry_name_en,
  m.ministry_code,
  m.color as ministry_color
FROM fiscal_services fs
LEFT JOIN categories c ON fs.category_id = c.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON s.ministry_id = m.id;

-- Vue services populaires
CREATE VIEW IF NOT EXISTS v_popular_services AS
SELECT * FROM fiscal_services
WHERE is_active = 1
ORDER BY popularity_score DESC
LIMIT 20;

-- Vue services non vérifiés (Decision #2 - Disclaimer UI)
CREATE VIEW IF NOT EXISTS v_unverified_services AS
SELECT * FROM fiscal_services
WHERE is_amount_verified = 0
ORDER BY service_code;

-- Vue favoris utilisateur avec détails
CREATE VIEW IF NOT EXISTS v_user_favorites_detail AS
SELECT
  uf.*,
  fs.name_es,
  fs.name_fr,
  fs.name_en,
  fs.service_type,
  fs.tasa_expedicion,
  fs.tasa_renovacion,
  fs.is_amount_verified,
  m.name_es as ministry_name
FROM user_favorites uf
LEFT JOIN fiscal_services fs ON uf.fiscal_service_id = fs.id
LEFT JOIN categories c ON fs.category_id = c.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON s.ministry_id = m.id;

-- Vue procédures par service
CREATE VIEW IF NOT EXISTS v_service_procedures AS
SELECT
  spa.fiscal_service_id,
  spa.applies_to,
  pt.template_code,
  pt.name_es as procedure_name,
  pt.estimated_total_duration_minutes,
  pt.complexity_level,
  COUNT(pts.id) as steps_count
FROM service_procedure_assignments spa
LEFT JOIN procedure_templates pt ON spa.procedure_template_id = pt.id
LEFT JOIN procedure_template_steps pts ON pt.id = pts.template_id
GROUP BY spa.fiscal_service_id, spa.applies_to, pt.id;

-- Vue documents requis par service
CREATE VIEW IF NOT EXISTS v_service_documents AS
SELECT
  rd.fiscal_service_id,
  rd.applies_to,
  dt.document_code,
  dt.name_es as document_name,
  dt.is_mandatory,
  rd.quantity
FROM required_documents rd
LEFT JOIN document_templates dt ON rd.document_template_id = dt.id
ORDER BY rd.order_index;
`;

// ============================================
// QUERIES UTILITAIRES (UPDATED)
// ============================================

export const QUERIES = {
  // Obtenir tous les ministères actifs
  getActiveMinistries: `
    SELECT * FROM ministries
    WHERE is_active = 1
    ORDER BY order_index, name_es
  `,

  // Recherche simple (LIKE) - FTS5 disabled for MVP1
  searchServices: `
    SELECT * FROM fiscal_services
    WHERE is_active = 1
    AND (
      name_es LIKE ? OR
      name_fr LIKE ? OR
      name_en LIKE ? OR
      service_code LIKE ?
    )
    ORDER BY popularity_score DESC
    LIMIT ?
  `,

  // Services par catégorie
  getServicesByCategory: `
    SELECT * FROM v_fiscal_services_complete
    WHERE category_id = ? AND is_active = 1
    ORDER BY name_es
  `,

  // Services populaires
  getPopularServices: `
    SELECT * FROM v_popular_services
  `,

  // Services non vérifiés (NEW - for Decision #2 disclaimer)
  getUnverifiedServices: `
    SELECT * FROM v_unverified_services
  `,

  // Service detail with all info (NEW)
  getServiceDetail: `
    SELECT * FROM v_fiscal_services_complete
    WHERE id = ? OR service_code = ?
    LIMIT 1
  `,

  // Procédures d'un service (NEW)
  getServiceProcedures: `
    SELECT
      pt.*,
      spa.applies_to
    FROM service_procedure_assignments spa
    JOIN procedure_templates pt ON spa.procedure_template_id = pt.id
    WHERE spa.fiscal_service_id = ?
    ORDER BY pt.template_code
  `,

  // Étapes d'une procédure (NEW)
  getProcedureSteps: `
    SELECT * FROM procedure_template_steps
    WHERE template_id = ?
    ORDER BY step_number
  `,

  // Documents requis d'un service (NEW)
  getServiceDocuments: `
    SELECT
      dt.*,
      rd.applies_to,
      rd.is_mandatory,
      rd.quantity,
      rd.notes_es,
      rd.notes_fr,
      rd.notes_en
    FROM required_documents rd
    JOIN document_templates dt ON rd.document_template_id = dt.id
    WHERE rd.fiscal_service_id = ?
    ORDER BY rd.order_index
  `,

  // Favoris utilisateur
  getUserFavorites: `
    SELECT * FROM v_user_favorites_detail
    WHERE user_id = ?
    ORDER BY added_at DESC
  `,

  // Historique calculs (UPDATED with calculation_method)
  getCalculationsHistory: `
    SELECT
      ch.*,
      fs.name_es as service_name,
      fs.service_code,
      fs.calculation_method
    FROM calculations_history ch
    JOIN fiscal_services fs ON ch.fiscal_service_id = fs.id
    WHERE ch.user_id = ?
    ORDER BY ch.calculated_at DESC
    LIMIT ?
  `,

  // Queue de sync non traitée
  getPendingSyncQueue: `
    SELECT * FROM sync_queue
    WHERE retry_count < 5
    ORDER BY created_at ASC
  `,

  // Vérifier si favoris existe
  checkFavoriteExists: `
    SELECT 1 FROM user_favorites
    WHERE user_id = ? AND fiscal_service_id = ?
    LIMIT 1
  `,

  // NEW: Check if service amount is verified
  isServiceAmountVerified: `
    SELECT is_amount_verified FROM fiscal_services
    WHERE id = ? OR service_code = ?
    LIMIT 1
  `,

  // NEW v3: Chatbot FAQ queries (using LIKE instead of FTS5)
  searchChatbotFAQ: `
    SELECT * FROM chatbot_faq
    WHERE is_active = 1
    AND (
      keywords LIKE ? OR
      response_es LIKE ? OR
      response_fr LIKE ? OR
      response_en LIKE ?
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

  getAllActiveChatbotFAQ: `
    SELECT * FROM chatbot_faq
    WHERE is_active = 1
    ORDER BY intent, priority DESC
  `,
};

// ============================================
// CONSTANTES
// ============================================

export const TABLE_NAMES = {
  MINISTRIES: 'ministries',
  SECTORS: 'sectors',
  CATEGORIES: 'categories',
  FISCAL_SERVICES: 'fiscal_services',
  PROCEDURE_TEMPLATES: 'procedure_templates', // NEW
  PROCEDURE_TEMPLATE_STEPS: 'procedure_template_steps', // NEW
  SERVICE_PROCEDURE_ASSIGNMENTS: 'service_procedure_assignments', // NEW
  DOCUMENT_TEMPLATES: 'document_templates', // NEW
  REQUIRED_DOCUMENTS: 'required_documents',
  SERVICE_KEYWORDS: 'service_keywords',
  USER_FAVORITES: 'user_favorites',
  CALCULATIONS_HISTORY: 'calculations_history',
  SYNC_QUEUE: 'sync_queue',
  SYNC_METADATA: 'sync_metadata',
  SEARCH_CACHE: 'search_cache',
  CHATBOT_FAQ: 'chatbot_faq', // NEW v3: FAQ chatbot
} as const;

export const SYNC_STATUS = {
  PENDING: 0,
  SYNCED: 1,
  ERROR: -1,
} as const;

export const CALCULATION_METHODS = {
  FIXED_EXPEDITION: 'fixed_expedition',
  FIXED_RENEWAL: 'fixed_renewal',
  FIXED_BOTH: 'fixed_both',
  PERCENTAGE_BASED: 'percentage_based',
  UNIT_BASED: 'unit_based',
  TIERED_RATES: 'tiered_rates',
  FORMULA_BASED: 'formula_based',
  FIXED_PLUS_UNIT: 'fixed_plus_unit',
} as const;

export const SERVICE_TYPES = {
  DOCUMENT_PROCESSING: 'document_processing',
  LICENSE_PERMIT: 'license_permit',
  RESIDENCE_PERMIT: 'residence_permit',
  REGISTRATION_FEE: 'registration_fee',
  INSPECTION_FEE: 'inspection_fee',
  ADMINISTRATIVE_TAX: 'administrative_tax',
  CUSTOMS_DUTY: 'customs_duty',
  DECLARATION_TAX: 'declaration_tax',
} as const;

export const MAX_SEARCH_CACHE_AGE_HOURS = 24;
export const MAX_SYNC_RETRIES = 5;

// ============================================
// MIGRATION HELPERS
// ============================================

export const MIGRATION_QUERIES = {
  // Check if old schema exists (v1.0.0)
  checkOldSchema: `
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='fiscal_services'
    LIMIT 1
  `,

  // Check if old columns exist
  checkOldColumn: `
    SELECT COUNT(*) as count FROM pragma_table_info('fiscal_services')
    WHERE name='expedition_amount'
  `,

  // Migration info
  getMigrationInfo: `
    SELECT value FROM sync_metadata
    WHERE key='database_version'
  `,
};

/**
 * Migration notes:
 * - v1.0.0 → v2.0.0: Schema alignment with Supabase
 * - Old column names preserved as comments for reference
 * - New tables added: procedure_templates, procedure_template_steps,
 *   service_procedure_assignments, document_templates
 * - New flag: is_amount_verified for disclaimer UI (Decision #2)
 */
