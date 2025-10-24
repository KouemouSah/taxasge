-- ============================================
-- MIGRATION: Créer table entity_translations
-- TaxasGE v3.4.1
-- Date: 2025-10-10
-- ============================================

-- CONTEXTE:
-- La table translation_status stocke seulement le STATUT (missing/available/outdated)
-- Il nous faut une table séparée pour stocker le CONTENU des traductions

BEGIN;

-- ============================================
-- TABLE: entity_translations
-- ============================================

CREATE TABLE IF NOT EXISTS entity_translations (
    id SERIAL PRIMARY KEY,

    -- Référence soft (pas de FK pour flexibilité)
    entity_type VARCHAR(50) NOT NULL,     -- 'ministry', 'sector', 'category', 'fiscal_service', 'procedure', 'document'
    entity_code VARCHAR(255) NOT NULL,    -- Code business ou composite key
                                           -- Examples:
                                           --   - Ministry: 'M-001'
                                           --   - Service: 'T-001'
                                           --   - Procedure: 'T-001:step_1' (composite key)
                                           --   - Document: 'T-001'

    -- Traduction
    language_code VARCHAR(5) NOT NULL,    -- 'fr', 'en' (pas 'es' car en colonnes DB)
    field_name VARCHAR(100) NOT NULL,     -- 'name', 'description', 'instructions'
    translation_text TEXT NOT NULL,       -- Contenu traduit

    -- Métadonnées
    translation_source VARCHAR(50),       -- 'manual', 'auto', 'import', 'ai'
    quality_score DECIMAL(3,2),           -- 0.00-1.00 (optionnel)
    translator_notes TEXT,                -- Notes du traducteur

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER,                   -- user_id (optionnel)
    updated_by INTEGER,                   -- user_id (optionnel)

    -- Contrainte unicité
    UNIQUE(entity_type, entity_code, language_code, field_name)
);

-- ============================================
-- INDEX PERFORMANCE
-- ============================================

-- Index principal pour lookup rapide
CREATE INDEX idx_entity_translations_lookup
ON entity_translations(entity_type, entity_code, language_code, field_name);

-- Index pour recherche par langue
CREATE INDEX idx_entity_translations_language
ON entity_translations(language_code, entity_type);

-- Index pour audit
CREATE INDEX idx_entity_translations_audit
ON entity_translations(entity_type, created_at DESC);

-- ============================================
-- TRIGGER AUTO-UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_entity_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entity_translations_updated_at
    BEFORE UPDATE ON entity_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_translations_updated_at();

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE entity_translations IS 'Stockage du contenu des traductions FR/EN (ES en colonnes DB)';
COMMENT ON COLUMN entity_translations.entity_code IS 'Code business ou composite key (ex: T-001:step_1 pour procedures)';
COMMENT ON COLUMN entity_translations.translation_text IS 'Contenu traduit (TEXT pour textes longs)';
COMMENT ON COLUMN entity_translations.quality_score IS 'Score qualité traduction 0-1 (optionnel pour priorisation révision)';

COMMIT;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Test insertion
INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source)
VALUES ('ministry', 'M-001', 'fr', 'name', 'Test', 'manual')
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

-- Vérification
SELECT
    COUNT(*) as total,
    entity_type,
    language_code
FROM entity_translations
GROUP BY entity_type, language_code;

-- Cleanup test
DELETE FROM entity_translations WHERE translation_text = 'Test';

-- ============================================
-- USAGE: Récupérer traductions
-- ============================================

-- Exemple: Service avec procedures
/*
SELECT
  sp.id,
  fs.service_code,
  sp.step_number,
  sp.description_es,
  t_fr.translation_text as description_fr,
  t_en.translation_text as description_en
FROM service_procedures sp
JOIN fiscal_services fs ON sp.fiscal_service_id = fs.id
LEFT JOIN entity_translations t_fr ON (
    t_fr.entity_code = fs.service_code || ':step_' || sp.step_number
    AND t_fr.entity_type = 'procedure'
    AND t_fr.language_code = 'fr'
    AND t_fr.field_name = 'description'
)
LEFT JOIN entity_translations t_en ON (
    t_en.entity_code = fs.service_code || ':step_' || sp.step_number
    AND t_en.entity_type = 'procedure'
    AND t_en.language_code = 'en'
    AND t_en.field_name = 'description'
)
WHERE fs.service_code = 'T-001'
ORDER BY sp.step_number;
*/
