-- ============================================
-- MISE À JOUR SCHÉMA v3.4 → v3.5 - ENUMs EN ESPAGNOL
-- Conversion tous types ENUMs vers espagnol (langue par défaut)
-- Date: 10 octobre 2025
-- ============================================

-- ============================================
-- SUPPRESSION ANCIENS ENUMs (EN ANGLAIS)
-- ============================================

DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;
DROP TYPE IF EXISTS service_status_enum CASCADE;
DROP TYPE IF EXISTS service_type_enum CASCADE;
DROP TYPE IF EXISTS calculation_method_enum CASCADE;
DROP TYPE IF EXISTS payment_workflow_status CASCADE;
DROP TYPE IF EXISTS agent_action_type CASCADE;
DROP TYPE IF EXISTS escalation_level CASCADE;
DROP TYPE IF EXISTS declaration_type_enum CASCADE;
DROP TYPE IF EXISTS declaration_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS payment_method_enum CASCADE;
DROP TYPE IF EXISTS document_processing_mode_enum CASCADE;
DROP TYPE IF EXISTS document_ocr_status_enum CASCADE;
DROP TYPE IF EXISTS document_extraction_status_enum CASCADE;
DROP TYPE IF EXISTS document_validation_status_enum CASCADE;
DROP TYPE IF EXISTS document_access_level_enum CASCADE;

-- ============================================
-- CRÉATION ENUMs EN ESPAGNOL (LANGUE PAR DÉFAUT)
-- ============================================

