-- ============================================
-- SCHÉMA TAXASGE v3.4 - FINAL COMPLET
-- Traductions dénormalisées + Agents ministériels  
-- Architecture optimisée performance et simplicité
-- Date: 10 octobre 2025
-- ============================================

-- ============================================
-- 1. EXTENSIONS POSTGRESQL
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TYPES ÉNUMÉRÉS
-- ============================================

-- Types utilisateur
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('citizen', 'business', 'accountant', 'admin', 'dgi_agent', 'ministry_agent');
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

-- Types workflow agents
DO $$ BEGIN
    CREATE TYPE payment_workflow_status AS ENUM (
        'submitted',              -- Soumis par utilisateur
        'auto_processing',        -- En cours validation automatique
        'auto_approved',          -- Approuvé automatiquement
        'pending_agent_review',   -- En attente révision agent
        'locked_by_agent',        -- VERROUILLÉ par agent (travail en cours)
        'agent_reviewing',        -- Agent en cours révision
        'requires_documents',     -- Documents complémentaires requis
        'docs_resubmitted',       -- Documents re-soumis par utilisateur
        'approved_by_agent',      -- Approuvé par agent
        'rejected_by_agent',      -- Rejeté par agent avec motif
        'escalated_supervisor',   -- Escaladé au superviseur
        'supervisor_reviewing',   -- Superviseur en révision
        'completed',              -- Traitement terminé avec succès
        'cancelled_by_user',      -- Annulé par utilisateur
        'cancelled_by_agent',     -- Annulé par agent
        'expired'                 -- Expiré (délai dépassé)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_action_type AS ENUM (
        'lock_for_review',        -- Verrouiller pour révision
        'approve',                -- Approuver la demande
        'reject',                 -- Rejeter avec motif
        'request_documents',      -- Demander documents complémentaires
        'add_comment',            -- Ajouter commentaire
        'escalate',               -- Escalader au superviseur
        'unlock_release',         -- Déverrouiller et libérer
        'assign_to_colleague'     -- Réassigner à collègue
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE escalation_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types déclarations *** MISE À JOUR v3.4 ***
DO $$ BEGIN
    CREATE TYPE declaration_type_enum AS ENUM (
        'income_tax',          -- Impôt sur le revenu
        'corporate_tax',       -- Impôt sur les sociétés
        'vat_declaration',     -- Déclaration TVA
        'social_contribution', -- Cotisations sociales
        'property_tax',        -- Impôt foncier
        'other_tax',          -- Autres impôts déclaratifs
        'settlement_voucher',                         -- Impreso de Liquidación
        'minimum_fiscal_contribution',               -- Cuota Mínima Fiscal
        'withheld_vat',                             -- IVA Destajo
        'actual_vat',                               -- IVA Real
        'petroleum_products_tax',                   -- Impuesto sobre Productos Petroleros
        'petroleum_products_tax_ivs',               -- Impuesto sobre Productos Petroleros (IVS)
        'wages_tax_oil_mining',                     -- Impuesto sobre Sueldos y Salarios Sector Petrolero y Minero
        'wages_tax_common_sector',                  -- Impuesto sobre Sueldos y Salarios Sector Común
        'common_voucher',                           -- Impreso Común
        'withholding_3pct_oil_mining_residents',    -- Retención 3% Residentes Petrolero y Minero
        'withholding_10pct_common_residents',       -- Retención 10% Residentes Sector Común
        'withholding_5pct_oil_mining_residents',    -- Retención 5% Residentes Petrolero y Minero
        'minimum_fiscal_oil_mining',                -- Cuota Mínima Fiscal Petrolera y Minera
        'withholding_10pct_oil_mining_nonresidents' -- Retención 10% No Residentes Petrolero y Minero
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
-- RESTE DU SCHÉMA INCHANGÉ
-- (Tables, contraintes, index, etc.)
-- ============================================

/*
CHANGELOG v3.4 - MISE À JOUR declaration_type_enum

✅ NOUVEAUX TYPES AJOUTÉS (14 types) :
1. settlement_voucher - Impreso de Liquidación / Bordereau de liquidation
2. minimum_fiscal_contribution - Cuota Mínima Fiscal / Cotisation minimale fiscale
3. withheld_vat - IVA Destajo / TVA à la source  
4. actual_vat - IVA Real / TVA réelle
5. petroleum_products_tax - Impuesto sobre Productos Petroleros / Taxe produits pétroliers
6. petroleum_products_tax_ivs - Impuesto sobre Productos Petroleros (IVS) / Taxe produits pétroliers (IVS)
7. wages_tax_oil_mining - Impuesto sobre Sueldos y Salarios Sector Petrolero y Minero / Impôt salaires secteur pétrolier/minier
8. wages_tax_common_sector - Impuesto sobre Sueldos y Salarios Sector Común / Impôt salaires secteur commun
9. common_voucher - Impreso Común / Bordereau commun
10. withholding_3pct_oil_mining_residents - Retención 3% Residentes Petrolero y Minero / Retenue 3% résidents pétrole/mine
11. withholding_10pct_common_residents - Retención 10% Residentes Sector Común / Retenue 10% résidents secteur commun
12. withholding_5pct_oil_mining_residents - Retención 5% Residentes Petrolero y Minero / Retenue 5% résidents pétrole/mine
13. minimum_fiscal_oil_mining - Cuota Mínima Fiscal Petrolera y Minera / Cotisation minimale pétrole/mine
14. withholding_10pct_oil_mining_nonresidents - Retención 10% No Residentes Petrolero y Minero / Retenue 10% non-résidents pétrole/mine

🎯 SPÉCIFICITÉS SYSTÈME FISCAL GUINÉE ÉQUATORIALE :
- Distinction claire secteur pétrolier/minier vs secteur commun
- Retenues à la source graduées : 3%, 5%, 10% selon statut et secteur
- Bordereaux spécialisés : liquidation et bordereaux communs  
- TVA complexe : destajo (retenue) vs réelle
- Cotisations minimales générales et sectorielles

📊 IMPACT :
- declaration_type_enum : 6 → 20 valeurs (+233% d'extension)
- Couverture complète des déclarations fiscales nationales
- Base solide pour implémentation réglementaire
*/
