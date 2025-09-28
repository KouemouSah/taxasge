-- ============================================
-- MIGRATION COMPLÈTE TAXASGE - VERSION UNIFIÉE
-- Date: 27 septembre 2025
-- Version: 2.0 - Migration atomique complète
-- Description: Création schéma complet avec tables de base + extension documents
-- ============================================

-- Transaction atomique pour tout ou rien
BEGIN;

-- ============================================
-- 1. NETTOYAGE ET PRÉPARATION
-- ============================================

-- Suppression des objets existants si nécessaire (dev only)
-- DROP SCHEMA IF EXISTS taxasge CASCADE;
-- CREATE SCHEMA taxasge;
-- SET search_path TO taxasge, public;

-- Extensions nécessaires (inoffensif si déjà présentes)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- pour gen_random_uuid()

-- ============================================
-- 2. TYPES ÉNUMÉRÉS - BASE (création si absents)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('citizen', 'dgi_agent', 'dgi_admin', 'system_admin');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type_enum') THEN
        CREATE TYPE service_type_enum AS ENUM ('license', 'certificate', 'registration', 'permit', 'declaration', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_enum') THEN
        CREATE TYPE currency_enum AS ENUM ('XAF', 'EUR', 'USD');
    END IF;
END$$;

-- ============================================
-- 3. TYPES ÉNUMÉRÉS - DOCUMENTS & OCR (création si absents)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_processing_mode_enum') THEN
        CREATE TYPE document_processing_mode_enum AS ENUM ('pending', 'server_processing', 'lite_processing', 'assisted_manual');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_ocr_status_enum') THEN
        CREATE TYPE document_ocr_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_extraction_status_enum') THEN
        CREATE TYPE document_extraction_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'manual');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_validation_status_enum') THEN
        CREATE TYPE document_validation_status_enum AS ENUM ('pending', 'valid', 'invalid', 'requires_review', 'user_corrected');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_access_level_enum') THEN
        CREATE TYPE document_access_level_enum AS ENUM ('private', 'shared', 'public', 'confidential');
    END IF;
END$$;

-- ============================================
-- 10. SÉQUENCES (créée avant la table documents car utilisée dans le DEFAULT)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'documents_seq') THEN
        CREATE SEQUENCE documents_seq START 1;
    END IF;
END$$;

-- ============================================
-- 4. TABLES DE BASE - UTILISATEURS & AUTH
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role_enum DEFAULT 'citizen',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLES DE BASE - STRUCTURE FISCALE
-- ============================================

CREATE TABLE IF NOT EXISTS ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code VARCHAR(20) UNIQUE NOT NULL,
    ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(20) UNIQUE NOT NULL,
    sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_code VARCHAR(20) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLES DE BASE - SERVICES FISCAUX
-- ============================================

CREATE TABLE IF NOT EXISTS fiscal_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) UNIQUE NOT NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    service_type service_type_enum DEFAULT 'other',
    expedition_amount DECIMAL(12,2) DEFAULT 0.00,
    renewal_amount DECIMAL(12,2) DEFAULT 0.00,
    validity_period_months INTEGER DEFAULT 12,
    is_renewable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLES DE BASE - PAIEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    fiscal_service_id UUID REFERENCES fiscal_services(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency currency_enum DEFAULT 'XAF',
    payment_status payment_status_enum DEFAULT 'pending',
    payment_method VARCHAR(50),
    external_reference VARCHAR(100),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABLE DOCUMENTS - EXTENSION OCR COMPLÈTE
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références conformes au schéma existant
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_service_id UUID REFERENCES fiscal_services(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

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
    form_mapping_status VARCHAR(20) DEFAULT 'pending' CHECK (form_mapping_status IN ('pending', 'completed', 'failed')),
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

-- ============================================
-- 9. TABLE TRADUCTIONS CENTRALISÉE
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'ministry', 'sector', 'category', etc.
    entity_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'name', 'description', etc.
    language_code VARCHAR(5) NOT NULL, -- 'es', 'fr', 'en'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, field_name, language_code)
);

