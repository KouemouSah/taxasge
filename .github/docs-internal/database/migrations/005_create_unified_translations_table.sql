-- ============================================================================================================
-- Migration 005: Create Unified Translations Table
-- ============================================================================================================
-- Description: Table unifiée pour TOUTES les traductions du système (ENUMs, UI, Forms, Messages)
-- Version: 2.1
-- Date: 2025-01-12
-- Remplace: entity_translations + enum_translations (anciennes tables fragmentées)
-- ============================================================================================================

BEGIN;

-- ============================================================================================================
-- DROP OLD TABLES (si migration depuis ancien système)
-- ============================================================================================================
-- Décommenter si vous voulez migrer complètement vers la nouvelle structure:
-- DROP TABLE IF EXISTS enum_translations CASCADE;
-- DROP TABLE IF EXISTS entity_translations CASCADE;

-- ============================================================================================================
-- CREATE MAIN TRANSLATIONS TABLE
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS translations (
    id BIGSERIAL PRIMARY KEY,

    -- Clés d'identification
    category VARCHAR(50) NOT NULL,          -- 'enum', 'ui.menu', 'ui.button', 'form.label', 'system.message', etc.
    key_code VARCHAR(255) NOT NULL,         -- Code unique de la clé (ex: 'user_role.citizen', 'dashboard', 'save')
    context VARCHAR(100),                   -- Contexte additionnel (ex: 'user_role_enum', 'navigation', 'payment')

    -- Traductions (3 langues)
    es TEXT NOT NULL,                       -- Espagnol (langue par défaut GQ)
    fr TEXT NOT NULL,                       -- Français (langue officielle GQ)
    en TEXT NOT NULL,                       -- Anglais (langue internationale)

    -- Métadonnées
    description TEXT,                       -- Description/note pour traducteurs
    translation_source VARCHAR(50) DEFAULT 'manual',  -- 'manual', 'import', 'ai_generated'

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Version control
    version INTEGER DEFAULT 1,

    -- Constraints
    CONSTRAINT unique_translation_key UNIQUE (category, key_code, context)
);

-- ============================================================================================================
-- INDEXES (Performance optimale pour lookups fréquents)
-- ============================================================================================================

CREATE INDEX IF NOT EXISTS idx_translations_category ON translations(category);
CREATE INDEX IF NOT EXISTS idx_translations_key_code ON translations(key_code);
CREATE INDEX IF NOT EXISTS idx_translations_category_key ON translations(category, key_code);
CREATE INDEX IF NOT EXISTS idx_translations_context ON translations(context) WHERE context IS NOT NULL;

-- Full-text search (GIN index pour recherche rapide dans traductions)
CREATE INDEX IF NOT EXISTS idx_translations_es_gin ON translations USING gin(to_tsvector('spanish', es));
CREATE INDEX IF NOT EXISTS idx_translations_fr_gin ON translations USING gin(to_tsvector('french', fr));
CREATE INDEX IF NOT EXISTS idx_translations_en_gin ON translations USING gin(to_tsvector('english', en));

-- ============================================================================================================
-- COMMENTS (Documentation)
-- ============================================================================================================

COMMENT ON TABLE translations IS 'Table unifiée pour toutes les traductions du système (ENUMs, UI, Forms, Messages système)';
COMMENT ON COLUMN translations.category IS 'Catégorie: enum, ui.menu, ui.button, form.label, system.message, fiscal.period, etc.';
COMMENT ON COLUMN translations.key_code IS 'Code unique identifiant la traduction (ex: user_role.citizen, dashboard, save)';
COMMENT ON COLUMN translations.context IS 'Contexte additionnel optionnel (ex: user_role_enum, navigation, payment)';
COMMENT ON COLUMN translations.es IS 'Traduction Espagnol (langue par défaut Guinée Équatoriale)';
COMMENT ON COLUMN translations.fr IS 'Traduction Français (langue officielle Guinée Équatoriale)';
COMMENT ON COLUMN translations.en IS 'Traduction Anglais (langue internationale)';
COMMENT ON COLUMN translations.translation_source IS 'Source: manual, import, ai_generated';

-- ============================================================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================================================

CREATE OR REPLACE FUNCTION update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_translations_updated_at
    BEFORE UPDATE ON translations
    FOR EACH ROW
    EXECUTE FUNCTION update_translations_updated_at();

-- ============================================================================================================
-- HELPER FUNCTIONS (Fonctions utilitaires pour récupération traductions)
-- ============================================================================================================

-- Fonction: get_translation(category, key, lang, fallback)
-- Récupère une traduction avec fallback automatique (ES → FR → EN)
CREATE OR REPLACE FUNCTION get_translation(
    p_category VARCHAR,
    p_key_code VARCHAR,
    p_lang VARCHAR DEFAULT 'es',
    p_context VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
BEGIN
    -- Essayer la langue demandée
    EXECUTE format('SELECT %I FROM translations WHERE category = $1 AND key_code = $2 AND ($3 IS NULL OR context = $3)',
                   p_lang)
    INTO v_translation
    USING p_category, p_key_code, p_context;

    -- Fallback ES si pas trouvé
    IF v_translation IS NULL THEN
        SELECT es INTO v_translation
        FROM translations
        WHERE category = p_category
          AND key_code = p_key_code
          AND (p_context IS NULL OR context = p_context);
    END IF;

    -- Fallback ultime: retourner key_code
    RETURN COALESCE(v_translation, p_key_code);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_translation IS 'Récupère une traduction avec fallback automatique ES → FR → EN → key_code';

-- ============================================================================================================
-- MATERIALIZED VIEW: translations_export (Pour génération fichiers JSON frontend)
-- ============================================================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS translations_export AS
SELECT
    category,
    key_code,
    context,
    jsonb_build_object(
        'es', es,
        'fr', fr,
        'en', en
    ) as translations,
    updated_at
FROM translations
ORDER BY category, key_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_export_key ON translations_export(category, key_code);

COMMENT ON MATERIALIZED VIEW translations_export IS 'Vue exportable pour générer fichiers JSON i18n frontend';

-- ============================================================================================================
-- GRANTS (Permissions)
-- ============================================================================================================

GRANT SELECT ON translations TO authenticated, service_role;
GRANT SELECT ON translations_export TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON translations TO service_role; -- Seuls admins peuvent modifier
GRANT USAGE, SELECT ON SEQUENCE translations_id_seq TO service_role;

COMMIT;

-- ============================================================================================================
-- NOTES D'UTILISATION
-- ============================================================================================================
--
-- 1. INSERT traduction:
--    INSERT INTO translations (category, key_code, context, es, fr, en)
--    VALUES ('ui.button', 'save', 'action', 'Guardar', 'Enregistrer', 'Save');
--
-- 2. GET traduction (avec fallback):
--    SELECT get_translation('ui.button', 'save', 'fr'); → 'Enregistrer'
--    SELECT get_translation('ui.button', 'unknown_key', 'fr'); → 'unknown_key' (fallback)
--
-- 3. EXPORT pour frontend:
--    REFRESH MATERIALIZED VIEW translations_export;
--    COPY (SELECT * FROM translations_export) TO '/tmp/translations.json' WITH (FORMAT csv);
--
-- 4. FULL-TEXT SEARCH:
--    SELECT * FROM translations WHERE to_tsvector('spanish', es) @@ to_tsquery('spanish', 'ciudadano');
--
-- ============================================================================================================
