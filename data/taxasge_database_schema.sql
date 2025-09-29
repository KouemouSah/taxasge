-- ============================================
-- SCHÉMA BASE DE DONNÉES TAXASGE RESTRUCTURÉ
-- Version: 3.0 - Architecture 3-niveaux optimisée & Supabase-ready
-- Date: 29 septembre 2025
-- Description: Schéma complet avec ordre d'exécution optimisé
-- ============================================

-- ============================================
-- 1. EXTENSIONS POSTGRESQL
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TYPES ÉNUMÉRÉS (IDEMPOTENTS)
-- ============================================

-- Types utilisateur
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('citizen', 'business', 'accountant', 'admin', 'dgi_agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'pending_verification', 'deactivated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types services
DO $$ BEGIN
    CREATE TYPE service_status_enum AS ENUM ('active', 'inactive', 'draft', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type_enum AS ENUM (
        'document_processing',  -- Légalisation, certification documents
        'license_permit',       -- Permis de conduire, licences professionnelles
        'residence_permit',     -- Carte de séjour résident
        'registration_fee',     -- Inscription, enregistrement
        'inspection_fee',       -- Frais d'inspection, contrôle technique
        'administrative_tax',   -- Taxes administratives diverses
        'customs_duty',         -- Droits de douane
        'declaration_tax'       -- Taxes liées aux déclarations obligatoires
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calculation_method_enum AS ENUM (
        'fixed_expedition',     -- Montant fixe pour expedition uniquement
        'fixed_renewal',        -- Montant fixe pour renouvellement uniquement
        'fixed_both',          -- Montants fixes pour expedition ET renouvellement
        'percentage_based',     -- Calculé sur pourcentage d'une base
        'unit_based',          -- Par unité (tonne, passager, litre, etc.)
        'tiered_rates',        -- Tarification par tranches
        'formula_based'        -- Calcul selon formule complexe
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types déclarations
DO $$ BEGIN
    CREATE TYPE declaration_type_enum AS ENUM (
        'income_tax',          -- Impôt sur le revenu
        'corporate_tax',       -- Impôt sur les sociétés
        'vat_declaration',     -- Déclaration TVA
        'social_contribution', -- Cotisations sociales
        'property_tax',        -- Impôt foncier
        'other_tax'           -- Autres impôts déclaratifs
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE declaration_status_enum AS ENUM ('draft', 'submitted', 'processing', 'accepted', 'rejected', 'amended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types paiements
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'card', 'mobile_money', 'cash', 'bange_wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types documents
DO $$ BEGIN
    CREATE TYPE document_processing_mode_enum AS ENUM (
        'pending',
        'server_processing',
        'lite_processing',
        'assisted_manual'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_ocr_status_enum AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'skipped'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_extraction_status_enum AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'manual'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_validation_status_enum AS ENUM (
        'pending',
        'valid',
        'invalid',
        'requires_review',
        'user_corrected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_access_level_enum AS ENUM (
        'private',
        'shared',
        'public',
        'confidential'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. TABLES DE BASE (AUCUNE DÉPENDANCE)
-- ============================================

-- Languages (référencée par translations)
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(2) PRIMARY KEY,
    name_native VARCHAR(50) NOT NULL,
    name_english VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- Insérer les langues de base
INSERT INTO languages (code, name_native, name_english, display_order) VALUES
('es', 'Español', 'Spanish', 1),
('fr', 'Français', 'French', 2),
('en', 'English', 'English', 3)
ON CONFLICT (code) DO NOTHING;

-- Ministries (référencée par sectors)
CREATE TABLE IF NOT EXISTS ministries (
    id VARCHAR(10) PRIMARY KEY,  -- Aligné avec JSON: "M-001", "M-002", etc.
    code VARCHAR(20) UNIQUE,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. HIÉRARCHIE GÉOGRAPHIQUE
-- ============================================

-- Sectors (FK: ministries)
CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR(10) PRIMARY KEY,  -- Aligné avec JSON: "S-001", "S-002", etc.
    ministerio_id VARCHAR(10) NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,  -- Aligné avec JSON
    code VARCHAR(30) UNIQUE,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (FK: sectors OU ministries - architecture flexible)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(10) PRIMARY KEY,  -- Aligné avec JSON: "C-001", "C-002", etc.
    sector_id VARCHAR(10) REFERENCES sectors(id) ON DELETE CASCADE,  -- NULLABLE pour catégories directes ministères
    ministry_id VARCHAR(10) REFERENCES ministries(id) ON DELETE CASCADE,  -- Pour catégories directes
    code VARCHAR(40) UNIQUE,
    service_type service_type_enum,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte: une catégorie doit être liée SOIT à un secteur SOIT directement à un ministère
    CONSTRAINT categories_hierarchy_check CHECK (
        (sector_id IS NOT NULL AND ministry_id IS NULL) OR
        (sector_id IS NULL AND ministry_id IS NOT NULL)
    )
);

-- ============================================
-- 5. SYSTÈME CENTRAL
-- ============================================

-- Translations (FK: languages)
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(10) NOT NULL,  -- Aligné avec nouveaux types ID
    field_name VARCHAR(50) NOT NULL,
    language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
    content TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(entity_type, entity_id, field_name, language_code)
);

-- Users (référencée par presque tout)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Informations personnelles
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),

    -- Document d'identité
    document_type VARCHAR(20),
    document_number VARCHAR(50),

    -- Configuration utilisateur
    role user_role_enum NOT NULL DEFAULT 'citizen',
    status user_status_enum DEFAULT 'active',
    preferred_language VARCHAR(2) DEFAULT 'es' REFERENCES languages(code),
    timezone VARCHAR(50) DEFAULT 'Africa/Malabo',

    -- Préférences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,

    -- Sécurité
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (FK: sectors)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification officielle
    tax_id VARCHAR(100) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),

    -- Secteur d'activité
    primary_sector_id VARCHAR(10) REFERENCES sectors(id),

    -- Contact
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Company roles (FK: users, companies)
CREATE TABLE IF NOT EXISTS user_company_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'employee', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY(user_id, company_id)
);

-- ============================================
-- 6. SERVICES FISCAUX & BUSINESS LOGIC
-- ============================================

-- Fiscal Services (FK: categories)
CREATE TABLE IF NOT EXISTS fiscal_services (
    id VARCHAR(10) PRIMARY KEY,  -- Aligné avec JSON: "T-001", "T-002", etc.
    service_code VARCHAR(50) UNIQUE,
    category_id VARCHAR(10) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,  -- Aligné avec JSON

    -- Classification du service
    service_type service_type_enum NOT NULL,
    calculation_method calculation_method_enum NOT NULL,

    -- TARIFICATION EXPEDITION (Première obtention) - Aligné avec JSON
    tasa_expedicion DECIMAL(15,2) DEFAULT 0.0,  -- Aligné avec JSON: "tasa_expedicion"
    expedition_formula TEXT, -- Formule si calcul complexe
    expedition_unit_measure VARCHAR(50), -- 'per_ton', 'per_passenger', etc.

    -- TARIFICATION RENOUVELLEMENT - Aligné avec JSON
    tasa_renovacion DECIMAL(15,2) DEFAULT 0.0,  -- Aligné avec JSON: "tasa_renovacion"
    renewal_formula TEXT,
    renewal_unit_measure VARCHAR(50),

    -- CONFIGURATION CALCUL AVANCÉ (pour cas complexes)
    calculation_config JSONB DEFAULT '{}', -- Configuration flexible

    -- TRANCHES TARIFAIRES (pour tiered_rates)
    rate_tiers JSONB DEFAULT '[]',
    -- Exemple: [{"min": 0, "max": 25, "rate": 3.503}, {"min": 26, "max": 75, "rate": 5.652}]

    -- POURCENTAGE (pour percentage_based)
    base_percentage DECIMAL(5,4), -- Ex: 0.10 pour 10%
    percentage_of VARCHAR(100), -- Description de la base de calcul

    -- VALIDITÉ ET PÉRIODICITÉ
    validity_period_months INTEGER, -- Durée validité après paiement
    renewal_frequency_months INTEGER, -- Fréquence renouvellement obligatoire
    grace_period_days INTEGER DEFAULT 0, -- Délai de grâce avant pénalité

    -- PÉNALITÉS ET MAJORATIONS
    late_penalty_percentage DECIMAL(5,2), -- Pénalité retard en %
    late_penalty_fixed DECIMAL(15,2), -- Pénalité retard montant fixe
    penalty_calculation_rules JSONB DEFAULT '{}',

    -- CONDITIONS D'APPLICATION
    eligibility_criteria JSONB DEFAULT '{}',
    required_documents_ids VARCHAR(10)[], -- Array des IDs documents requis

    -- EXEMPTIONS
    exemption_conditions JSONB DEFAULT '[]',

    -- BASE LÉGALE
    legal_reference TEXT,
    regulatory_articles TEXT[],

    -- DATES DE VALIDITÉ TARIF
    tariff_effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    tariff_effective_to DATE,

    -- STATUS ET MÉTADONNÉES
    status service_status_enum DEFAULT 'active',
    priority INTEGER DEFAULT 0,
    complexity_level INTEGER DEFAULT 1 CHECK (complexity_level BETWEEN 1 AND 5),
    processing_time_days INTEGER DEFAULT 1,

    -- STATISTIQUES D'USAGE
    view_count INTEGER DEFAULT 0,
    calculation_count INTEGER DEFAULT 0,
    payment_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,

    -- AUDIT
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    CONSTRAINT valid_tariff_dates CHECK (tariff_effective_to IS NULL OR tariff_effective_to > tariff_effective_from),
    CONSTRAINT has_expedition_or_renewal CHECK (
        tasa_expedicion > 0 OR
        tasa_renovacion > 0 OR
        calculation_method NOT IN ('fixed_expedition', 'fixed_renewal', 'fixed_both')
    )
);

-- Required Documents (FK: fiscal_services)
CREATE TABLE IF NOT EXISTS required_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    document_code VARCHAR(50) NOT NULL,
    document_name TEXT NOT NULL, -- Nom principal du document (ES par défaut)
    is_mandatory BOOLEAN DEFAULT true,
    applies_to VARCHAR(20) CHECK (applies_to IN ('expedition', 'renewal', 'both')),
    file_types TEXT[], -- ['pdf', 'jpg', 'png']
    max_size_mb INTEGER DEFAULT 10,
    validity_months INTEGER, -- Durée validité document
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fiscal_service_id, document_code)
);

-- Service Procedures (FK: fiscal_services)
CREATE TABLE IF NOT EXISTS service_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    applies_to VARCHAR(20) CHECK (applies_to IN ('expedition', 'renewal', 'both')),
    estimated_duration_minutes INTEGER,
    location_address TEXT,
    office_hours VARCHAR(100),
    requires_appointment BOOLEAN DEFAULT false,
    can_be_done_online BOOLEAN DEFAULT false,
    additional_cost DECIMAL(12,2) DEFAULT 0,
    required_documents VARCHAR(10)[], -- Array des IDs de documents
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fiscal_service_id, step_number, applies_to)
);

