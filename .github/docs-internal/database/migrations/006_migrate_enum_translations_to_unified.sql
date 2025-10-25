-- ============================================================================================================
-- Migration 006: Migrate enum_translations → translations (Unification)
-- ============================================================================================================
-- Description: Migre les traductions d'ENUMs de l'ancienne table vers la nouvelle table unifiée
-- Version: 2.1
-- Date: 2025-01-12
-- Dépendances: REQUIRES 005_create_unified_translations_table.sql
--
-- Strategy:
--   1. Migrer données enum_translations → translations (avec PIVOT ES/FR/EN)
--   2. Marquer enum_translations comme deprecated
--   3. Garder enum_translations temporairement (safety)
--   4. Future: DROP enum_translations après validation (dans 006b)
-- ============================================================================================================

BEGIN;

-- ============================================================================================================
-- STEP 1: Vérifier que la table translations existe
-- ============================================================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translations') THEN
        RAISE EXCEPTION 'Table translations does not exist. Run 005_create_unified_translations_table.sql first.';
    END IF;
END $$;

-- ============================================================================================================
-- STEP 2: Migrer données enum_translations → translations (PIVOT ES/FR/EN)
-- ============================================================================================================

-- Note: enum_translations stocke 1 row par langue (ES, FR, EN séparées)
--       translations stocke 1 row avec 3 colonnes (es, fr, en)
--       → Besoin d'un PIVOT

INSERT INTO translations (category, key_code, context, es, fr, en, description, translation_source, created_at)
SELECT
    'enum' as category,
    enum_type || '.' || enum_value as key_code,
    'migrated_from_enum_translations' as context,

    -- PIVOT: Agréger les 3 langues en colonnes
    MAX(CASE WHEN language_code = 'es' THEN translation ELSE NULL END) as es,
    MAX(CASE WHEN language_code = 'fr' THEN translation ELSE NULL END) as fr,
    MAX(CASE WHEN language_code = 'en' THEN translation ELSE NULL END) as en,

    MAX(context) as description,  -- Prendre contexte de l'ancienne table
    'import' as translation_source,
    MIN(created_at) as created_at

FROM enum_translations
WHERE is_active = true
GROUP BY enum_type, enum_value
HAVING
    -- S'assurer qu'on a AU MOINS ES (langue par défaut)
    MAX(CASE WHEN language_code = 'es' THEN translation END) IS NOT NULL

ON CONFLICT (category, key_code, context) DO UPDATE
SET
    es = EXCLUDED.es,
    fr = COALESCE(EXCLUDED.fr, translations.fr),  -- Garder existante si nouvelle NULL
    en = COALESCE(EXCLUDED.en, translations.en),
    updated_at = NOW();

-- ============================================================================================================
-- STEP 3: Ajouter colonne deprecated à enum_translations (marquer comme obsolète)
-- ============================================================================================================

ALTER TABLE enum_translations
    ADD COLUMN IF NOT EXISTS deprecated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS migration_notes TEXT;

-- Marquer toutes les rows comme deprecated
UPDATE enum_translations
SET
    deprecated = true,
    deprecated_at = NOW(),
    migration_notes = 'Migrated to unified translations table. Use translations table instead.'
WHERE deprecated = false OR deprecated IS NULL;

-- ============================================================================================================
-- STEP 4: Créer VIEW de compatibilité (pour code legacy)
-- ============================================================================================================
-- Cette VIEW permet au code ancien utilisant enum_translations de continuer à fonctionner
-- en lisant depuis la nouvelle table translations

CREATE OR REPLACE VIEW enum_translations_compat AS
SELECT
    ROW_NUMBER() OVER (ORDER BY category, key_code, lang) as id,
    REPLACE(key_code, category || '.', '') as enum_type,  -- Extraire enum_type de 'enum.payment_status'
    SPLIT_PART(key_code, '.', 2) as enum_value,           -- Extraire enum_value
    lang as language_code,
    translation_text as translation,
    context,
    true as is_active,
    created_at,
    updated_at
FROM (
    -- UNPIVOT: Transformer colonnes (es, fr, en) en rows
    SELECT category, key_code, context, created_at, updated_at, 'es' as lang, es as translation_text FROM translations WHERE category = 'enum'
    UNION ALL
    SELECT category, key_code, context, created_at, updated_at, 'fr' as lang, fr as translation_text FROM translations WHERE category = 'enum'
    UNION ALL
    SELECT category, key_code, context, created_at, updated_at, 'en' as lang, en as translation_text FROM translations WHERE category = 'enum'
) unpivoted
WHERE translation_text IS NOT NULL;

COMMENT ON VIEW enum_translations_compat IS 'Compatibility view for legacy code using enum_translations. Reads from unified translations table.';

-- ============================================================================================================
-- STEP 5: Créer fonction helper pour migration entity_translations
-- ============================================================================================================
-- Note: entity_translations reste séparée (pour ministries, services, documents, procedures)
--       MAIS on peut créer une fonction unifiée qui lit depuis les 2 tables

