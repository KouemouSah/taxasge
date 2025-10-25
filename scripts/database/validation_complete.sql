-- ============================================
-- 🧪 TESTS DE VALIDATION COMPLÈTE - TAXASGE
-- Architecture 3-niveaux optimisée
-- ============================================
-- Version: 1.0
-- Date: 29 septembre 2025
-- Auteur: Kouemou Sah Jean Emac + Claude Code Assistant
--
-- SCOPE:
-- ✅ Validation structure données hiérarchique
-- ✅ Tests performance navigation 3-niveaux
-- ✅ Validation intégrité traductions multilingues
-- ✅ Tests contraintes métier et FK
-- ✅ Validation conformité spécifications
-- ✅ Tests charge et performance
-- ============================================

-- ============================================
-- 1. INITIALISATION TESTS
-- ============================================

-- Table résultats tests
DROP TABLE IF EXISTS test_results;
CREATE TEMP TABLE test_results (
    test_category VARCHAR(50),
    test_name VARCHAR(100),
    expected_result TEXT,
    actual_result TEXT,
    status VARCHAR(10), -- PASS/FAIL/WARNING
    execution_time_ms INTEGER,
    notes TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction helper pour enregistrer résultats
CREATE OR REPLACE FUNCTION record_test_result(
    p_category VARCHAR(50),
    p_test_name VARCHAR(100),
    p_expected TEXT,
    p_actual TEXT,
    p_status VARCHAR(10),
    p_execution_time INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO test_results (
        test_category, test_name, expected_result, actual_result,
        status, execution_time_ms, notes
    ) VALUES (
        p_category, p_test_name, p_expected, p_actual,
        p_status, p_execution_time, p_notes
    );
END;
$$ LANGUAGE plpgsql;

-- Démarrage des tests
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🧪 DÉMARRAGE TESTS VALIDATION COMPLÈTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Base: TaxasGE - Architecture 3-niveaux';
    RAISE NOTICE '';
END$$;

-- ============================================
-- 2. TESTS STRUCTURE HIÉRARCHIQUE
-- ============================================

-- Test 2.1: Validation existence tables principales
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY['ministries', 'sectors', 'categories', 'fiscal_services', 'translations'];
    existing_tables TEXT[];
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    SELECT array_agg(table_name) INTO existing_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = ANY(expected_tables);

    end_time := clock_timestamp();

    IF array_length(existing_tables, 1) = array_length(expected_tables, 1) THEN
        PERFORM record_test_result(
            'STRUCTURE',
            'Tables principales existantes',
            '5 tables (ministries, sectors, categories, fiscal_services, translations)',
            array_length(existing_tables, 1)::TEXT || ' tables trouvées',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Toutes les tables requises sont présentes'
        );
    ELSE
        PERFORM record_test_result(
            'STRUCTURE',
            'Tables principales existantes',
            '5 tables',
            COALESCE(array_length(existing_tables, 1), 0)::TEXT || ' tables',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Tables manquantes: ' || array_to_string(
                ARRAY(SELECT unnest(expected_tables) EXCEPT SELECT unnest(existing_tables)), ', '
            )
        );
    END IF;
END$$;

-- Test 2.2: Validation hiérarchie 3-niveaux (pas de subcategories)
DO $$
DECLARE
    subcategory_table_exists BOOLEAN;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'subcategories'
    ) INTO subcategory_table_exists;

    end_time := clock_timestamp();

    IF NOT subcategory_table_exists THEN
        PERFORM record_test_result(
            'STRUCTURE',
            'Suppression subcategories',
            'Table subcategories n''existe pas',
            'Table subcategories supprimée',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Hiérarchie 3-niveaux confirmée'
        );
    ELSE
        PERFORM record_test_result(
            'STRUCTURE',
            'Suppression subcategories',
            'Table subcategories n''existe pas',
            'Table subcategories existe encore',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Migration subcategories incomplète'
        );
    END IF;
END$$;

