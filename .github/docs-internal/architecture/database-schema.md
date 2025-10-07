# 📊 DATABASE SCHEMA - TAXASGE POSTGRESQL
*Basé sur le schéma de production `taxasge_database_schema.sql`*

**Auteur :** Kouemou Sah Jean Emac
**Date :** 25 septembre 2025
**Version :** 2.1 - Correction Conceptuelle Majeure
**Base de Données :** PostgreSQL 15 + Supabase
**Schéma Source :** `data/taxasge_database_schema.sql`

---

## 🎯 **VUE D'ENSEMBLE BASE DE DONNÉES**

### 📊 **Métriques Cibles**
- **Volume** : 1M+ utilisateurs, 10M+ transactions
- **Performance** : Requêtes < 50ms (95e percentile)
- **Disponibilité** : 99.99% avec réplication multi-AZ
- **Sécurité** : Chiffrement au repos + en transit, audit complet

### 🏗️ **Architecture Données**
```yaml
Database: PostgreSQL 15.4
Hosting: Supabase (managed PostgreSQL)
Réplication: Master-Slave (2 répliques lecture)
Backup: Automatique daily + PITR
Extensions: pgcrypto, uuid-ossp, pg_trgm, btree_gin
```

---

## 📊 **ARCHITECTURE FISCALE SÉPARÉE**

### 💡 **Concept Clé : Services Fiscaux ≠ Déclarations Fiscales**
Le schéma corrigé fait une distinction fondamentale :
- **`fiscal_services`** : Catalogue des 547 services avec tarification (T-470, etc.)
- **`tax_declarations`** : Déclarations obligatoires (impôts revenus, TVA, etc.)
- **`service_payments`** : Paiements de services (permis, légalisations)
- **`declaration_payments`** : Paiements résultant des déclarations

---

## 📋 **SCHÉMA COMPLET TABLES**

### 👥 **GESTION UTILISATEURS & AUTHENTIFICATION**

#### **Table: `users`**
```sql
CREATE TABLE users (
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

CREATE TYPE user_role_enum AS ENUM ('citizen', 'business', 'accountant', 'admin', 'dgi_agent');
CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'pending_verification', 'deactivated');

-- Index optimisés
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role_status ON users(role, status);
```

---

### 🏛️ **STRUCTURE HIÉRARCHIQUE & RÉFÉRENTIELS**

#### **Tables de Référence : Ministères → Secteurs → Catégories → Sous-catégories**

```sql
-- Langues supportées
CREATE TABLE languages (
    code VARCHAR(2) PRIMARY KEY,
    name_native VARCHAR(50) NOT NULL,
    name_english VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

INSERT INTO languages (code, name_native, name_english, display_order) VALUES
('es', 'Español', 'Spanish', 1),
('fr', 'Français', 'French', 2),
('en', 'English', 'English', 3);

-- Ministères
CREATE TABLE ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secteurs
CREATE TABLE sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catégories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    code VARCHAR(40) UNIQUE NOT NULL,
    service_type service_type_enum NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sous-catégories
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    applicable_to VARCHAR(20) CHECK (applicable_to IN ('individual', 'business', 'both')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Système de traductions centralisé
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
    content TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(entity_type, entity_id, field_name, language_code)
);

CREATE INDEX idx_translations_search ON translations
USING gin(to_tsvector('simple', content));
```

---

### 💼 **SERVICES FISCAUX (CATALOGUE 547 SERVICES)**

