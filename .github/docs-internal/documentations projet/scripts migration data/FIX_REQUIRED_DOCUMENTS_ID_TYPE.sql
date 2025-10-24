-- ============================================
-- CORRECTION TYPE COLONNE ID: UUID → VARCHAR(10)
-- Problème: CSV contient RD-00001 mais table attend UUID
-- Solution: Modifier le type de colonne id
-- ============================================

-- Vérifier l'état actuel
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'required_documents'
AND column_name = 'id';

-- Vérifier qu'il n'y a pas de données (devrait être 0)
SELECT COUNT(*) as current_records FROM required_documents;

-- ============================================
-- MODIFIER LE TYPE DE COLONNE ID
-- ============================================

-- Supprimer la contrainte PRIMARY KEY temporairement
ALTER TABLE required_documents DROP CONSTRAINT required_documents_pkey;

-- Modifier le type de colonne
ALTER TABLE required_documents ALTER COLUMN id TYPE VARCHAR(10);

-- Supprimer la valeur par défaut UUID
ALTER TABLE required_documents ALTER COLUMN id DROP DEFAULT;

-- Recréer la contrainte PRIMARY KEY
ALTER TABLE required_documents ADD CONSTRAINT required_documents_pkey PRIMARY KEY (id);

-- ============================================
-- VALIDATION
-- ============================================

-- Vérifier la nouvelle structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'required_documents'
AND column_name = 'id';

-- Tester l'insertion d'un ID court
DO $$
BEGIN
    -- Test d'insertion
    INSERT INTO required_documents (
        id, fiscal_service_id, document_code, document_name,
        is_mandatory, applies_to, created_at
    ) VALUES (
        'RD-00001', 'T-001', 'TEST-DOC', 'Test Document',
        true, 'both', NOW()
    );

    -- Vérifier que ça fonctionne
    IF EXISTS(SELECT 1 FROM required_documents WHERE id = 'RD-00001') THEN
        RAISE NOTICE 'SUCCESS: ID court RD-00001 accepté!';
    END IF;

    -- Nettoyer le test
    DELETE FROM required_documents WHERE id = 'RD-00001';

    RAISE NOTICE 'Test réussi - prêt pour import CSV!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERREUR test ID court: %', SQLERRM;
END $$;

-- ============================================
-- CONFIRMATION FINALE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION TYPE ID TERMINÉE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CHANGEMENTS:';
    RAISE NOTICE '- required_documents.id: UUID → VARCHAR(10)';
    RAISE NOTICE '- PRIMARY KEY: Recréée sur VARCHAR(10)';
    RAISE NOTICE '- DEFAULT gen_random_uuid(): Supprimé';
    RAISE NOTICE '';
    RAISE NOTICE 'MAINTENANT COMPATIBLE:';
    RAISE NOTICE '- IDs courts: RD-00001, RD-00002...';
    RAISE NOTICE '- Format CSV: id,fiscal_service_id,...';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÊT POUR IMPORT:';
    RAISE NOTICE '1. required_documents.csv';
    RAISE NOTICE '2. translations_documents_only.csv';
    RAISE NOTICE '';
    RAISE NOTICE 'STATUS: PRÊT POUR IMPORT! 🚀';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;