-- Test 2.3: Validation contraintes FK directes
DO $$
DECLARE
    fk_count INTEGER;
    expected_fks INTEGER := 3; -- sectors→ministries, categories→sectors, fiscal_services→categories
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('sectors', 'categories', 'fiscal_services');

    end_time := clock_timestamp();

    IF fk_count >= expected_fks THEN
        PERFORM record_test_result(
            'STRUCTURE',
            'Contraintes FK hiérarchiques',
            expected_fks::TEXT || ' FK minimum',
            fk_count::TEXT || ' FK trouvées',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'FK hiérarchiques correctement définies'
        );
    ELSE
        PERFORM record_test_result(
            'STRUCTURE',
            'Contraintes FK hiérarchiques',
            expected_fks::TEXT || ' FK minimum',
            fk_count::TEXT || ' FK trouvées',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'FK hiérarchiques manquantes'
        );
    END IF;
END$$;

-- ============================================
-- 3. TESTS INTÉGRITÉ DONNÉES
-- ============================================

-- Test 3.1: Validation complétude données principales
DO $$
DECLARE
    ministry_count INTEGER;
    sector_count INTEGER;
    category_count INTEGER;
    service_count INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    SELECT COUNT(*) INTO ministry_count FROM ministries WHERE is_active;
    SELECT COUNT(*) INTO sector_count FROM sectors WHERE is_active;
    SELECT COUNT(*) INTO category_count FROM categories WHERE is_active;
    SELECT COUNT(*) INTO service_count FROM fiscal_services WHERE is_active;

    end_time := clock_timestamp();

    -- Validation basée sur données Phase 2
    IF ministry_count >= 10 AND sector_count >= 15 AND category_count >= 75 AND service_count >= 500 THEN
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Complétude données hiérarchiques',
            'Min: 10 ministères, 15 secteurs, 75 catégories, 500 services',
            FORMAT('%s ministères, %s secteurs, %s catégories, %s services',
                   ministry_count, sector_count, category_count, service_count),
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Données importées avec succès'
        );
    ELSE
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Complétude données hiérarchiques',
            'Min: 10 ministères, 15 secteurs, 75 catégories, 500 services',
            FORMAT('%s ministères, %s secteurs, %s catégories, %s services',
                   ministry_count, sector_count, category_count, service_count),
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Import données incomplet'
        );
    END IF;
END$$;

-- Test 3.2: Validation intégrité FK (aucun orphelin)
DO $$
DECLARE
    orphan_sectors INTEGER;
    orphan_categories INTEGER;
    orphan_services INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    total_orphans INTEGER;
BEGIN
    start_time := clock_timestamp();

    -- Secteurs orphelins
    SELECT COUNT(*) INTO orphan_sectors
    FROM sectors s
    LEFT JOIN ministries m ON s.ministry_id = m.id
    WHERE s.is_active AND m.id IS NULL;

    -- Catégories orphelines
    SELECT COUNT(*) INTO orphan_categories
    FROM categories c
    LEFT JOIN sectors s ON c.sector_id = s.id
    WHERE c.is_active AND s.id IS NULL;

    -- Services orphelins
    SELECT COUNT(*) INTO orphan_services
    FROM fiscal_services fs
    LEFT JOIN categories c ON fs.category_id = c.id
    WHERE fs.is_active AND c.id IS NULL;

    total_orphans := orphan_sectors + orphan_categories + orphan_services;
    end_time := clock_timestamp();

    IF total_orphans = 0 THEN
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Validation FK (aucun orphelin)',
            '0 enregistrements orphelins',
            total_orphans::TEXT || ' orphelins trouvés',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Intégrité FK parfaite'
        );
    ELSE
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Validation FK (aucun orphelin)',
            '0 enregistrements orphelins',
            FORMAT('%s orphelins (%s secteurs, %s catégories, %s services)',
                   total_orphans, orphan_sectors, orphan_categories, orphan_services),
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Orphelins détectés - intégrité compromise'
        );
    END IF;
