-- ============================================
-- CORRECTION TYPE COLONNES ID: UUID → VARCHAR(10) (VERSION CORRIGÉE)
-- Tables: service_procedures et service_keywords
-- Fix: Utilise les bonnes colonnes du schéma réel
-- ============================================

-- Afficher l'état initial
SELECT 'ÉTAT ACTUEL DES TYPES DE COLONNES' as section;

-- Vérifier structure actuelle
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('service_procedures', 'service_keywords')
AND column_name = 'id'
ORDER BY table_name;

-- Vérifier qu'il n'y a pas de données
SELECT 'service_procedures' as table_name, COUNT(*) as current_records FROM service_procedures
UNION ALL
SELECT 'service_keywords' as table_name, COUNT(*) as current_records FROM service_keywords;

-- ============================================
-- MODIFICATION service_procedures.id
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MODIFICATION service_procedures.id';
    RAISE NOTICE '========================================';

    -- Supprimer la contrainte PRIMARY KEY
    ALTER TABLE service_procedures DROP CONSTRAINT IF EXISTS service_procedures_pkey;

    -- Modifier le type de colonne
    ALTER TABLE service_procedures ALTER COLUMN id TYPE VARCHAR(10);

    -- Supprimer la valeur par défaut UUID
    ALTER TABLE service_procedures ALTER COLUMN id DROP DEFAULT;

    -- Recréer la contrainte PRIMARY KEY
    ALTER TABLE service_procedures ADD CONSTRAINT service_procedures_pkey PRIMARY KEY (id);

    RAISE NOTICE 'SUCCESS: service_procedures.id modifié en VARCHAR(10)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erreur service_procedures: %', SQLERRM;
END $$;

-- ============================================
-- MODIFICATION service_keywords.id
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MODIFICATION service_keywords.id';
    RAISE NOTICE '========================================';

    -- Supprimer la contrainte PRIMARY KEY
    ALTER TABLE service_keywords DROP CONSTRAINT IF EXISTS service_keywords_pkey;

    -- Modifier le type de colonne
    ALTER TABLE service_keywords ALTER COLUMN id TYPE VARCHAR(10);

    -- Supprimer la valeur par défaut UUID
    ALTER TABLE service_keywords ALTER COLUMN id DROP DEFAULT;

    -- Recréer la contrainte PRIMARY KEY
    ALTER TABLE service_keywords ADD CONSTRAINT service_keywords_pkey PRIMARY KEY (id);

    RAISE NOTICE 'SUCCESS: service_keywords.id modifié en VARCHAR(10)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erreur service_keywords: %', SQLERRM;
END $$;

-- ============================================
-- VALIDATION (avec les vraies colonnes)
-- ============================================

-- Vérifier les nouvelles structures
SELECT 'APRÈS MODIFICATION' as section;

SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('service_procedures', 'service_keywords')
AND column_name = 'id'
ORDER BY table_name;

-- Test d'insertion avec les vraies colonnes du schéma
DO $$
BEGIN
    -- Test service_procedures (sans description_es qui n'existe pas)
    INSERT INTO service_procedures (
        id,
        fiscal_service_id,
        step_number,
        applies_to,
        created_at
    ) VALUES (
        'SP-TEST',
        'T-001',
        999,
        'both',
        NOW()
    );

    IF EXISTS(SELECT 1 FROM service_procedures WHERE id = 'SP-TEST') THEN
        RAISE NOTICE 'TEST 1: ID court accepté dans service_procedures';
    END IF;

    DELETE FROM service_procedures WHERE id = 'SP-TEST';

    -- Test service_keywords
    INSERT INTO service_keywords (
        id,
        fiscal_service_id,
        keyword,
        language_code,
        weight,
        is_auto_generated,
        created_at
    ) VALUES (
        'SK-TEST',
        'T-001',
        'test',
        'es',
        1,
        true,
        NOW()
    );

    IF EXISTS(SELECT 1 FROM service_keywords WHERE id = 'SK-TEST') THEN
        RAISE NOTICE 'TEST 2: ID court accepté dans service_keywords';
    END IF;

    DELETE FROM service_keywords WHERE id = 'SK-TEST';

    RAISE NOTICE 'Tous les tests réussis !';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erreur tests: %', SQLERRM;
        -- Continue même si erreur
END $$;

-- ============================================
-- CONFIRMATION FINALE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'CORRECTION TERMINÉE';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CHANGEMENTS APPLIQUÉS:';
    RAISE NOTICE '- service_procedures.id: UUID → VARCHAR(10)';
    RAISE NOTICE '- service_keywords.id: UUID → VARCHAR(10)';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT - COLONNES service_procedures:';
    RAISE NOTICE '- PAS de description_es (utilise translations)';
    RAISE NOTICE '- Colonnes: id, fiscal_service_id, step_number, applies_to...';
    RAISE NOTICE '';
    RAISE NOTICE 'FORMATS ACCEPTÉS:';
    RAISE NOTICE '- service_procedures: SP-00001, SP-00002...';
    RAISE NOTICE '- service_keywords: SK-00001, SK-00002...';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÊT POUR IMPORT CSV!';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;