-- ============================================
-- 11. INDEX POUR PERFORMANCE - BASE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sectors_ministry ON sectors (ministry_id);
CREATE INDEX IF NOT EXISTS idx_categories_sector ON categories (sector_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories (category_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_subcategory ON fiscal_services (subcategory_id);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (payment_reference);

CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations (language_code);

-- ============================================
-- 12. INDEX POUR PERFORMANCE - DOCUMENTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_user_type ON documents (user_id, document_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_processing_pipeline ON documents (processing_mode, ocr_status, extraction_status);
CREATE INDEX IF NOT EXISTS idx_documents_validation ON documents (validation_status) WHERE validation_status IN ('requires_review', 'invalid');
CREATE INDEX IF NOT EXISTS idx_documents_form_mapping ON documents (target_form_type, form_mapping_status);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents (file_hash) WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_date_range ON documents (created_at, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_fiscal_service ON documents (fiscal_service_id) WHERE fiscal_service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_retry ON documents (retry_count, ocr_status) WHERE retry_count > 0;

-- Index GIN pour recherche dans JSONB
CREATE INDEX IF NOT EXISTS idx_documents_extracted_data ON documents USING gin(extracted_data);
CREATE INDEX IF NOT EXISTS idx_documents_form_data ON documents USING gin(form_auto_fill_data);

-- ============================================
-- 13. FONCTIONS UTILITAIRES (créées uniquement si absentes)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'update_updated_at_column' AND n.nspname = 'public'
    ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $fn$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'cleanup_expired_documents' AND n.nspname = 'public'
    ) THEN
        CREATE FUNCTION cleanup_expired_documents()
        RETURNS INTEGER AS $fn$
        DECLARE
            deleted_count INTEGER := 0;
        BEGIN
            WITH deleted AS (
                DELETE FROM documents
                WHERE retention_until IS NOT NULL
                AND retention_until < CURRENT_DATE
                RETURNING id
            )
            SELECT COUNT(*) INTO deleted_count FROM deleted;

            RETURN deleted_count;
        END;
        $fn$ LANGUAGE plpgsql;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'calculate_document_quality_score' AND n.nspname = 'public'
    ) THEN
        CREATE FUNCTION calculate_document_quality_score(p_document_id UUID)
        RETURNS DECIMAL(4,3) AS $fn$
        DECLARE
            v_doc documents%ROWTYPE;
            v_quality_score DECIMAL(4,3) := 0.0;
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

            RETURN LEAST(1.0, GREATEST(0.0, v_quality_score));
        END;
        $fn$ LANGUAGE plpgsql;
    END IF;
END$$;

-- ============================================
-- 14. TRIGGERS (créés uniquement si absents)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ministries_updated_at') THEN
        CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON ministries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sectors_updated_at') THEN
        CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategories_updated_at') THEN
        CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fiscal_services_updated_at') THEN
        CREATE TRIGGER update_fiscal_services_updated_at BEFORE UPDATE ON fiscal_services
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
        CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_translations_updated_at') THEN
        CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- ============================================
-- 15. VUES UTILITAIRES (créées uniquement si absentes)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'documents_processing_stats') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'documents_requiring_attention') THEN
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
    END IF;
END$$;

-- ============================================
-- 16. COMMENTAIRES ET DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Utilisateurs du système TaxasGE avec authentification';
COMMENT ON TABLE ministries IS 'Ministères de la République de Guinée Équatoriale';
COMMENT ON TABLE sectors IS 'Secteurs d''activité par ministère';
COMMENT ON TABLE categories IS 'Catégories de services fiscaux par secteur';
COMMENT ON TABLE subcategories IS 'Sous-catégories détaillées de services';
COMMENT ON TABLE fiscal_services IS 'Services fiscaux avec tarification';
COMMENT ON TABLE payments IS 'Paiements et transactions BANGE';
COMMENT ON TABLE documents IS 'Gestion documents utilisateur avec traitement OCR et extraction automatisée';
COMMENT ON TABLE translations IS 'Traductions multilingues centralisées (ES/FR/EN)';

COMMENT ON COLUMN documents.document_number IS 'Numéro unique document format DOC-YYYYMMDD-NNNNNN';
COMMENT ON COLUMN documents.processing_mode IS 'Mode traitement: server_processing, lite_processing, assisted_manual';
COMMENT ON COLUMN documents.extracted_data IS 'Données structurées extraites du document (JSONB)';
COMMENT ON COLUMN documents.form_auto_fill_data IS 'Données mappées pour pré-remplissage formulaires';
COMMENT ON COLUMN documents.field_confidences IS 'Score confiance par champ extrait';
COMMENT ON COLUMN documents.retention_until IS 'Date suppression automatique (conformité GDPR)';

-- ============================================
-- 17. FINALISATION TRANSACTION
-- ============================================

-- Mise à jour statistiques tables pour optimisation (sans effet si vides)
ANALYZE users;
ANALYZE ministries;
ANALYZE sectors;
ANALYZE categories;
ANALYZE subcategories;
ANALYZE fiscal_services;
ANALYZE payments;
ANALYZE documents;
ANALYZE translations;

-- Validation finale (non bloquante si tout existe déjà)
DO $$
BEGIN
    -- Vérifier que la table documents existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        RAISE EXCEPTION 'Table documents non créée - migration échouée';
    END IF;

    -- Vérifier qu'un enum clé existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_processing_mode_enum') THEN
        RAISE EXCEPTION 'Enum document_processing_mode_enum non créé - migration échouée';
    END IF;

    RAISE NOTICE 'Migration TaxasGE complète réussie - Schéma unifié (safe) ok';
END;
$$;

COMMIT;

-- ============================================
-- FIN MIGRATION COMPLÈTE TAXASGE
-- Schema Version: 2.0
-- Tables: 9 tables de base + documents + translations
-- Enum Types: 9 types énumérés
-- Functions: 3 fonctions utilitaires
-- Views: 2 vues de monitoring
-- Index: 20+ index optimisés
-- ============================================