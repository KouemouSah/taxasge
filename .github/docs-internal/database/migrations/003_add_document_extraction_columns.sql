-- ====================================================================================================
-- Migration 003: Add Document Extraction Columns for Module 03
-- ====================================================================================================
-- Date: 2025-11-14
-- Author: Claude Code
-- Description: Ajoute colonnes pour OCR + extraction de données structurées
--
-- Context:
--   Le DocumentRepository (packages/backend/app/repositories/document_repository.py)
--   attend des colonnes qui n'existent pas encore dans uploaded_files.
--   Cette migration ajoute toutes les colonnes nécessaires pour:
--   - Stockage résultats OCR (texte, confiance, provider)
--   - Stockage données extraites (extracted_data JSONB)
--   - Mapping vers formulaires frontend (form_mapping JSONB)
--   - Tracking du workflow de traitement
--
-- Impact:
--   - Débloque update_ocr_results(), update_extracted_data()
--   - Permet pre-fill automatique des formulaires frontend
--   - Active workflow complet: Upload → OCR → Extraction → Mapping
-- ====================================================================================================

BEGIN;

-- ====================================================================================================
-- SECTION 1: COLONNES MÉTADONNÉES FICHIER
-- ====================================================================================================

-- Nom original du fichier (vs file_name qui peut être sanitized)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- URL publique pour téléchargement (signed URL Firebase/Supabase Storage)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Hash SHA-256 pour vérification intégrité
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Type de document (granulaire: declaration_iva, passport, invoice, etc.)
-- Note: file_type (enum) reste pour compatibilité, document_type est plus précis
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

-- Sous-type pour catégorisation fine (ex: iva_destajo, retencion_art3, etc.)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS document_subtype VARCHAR(50);

-- Description libre fournie par l'utilisateur
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS description TEXT;

-- Mode de traitement: 'server_processing', 'cloud_vision', 'lite_mode'
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_mode VARCHAR(20) DEFAULT 'server_processing';

-- ====================================================================================================
-- SECTION 2: COLONNES RÉSULTATS OCR
-- ====================================================================================================

-- Texte complet extrait par OCR (peut être très long pour formulaires complexes)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_text TEXT;

-- Score de confiance OCR global (0.00 à 1.00)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(3,2);

-- Provider OCR utilisé: 'tesseract', 'google_vision', 'manual'
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_provider VARCHAR(20);

-- ====================================================================================================
-- SECTION 3: COLONNES EXTRACTION DE DONNÉES STRUCTURÉES
-- ====================================================================================================

-- Statut de l'extraction: 'pending', 'processing', 'completed', 'failed'
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(20) DEFAULT 'pending';

-- Données extraites structurées (JSONB)
-- Exemple: {"nif": "12345678A", "base_imponible": 50000.00, "cuota": 7500.00, ...}
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- Score de confiance de l'extraction (0.00 à 1.00)
-- Calculé comme moyenne pondérée des confidences par champ
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(3,2);

-- Mapping vers formulaire frontend pour pre-fill automatique (JSONB)
-- Exemple: {"form_type": "declaration_iva", "pre_filled_fields": {"nif": "12345678A", ...}}
-- CRITIQUE: Utilisé par le frontend pour pré-remplir les formulaires
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS form_mapping JSONB;

-- ====================================================================================================
-- SECTION 4: COLONNES TRACKING PROCESSING
-- ====================================================================================================

-- Timestamp début du traitement (OCR + extraction)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- Timestamp fin du traitement
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Durée totale du traitement en millisecondes
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- ====================================================================================================
-- SECTION 5: COLONNES MÉTADONNÉES ET ACCESS CONTROL
-- ====================================================================================================

-- Niveau d'accès: 'private', 'shared', 'public'
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private';

-- Statut de validation: 'pending', 'validated', 'rejected'
-- Distinct de extraction_status (qui concerne le processing technique)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';

-- Relation polymorphique générique (en plus de tax_declaration_id et payment_id)
-- Exemple: related_to_type='fiscal_service', related_to_id=<service_id>
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS related_to_type VARCHAR(50);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS related_to_id UUID;

-- Timestamp de dernière modification (pour tracking changes)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================================================
-- SECTION 6: MIGRATION DES DONNÉES EXISTANTES
-- ====================================================================================================

-- Copier file_name vers original_filename pour les enregistrements existants
UPDATE uploaded_files
SET original_filename = file_name
WHERE original_filename IS NULL;

-- Copier file_type (enum) vers document_type (string) pour compatibilité
UPDATE uploaded_files
SET document_type = file_type::text
WHERE document_type IS NULL;

-- Initialiser extraction_status basé sur ocr_status existant
UPDATE uploaded_files
SET extraction_status = CASE
    WHEN ocr_status = 'completed' THEN 'pending'
    WHEN ocr_status = 'failed' THEN 'pending'
    WHEN ocr_status = 'processing' THEN 'pending'
    ELSE 'pending'