#### **Table: `fiscal_services`** - Services Fiscaux avec Tarification
```sql
CREATE TABLE fiscal_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) UNIQUE NOT NULL, -- Ex: T-470 from JSON
    subcategory_id UUID NOT NULL REFERENCES subcategories(id),

    -- Classification du service
    service_type service_type_enum NOT NULL,
    calculation_method calculation_method_enum NOT NULL,

    -- TARIFICATION EXPEDITION (Première obtention)
    expedition_amount DECIMAL(15,2) DEFAULT 0.0,
    expedition_formula TEXT, -- Formule si calcul complexe
    expedition_unit_measure VARCHAR(50), -- 'per_ton', 'per_passenger', etc.

    -- TARIFICATION RENOUVELLEMENT
    renewal_amount DECIMAL(15,2) DEFAULT 0.0,
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
    required_documents_ids UUID[], -- Array des IDs documents requis

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
        expedition_amount > 0 OR
        renewal_amount > 0 OR
        calculation_method NOT IN ('fixed_expedition', 'fixed_renewal', 'fixed_both')
    )
);

-- Types ENUM pour Services Fiscaux
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

CREATE TYPE calculation_method_enum AS ENUM (
    'fixed_expedition',     -- Montant fixe pour expedition uniquement
    'fixed_renewal',        -- Montant fixe pour renouvellement uniquement
    'fixed_both',          -- Montants fixes pour expedition ET renouvellement
    'percentage_based',     -- Calculé sur pourcentage d'une base
    'unit_based',          -- Par unité (tonne, passager, litre, etc.)
    'tiered_rates',        -- Tarification par tranches
    'formula_based'        -- Calcul selon formule complexe
);

CREATE TYPE service_status_enum AS ENUM ('active', 'inactive', 'draft', 'deprecated');

-- Index optimisés pour fiscal_services
CREATE INDEX idx_fiscal_services_active ON fiscal_services(status, service_type) WHERE status = 'active';
CREATE INDEX idx_fiscal_services_hierarchy ON fiscal_services(subcategory_id, status);
CREATE INDEX idx_fiscal_services_amounts ON fiscal_services(expedition_amount, renewal_amount) WHERE status = 'active';
```

---

### 📋 **DÉCLARATIONS FISCALES (SÉPARÉES DES SERVICES)**

#### **Table: `tax_declarations`** - Déclarations Obligatoires
```sql
CREATE TABLE tax_declarations (
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

CREATE TYPE declaration_type_enum AS ENUM (
    'income_tax',          -- Impôt sur le revenu
    'corporate_tax',       -- Impôt sur les sociétés
    'vat_declaration',     -- Déclaration TVA
    'social_contribution', -- Cotisations sociales
    'property_tax',        -- Impôt foncier
    'other_tax'           -- Autres impôts déclaratifs
);

CREATE TYPE declaration_status_enum AS ENUM ('draft', 'submitted', 'processing', 'accepted', 'rejected', 'amended');

-- Index optimisés
CREATE INDEX idx_tax_declarations_user ON tax_declarations(user_id, fiscal_year, status);
CREATE INDEX idx_tax_declarations_type ON tax_declarations(declaration_type, fiscal_year, status);
```

---

### 💳 **SYSTÈME DE PAIEMENTS DUAL**

#### **Table: `service_payments`** - Paiements Services Fiscaux
```sql
CREATE TABLE service_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Références
    fiscal_service_id UUID NOT NULL REFERENCES fiscal_services(id),
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
```

#### **Table: `declaration_payments`** - Paiements Déclarations Fiscales
```sql
CREATE TABLE declaration_payments (
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

CREATE TYPE payment_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'card', 'mobile_money', 'cash', 'bange_wallet');

-- Index optimisés pour paiements
CREATE INDEX idx_service_payments_user ON service_payments(user_id, status, created_at);
CREATE INDEX idx_service_payments_service ON service_payments(fiscal_service_id, payment_type, status);
CREATE INDEX idx_declaration_payments_user ON declaration_payments(user_id, created_at);
```

---

### 🏢 **GESTION DES ENTREPRISES**

#### **Table: `companies`**
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification officielle
    tax_id VARCHAR(100) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),

    -- Secteur d'activité
    primary_sector_id UUID REFERENCES sectors(id),

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

