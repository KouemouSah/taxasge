-- ============================================
-- MISE À JOUR SCHÉMA TAXASGE - TABLE DOCUMENTS
-- Version: 2.2 - Ajout gestion documents et OCR
-- Date: 27 septembre 2025
-- Description: Ajout table documents pour traitement OCR/extraction
-- ============================================

-- Ajout des nouveaux types énumérés pour documents
CREATE TYPE document_processing_mode_enum AS ENUM (
    'pending', 
    'server_processing', 
    'lite_processing', 
    'assisted_manual'
);

CREATE TYPE document_ocr_status_enum AS ENUM (
    'pending', 
    'processing', 
    'completed', 
    'failed', 
    'skipped'
);

CREATE TYPE document_extraction_status_enum AS ENUM (
    'pending', 
    'processing', 
    'completed', 
    'failed', 
    'manual'
);

CREATE TYPE document_validation_status_enum AS ENUM (
    'pending', 
    'valid', 
    'invalid', 
    'requires_review', 
    'user_corrected'
);

CREATE TYPE document_access_level_enum AS ENUM (
    'private', 
    'shared', 
    'public', 
    'confidential'
);

-- ============================================
-- TABLE DOCUMENTS PRINCIPALE
-- ============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références conformes au schéma existant
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_service_id UUID REFERENCES fiscal_services(id) ON DELETE SET NULL,
    service_payment_id UUID REFERENCES service_payments(id) ON DELETE SET NULL,
    declaration_id UUID REFERENCES tax_declarations(id) ON DELETE SET NULL,
    
    -- Métadonnées document
    document_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('documents_seq')::text, 6, '0')),
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url TEXT,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64), -- SHA-256
    
    -- Classification document
    document_type VARCHAR(50) NOT NULL, -- 'passport', 'nif_card', 'residence_permit', etc.
    document_subtype VARCHAR(50), -- 'guinean_passport', 'foreign_passport', 'business_nif'
    
    -- Traitement OCR
    processing_mode document_processing_mode_enum DEFAULT 'pending',
    ocr_status document_ocr_status_enum DEFAULT 'pending',
    ocr_provider VARCHAR(30), -- 'tesseract_server', 'tesseract_lite', 'google_vision'
    ocr_confidence DECIMAL(4,3), -- 0.000 - 1.000
    extracted_text TEXT,
    ocr_processing_time_ms INTEGER,
    
    -- Extraction structurée
    extraction_status document_extraction_status_enum DEFAULT 'pending',
    extracted_data JSONB, -- Données structurées extraites
    extraction_confidence DECIMAL(4,3),
    field_confidences JSONB, -- Confiance par champ {"passport_number": 0.95, "name": 0.87}
    
    -- Validation
    validation_status document_validation_status_enum DEFAULT 'pending',
    validation_errors JSONB DEFAULT '[]',
    validation_warnings JSONB DEFAULT '[]',
    user_corrections JSONB, -- Corrections apportées par l'utilisateur
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    
    -- Form mapping
    form_mapping_status VARCHAR(20) DEFAULT 'pending' CHECK (form_mapping_status IN (
        'pending', 'completed', 'failed'
    )),
    form_auto_fill_data JSONB, -- Données pour pré-remplissage formulaire
    target_form_type VARCHAR(50), -- Type de formulaire cible
    
    -- Métadonnées techniques
    image_quality_score DECIMAL(4,3),
    preprocessing_applied JSONB, -- Transformations appliquées à l'image
    retry_count INTEGER DEFAULT 0,
    error_logs JSONB DEFAULT '[]',
    
    -- Audit et conformité
    retention_until DATE, -- Suppression automatique (conformité GDPR)
    access_level document_access_level_enum DEFAULT 'private',
    encryption_key_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes < 52428800), -- 50MB max
    CONSTRAINT valid_confidence CHECK (
        (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)) AND
        (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1))
    ),
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Séquence pour numérotation automatique documents
CREATE SEQUENCE documents_seq START 1;

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

