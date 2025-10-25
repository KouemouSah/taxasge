-- ============================================================================================================
-- Migration 007: Cleanup Redundant Translations (Simplification)
-- ============================================================================================================
-- Description: Supprime enum_translations (redondante avec translations)
--              Garde entity_translations (usage distinct: entités métier)
-- Version: 2.1
-- Date: 2025-01-12
-- Dépendances: REQUIRES 005_create_unified_translations_table.sql
--
-- Context:
--   Puisque AUCUNE donnée n'a été chargée dans enum_translations,
--   on peut la supprimer directement sans migration de données.
--
-- Strategy:
--   1. Vérifier que enum_translations est VIDE
--   2. Supprimer table enum_translations + indexes
--   3. Modifier fonction get_translations() pour utiliser translations (nouvelle table)
--   4. Garder entity_translations (usage différent, pas de redondance)
-- ============================================================================================================

BEGIN;

-- ============================================================================================================
-- STEP 1: Vérifications de sécurité
-- ============================================================================================================

DO $$
DECLARE
    v_enum_count INTEGER;
    v_entity_count INTEGER;
BEGIN
    -- Vérifier que translations existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translations') THEN
        RAISE EXCEPTION 'Table translations does not exist. Run 005_create_unified_translations_table.sql first.';
    END IF;

    -- Compter données dans enum_translations
    SELECT COUNT(*) INTO v_enum_count FROM enum_translations;

    IF v_enum_count > 0 THEN
        RAISE WARNING 'enum_translations contains % rows. Aborting cleanup. Run migration 006 instead.', v_enum_count;
        RAISE EXCEPTION 'enum_translations is not empty. Cannot proceed with direct deletion.';
    END IF;

    -- Compter données dans entity_translations (juste info)
    SELECT COUNT(*) INTO v_entity_count FROM entity_translations;
    RAISE NOTICE 'entity_translations contains % rows (will be kept)', v_entity_count;
END $$;

-- ============================================================================================================
-- STEP 2: Supprimer enum_translations (table + indexes)
-- ============================================================================================================

-- Supprimer indexes
DROP INDEX IF EXISTS idx_enum_translations_lookup;

-- Supprimer table
DROP TABLE IF EXISTS enum_translations CASCADE;

-- ============================================================================================================
-- STEP 3: Modifier fonction get_translations() pour supporter les 2 systèmes
-- ============================================================================================================

-- Fonction existante: get_translations(entity_type, entity_code, language_code)
-- → Lit depuis entity_translations (entités métier)
-- On va créer une fonction UNIFIÉE qui lit depuis les 2 tables

CREATE OR REPLACE FUNCTION get_translation_unified(
    p_category VARCHAR,
    p_key VARCHAR,
    p_language VARCHAR DEFAULT 'es'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
    v_entity_type translatable_entity_type;
BEGIN
    -- Cas 1: Si category = 'enum' → Lire depuis translations
    IF p_category = 'enum' OR p_category LIKE 'ui.%' OR p_category LIKE 'form.%' OR p_category LIKE 'system.%' THEN
        -- Utiliser la fonction get_translation() de la table translations
        SELECT get_translation(p_category, p_key, p_language) INTO v_translation;
        RETURN v_translation;
    END IF;

    -- Cas 2: Si category = entity type → Lire depuis entity_translations
    BEGIN
        v_entity_type := p_category::translatable_entity_type;

        SELECT translation_text INTO v_translation
        FROM entity_translations
        WHERE entity_type = v_entity_type
          AND entity_code = p_key
          AND language_code = p_language
          AND field_name = 'name';  -- Par défaut, retourner le nom

        RETURN v_translation;
    EXCEPTION
        WHEN invalid_text_representation THEN
            -- p_category n'est pas un translatable_entity_type valide
            RETURN NULL;
    END;

    -- Fallback
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_translation_unified IS
'Fonction unifiée de traduction:
 - ENUMs, UI, Forms, Messages → translations table
 - Entités métier (ministries, services, etc.) → entity_translations table';

-- ============================================================================================================
-- STEP 4: Créer fonction helper pour entity_translations (simplifiée)
-- ============================================================================================================

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
'Récupère traduction d''une entité métier (ministry, service, document, etc.)';

-- ============================================================================================================
-- STEP 5: Rapport final
-- ============================================================================================================

DO $$
DECLARE
    v_translations_count INTEGER;
    v_entity_translations_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_translations_count FROM translations;
    SELECT COUNT(*) INTO v_entity_translations_count FROM entity_translations;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANUP REPORT: Redundant Tables Removed';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ enum_translations: SUPPRIMÉE (redondante)';
    RAISE NOTICE '✅ translations: % rows (ENUMs + UI + tout)', v_translations_count;
    RAISE NOTICE '✅ entity_translations: % rows (entités métier)', v_entity_translations_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Fonctions disponibles:';
    RAISE NOTICE '  - get_translation(category, key, lang) → ENUMs, UI, Forms, Messages';
    RAISE NOTICE '  - get_entity_translation(type, code, field, lang) → Entités métier';
    RAISE NOTICE '  - get_translation_unified(category, key, lang) → Tout (automatique)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Status: ✅ ARCHITECTURE FINALE PROPRE';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================================================
-- TESTS DE VALIDATION (à exécuter manuellement après migration)
-- ============================================================================================================

-- ✅ TEST 1: Vérifier que enum_translations n'existe plus
/*
SELECT table_name FROM information_schema.tables WHERE table_name = 'enum_translations';
-- Résultat attendu: 0 rows
*/

-- ✅ TEST 2: Vérifier que translations fonctionne
/*
SELECT get_translation('enum', 'payment_status.pending', 'fr');
-- Résultat attendu: "En Attente"
*/

-- ✅ TEST 3: Vérifier que entity_translations fonctionne toujours
/*
-- D'abord insérer une entité test
INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text)
VALUES ('ministry', 'TEST-001', 'fr', 'name', 'Test Ministère');

-- Tester fonction
SELECT get_entity_translation('ministry', 'TEST-001', 'name', 'fr');
-- Résultat attendu: "Test Ministère"

-- Nettoyer
DELETE FROM entity_translations WHERE entity_code = 'TEST-001';
*/

-- ✅ TEST 4: Vérifier fonction unifiée
/*
SELECT get_translation_unified('enum', 'payment_status.pending', 'es');
-- Résultat attendu: "Pendiente"

SELECT get_translation_unified('ministry', 'TEST-001', 'fr');
-- Résultat attendu: lecture depuis entity_translations
*/

-- ============================================================================================================
-- NOTES IMPORTANTES
-- ============================================================================================================
--
-- Architecture finale:
--
-- 1. Table: translations (PRINCIPALE)
--    Usage: ENUMs + UI + Formulaires + Messages + Périodes + TOUT
--    Format: 1 row = 1 clé × 3 colonnes (es, fr, en)
--    Fonction: get_translation(category, key, lang)
--
-- 2. Table: entity_translations (SÉPARÉE)
--    Usage: Entités métier UNIQUEMENT (ministries, services, documents, procedures)
--    Format: 1 row par entité × langue × champ
--    Fonction: get_entity_translation(type, code, field, lang)
--
-- 3. Fonction unifiée: get_translation_unified(category, key, lang)
--    Route automatiquement vers la bonne table
--
-- Avantages:
--   ✅ Zéro redondance
--   ✅ Architecture claire (2 tables avec usages distincts)
--   ✅ Performance optimale (indexes ciblés)
--   ✅ Maintenabilité maximale
--
-- ============================================================================================================