END$$;

-- Test 3.3: Validation contraintes métier
DO $$
DECLARE
    invalid_amounts INTEGER;
    invalid_codes INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Montants invalides
    SELECT COUNT(*) INTO invalid_amounts
    FROM fiscal_services
    WHERE expedition_amount < 0 OR renewal_amount < 0;

    -- Codes invalides
    SELECT COUNT(*) INTO invalid_codes
    FROM (
        SELECT ministry_code FROM ministries WHERE NOT (ministry_code ~ '^M-[0-9]{3}$')
        UNION ALL
        SELECT sector_code FROM sectors WHERE NOT (sector_code ~ '^S-[0-9]{3}$')
        UNION ALL
        SELECT category_code FROM categories WHERE NOT (category_code ~ '^C-[0-9]{3}$')
        UNION ALL
        SELECT service_code FROM fiscal_services WHERE NOT (service_code ~ '^T-[0-9]{3}$')
    ) invalid;

    end_time := clock_timestamp();

    IF invalid_amounts = 0 AND invalid_codes = 0 THEN
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Contraintes métier',
            'Tous montants ≥0, tous codes valides',
            FORMAT('0 montants invalides, 0 codes invalides'),
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Contraintes métier respectées'
        );
    ELSE
        PERFORM record_test_result(
            'INTÉGRITÉ',
            'Contraintes métier',
            'Tous montants ≥0, tous codes valides',
            FORMAT('%s montants invalides, %s codes invalides', invalid_amounts, invalid_codes),
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Violations contraintes métier détectées'
        );
    END IF;
END$$;

-- ============================================
-- 4. TESTS TRADUCTIONS MULTILINGUES
-- ============================================

-- Test 4.1: Validation présence traductions espagnoles
DO $$
DECLARE
    total_entities INTEGER;
    entities_with_es INTEGER;
    coverage_percent NUMERIC;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Total entités actives
    SELECT COUNT(*) INTO total_entities
    FROM (
        SELECT id FROM ministries WHERE is_active
        UNION ALL
        SELECT id FROM sectors WHERE is_active
        UNION ALL
        SELECT id FROM categories WHERE is_active
        UNION ALL
        SELECT id FROM fiscal_services WHERE is_active
    ) entities;

    -- Entités avec traduction ES
    SELECT COUNT(DISTINCT entity_id) INTO entities_with_es
    FROM translations
    WHERE language_code = 'es'
    AND field_name = 'name'
    AND is_active = TRUE;

    coverage_percent := ROUND((entities_with_es * 100.0 / total_entities), 2);
    end_time := clock_timestamp();

    IF coverage_percent >= 95.0 THEN
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Couverture espagnol (obligatoire)',
            '≥95% entités avec traduction ES',
            coverage_percent::TEXT || '% (' || entities_with_es || '/' || total_entities || ')',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Couverture espagnol excellente'
        );
    ELSE
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Couverture espagnol (obligatoire)',
            '≥95% entités avec traduction ES',
            coverage_percent::TEXT || '% (' || entities_with_es || '/' || total_entities || ')',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Couverture espagnol insuffisante'
        );
    END IF;
END$$;

-- Test 4.2: Validation qualité traductions (non vides)
DO $$
DECLARE
    total_translations INTEGER;
    empty_translations INTEGER;
    quality_percent NUMERIC;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    SELECT COUNT(*) INTO total_translations
    FROM translations
    WHERE is_active = TRUE;

    SELECT COUNT(*) INTO empty_translations
    FROM translations
    WHERE is_active = TRUE
    AND (content IS NULL OR TRIM(content) = '');

    quality_percent := ROUND(((total_translations - empty_translations) * 100.0 / total_translations), 2);
    end_time := clock_timestamp();

    IF quality_percent >= 98.0 THEN
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Qualité traductions (non vides)',
            '≥98% traductions non vides',
            quality_percent::TEXT || '% (' || (total_translations - empty_translations) || '/' || total_translations || ')',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Qualité traductions excellente'
        );
    ELSE
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Qualité traductions (non vides)',
            '≥98% traductions non vides',
            quality_percent::TEXT || '% (' || (total_translations - empty_translations) || '/' || total_translations || ')',
            'WARNING',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            empty_translations::TEXT || ' traductions vides détectées'
        );
    END IF;