CREATE OR REPLACE FUNCTION get_entity_or_enum_translation(
    p_entity_type VARCHAR,
    p_entity_code VARCHAR,
    p_field_name VARCHAR DEFAULT 'name',
    p_language VARCHAR DEFAULT 'es'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
BEGIN
    -- Essayer d'abord entity_translations (entités métier)
    IF p_entity_type IN ('ministry', 'sector', 'category', 'service', 'document', 'procedure', 'step', 'template', 'notification', 'declaration_type') THEN
        SELECT translation_text INTO v_translation
        FROM entity_translations
        WHERE entity_type::text = p_entity_type
          AND entity_code = p_entity_code
          AND field_name = p_field_name
          AND language_code = p_language;

        IF v_translation IS NOT NULL THEN
            RETURN v_translation;
        END IF;
    END IF;

    -- Sinon, essayer translations (ENUMs + UI)
    RETURN get_translation('enum', p_entity_type || '.' || p_entity_code, p_language);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_entity_or_enum_translation IS 'Unified translation lookup: tries entity_translations first, then translations table';

-- ============================================================================================================
-- STEP 6: Rapport de migration
-- ============================================================================================================

DO $$
DECLARE
    v_old_count INTEGER;
    v_new_count INTEGER;
    v_migrated_count INTEGER;
BEGIN
    -- Compter anciennes traductions
    SELECT COUNT(DISTINCT (enum_type, enum_value)) INTO v_old_count
    FROM enum_translations
    WHERE is_active = true;

    -- Compter nouvelles traductions
    SELECT COUNT(*) INTO v_new_count
    FROM translations
    WHERE category = 'enum' AND context = 'migrated_from_enum_translations';

    -- Compter traductions migrées avec succès (avec les 3 langues)
    SELECT COUNT(*) INTO v_migrated_count
    FROM translations
    WHERE category = 'enum'
      AND context = 'migrated_from_enum_translations'
      AND es IS NOT NULL
      AND fr IS NOT NULL
      AND en IS NOT NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION REPORT: enum_translations → translations';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Old enum_translations entries: %', v_old_count;
    RAISE NOTICE 'New translations entries: %', v_new_count;
    RAISE NOTICE 'Fully migrated (ES+FR+EN): %', v_migrated_count;
    RAISE NOTICE 'Migration success rate: % %%', ROUND((v_migrated_count::FLOAT / v_old_count * 100), 2);
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Status: enum_translations marked as DEPRECATED';
    RAISE NOTICE 'Compatibility view: enum_translations_compat created';
    RAISE NOTICE 'Next step: Validate and run 006b_drop_enum_translations.sql';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================================================
-- VALIDATION QUERIES (à exécuter manuellement après migration)
-- ============================================================================================================

-- 1. Vérifier que toutes les traductions ont été migrées
/*
SELECT
    enum_type,
    enum_value,
    COUNT(DISTINCT language_code) as lang_count,
    STRING_AGG(language_code, ', ' ORDER BY language_code) as languages
FROM enum_translations
WHERE is_active = true
GROUP BY enum_type, enum_value
HAVING COUNT(DISTINCT language_code) < 3;  -- Trouver celles avec moins de 3 langues
*/

-- 2. Comparer anciennes vs nouvelles traductions
/*
SELECT
    'OLD' as source,
    enum_type || '.' || enum_value as key,
    language_code,
    translation
FROM enum_translations
WHERE enum_type = 'payment_status' AND enum_value = 'pending'

UNION ALL

SELECT
    'NEW' as source,
    key_code,
    'es' as language_code,
    es as translation
FROM translations
WHERE category = 'enum' AND key_code = 'payment_status.pending'

UNION ALL

SELECT
    'NEW' as source,
    key_code,
    'fr' as language_code,
    fr as translation
FROM translations
WHERE category = 'enum' AND key_code = 'payment_status.pending'

UNION ALL

SELECT
    'NEW' as source,
    key_code,
    'en' as language_code,
    en as translation
FROM translations
WHERE category = 'enum' AND key_code = 'payment_status.pending';
*/

-- 3. Tester la VIEW de compatibilité
/*
SELECT * FROM enum_translations_compat
WHERE enum_type = 'payment_status'
ORDER BY enum_value, language_code;
*/

-- 4. Tester fonction unifiée
/*
SELECT get_entity_or_enum_translation('payment_status', 'pending', 'name', 'fr');
-- Attendu: "En Attente"
*/

-- ============================================================================================================
-- NOTES IMPORTANTES
-- ============================================================================================================
--
-- ⚠️ NE PAS SUPPRIMER enum_translations IMMÉDIATEMENT
--
-- Raisons:
--   1. Validation nécessaire (comparer OLD vs NEW)
--   2. Code legacy peut encore référencer cette table
--   3. Rollback possible si problème détecté
--
-- Timeline suggérée:
--   - Semaine 1-2: Migration + Validation (ce fichier)
--   - Semaine 3-4: Tests exhaustifs en dev/staging
--   - Semaine 5-6: Déploiement production + Monitoring
--   - Semaine 7+: Si OK, exécuter 006b_drop_enum_translations.sql
--
-- Pour supprimer définitivement (APRÈS validation complète):
--   → Créer et exécuter: data/migrations/006b_drop_enum_translations.sql
--
-- ============================================================================================================
