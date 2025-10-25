-- ============================================
-- 7. i18n OPTIMISÉE (v4.2 - ARCHITECTURE FINALE)
-- ============================================
-- Version: 4.2 (2025-01-12)
-- Changes from v4.1:
--   - SUPPRIMÉ: enum_translations (redondante avec translations unifiée)
--   - CONSERVÉ: entity_translations (usage distinct: entités métier)
--   - AJOUTÉ: Note sur table translations (voir migrations/005_*.sql)
--
-- Architecture finale:
--   1. Table: translations (migrations/005_*.sql)
--      → ENUMs + UI + Formulaires + Messages + TOUT
--   2. Table: entity_translations (ci-dessous)
--      → Entités métier UNIQUEMENT (ministries, services, documents, procedures)
-- ============================================

-- ============================================
-- 7.1 Entity Translations (Entités métier)
-- ============================================
-- Usage: Traduire les entités métier (ministries, sectors, categories, services, documents, procedures)
-- Note: Les ENUMs sont gérés par la table "translations" (voir migrations/005_*.sql)
--
-- translatable_entity_type values (défini dans schema_taxage2.sql ligne 181):
--   • ministry           → Ministries (M-001, M-002, etc.)
--   • sector             → Sectors (S-001, S-002, etc.)
--   • category           → Service Categories (C-001, C-002, etc.)
--   • service            → Fiscal Services (code unique)
--   • procedure_template → Procedure Templates
--   • procedure_step     → Procedure Steps
--   • document_template  → Document Templates

CREATE TABLE IF NOT EXISTS entity_translations (
    entity_type translatable_entity_type NOT NULL,
    entity_code VARCHAR(100) NOT NULL,              -- SHORT: 'M-001', 'S-001', 'C-001', 'PAYMENT_STD', etc.
    language_code VARCHAR(5) NOT NULL CHECK (language_code IN ('fr', 'en')),
    field_name VARCHAR(30) NOT NULL CHECK (field_name IN ('name', 'description', 'instructions')),
    translation_text TEXT NOT NULL,

    -- Quality tracking (AI-ready)
    translation_source VARCHAR(20) DEFAULT 'manual' CHECK (translation_source IN ('manual', 'import', 'ai', 'google_translate')),
    translation_quality DECIMAL(3,2) CHECK (translation_quality BETWEEN 0 AND 1),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (entity_type, entity_code, language_code, field_name)
);

COMMENT ON TABLE entity_translations IS
'Traductions des entités métier (ministries, services, documents, procedures).
Pour ENUMs et UI: voir table "translations" (migrations/005_*.sql)';

-- ============================================
-- 7.2 Service Keywords (multilingue natif)
-- ============================================

CREATE TABLE IF NOT EXISTS service_keywords (
    id SERIAL PRIMARY KEY,
    fiscal_service_id INTEGER NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('es', 'fr', 'en')),
    weight INTEGER DEFAULT 1,
    is_auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fiscal_service_id, keyword, language_code)
);

COMMENT ON TABLE service_keywords IS 'Mots-clés multilingues pour recherche de services fiscaux';

-- ============================================
-- 7.3 Indexes (Performance)
-- ============================================

-- Index pour entity_translations (lookup rapide)
-- Note: PRIMARY KEY couvre déjà (entity_type, entity_code, language_code, field_name)
-- Pas d'index additionnel nécessaire

-- Index pour service_keywords (recherche full-text)
CREATE INDEX IF NOT EXISTS idx_service_keywords_search
    ON service_keywords USING gin(to_tsvector('simple', keyword))
    WHERE language_code IN ('es', 'fr', 'en');

CREATE INDEX IF NOT EXISTS idx_service_keywords_service
    ON service_keywords(fiscal_service_id);

-- ============================================
-- 7.4 Fonctions Helper (Traductions)
-- ============================================

-- Fonction: get_entity_translation
-- Récupère la traduction d'une entité métier
CREATE OR REPLACE FUNCTION get_entity_translation(
    p_entity_type translatable_entity_type,
    p_entity_code VARCHAR,
    p_field_name VARCHAR DEFAULT 'name',
    p_language VARCHAR DEFAULT 'fr'
)
RETURNS TEXT AS $$
    SELECT translation_text
    FROM entity_translations
    WHERE entity_type = p_entity_type
      AND entity_code = p_entity_code
      AND field_name = p_field_name
      AND language_code = p_language;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_entity_translation IS
'Récupère traduction d''une entité métier (ministry, service, document, etc.)
Pour ENUMs: utiliser get_translation() de la table translations';

-- Fonction: get_translations (JSON agrégé)
-- Retourne toutes les traductions d'une entité en JSON
CREATE OR REPLACE FUNCTION get_translations(
    p_entity_type translatable_entity_type,
    p_entity_code VARCHAR(100),
    p_language_code VARCHAR(5)
)
RETURNS JSONB AS $$
    SELECT jsonb_object_agg(field_name, translation_text)
    FROM entity_translations
    WHERE entity_type = p_entity_type
      AND entity_code = p_entity_code
      AND language_code = p_language_code;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_translations IS
'Récupère toutes les traductions (name, description, instructions) d''une entité en JSON
Exemple: get_translations(''ministry'', ''T-001'', ''fr'') → {"name": "...", "description": "..."}';

-- ============================================
-- 7.5 Note sur table "translations" (unifiée)
-- ============================================

-- La table "translations" (ENUMs + UI + Formulaires + Messages) est créée dans:
--   → data/migrations/005_create_unified_translations_table.sql
--
-- Elle remplace l'ancienne table "enum_translations" (supprimée en v4.2)
--
-- Fonction: get_translation(category, key, language)
--   Exemple: get_translation('enum', 'payment_status.pending', 'fr') → "En Attente"
--
-- Voir documentation complète:
--   → .github/docs-internal/RAPPORT_TRADUCTIONS_v2.1.md
--   → data/i18n/README.md

-- ============================================
-- FIN SECTION i18n
-- ============================================