END$$;

-- Test 4.3: Validation format centralisé traductions
DO $$
DECLARE
    invalid_entity_types INTEGER;
    invalid_languages INTEGER;
    invalid_fields INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Types entités invalides
    SELECT COUNT(*) INTO invalid_entity_types
    FROM translations
    WHERE entity_type NOT IN ('ministry', 'sector', 'category', 'fiscal_service');

    -- Langues invalides
    SELECT COUNT(*) INTO invalid_languages
    FROM translations
    WHERE language_code NOT IN ('es', 'fr', 'en');

    -- Champs invalides
    SELECT COUNT(*) INTO invalid_fields
    FROM translations
    WHERE field_name NOT IN ('name', 'description', 'short_name');

    end_time := clock_timestamp();

    IF invalid_entity_types = 0 AND invalid_languages = 0 AND invalid_fields = 0 THEN
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Format centralisé conforme',
            'Tous types/langues/champs valides',
            'Format 100% conforme',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Spécification translations.json respectée'
        );
    ELSE
        PERFORM record_test_result(
            'TRADUCTIONS',
            'Format centralisé conforme',
            'Tous types/langues/champs valides',
            FORMAT('%s types invalides, %s langues invalides, %s champs invalides',
                   invalid_entity_types, invalid_languages, invalid_fields),
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Non-conformité format détectée'
        );
    END IF;
END$$;

-- ============================================
-- 5. TESTS PERFORMANCE
-- ============================================

-- Test 5.1: Performance navigation hiérarchique
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    record_count INTEGER;
BEGIN
    start_time := clock_timestamp();

    -- Requête navigation hiérarchique typique
    SELECT COUNT(*) INTO record_count
    FROM v_hierarchy_complete
    WHERE ministry_active AND sector_active AND category_active AND service_active;

    end_time := clock_timestamp();
    execution_time := EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER;

    IF execution_time <= 100 THEN -- Cible: <100ms pour navigation complète
        PERFORM record_test_result(
            'PERFORMANCE',
            'Navigation hiérarchique complète',
            '≤100ms pour ' || record_count || ' services',
            execution_time::TEXT || 'ms',
            'PASS',
            execution_time,
            'Performance excellente'
        );
    ELSIF execution_time <= 200 THEN
        PERFORM record_test_result(
            'PERFORMANCE',
            'Navigation hiérarchique complète',
            '≤100ms pour ' || record_count || ' services',
            execution_time::TEXT || 'ms',
            'WARNING',
            execution_time,
            'Performance acceptable mais à optimiser'
        );
    ELSE
        PERFORM record_test_result(
            'PERFORMANCE',
            'Navigation hiérarchique complète',
            '≤100ms pour ' || record_count || ' services',
            execution_time::TEXT || 'ms',
            'FAIL',
            execution_time,
            'Performance insuffisante - optimisation requise'
        );
    END IF;
END$$;