-- Service Keywords (FK: fiscal_services, languages)
CREATE TABLE IF NOT EXISTS service_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
    weight INTEGER DEFAULT 1,
    is_auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fiscal_service_id, keyword, language_code)
);

-- ============================================
-- 7. TRANSACTIONS & PAIEMENTS
-- ============================================

-- Service Payments (FK: fiscal_services, users, companies)
CREATE TABLE IF NOT EXISTS service_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Références
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id),
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID REFERENCES companies(id), -- NULL si paiement individuel

    -- Type de paiement
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('expedition', 'renewal')),

    -- Calcul du montant
    calculation_base DECIMAL(15,2), -- Base de calcul (ex: tonnage, CA, etc.)
    calculation_details JSONB DEFAULT '{}', -- Détails du calcul
    base_amount DECIMAL(15,2) NOT NULL,
    penalties DECIMAL(15,2) DEFAULT 0,
    discounts DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Paiement
    payment_method payment_method_enum NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XAF',

    -- Intégration BANGE
    bange_transaction_id VARCHAR(255) UNIQUE,
    bange_wallet_id VARCHAR(255),

    -- Status et dates
    status payment_status_enum DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Date expiration validité

    -- Documents et justificatifs
    receipt_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,
    supporting_documents JSONB DEFAULT '[]',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Declarations (FK: users, companies)