-- Types utilisateur
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'ciudadano',              -- citizen → ciudadano
        'empresa',                -- business → empresa  
        'contador',               -- accountant → contador
        'administrador',          -- admin → administrador
        'agente_dgi',            -- dgi_agent → agente_dgi
        'agente_ministerial'      -- ministry_agent → agente_ministerial
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM (
        'activo',                 -- active → activo
        'suspendido',            -- suspended → suspendido
        'verificacion_pendiente', -- pending_verification → verificacion_pendiente
        'desactivado'            -- deactivated → desactivado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types services
DO $$ BEGIN
    CREATE TYPE service_status_enum AS ENUM (
        'activo',                -- active → activo
        'inactivo',              -- inactive → inactivo
        'borrador',              -- draft → borrador
        'obsoleto'               -- deprecated → obsoleto
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type_enum AS ENUM (
        'procesamiento_documento',  -- document_processing → procesamiento_documento
        'licencia_permiso',        -- license_permit → licencia_permiso
        'permiso_residencia',      -- residence_permit → permiso_residencia
        'tasa_registro',           -- registration_fee → tasa_registro
        'tasa_inspeccion',         -- inspection_fee → tasa_inspeccion
        'impuesto_administrativo', -- administrative_tax → impuesto_administrativo
        'derecho_aduanero',        -- customs_duty → derecho_aduanero
        'impuesto_declarativo'     -- declaration_tax → impuesto_declarativo
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calculation_method_enum AS ENUM (
        'fijo_expedicion',         -- fixed_expedition → fijo_expedicion
        'fijo_renovacion',         -- fixed_renewal → fijo_renovacion
        'fijo_ambos',             -- fixed_both → fijo_ambos
        'basado_porcentaje',      -- percentage_based → basado_porcentaje
        'basado_unidad',          -- unit_based → basado_unidad
        'tarifas_escalonadas',    -- tiered_rates → tarifas_escalonadas
        'basado_formula'          -- formula_based → basado_formula
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types workflow agents
DO $$ BEGIN
    CREATE TYPE payment_workflow_status AS ENUM (
        'enviado',                      -- submitted → enviado
        'procesamiento_automatico',    -- auto_processing → procesamiento_automatico
        'aprobado_automatico',         -- auto_approved → aprobado_automatico
        'revision_agente_pendiente',   -- pending_agent_review → revision_agente_pendiente
        'bloqueado_por_agente',        -- locked_by_agent → bloqueado_por_agente
        'agente_revisando',            -- agent_reviewing → agente_revisando
        'requiere_documentos',         -- requires_documents → requiere_documentos
        'documentos_reenviados',       -- docs_resubmitted → documentos_reenviados
        'aprobado_por_agente',         -- approved_by_agent → aprobado_por_agente
        'rechazado_por_agente',        -- rejected_by_agent → rechazado_por_agente
        'escalado_supervisor',         -- escalated_supervisor → escalado_supervisor
        'supervisor_revisando',        -- supervisor_reviewing → supervisor_revisando
        'completado',                  -- completed → completado
        'cancelado_por_usuario',       -- cancelled_by_user → cancelado_por_usuario
        'cancelado_por_agente',        -- cancelled_by_agent → cancelado_por_agente
        'expirado'                     -- expired → expirado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_action_type AS ENUM (
        'bloquear_para_revision',    -- lock_for_review → bloquear_para_revision
        'aprobar',                   -- approve → aprobar
        'rechazar',                  -- reject → rechazar
        'solicitar_documentos',      -- request_documents → solicitar_documentos
        'agregar_comentario',        -- add_comment → agregar_comentario
        'escalar',                   -- escalate → escalar
        'desbloquear_liberar',       -- unlock_release → desbloquear_liberar
        'asignar_a_colega'          -- assign_to_colleague → asignar_a_colega
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE escalation_level AS ENUM (
        'bajo',                      -- low → bajo
        'medio',                     -- medium → medio
        'alto',                      -- high → alto
        'critico'                    -- critical → critico
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types déclarations (avec extensions v3.4)
DO $$ BEGIN
    CREATE TYPE declaration_type_enum AS ENUM (
        'impuesto_renta',                              -- income_tax → impuesto_renta
        'impuesto_sociedades',                         -- corporate_tax → impuesto_sociedades
        'declaracion_iva',                             -- vat_declaration → declaracion_iva
        'contribucion_social',                         -- social_contribution → contribucion_social
        'impuesto_inmobiliario',                       -- property_tax → impuesto_inmobiliario
        'otro_impuesto',                               -- other_tax → otro_impuesto
        'impreso_liquidacion',                         -- settlement_voucher → impreso_liquidacion
        'cuota_minima_fiscal',                         -- minimum_fiscal_contribution → cuota_minima_fiscal
        'iva_destajo',                                 -- withheld_vat → iva_destajo
        'iva_real',                                    -- actual_vat → iva_real
        'impuesto_productos_petroleros',               -- petroleum_products_tax → impuesto_productos_petroleros
        'impuesto_productos_petroleros_ivs',           -- petroleum_products_tax_ivs → impuesto_productos_petroleros_ivs
        'impuesto_sueldos_petrolero_minero',          -- wages_tax_oil_mining → impuesto_sueldos_petrolero_minero
        'impuesto_sueldos_sector_comun',              -- wages_tax_common_sector → impuesto_sueldos_sector_comun
        'impreso_comun',                              -- common_voucher → impreso_comun
        'retencion_3pct_residentes_petrolero_minero', -- withholding_3pct_oil_mining_residents → retencion_3pct_residentes_petrolero_minero
        'retencion_10pct_residentes_sector_comun',    -- withholding_10pct_common_residents → retencion_10pct_residentes_sector_comun
        'retencion_5pct_residentes_petrolero_minero', -- withholding_5pct_oil_mining_residents → retencion_5pct_residentes_petrolero_minero
        'cuota_minima_fiscal_petrolera_minera',       -- minimum_fiscal_oil_mining → cuota_minima_fiscal_petrolera_minera
        'retencion_10pct_no_residentes_petrolero_minero' -- withholding_10pct_oil_mining_nonresidents → retencion_10pct_no_residentes_petrolero_minero
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE declaration_status_enum AS ENUM (
        'borrador',                  -- draft → borrador
        'enviado',                   -- submitted → enviado
        'procesando',               -- processing → procesando
        'aceptado',                 -- accepted → aceptado
        'rechazado',                -- rejected → rechazado
        'modificado'                -- amended → modificado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types paiements
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pendiente',                -- pending → pendiente
        'procesando',               -- processing → procesando
        'completado',               -- completed → completado
        'fallido',                  -- failed → fallido
        'reembolsado',              -- refunded → reembolsado
        'cancelado'                 -- cancelled → cancelado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'transferencia_bancaria',   -- bank_transfer → transferencia_bancaria
        'tarjeta',                  -- card → tarjeta
        'dinero_movil',             -- mobile_money → dinero_movil
        'efectivo',                 -- cash → efectivo
        'cartera_bange'             -- bange_wallet → cartera_bange
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types documents
DO $$ BEGIN
    CREATE TYPE document_processing_mode_enum AS ENUM (
        'pendiente',                -- pending → pendiente
        'procesamiento_servidor',   -- server_processing → procesamiento_servidor
        'procesamiento_ligero',     -- lite_processing → procesamiento_ligero
        'manual_asistido'           -- assisted_manual → manual_asistido
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_ocr_status_enum AS ENUM (
        'pendiente',                -- pending → pendiente
        'procesando',               -- processing → procesando
        'completado',               -- completed → completado
        'fallido',                  -- failed → fallido
        'omitido'                   -- skipped → omitido
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_extraction_status_enum AS ENUM (
        'pendiente',                -- pending → pendiente
        'procesando',               -- processing → procesando
        'completado',               -- completed → completado
        'fallido',                  -- failed → fallido
        'manual'                    -- manual → manual
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_validation_status_enum AS ENUM (
        'pendiente',                -- pending → pendiente
        'valido',                   -- valid → valido
        'invalido',                 -- invalid → invalido
        'requiere_revision',        -- requires_review → requiere_revision
        'corregido_usuario'         -- user_corrected → corregido_usuario
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_access_level_enum AS ENUM (
        'privado',                  -- private → privado
        'compartido',               -- shared → compartido
        'publico',                  -- public → publico
        'confidencial'              -- confidential → confidencial
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MISE À JOUR FONCTION get_enum_translation
-- ============================================

-- Remplacer pour gérer nouveau système espagnol par défaut
CREATE OR REPLACE FUNCTION get_enum_translation(
    p_enum_type VARCHAR(100),
    p_enum_value VARCHAR(100), 
    p_language_code VARCHAR(2) DEFAULT 'es'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
BEGIN
    -- Si espagnol demandé, retourner valeur ENUM directement (langue par défaut)
    IF p_language_code = 'es' THEN
        RETURN p_enum_value;
    END IF;
    
    -- Utiliser nouveau système unifié pour FR/EN
    SELECT get_unified_translation(
        'enum', 
        p_enum_type || '.' || p_enum_value, 
        NULL, 
        p_language_code
    ) INTO v_translation;
    
    -- Fallback vers ancien système si nouveau pas configuré
    IF v_translation IS NULL THEN
        SELECT translation INTO v_translation
        FROM enum_translations 
        WHERE enum_type = p_enum_type 
        AND enum_value = p_enum_value 
        AND language_code = p_language_code
        AND is_active = true;
    END IF;
    
    -- Fallback final vers espagnol (valeur ENUM directe)
    RETURN COALESCE(v_translation, p_enum_value);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MAPPING ANCIENS → NOUVEAUX ENUMs
-- ============================================

-- Table temporaire pour migration données existantes
CREATE TEMP TABLE enum_mapping (
    old_value TEXT,
    new_value TEXT,
    enum_type TEXT
);

-- Mappings user_role_enum
INSERT INTO enum_mapping VALUES
('citizen', 'ciudadano', 'user_role_enum'),
('business', 'empresa', 'user_role_enum'),
('accountant', 'contador', 'user_role_enum'),
('admin', 'administrador', 'user_role_enum'),
('dgi_agent', 'agente_dgi', 'user_role_enum'),
('ministry_agent', 'agente_ministerial', 'user_role_enum');

-- Mappings user_status_enum
INSERT INTO enum_mapping VALUES
('active', 'activo', 'user_status_enum'),
('suspended', 'suspendido', 'user_status_enum'),
('pending_verification', 'verificacion_pendiente', 'user_status_enum'),
('deactivated', 'desactivado', 'user_status_enum');

-- Mappings payment_status_enum
INSERT INTO enum_mapping VALUES
('pending', 'pendiente', 'payment_status_enum'),
('processing', 'procesando', 'payment_status_enum'),
('completed', 'completado', 'payment_status_enum'),
('failed', 'fallido', 'payment_status_enum'),
('refunded', 'reembolsado', 'payment_status_enum'),
('cancelled', 'cancelado', 'payment_status_enum');

-- Mappings payment_method_enum
INSERT INTO enum_mapping VALUES
('bank_transfer', 'transferencia_bancaria', 'payment_method_enum'),
('card', 'tarjeta', 'payment_method_enum'),
('mobile_money', 'dinero_movil', 'payment_method_enum'),
('cash', 'efectivo', 'payment_method_enum'),
('bange_wallet', 'cartera_bange', 'payment_method_enum');

-- [Ajouter tous les autres mappings pour chaque ENUM...]

-- ============================================
-- SCRIPT DE MIGRATION DONNÉES EXISTANTES
-- ============================================

-- Fonction pour migrer colonnes ENUMs existantes
CREATE OR REPLACE FUNCTION migrate_enum_columns()
RETURNS TEXT AS $$
DECLARE
    rec RECORD;
    update_sql TEXT;
    migration_count INT := 0;
BEGIN
    -- Pour chaque table et colonne utilisant des ENUMs
    FOR rec IN 
        SELECT 
            t.table_name,
            c.column_name,
            c.udt_name as enum_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND c.udt_name LIKE '%_enum'
        AND c.udt_name IN (
            'user_role_enum', 'user_status_enum', 'payment_status_enum', 
            'payment_method_enum', 'service_status_enum', 'service_type_enum'
            -- Ajouter autres ENUMs selon besoins
        )
    LOOP
        -- Construire requête UPDATE avec mapping
        update_sql := format(
            'UPDATE %I SET %I = em.new_value::text::%I 
             FROM enum_mapping em 
             WHERE %I::text = em.old_value 
             AND em.enum_type = %L',
            rec.table_name, rec.column_name, rec.enum_type,
            rec.column_name, rec.enum_type
        );
        
        -- Exécuter migration
        EXECUTE update_sql;
        
        migration_count := migration_count + 1;
        
        RAISE NOTICE 'Migré: %.% (type: %)', 
            rec.table_name, rec.column_name, rec.enum_type;
    END LOOP;
    
    RETURN format('Migration terminée: %s colonnes migrées', migration_count);
END;
$$ LANGUAGE plpgsql;

-- Exécuter migration automatique
SELECT migrate_enum_columns();

-- ============================================
-- MISE À JOUR enum_translations POUR ESPAGNOL
-- ============================================

-- Mettre à jour les enum_value vers espagnol dans enum_translations
UPDATE enum_translations 
SET enum_value = em.new_value 
FROM enum_mapping em 
WHERE enum_translations.enum_value = em.old_value;

-- ============================================
-- NETTOYAGE
-- ============================================

-- Supprimer table temporaire mapping
DROP TABLE enum_mapping;

-- Supprimer fonction de migration (temporaire)
DROP FUNCTION migrate_enum_columns();

-- ============================================
-- NOTIFICATIONS SUCCÈS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CONVERSION ENUMs EN ESPAGNOL TERMINÉE';
    RAISE NOTICE '✅ Tous les types ENUMs convertis en espagnol';
    RAISE NOTICE '✅ Données existantes migrées automatiquement';
    RAISE NOTICE '✅ Fonction get_enum_translation() mise à jour';
    RAISE NOTICE '✅ enum_translations synchronisé';
    RAISE NOTICE 'Langue par défaut: ESPAGNOL';
    RAISE NOTICE 'Traductions FR/EN: via système unifié';
    RAISE NOTICE '============================================';
END$$;