-- Test 5.2: Performance lookup traductions
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    sample_entity_id UUID;
BEGIN
    -- Prendre un échantillon
    SELECT id INTO sample_entity_id FROM fiscal_services LIMIT 1;

    start_time := clock_timestamp();

    -- Test lookup traductions multilingues
    PERFORM *
    FROM get_entity_translations('fiscal_service', sample_entity_id, 'name');

    end_time := clock_timestamp();
    execution_time := EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER;

    IF execution_time <= 10 THEN -- Cible: <10ms pour lookup traductions
        PERFORM record_test_result(
            'PERFORMANCE',
            'Lookup traductions multilingues',
            '≤10ms pour traductions entité',
            execution_time::TEXT || 'ms',
            'PASS',
            execution_time,
            'Performance lookup excellente'
        );
    ELSIF execution_time <= 30 THEN
        PERFORM record_test_result(
            'PERFORMANCE',
            'Lookup traductions multilingues',
            '≤10ms pour traductions entité',
            execution_time::TEXT || 'ms',
            'WARNING',
            execution_time,
            'Performance lookup acceptable'
        );
    ELSE
        PERFORM record_test_result(
            'PERFORMANCE',
            'Lookup traductions multilingues',
            '≤10ms pour traductions entité',
            execution_time::TEXT || 'ms',
            'FAIL',
            execution_time,
            'Performance lookup insuffisante'
        );
    END IF;
END$$;

-- Test 5.3: Performance index utilisation
DO $$
DECLARE
    index_count INTEGER;
    unused_indexes INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Compter index créés
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    -- Index non utilisés (simplifié)
    SELECT COUNT(*) INTO unused_indexes
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND indexrelname LIKE 'idx_%';

    end_time := clock_timestamp();

    IF index_count >= 8 AND unused_indexes <= 2 THEN
        PERFORM record_test_result(
            'PERFORMANCE',
            'Utilisation index optimaux',
            '≥8 index créés, ≤2 non utilisés',
            index_count::TEXT || ' index, ' || unused_indexes::TEXT || ' non utilisés',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Stratégie indexation optimale'
        );
    ELSE
        PERFORM record_test_result(
            'PERFORMANCE',
            'Utilisation index optimaux',
            '≥8 index créés, ≤2 non utilisés',
            index_count::TEXT || ' index, ' || unused_indexes::TEXT || ' non utilisés',
            'WARNING',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Stratégie indexation à revoir'
        );
    END IF;
END$$;

-- ============================================
-- 6. TESTS CONFORMITÉ SPÉCIFICATIONS
-- ============================================

-- Test 6.1: Conformité schéma 3-niveaux
DO $$
DECLARE
    max_depth INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Vérifier profondeur maximale hiérarchie
    WITH RECURSIVE hierarchy_depth AS (
        SELECT ministry_code, 1 as depth FROM ministries
        UNION ALL
        SELECT s.sector_code, h.depth + 1
        FROM sectors s
        JOIN hierarchy_depth h ON s.ministry_id IN (SELECT id FROM ministries WHERE ministry_code = h.ministry_code)
        UNION ALL
        SELECT c.category_code, h.depth + 1
        FROM categories c
        JOIN hierarchy_depth h ON c.sector_id IN (SELECT id FROM sectors WHERE sector_code = h.ministry_code)
        UNION ALL
        SELECT fs.service_code, h.depth + 1
        FROM fiscal_services fs
        JOIN hierarchy_depth h ON fs.category_id IN (SELECT id FROM categories WHERE category_code = h.ministry_code)
    )
    SELECT MAX(depth) INTO max_depth FROM hierarchy_depth;

    end_time := clock_timestamp();

    IF max_depth <= 4 THEN -- Ministry(1) → Sector(2) → Category(3) → Service(4)
        PERFORM record_test_result(
            'CONFORMITÉ',
            'Architecture 3-niveaux + services',
            'Profondeur ≤4 niveaux',
            'Profondeur ' || max_depth::TEXT || ' niveaux',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Architecture conforme spécification'
        );
    ELSE
        PERFORM record_test_result(
            'CONFORMITÉ',
            'Architecture 3-niveaux + services',
            'Profondeur ≤4 niveaux',
            'Profondeur ' || max_depth::TEXT || ' niveaux',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Architecture non conforme - trop de niveaux'
        );
    END IF;
END$$;