-- Liaison utilisateurs-entreprises
CREATE TABLE user_company_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'employee', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY(user_id, company_id)
);
```

---

### 🤖 **ASSISTANT IA & CONVERSATIONS**

#### **Table: `ai_conversations`**
```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Session
    session_id UUID NOT NULL,
    titre VARCHAR(255),
    contexte JSONB, -- Contexte de la conversation

    -- Métadonnées
    langue VARCHAR(2) DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    messages_count INTEGER DEFAULT 0,

    -- Évaluation
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    feedback TEXT
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);
```

#### **Table: `ai_messages`**
```sql
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,

    -- Message
    role message_role NOT NULL, -- 'user' ou 'assistant'
    contenu TEXT NOT NULL,
    metadata JSONB, -- Informations supplémentaires

    -- IA Processing
    tokens_input INTEGER,
    tokens_output INTEGER,
    model_utilise VARCHAR(50),
    confidence_score DECIMAL(3,2), -- 0.00 à 1.00

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processing_duration_ms INTEGER, -- Temps de traitement IA

    -- Actions suggérées
    actions_proposees JSONB -- Actions que l'IA suggère
);

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
```

---

### 📢 **NOTIFICATIONS & COMMUNICATIONS**

#### **Table: `notifications`**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Contenu
    type_notification notification_type NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    donnees JSONB, -- Données structurées pour actions

    -- Canaux
    envoye_email BOOLEAN DEFAULT FALSE,
    envoye_sms BOOLEAN DEFAULT FALSE,
    envoye_push BOOLEAN DEFAULT FALSE,

    -- Statut
    lu BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMPTZ,
    archive BOOLEAN DEFAULT FALSE,

    -- Priorité et catégorie
    priorite notification_priority DEFAULT 'normale',
    categorie VARCHAR(50),

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expire_at TIMESTAMPTZ,

    -- Actions
    actions JSONB, -- Boutons d'action dans la notification

    CONSTRAINT notifications_lecture_check CHECK (
        (lu = FALSE AND date_lecture IS NULL) OR
        (lu = TRUE AND date_lecture IS NOT NULL)
    )
);

CREATE TYPE notification_type AS ENUM (
    'declaration_soumise', 'declaration_validee', 'declaration_rejetee',
    'paiement_requis', 'paiement_confirme', 'paiement_echec',
    'echeance_proche', 'document_manquant', 'mise_a_jour_systeme'
);
CREATE TYPE notification_priority AS ENUM ('basse', 'normale', 'haute', 'urgente');

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type_notification);
CREATE INDEX idx_notifications_lu ON notifications(lu);
```

---

### 📈 **FONCTIONS MÉTIER AVANCÉES**

#### **Fonction: Calcul Montant Service**
```sql
-- Fonction pour calculer le montant d'un service
CREATE OR REPLACE FUNCTION calculate_service_amount(
    p_service_id UUID,
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
                v_amount := v_service.expedition_amount;
            ELSE
                RAISE EXCEPTION 'Ce service n''a pas de tarif renouvellement';
            END IF;

        WHEN 'fixed_both' THEN
            IF p_payment_type = 'expedition' THEN
                v_amount := v_service.expedition_amount;
            ELSE
                v_amount := v_service.renewal_amount;
            END IF;

        WHEN 'percentage_based' THEN
            IF p_calculation_base IS NULL THEN
                RAISE EXCEPTION 'Base de calcul requise pour calcul en pourcentage';
            END IF;
            v_amount := p_calculation_base * v_service.base_percentage;

        WHEN 'tiered_rates' THEN
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
```

#### **Fonction: Recherche Services Fiscaux**
```sql
CREATE OR REPLACE FUNCTION search_fiscal_services(
    search_query TEXT,
    lang_code VARCHAR(2) DEFAULT 'es',
    service_types service_type_enum[] DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    service_id UUID,
    service_code VARCHAR(50),
    relevance_score REAL,
    name_translation TEXT,
    expedition_amount DECIMAL(15,2),
    renewal_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fs.id,
        fs.service_code,
        ts_rank(to_tsvector('simple', COALESCE(tn.content, '')), plainto_tsquery('simple', search_query))::REAL as relevance_score,
        tn.content as name_translation,
        fs.expedition_amount,
        fs.renewal_amount
    FROM fiscal_services fs
    LEFT JOIN translations tn ON (tn.entity_type = 'fiscal_service' AND tn.entity_id = fs.id AND tn.field_name = 'name' AND tn.language_code = lang_code)
    WHERE
        fs.status = 'active'
        AND (service_types IS NULL OR fs.service_type = ANY(service_types))
        AND to_tsvector('simple', COALESCE(tn.content, '')) @@ plainto_tsquery('simple', search_query)
    ORDER BY relevance_score DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;
```

---

### 🔍 **AUDIT & LOGS**

#### **Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
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

-- Index optimisés
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🚀 **OPTIMISATIONS PERFORMANCE**