-- Index principaux pour requêtes fréquentes
CREATE INDEX idx_documents_user_type ON documents (user_id, document_type, created_at DESC);
CREATE INDEX idx_documents_processing_pipeline ON documents (processing_mode, ocr_status, extraction_status);
CREATE INDEX idx_documents_validation ON documents (validation_status) WHERE validation_status IN ('requires_review', 'invalid');
CREATE INDEX idx_documents_form_mapping ON documents (target_form_type, form_mapping_status);
CREATE INDEX idx_documents_hash ON documents (file_hash) WHERE file_hash IS NOT NULL;

-- Index pour recherche et filtrage
CREATE INDEX idx_documents_date_range ON documents (created_at, document_type);
CREATE INDEX idx_documents_fiscal_service ON documents (fiscal_service_id) WHERE fiscal_service_id IS NOT NULL;
CREATE INDEX idx_documents_retry ON documents (retry_count, ocr_status) WHERE retry_count > 0;

-- Index GIN pour recherche dans JSONB
CREATE INDEX idx_documents_extracted_data ON documents USING gin(extracted_data) WHERE extracted_data IS NOT NULL;
CREATE INDEX idx_documents_form_data ON documents USING gin(form_auto_fill_data) WHERE form_auto_fill_data IS NOT NULL;

-- ============================================
-- TRIGGERS ET FONCTIONS
-- ============================================

-- Trigger pour updated_at automatique
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyage automatique documents expirés
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Supprimer documents expirés selon retention_until
    WITH deleted AS (
        DELETE FROM documents 
        WHERE retention_until IS NOT NULL 
        AND retention_until < CURRENT_DATE
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- Log de l'opération
    INSERT INTO audit_logs (
        entity_type, 
        action, 
        new_values, 
        created_at
    ) VALUES (
        'documents', 
        'cleanup_expired', 
        jsonb_build_object('deleted_count', deleted_count), 
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer score qualité document
CREATE OR REPLACE FUNCTION calculate_document_quality_score(
    p_document_id UUID
)
RETURNS DECIMAL(4,3) AS $$
DECLARE
    v_doc documents%ROWTYPE;
    v_quality_score DECIMAL(4,3) := 0.0;
    v_field_count INTEGER := 0;
    v_high_confidence_fields INTEGER := 0;
BEGIN
    SELECT * INTO v_doc FROM documents WHERE id = p_document_id;
    
    IF NOT FOUND THEN
        RETURN 0.0;
    END IF;
    
    -- Score basé sur confiance OCR (30%)
    IF v_doc.ocr_confidence IS NOT NULL THEN
        v_quality_score := v_quality_score + (v_doc.ocr_confidence * 0.3);
    END IF;
    
    -- Score basé sur confiance extraction (40%)
    IF v_doc.extraction_confidence IS NOT NULL THEN
        v_quality_score := v_quality_score + (v_doc.extraction_confidence * 0.4);
    END IF;
    
    -- Score basé sur validation (30%)
    CASE v_doc.validation_status
        WHEN 'valid' THEN v_quality_score := v_quality_score + 0.3;
        WHEN 'user_corrected' THEN v_quality_score := v_quality_score + 0.25;
        WHEN 'requires_review' THEN v_quality_score := v_quality_score + 0.15;
        WHEN 'invalid' THEN v_quality_score := v_quality_score + 0.0;
        ELSE v_quality_score := v_quality_score + 0.1;
    END CASE;
    
    -- Bonus pour champs avec haute confiance
    IF v_doc.field_confidences IS NOT NULL THEN
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE value::numeric > 0.8)
        INTO v_field_count, v_high_confidence_fields
        FROM jsonb_each_text(v_doc.field_confidences);
        
        IF v_field_count > 0 THEN
            v_quality_score := v_quality_score + (v_high_confidence_fields::decimal / v_field_count * 0.1);
        END IF;
    END IF;
    
    -- Normaliser entre 0 et 1
    RETURN LEAST(1.0, GREATEST(0.0, v_quality_score));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES UTILITAIRES
-- ============================================

-- Vue pour monitoring traitement documents
CREATE VIEW documents_processing_stats AS
SELECT 
    document_type,
    processing_mode,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE ocr_status = 'completed') as ocr_completed,
    COUNT(*) FILTER (WHERE extraction_status = 'completed') as extraction_completed,
    COUNT(*) FILTER (WHERE validation_status = 'valid') as validated,
    AVG(ocr_confidence) as avg_ocr_confidence,
    AVG(extraction_confidence) as avg_extraction_confidence,
    AVG(ocr_processing_time_ms) as avg_processing_time_ms,
    COUNT(*) FILTER (WHERE retry_count > 0) as retried_documents
