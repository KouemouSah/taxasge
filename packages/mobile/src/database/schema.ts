/**
 * TaxasGE Mobile - SQLite Schema
 * Version: 1.0.0
 * Description: Schema optimisé pour mode offline-first avec sync Supabase
 *
 * Architecture:
 * - Tables principales (fiscal_services, ministries, categories)
 * - Tables utilisateur (favorites, calculations_history)
 * - Tables cache (translations, sync_queue)
 */

export const DATABASE_NAME = 'taxasge.db';
export const DATABASE_VERSION = 1;

// ============================================
// SCHEMA SQL COMPLET
// ============================================

export const SCHEMA_SQL = `
-- ============================================
-- 1. TABLES RÉFÉRENCE (données fiscales)
-- ============================================

-- Ministères
CREATE TABLE IF NOT EXISTS ministries (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_ministries_code ON ministries(code);
CREATE INDEX IF NOT EXISTS idx_ministries_active ON ministries(is_active);

-- Secteurs
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  ministry_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  icon_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sectors_ministry ON sectors(ministry_id);
CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(code);

-- Catégories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  sector_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_sector ON categories(sector_id);

-- Services fiscaux (table principale)
CREATE TABLE IF NOT EXISTS fiscal_services (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category_id TEXT,
  name_es TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  description_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  service_type TEXT CHECK(service_type IN ('license', 'certificate', 'registration', 'permit', 'declaration', 'other')),

  -- Prix
  expedition_amount REAL DEFAULT 0,
  renewal_amount REAL DEFAULT 0,
  urgent_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'XAF',

  -- Délais
  processing_time_days INTEGER,
  processing_time_text TEXT,
  urgent_processing_days INTEGER,

  -- Disponibilité
  is_online_available INTEGER DEFAULT 0,
  is_urgent_available INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,

  -- Métadonnées
  popularity_score INTEGER DEFAULT 0,
  last_updated TEXT,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fiscal_services_code ON fiscal_services(code);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_category ON fiscal_services(category_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_type ON fiscal_services(service_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_active ON fiscal_services(is_active);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_popularity ON fiscal_services(popularity_score DESC);

-- ============================================
-- 2. TABLES UTILISATEUR
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
  calculation_base REAL NOT NULL,
  calculated_amount REAL NOT NULL,
  payment_type TEXT,
  parameters TEXT, -- JSON
  breakdown TEXT, -- JSON
  calculated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calculations_user ON calculations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_date ON calculations_history(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_synced ON calculations_history(synced);

-- Documents requis (référence)
CREATE TABLE IF NOT EXISTS required_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fiscal_service_id TEXT NOT NULL,
  document_name_es TEXT NOT NULL,
  document_name_fr TEXT,
  document_name_en TEXT,
  description_es TEXT,
  is_mandatory INTEGER DEFAULT 1,
  document_type TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_service ON required_documents(fiscal_service_id);

-- ============================================
-- 3. TABLES CACHE & SYNC
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
  ('database_version', '1.0.0');

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
-- 4. FULL-TEXT SEARCH (FTS5)
-- ============================================

-- Table de recherche plein texte
CREATE VIRTUAL TABLE IF NOT EXISTS fiscal_services_fts USING fts5(
  id UNINDEXED,
  code,
  name_es,
  name_fr,
  name_en,
  description_es,
  category_name,
  ministry_name,
  content=fiscal_services,
  content_rowid=rowid
);

-- Triggers pour maintenir FTS à jour
CREATE TRIGGER IF NOT EXISTS fiscal_services_ai AFTER INSERT ON fiscal_services BEGIN
  INSERT INTO fiscal_services_fts(rowid, id, code, name_es, name_fr, name_en, description_es)
  VALUES (new.rowid, new.id, new.code, new.name_es, new.name_fr, new.name_en, new.description_es);
END;

CREATE TRIGGER IF NOT EXISTS fiscal_services_ad AFTER DELETE ON fiscal_services BEGIN
  DELETE FROM fiscal_services_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS fiscal_services_au AFTER UPDATE ON fiscal_services BEGIN
  UPDATE fiscal_services_fts
  SET code = new.code,
      name_es = new.name_es,
      name_fr = new.name_fr,
      name_en = new.name_en,
      description_es = new.description_es
  WHERE rowid = old.rowid;
END;

-- ============================================
-- 5. VUES UTILITAIRES
-- ============================================

-- Vue complète services avec hiérarchie
CREATE VIEW IF NOT EXISTS v_fiscal_services_complete AS
SELECT
  fs.*,
  c.name_es as category_name,
  c.name_fr as category_name_fr,
  s.name_es as sector_name,
  m.name_es as ministry_name,
  m.code as ministry_code,
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

-- Vue favoris utilisateur avec détails
CREATE VIEW IF NOT EXISTS v_user_favorites_detail AS
SELECT
  uf.*,
  fs.name_es,
  fs.name_fr,
  fs.service_type,
  fs.expedition_amount,
  m.name_es as ministry_name
FROM user_favorites uf
LEFT JOIN fiscal_services fs ON uf.fiscal_service_id = fs.id
LEFT JOIN categories c ON fs.category_id = c.id
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON s.ministry_id = m.id;
`;

// ============================================
// QUERIES UTILITAIRES
// ============================================

export const QUERIES = {
  // Obtenir tous les ministères actifs
  getActiveMinistries: `
    SELECT * FROM ministries
    WHERE is_active = 1
    ORDER BY order_index, name_es
  `,

  // Recherche full-text
  searchServices: `
    SELECT fs.*
    FROM fiscal_services_fts fts
    JOIN fiscal_services fs ON fts.id = fs.id
    WHERE fiscal_services_fts MATCH ?
    AND fs.is_active = 1
    ORDER BY rank
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

  // Favoris utilisateur
  getUserFavorites: `
    SELECT * FROM v_user_favorites_detail
    WHERE user_id = ?
    ORDER BY added_at DESC
  `,

  // Historique calculs
  getCalculationsHistory: `
    SELECT
      ch.*,
      fs.name_es as service_name,
      fs.code as service_code
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
};

// ============================================
// CONSTANTES
// ============================================

export const TABLE_NAMES = {
  MINISTRIES: 'ministries',
  SECTORS: 'sectors',
  CATEGORIES: 'categories',
  FISCAL_SERVICES: 'fiscal_services',
  USER_FAVORITES: 'user_favorites',
  CALCULATIONS_HISTORY: 'calculations_history',
  REQUIRED_DOCUMENTS: 'required_documents',
  SYNC_QUEUE: 'sync_queue',
  SYNC_METADATA: 'sync_metadata',
  SEARCH_CACHE: 'search_cache',
} as const;

export const SYNC_STATUS = {
  PENDING: 0,
  SYNCED: 1,
  ERROR: -1,
} as const;

export const MAX_SEARCH_CACHE_AGE_HOURS = 24;
export const MAX_SYNC_RETRIES = 5;