### 📊 **Index Composites Avancés**
```sql
-- Recherche services fiscaux avec filtres multiples
CREATE INDEX idx_fiscal_services_filters ON fiscal_services(status, service_type, subcategory_id) WHERE status = 'active';

-- Paiements par utilisateur et période
CREATE INDEX idx_service_payments_user_period ON service_payments(user_id, created_at DESC) WHERE status = 'completed';
```

### 📊 **Vues Matérialisées**
```sql
-- Vue complète des services fiscaux avec traductions
CREATE MATERIALIZED VIEW fiscal_services_view AS
SELECT
    fs.id,
    fs.service_code,
    fs.subcategory_id,
    sc.category_id,
    c.sector_id,
    s.ministry_id,

    -- Noms traduits
    tn_es.content as name_es,
    tn_fr.content as name_fr,
    tn_en.content as name_en,

    -- Tarification
    fs.service_type,
    fs.calculation_method,
    fs.expedition_amount,
    fs.renewal_amount,

    -- Status
    fs.status,
    fs.complexity_level,
    fs.processing_time_days,

    -- Stats
    fs.view_count,
    fs.payment_count,

    fs.updated_at
FROM fiscal_services fs
JOIN subcategories sc ON fs.subcategory_id = sc.id
JOIN categories c ON sc.category_id = c.id
JOIN sectors s ON c.sector_id = s.id
LEFT JOIN translations tn_es ON (tn_es.entity_type = 'fiscal_service' AND tn_es.entity_id = fs.id AND tn_es.field_name = 'name' AND tn_es.language_code = 'es')
LEFT JOIN translations tn_fr ON (tn_fr.entity_type = 'fiscal_service' AND tn_fr.entity_id = fs.id AND tn_fr.field_name = 'name' AND tn_fr.language_code = 'fr')
LEFT JOIN translations tn_en ON (tn_en.entity_type = 'fiscal_service' AND tn_en.entity_id = fs.id AND tn_en.field_name = 'name' AND tn_en.language_code = 'en')
WHERE fs.status = 'active';

CREATE UNIQUE INDEX idx_fiscal_services_view_id ON fiscal_services_view(id);
```

---

## 🔒 **SÉCURITÉ : Row Level Security (RLS)**

### 🛡️ **Politiques de Sécurité**
```sql
-- Activer RLS sur les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;

-- Politique: Utilisateurs ne voient que leurs données
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY declarations_own_data ON tax_declarations
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY payments_own_data ON service_payments
    FOR ALL
    USING (auth.uid() = user_id);
```

### 🔐 **Chiffrement Données Sensibles**
```sql
-- Extension pour chiffrement
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction chiffrement/déchiffrement
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, 'secret_key', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **MÉTRIQUES & MONITORING**

### 🏥 **KPIs Base de Données**
```sql
-- Vue monitoring performance
CREATE VIEW v_database_health AS
SELECT
    'active_connections' as metric,
    count(*) as value
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT
    'slow_queries',
    count(*)
FROM pg_stat_statements
WHERE mean_exec_time > 1000; -- > 1 seconde
```

### 🔧 **Maintenance Automatique**
```sql
-- Fonction nettoyage sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 **CONCLUSION SCHÉMA**

### ✅ **Points Forts Architecture**
- **Séparation conceptuelle claire** : Services fiscaux ≠ Déclarations fiscales
- **Tarification flexible** : Support expédition/renouvellement avec méthodes de calcul avancées
- **Système hiérarchique** : Ministères → Secteurs → Catégories → Sous-catégories
- **Multi-langue** : Support natif Español, Français, English
- **Paiements dual** : Services fiscaux ET déclarations fiscales
- **Sécurité** : RLS, chiffrement, audit complet
- **Performance** : Index optimisés, vues matérialisées, fonctions métier

### 🎯 **Prêt pour Production**
Le schéma `taxasge_database_schema.sql` fournit une architecture robuste pour gérer les 547 services fiscaux avec leurs tarifications complexes, tout en maintenant une séparation claire avec le système déclaratif traditionnel.

---

*Documentation Database Schema basée sur `taxasge_database_schema.sql`*
*Version: 2.1 - Status: Production Ready*

**Auteur :** Kouemou Sah Jean Emac
**Database Schema :** Correctement Documenté selon Schéma de Production