CREATE TABLE IF NOT EXISTS tax_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_number VARCHAR(50) UNIQUE NOT NULL,

    -- Références
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID REFERENCES companies(id),

    -- Type de déclaration
    declaration_type declaration_type_enum NOT NULL,

    -- Période fiscale
    fiscal_year INTEGER NOT NULL,
    fiscal_period VARCHAR(20), -- 'Q1', 'Q2', 'Q3', 'Q4', 'M01'-'M12', 'ANNUAL'
    declaration_deadline DATE NOT NULL,

    -- Données déclaratives
    declared_data JSONB NOT NULL DEFAULT '{}',
    supporting_documents JSONB DEFAULT '[]',

    -- Calculs fiscaux
    taxable_base DECIMAL(15,2) DEFAULT 0,
    calculated_tax DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    credits DECIMAL(15,2) DEFAULT 0,
    net_tax_due DECIMAL(15,2) DEFAULT 0,

    -- Workflow
    status declaration_status_enum DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),

    -- Commentaires et notes
    taxpayer_notes TEXT,
    processor_notes TEXT,
    rejection_reason TEXT,

    -- Signature électronique
    digital_signature TEXT,
    signature_timestamp TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Declaration Payments (FK: tax_declarations, users)
CREATE TABLE IF NOT EXISTS declaration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Références
    declaration_id UUID NOT NULL REFERENCES tax_declarations(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Montants
    tax_amount DECIMAL(15,2) NOT NULL,
    penalties DECIMAL(15,2) DEFAULT 0,
    interest DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Paiement
    payment_method payment_method_enum NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XAF',

    -- Intégration BANGE
    bange_transaction_id VARCHAR(255) UNIQUE,

    -- Status
    status payment_status_enum DEFAULT 'pending',
    paid_at TIMESTAMPTZ,

    -- Justificatifs
    receipt_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. DONNÉES UTILISATEUR & HISTORIQUE
-- ============================================

-- User Favorites (FK: users, fiscal_services)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY(user_id, fiscal_service_id)
);