END
WHERE extraction_status IS NULL OR extraction_status = 'pending';

-- ====================================================================================================
-- SECTION 7: INDEXES POUR PERFORMANCE
-- ====================================================================================================

-- Index sur document_type pour filtrage rapide par type
CREATE INDEX IF NOT EXISTS idx_uploaded_files_document_type
ON uploaded_files(document_type)
WHERE document_type IS NOT NULL;

-- Index sur extraction_status pour récupération rapide des documents en attente
CREATE INDEX IF NOT EXISTS idx_uploaded_files_extraction_status
ON uploaded_files(extraction_status);

-- Index GIN sur form_mapping pour recherche dans JSONB
-- Permet de rechercher des documents par champs spécifiques du mapping
CREATE INDEX IF NOT EXISTS idx_uploaded_files_form_mapping
ON uploaded_files USING gin(form_mapping)
WHERE form_mapping IS NOT NULL;

-- Index GIN sur extracted_data pour recherche dans données extraites
CREATE INDEX IF NOT EXISTS idx_uploaded_files_extracted_data
ON uploaded_files USING gin(extracted_data)
WHERE extracted_data IS NOT NULL;

-- Index composé pour requêtes fréquentes: user + statuts
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_statuses
ON uploaded_files(user_id, extraction_status, validation_status);

-- Index sur processing timestamps pour analytics
CREATE INDEX IF NOT EXISTS idx_uploaded_files_processing_times
ON uploaded_files(processing_started_at, processing_completed_at)
WHERE processing_completed_at IS NOT NULL;

-- Index sur document_subtype pour catégorisation fine
CREATE INDEX IF NOT EXISTS idx_uploaded_files_document_subtype
ON uploaded_files(document_subtype)
WHERE document_subtype IS NOT NULL;

-- ====================================================================================================
-- SECTION 8: VALIDATION ET VÉRIFICATION
-- ====================================================================================================

-- Vérifier que toutes les colonnes ont été ajoutées
DO $$
DECLARE
    missing_columns TEXT[];
    col TEXT;
BEGIN
    -- Liste des colonnes attendues
    missing_columns := ARRAY[
        'original_filename', 'file_url', 'file_hash', 'document_type',
        'document_subtype', 'description', 'processing_mode',
        'ocr_text', 'ocr_confidence', 'ocr_provider',
        'extraction_status', 'extracted_data', 'extraction_confidence', 'form_mapping',
        'processing_started_at', 'processing_completed_at', 'processing_duration_ms',
        'access_level', 'validation_status', 'related_to_type', 'related_to_id', 'updated_at'
    ];

    -- Vérifier chaque colonne
    FOREACH col IN ARRAY missing_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'uploaded_files'
            AND column_name = col
        ) THEN
            RAISE EXCEPTION 'Migration failed: Column % not created', col;
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration validation: All % columns successfully added', array_length(missing_columns, 1);
END $$;

-- Afficher statistiques migration
DO $$
DECLARE
    total_files INTEGER;
    files_with_ocr INTEGER;
    files_pending_extraction INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_files FROM uploaded_files;
    SELECT COUNT(*) INTO files_with_ocr FROM uploaded_files WHERE ocr_status = 'completed';
    SELECT COUNT(*) INTO files_pending_extraction FROM uploaded_files WHERE extraction_status = 'pending';

    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Migration 003 Statistics:';
    RAISE NOTICE '  Total files: %', total_files;
    RAISE NOTICE '  Files with OCR completed: %', files_with_ocr;
    RAISE NOTICE '  Files pending extraction: %', files_pending_extraction;
    RAISE NOTICE '=================================================================';
END $$;

COMMIT;

-- ====================================================================================================
-- POST-MIGRATION NOTES
-- ====================================================================================================

-- After this migration:
-- 1. DocumentRepository methods will work correctly:
--    - update_ocr_results() → saves to ocr_text, ocr_confidence, ocr_provider
--    - update_extracted_data() → saves to extracted_data, extraction_confidence, form_mapping
--    - update_extraction_failed() → updates extraction_status
--
-- 2. Frontend can fetch form_mapping for auto-fill:
--    GET /api/documents/{id}/form-mapping → returns form_mapping JSONB
--
-- 3. Workflow enabled:
--    Upload → OCR → Extraction → Mapping → Save → Frontend Pre-fill
--
-- 4. Analytics queries possible:
--    - Average extraction confidence by document_type
--    - Processing time distribution
--    - Success rate by OCR provider
--
-- 5. Next steps:
--    - Implement OCRService (Google Cloud Vision + Tesseract)
--    - Implement DocumentService (orchestration)
--    - Create API endpoints