-- Test 6.2: Conformité spécification traductions centralisées
DO $$
DECLARE
    unique_constraint_exists BOOLEAN;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    -- Vérifier contrainte unicité traductions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'translations'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%entity_type%entity_id%field_name%language_code%'
    ) INTO unique_constraint_exists;

    end_time := clock_timestamp();

    IF unique_constraint_exists THEN
        PERFORM record_test_result(
            'CONFORMITÉ',
            'Contrainte unicité traductions',
            'Contrainte (entity_type, entity_id, field_name, language_code) EXISTS',
            'Contrainte unicité présente',
            'PASS',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Spécification traductions respectée'
        );
    ELSE
        PERFORM record_test_result(
            'CONFORMITÉ',
            'Contrainte unicité traductions',
            'Contrainte (entity_type, entity_id, field_name, language_code) EXISTS',
            'Contrainte unicité manquante',
            'FAIL',
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            'Non-conformité spécification traductions'
        );
    END IF;
END$$;

-- ============================================
-- 7. GÉNÉRATION RAPPORT FINAL
-- ============================================

DO $$
DECLARE
    total_tests INTEGER;
    passed_tests INTEGER;
    failed_tests INTEGER;
    warning_tests INTEGER;
    success_rate NUMERIC;
    avg_execution_time NUMERIC;
BEGIN
    -- Statistiques globales
    SELECT COUNT(*) INTO total_tests FROM test_results;
    SELECT COUNT(*) INTO passed_tests FROM test_results WHERE status = 'PASS';
    SELECT COUNT(*) INTO failed_tests FROM test_results WHERE status = 'FAIL';
    SELECT COUNT(*) INTO warning_tests FROM test_results WHERE status = 'WARNING';

    success_rate := ROUND((passed_tests * 100.0 / total_tests), 2);

    SELECT ROUND(AVG(execution_time_ms), 2) INTO avg_execution_time
    FROM test_results
    WHERE execution_time_ms IS NOT NULL;

    -- Rapport final
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📊 RAPPORT FINAL VALIDATION COMPLÈTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tests exécutés: %', total_tests;
    RAISE NOTICE '✅ Succès: % (%.1%%)', passed_tests, success_rate;
    RAISE NOTICE '⚠️  Warnings: %', warning_tests;
    RAISE NOTICE '❌ Échecs: %', failed_tests;
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Performance moyenne: %ms', avg_execution_time;
    RAISE NOTICE '🎯 Taux de réussite: %.1%%', success_rate;
    RAISE NOTICE '';

    IF success_rate >= 90 THEN
        RAISE NOTICE '🎉 VALIDATION GLOBALE: SUCCÈS';
        RAISE NOTICE '✅ Système prêt pour production';
    ELSIF success_rate >= 75 THEN
        RAISE NOTICE '⚠️ VALIDATION GLOBALE: ACCEPTABLE';
        RAISE NOTICE '🔧 Corrections mineures recommandées';
    ELSE
        RAISE NOTICE '❌ VALIDATION GLOBALE: ÉCHEC';
        RAISE NOTICE '🚨 Corrections majeures requises';
    END IF;

    RAISE NOTICE '============================================';
END$$;

-- Affichage résultats détaillés par catégorie
SELECT
    test_category,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'PASS') as passed,
    COUNT(*) FILTER (WHERE status = 'WARNING') as warnings,
    COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
    ROUND(AVG(execution_time_ms), 2) as avg_time_ms,
    ROUND(COUNT(*) FILTER (WHERE status = 'PASS') * 100.0 / COUNT(*), 1) as success_rate
FROM test_results
GROUP BY test_category
ORDER BY test_category;

-- Détails des échecs et warnings
SELECT
    test_category,
    test_name,
    status,
    expected_result,
    actual_result,
    notes
FROM test_results
WHERE status IN ('FAIL', 'WARNING')
ORDER BY test_category, status DESC;

-- Nettoyage
DROP FUNCTION IF EXISTS record_test_result(VARCHAR, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, TEXT);

-- Fin des tests
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tests de validation complète terminés';
    RAISE NOTICE '📋 Rapport détaillé disponible ci-dessus';
    RAISE NOTICE '';
END$$;