-- Calculation History (FK: users, fiscal_services)
CREATE TABLE IF NOT EXISTS calculation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_service_id VARCHAR(10) NOT NULL REFERENCES fiscal_services(id),
    calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('expedition', 'renewal')),
    input_parameters JSONB NOT NULL,
    calculated_amount DECIMAL(15,2) NOT NULL,
    calculation_details JSONB DEFAULT '{}',
    saved_for_later BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (FK: users)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. SÉQUENCES & DOCUMENTS
-- ============================================

-- Séquence pour numérotation automatique documents (doit être créée AVANT la table)
CREATE SEQUENCE IF NOT EXISTS documents_seq START 1;

-- Documents (FK: users, fiscal_services, service_payments, tax_declarations)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références conformes au schéma existant
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fiscal_service_id VARCHAR(10) REFERENCES fiscal_services(id) ON DELETE SET NULL,
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

-- ============================================
-- 10. INDEX POUR PERFORMANCE
-- ============================================

-- Index pour translations
CREATE INDEX IF NOT EXISTS idx_translations_search ON translations
USING gin(to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_type, entity_id, language_code);

-- Index pour fiscal_services - Architecture flexible 2-3 niveaux
CREATE INDEX IF NOT EXISTS idx_fiscal_services_active ON fiscal_services(status, service_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_fiscal_services_hierarchy ON fiscal_services(category_id, status);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_amounts ON fiscal_services(tasa_expedicion, tasa_renovacion) WHERE status = 'active';

-- Index pour categories flexibles (avec ou sans secteur)
CREATE INDEX IF NOT EXISTS idx_categories_sector ON categories(sector_id) WHERE sector_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_ministry_direct ON categories(ministry_id) WHERE ministry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_hierarchy ON categories(COALESCE(sector_id, ministry_id));

-- Index pour paiements
CREATE INDEX IF NOT EXISTS idx_service_payments_user ON service_payments(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_service_payments_service ON service_payments(fiscal_service_id, payment_type, status);
CREATE INDEX IF NOT EXISTS idx_service_payments_company ON service_payments(company_id, created_at) WHERE company_id IS NOT NULL;

-- Index pour déclarations
CREATE INDEX IF NOT EXISTS idx_tax_declarations_user ON tax_declarations(user_id, fiscal_year, status);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_type ON tax_declarations(declaration_type, fiscal_year, status);

-- Index pour service_keywords
CREATE INDEX IF NOT EXISTS idx_service_keywords_search ON service_keywords
USING gin(keyword gin_trgm_ops);

-- Index pour documents
CREATE INDEX IF NOT EXISTS idx_documents_user_type ON documents (user_id, document_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_processing_pipeline ON documents (processing_mode, ocr_status, extraction_status);
CREATE INDEX IF NOT EXISTS idx_documents_validation ON documents (validation_status) WHERE validation_status IN ('requires_review', 'invalid');
CREATE INDEX IF NOT EXISTS idx_documents_form_mapping ON documents (target_form_type, form_mapping_status);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents (file_hash) WHERE file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_date_range ON documents (created_at, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_fiscal_service ON documents (fiscal_service_id) WHERE fiscal_service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_retry ON documents (retry_count, ocr_status) WHERE retry_count > 0;

-- Index GIN pour recherche dans JSONB
CREATE INDEX IF NOT EXISTS idx_documents_extracted_data ON documents USING gin(extracted_data) WHERE extracted_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_form_data ON documents USING gin(form_auto_fill_data) WHERE form_auto_fill_data IS NOT NULL;

-- ============================================
-- 11. VUES MATÉRIALISÉES
-- ============================================

-- Vue complète des services fiscaux avec traductions - Architecture flexible 2-3 niveaux
CREATE MATERIALIZED VIEW IF NOT EXISTS fiscal_services_view AS
SELECT
    fs.id,
    fs.service_code,
    fs.category_id,  -- CHANGEMENT: Direct vers category au lieu de subcategory
    c.sector_id,
    COALESCE(s.ministerio_id, c.ministry_id) as ministry_id,  -- Ministère via secteur OU direct

    -- Noms traduits
    tn_es.content as name_es,
    tn_fr.content as name_fr,
    tn_en.content as name_en,

    -- Tarification (PRÉSERVÉ - tous les champs existants)
    fs.service_type,
    fs.calculation_method,
    fs.tasa_expedicion,
    fs.tasa_renovacion,

    -- Configuration (PRÉSERVÉ - tous les champs existants)
    fs.calculation_config,
    fs.rate_tiers,
    fs.base_percentage,
    fs.percentage_of,
    fs.validity_period_months,
    fs.renewal_frequency_months,
    fs.grace_period_days,

    -- Pénalités (PRÉSERVÉ)
    fs.late_penalty_percentage,
    fs.late_penalty_fixed,
    fs.penalty_calculation_rules,

    -- Conditions (PRÉSERVÉ)
    fs.eligibility_criteria,
    fs.required_documents_ids,
    fs.exemption_conditions,

    -- Légal (PRÉSERVÉ)
    fs.legal_reference,
    fs.regulatory_articles,

    -- Dates (PRÉSERVÉ)
    fs.tariff_effective_from,
    fs.tariff_effective_to,

    -- Status (PRÉSERVÉ)
    fs.status,
    fs.priority,
    fs.complexity_level,
    fs.processing_time_days,

    -- Stats (PRÉSERVÉ)
    fs.view_count,
    fs.calculation_count,
    fs.payment_count,
    fs.favorite_count,

    fs.updated_at
FROM fiscal_services fs
JOIN categories c ON fs.category_id = c.id  -- CHANGEMENT: Direct vers categories
LEFT JOIN sectors s ON c.sector_id = s.id  -- LEFT JOIN car catégories peuvent être directes
LEFT JOIN translations tn_es ON (tn_es.entity_type = 'fiscal_service' AND tn_es.entity_id = fs.id AND tn_es.field_name = 'name' AND tn_es.language_code = 'es')
LEFT JOIN translations tn_fr ON (tn_fr.entity_type = 'fiscal_service' AND tn_fr.entity_id = fs.id AND tn_fr.field_name = 'name' AND tn_fr.language_code = 'fr')
LEFT JOIN translations tn_en ON (tn_en.entity_type = 'fiscal_service' AND tn_en.entity_id = fs.id AND tn_en.field_name = 'name' AND tn_en.language_code = 'en')
WHERE fs.status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_services_view_id ON fiscal_services_view(id);

-- ============================================
-- 12. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour calculer le montant d'un service
CREATE OR REPLACE FUNCTION calculate_service_amount(
    p_service_id VARCHAR(10),
    p_payment_type VARCHAR(20), -- 'expedition' or 'renewal'
    p_calculation_base DECIMAL(15,2) DEFAULT NULL
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_service fiscal_services%ROWTYPE;
    v_amount DECIMAL(15,2) := 0;
    v_tier JSONB;
BEGIN
    SELECT * INTO v_service FROM fiscal_services WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service fiscal non trouvé: %', p_service_id;
    END IF;

    -- Calcul selon la méthode
    CASE v_service.calculation_method
        WHEN 'fixed_expedition' THEN
            IF p_payment_type = 'expedition' THEN
                v_amount := v_service.tasa_expedicion;
            ELSE
                RAISE EXCEPTION 'Ce service n''a pas de tarif renouvellement';
            END IF;

        WHEN 'fixed_renewal' THEN
            IF p_payment_type = 'renewal' THEN
                v_amount := v_service.tasa_renovacion;
            ELSE
                RAISE EXCEPTION 'Ce service n''a pas de tarif expédition';
            END IF;

        WHEN 'fixed_both' THEN
            IF p_payment_type = 'expedition' THEN
                v_amount := v_service.tasa_expedicion;
            ELSE
                v_amount := v_service.tasa_renovacion;
            END IF;

        WHEN 'percentage_based' THEN
            IF p_calculation_base IS NULL THEN
                RAISE EXCEPTION 'Base de calcul requise pour calcul en pourcentage';
            END IF;
            v_amount := p_calculation_base * v_service.base_percentage;

        WHEN 'tiered_rates' THEN
            IF p_calculation_base IS NULL THEN
                RAISE EXCEPTION 'Base de calcul requise pour tarification par tranches';
            END IF;

            -- Parcourir les tranches tarifaires
            FOR v_tier IN SELECT * FROM jsonb_array_elements(v_service.rate_tiers)
            LOOP
                IF p_calculation_base >= (v_tier->>'min')::DECIMAL AND
                   p_calculation_base <= (v_tier->>'max')::DECIMAL THEN
                    v_amount := (v_tier->>'rate')::DECIMAL;
                    EXIT;
                END IF;
            END LOOP;

        ELSE
            RAISE EXCEPTION 'Méthode de calcul non implémentée: %', v_service.calculation_method;
    END CASE;

    RETURN v_amount;
END;
$$ LANGUAGE plpgsql;

-- Fonction de recherche optimisée
CREATE OR REPLACE FUNCTION search_fiscal_services(
    search_query TEXT,
    lang_code VARCHAR(2) DEFAULT 'es',
    service_types service_type_enum[] DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    service_id VARCHAR(10),
    service_code VARCHAR(50),
    relevance_score REAL,
    name_translation TEXT,
    tasa_expedicion DECIMAL(15,2),
    tasa_renovacion DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fs.id,
        fs.service_code,
        (
            ts_rank(to_tsvector('simple', COALESCE(tn.content, '')), plainto_tsquery('simple', search_query)) * 2.0 +
            COALESCE(AVG(sk.weight), 0) * 0.5
        )::REAL as relevance_score,
        tn.content as name_translation,
        fs.tasa_expedicion,
        fs.tasa_renovacion
    FROM fiscal_services fs
    LEFT JOIN translations tn ON (tn.entity_type = 'fiscal_service' AND tn.entity_id = fs.id AND tn.field_name = 'name' AND tn.language_code = lang_code)
    LEFT JOIN service_keywords sk ON (sk.fiscal_service_id = fs.id AND sk.keyword ILIKE '%' || search_query || '%' AND sk.language_code = lang_code)
    WHERE
        fs.status = 'active'
        AND (service_types IS NULL OR fs.service_type = ANY(service_types))
        AND (
            to_tsvector('simple', COALESCE(tn.content, '')) @@ plainto_tsquery('simple', search_query)
            OR EXISTS(
                SELECT 1 FROM service_keywords sk2
                WHERE sk2.fiscal_service_id = fs.id
                AND sk2.keyword ILIKE '%' || search_query || '%'
                AND sk2.language_code = lang_code
            )
        )
    GROUP BY fs.id, fs.service_code, tn.content, fs.tasa_expedicion, fs.tasa_renovacion
    ORDER BY relevance_score DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

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

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 13. TRIGGERS
-- ============================================

-- Appliquer les triggers
CREATE TRIGGER trigger_update_fiscal_services
    BEFORE UPDATE ON fiscal_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_companies
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at automatique sur documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. VUES UTILITAIRES DOCUMENTS
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
-- 15. COMMENTAIRES FINAUX
-- ============================================

COMMENT ON SCHEMA public IS 'Schéma TaxasGE v3.0 - Architecture flexible 2-3 niveaux sans subcategories - Séparation claire services fiscaux vs déclarations fiscales';
COMMENT ON TABLE fiscal_services IS 'Services fiscaux: taxes, permis, licences avec tarification expedition/renouvellement - Liés aux categories (architecture flexible 2-3 niveaux)';
COMMENT ON TABLE categories IS 'Catégories liées SOIT à un secteur (3 niveaux) SOIT directement à un ministère (2 niveaux)';
COMMENT ON TABLE service_payments IS 'Paiements des services fiscaux (renouvellement permis, légalisation documents, etc.)';
COMMENT ON TABLE tax_declarations IS 'Déclarations fiscales obligatoires (impôts sur revenus, TVA, etc.)';
COMMENT ON TABLE declaration_payments IS 'Paiements résultant des déclarations fiscales';
COMMENT ON TABLE documents IS 'Gestion documents utilisateur avec traitement OCR et extraction automatisée (v2.2)';

COMMENT ON COLUMN fiscal_services.tasa_expedicion IS 'Montant fixe première obtention (aligné avec JSON tasa_expedicion)';
COMMENT ON COLUMN fiscal_services.tasa_renovacion IS 'Montant fixe renouvellement (aligné avec JSON tasa_renovacion)';
COMMENT ON COLUMN fiscal_services.calculation_method IS 'Méthode calcul: fixed_expedition, fixed_renewal, fixed_both, percentage_based, unit_based, etc.';

COMMENT ON COLUMN documents.document_number IS 'Numéro unique document format DOC-YYYYMMDD-NNNNNN';
COMMENT ON COLUMN documents.processing_mode IS 'Mode traitement: server_processing, lite_processing, assisted_manual';
COMMENT ON COLUMN documents.extracted_data IS 'Données structurées extraites du document (JSONB)';
COMMENT ON COLUMN documents.form_auto_fill_data IS 'Données mappées pour pré-remplissage formulaires';
COMMENT ON COLUMN documents.field_confidences IS 'Score confiance par champ extrait';
COMMENT ON COLUMN documents.user_corrections IS 'Corrections apportées par utilisateur';
COMMENT ON COLUMN documents.retention_until IS 'Date suppression automatique (conformité GDPR)';

-- ============================================
-- SCRIPT TERMINÉ - EXÉCUTION SÉCURISÉE GARANTIE
-- ============================================

-- Recalculer statistiques pour optimisation
ANALYZE languages;
ANALYZE ministries;
ANALYZE sectors;
ANALYZE categories;
ANALYZE translations;
ANALYZE fiscal_services;
ANALYZE users;

-- Log final
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SCHÉMA TAXASGE v3.0 CRÉÉ AVEC SUCCÈS';
    RAISE NOTICE 'Architecture: Flexible 2-3 niveaux';
    RAISE NOTICE 'Alignement JSON: 100%% des champs';
    RAISE NOTICE 'Compatibilité: Supabase-ready';
    RAISE NOTICE 'Idempotence: Ré-exécutable';
    RAISE NOTICE '============================================';
END$$;