FROM documents 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY document_type, processing_mode;

-- Vue pour documents nécessitant attention
CREATE VIEW documents_requiring_attention AS
SELECT 
    id,
    document_number,
    document_type,
    user_id,
    validation_status,
    retry_count,
    error_logs,
    created_at,
    CASE 
        WHEN retry_count >= 3 THEN 'high'
        WHEN validation_status = 'requires_review' THEN 'medium'
        WHEN ocr_status = 'failed' THEN 'medium'
        ELSE 'low'
    END as priority_level
FROM documents 
WHERE validation_status IN ('requires_review', 'invalid') 
   OR ocr_status = 'failed'
   OR extraction_status = 'failed'
   OR retry_count > 0
ORDER BY 
    CASE 
        WHEN retry_count >= 3 THEN 1
        WHEN validation_status = 'requires_review' THEN 2
        WHEN ocr_status = 'failed' THEN 3
        ELSE 4
    END,
    created_at DESC;

-- ============================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================

COMMENT ON TABLE documents IS 'Gestion documents utilisateur avec traitement OCR et extraction automatisée';
COMMENT ON COLUMN documents.document_number IS 'Numéro unique document format DOC-YYYYMMDD-NNNNNN';
COMMENT ON COLUMN documents.processing_mode IS 'Mode traitement: server_processing, lite_processing, assisted_manual';
COMMENT ON COLUMN documents.extracted_data IS 'Données structurées extraites du document (JSONB)';
COMMENT ON COLUMN documents.form_auto_fill_data IS 'Données mappées pour pré-remplissage formulaires';
COMMENT ON COLUMN documents.field_confidences IS 'Score confiance par champ extrait';
COMMENT ON COLUMN documents.user_corrections IS 'Corrections apportées par utilisateur';
COMMENT ON COLUMN documents.retention_until IS 'Date suppression automatique (conformité GDPR)';

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Insertion de quelques types de documents standards pour test
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content) VALUES
('document_type', gen_random_uuid(), 'name', 'es', 'Pasaporte'),
('document_type', gen_random_uuid(), 'name', 'fr', 'Passeport'),
('document_type', gen_random_uuid(), 'name', 'en', 'Passport');

-- ============================================
-- PERMISSIONS ET SÉCURITÉ
-- ============================================

-- Row Level Security pour documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateurs peuvent voir seulement leurs documents
CREATE POLICY documents_user_access ON documents
    FOR ALL
    TO authenticated_user
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Politique: admins DGI peuvent voir tous les documents
CREATE POLICY documents_admin_access ON documents
    FOR ALL
    TO dgi_admin
    USING (true);

-- ============================================
-- FINALISATION
-- ============================================

-- Mise à jour statistiques tables pour optimisation
ANALYZE documents;

-- Log de la migration
INSERT INTO audit_logs (
    entity_type, 
    action, 
    new_values, 
    created_at
) VALUES (
    'schema_migration', 
    'add_documents_table', 
    jsonb_build_object(
        'version', '2.2',
        'description', 'Ajout table documents avec OCR/extraction',
        'tables_added', ARRAY['documents'],
        'functions_added', ARRAY['cleanup_expired_documents', 'calculate_document_quality_score']
    ), 
    NOW()
);

-- ============================================
-- FIN MIGRATION TABLE DOCUMENTS
-- ============================================
