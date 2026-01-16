-- ============================================================================
-- Migration 049: Cleanup generic workflows and synchronize predefined tariffs
-- ============================================================================
-- Purpose:
--   1. Remove all generic workflows (is_generic = TRUE) from database
--   2. Reset workflow_tariffs to correct values from Python predefined classes
--   3. Add parent_workflow_code for hierarchical grouping in UI
--   4. Add tags for sub-categorization
--
-- Background:
--   - Predefined workflows have tariffs hardcoded in Python classes (source of truth)
--   - Database tariffs were incorrect (e.g., PASAPORTE_NUEVO showing 55,000 instead of 7,500)
--   - Generic workflows in production were test data that need cleanup
--
-- Date: 2025-01-16
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD HIERARCHICAL COLUMNS TO WORKFLOWS TABLE
-- ============================================================================

-- Add parent_workflow_code for grouping (e.g., all PASAPORTE_* share parent PASAPORTE)
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS parent_workflow_code VARCHAR(50);

-- Add tags for sub-categorization (JSONB array: ["pasaporte", "identidad"])
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add is_parent flag to identify parent workflows (for UI grouping)
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;

-- Index for parent lookup
CREATE INDEX IF NOT EXISTS idx_workflows_parent ON workflows(parent_workflow_code);
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON workflows USING GIN (tags);

COMMENT ON COLUMN workflows.parent_workflow_code IS 'For hierarchical grouping in admin UI - e.g., PASAPORTE_NUEVO has parent PASAPORTE';
COMMENT ON COLUMN workflows.tags IS 'JSONB array of tags for sub-categorization';
COMMENT ON COLUMN workflows.is_parent IS 'TRUE = this is a parent workflow (category header in UI)';

-- ============================================================================
-- 2. DELETE GENERIC WORKFLOWS AND THEIR RELATED DATA
-- ============================================================================

-- First, delete related tariffs for generic workflows
DELETE FROM workflow_tariffs WHERE workflow_code IN (
    SELECT code FROM workflows WHERE is_generic = TRUE
);

-- Delete document requirements for generic workflows
DELETE FROM workflow_document_requirements WHERE workflow_code IN (
    SELECT code FROM workflows WHERE is_generic = TRUE
);

-- Delete supplement configs for generic workflows
DELETE FROM workflow_supplement_config WHERE workflow_code IN (
    SELECT code FROM workflows WHERE is_generic = TRUE
);

-- Delete delay rules for generic workflows
DELETE FROM appointment_delay_rules WHERE workflow_code IN (
    SELECT code FROM workflows WHERE is_generic = TRUE
);

-- Now delete the generic workflows themselves
DELETE FROM workflows WHERE is_generic = TRUE;

-- ============================================================================
-- 3. INSERT PARENT WORKFLOWS (for UI grouping only)
-- ============================================================================
-- These are category headers, not actual workflows (is_active = FALSE)

INSERT INTO workflows (code, name_es, description_es, category, entity_code, workflow_type,
    requires_agent_validation, requires_appointment, is_generic, sla_hours, display_order,
    is_active, is_parent, tags, config)
VALUES
    ('PASAPORTE', 'Pasaporte', 'Servicios relacionados con pasaportes', 'identite', 'CNEDOGE',
     'standard', FALSE, FALSE, FALSE, 0, 0, FALSE, TRUE, '["pasaporte", "identidad", "documento_viaje"]'::jsonb, '{}'::jsonb),

    ('RESIDENCIA', 'Permiso de Residencia', 'Servicios de permisos de residencia para extranjeros', 'identite', 'EXTRANJERIA',
     'multi_phase', FALSE, FALSE, FALSE, 0, 9, FALSE, TRUE, '["residencia", "extranjeria", "permisos"]'::jsonb, '{}'::jsonb),

    ('VEHICULO', 'Vehiculos', 'Servicios relacionados con vehiculos', 'vehiculo', 'DGT',
     'standard', FALSE, FALSE, FALSE, 0, 19, FALSE, TRUE, '["vehiculo", "matriculacion", "transporte"]'::jsonb, '{}'::jsonb),

    ('CONTRATO', 'Contratos', 'Registro de contratos', 'contrato', 'ONRC',
     'standard', FALSE, FALSE, FALSE, 0, 29, FALSE, TRUE, '["contrato", "registro", "legal"]'::jsonb, '{}'::jsonb),

    ('CONDUCIR', 'Permiso de Conducir', 'Servicios relacionados con permisos de conducir', 'conducir', 'DGT',
     'standard', FALSE, FALSE, FALSE, 0, 39, FALSE, TRUE, '["conducir", "licencia", "transporte"]'::jsonb, '{}'::jsonb),

    ('FUNCION_PUBLICA', 'Funcion Publica', 'Servicios para funcionarios publicos', 'funcion_publica', 'MINFP',
     'standard', FALSE, FALSE, FALSE, 0, 49, FALSE, TRUE, '["funcionario", "administracion", "publico"]'::jsonb, '{}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    is_parent = EXCLUDED.is_parent,
    tags = EXCLUDED.tags,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- 4. UPDATE EXISTING WORKFLOWS WITH PARENT AND TAGS
-- ============================================================================

-- PASAPORTE family
UPDATE workflows SET
    parent_workflow_code = 'PASAPORTE',
    tags = '["pasaporte", "identidad", "cnedoge"]'::jsonb
WHERE code LIKE 'PASAPORTE_%';

-- RESIDENCIA family
UPDATE workflows SET
    parent_workflow_code = 'RESIDENCIA',
    tags = '["residencia", "extranjeria", "permisos"]'::jsonb
WHERE code LIKE 'RESIDENCIA_%';

-- VEHICULO family
UPDATE workflows SET
    parent_workflow_code = 'VEHICULO',
    tags = '["vehiculo", "dgt", "matriculacion"]'::jsonb
WHERE code LIKE 'VEHICULO_%';

-- CONTRATO family
UPDATE workflows SET
    parent_workflow_code = 'CONTRATO',
    tags = '["contrato", "onrc", "registro"]'::jsonb
WHERE code LIKE 'CONTRATO_%';

-- CONDUCIR family
UPDATE workflows SET
    parent_workflow_code = 'CONDUCIR',
    tags = '["conducir", "dgt", "licencia"]'::jsonb
WHERE code LIKE 'CONDUCIR_%';

-- FUNCION PUBLICA family
UPDATE workflows SET
    parent_workflow_code = 'FUNCION_PUBLICA',
    tags = '["funcionario", "minfp", "administracion"]'::jsonb
WHERE code LIKE 'FP_%';

-- ============================================================================
-- 5. RESET WORKFLOW TARIFFS TO CORRECT VALUES
-- ============================================================================

-- First, deactivate all existing tariffs for predefined workflows
-- (We'll insert fresh correct ones)
UPDATE workflow_tariffs
SET is_active = FALSE, effective_to = CURRENT_DATE, updated_at = NOW()
WHERE workflow_code IN (
    SELECT code FROM workflows WHERE is_generic = FALSE AND (is_parent = FALSE OR is_parent IS NULL)
)
AND is_active = TRUE;

-- Insert correct tariffs from Python predefined classes
-- Using effective_from = CURRENT_DATE to ensure they take precedence
INSERT INTO workflow_tariffs (workflow_code, solicitud_type, amount, currency, tariff_type, legal_reference, effective_from, is_active)
VALUES
    -- ========== PASAPORTE (Fixed tariffs from PasaporteWorkflow v2) ==========
    ('PASAPORTE_NUEVO', 'EXPEDICION', 7500, 'XAF', 'FIXED', 'Decreto 123/2024 Art. 5', CURRENT_DATE, TRUE),
    ('PASAPORTE_RENOVACION', 'RENOVACION', 5000, 'XAF', 'FIXED', 'Decreto 123/2024 Art. 6', CURRENT_DATE, TRUE),
    ('PASAPORTE_PERDIDA', 'RENOVACION', 10000, 'XAF', 'FIXED', 'Decreto 123/2024 Art. 7 - Penalidad', CURRENT_DATE, TRUE),
    ('PASAPORTE_ROBO', 'RENOVACION', 10000, 'XAF', 'FIXED', 'Decreto 123/2024 Art. 7 - Penalidad', CURRENT_DATE, TRUE),
    ('PASAPORTE_DETERIORO', 'RENOVACION', 7500, 'XAF', 'FIXED', 'Decreto 123/2024 Art. 8', CURRENT_DATE, TRUE),

    -- ========== RESIDENCIA (Nota de Ingreso - Treasury determines amount) ==========
    ('RESIDENCIA_PRIMERA_VEZ', 'EXPEDICION', 0, 'XAF', 'NOTA_INGRESO', 'Ley de Extranjeria Art. 12', CURRENT_DATE, TRUE),
    ('RESIDENCIA_RENOVACION', 'RENOVACION', 0, 'XAF', 'NOTA_INGRESO', 'Ley de Extranjeria Art. 15', CURRENT_DATE, TRUE),
    ('RESIDENCIA_DUPLICADO', 'DUPLICADO', 0, 'XAF', 'NOTA_INGRESO', 'Ley de Extranjeria Art. 18', CURRENT_DATE, TRUE),
    ('RESIDENCIA_CAMBIO_DATOS', 'EXPEDICION', 0, 'XAF', 'NOTA_INGRESO', 'Ley de Extranjeria Art. 20', CURRENT_DATE, TRUE),
    ('RESIDENCIA_REAGRUPACION', 'EXPEDICION', 0, 'XAF', 'NOTA_INGRESO', 'Ley de Extranjeria Art. 25', CURRENT_DATE, TRUE),

    -- ========== VEHICULO (RBC - Percentage based on vehicle value) ==========
    ('VEHICULO_PRIMERA_MATRICULACION', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Codigo de Trafico Art. 45', CURRENT_DATE, TRUE),
    ('VEHICULO_TRANSFERENCIA', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Codigo de Trafico Art. 48', CURRENT_DATE, TRUE),
    ('VEHICULO_RENOVACION_CUVE', 'RENOVACION', 25000, 'XAF', 'FIXED', 'Codigo de Trafico Art. 50', CURRENT_DATE, TRUE),
    ('VEHICULO_RENOVACION_ITV', 'RENOVACION', 15000, 'XAF', 'FIXED', 'Codigo de Trafico Art. 52', CURRENT_DATE, TRUE),
    ('VEHICULO_DUPLICADO_PERMISO', 'DUPLICADO', 10000, 'XAF', 'FIXED', 'Codigo de Trafico Art. 55', CURRENT_DATE, TRUE),
    ('VEHICULO_DUPLICADO_CUVE', 'DUPLICADO', 15000, 'XAF', 'FIXED', 'Codigo de Trafico Art. 56', CURRENT_DATE, TRUE),
    ('VEHICULO_CAMBIO_CARACTERISTICAS', 'EXPEDICION', 20000, 'XAF', 'FIXED', 'Codigo de Trafico Art. 58', CURRENT_DATE, TRUE),

    -- ========== CONTRATO (Percentage based on contract value) ==========
    ('CONTRATO_OBRA', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 30', CURRENT_DATE, TRUE),
    ('CONTRATO_SERVICIO', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 32', CURRENT_DATE, TRUE),
    ('CONTRATO_SUMINISTRO', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 34', CURRENT_DATE, TRUE),
    ('CONTRATO_CONCESION', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 36', CURRENT_DATE, TRUE),
    ('CONTRATO_JOINT_VENTURE', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 38', CURRENT_DATE, TRUE),
    ('CONTRATO_ARRENDAMIENTO', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 40', CURRENT_DATE, TRUE),
    ('CONTRATO_OTRO', 'EXPEDICION', 0, 'XAF', 'PERCENTAGE', 'Ley de Contratacion Art. 42', CURRENT_DATE, TRUE),

    -- ========== CONDUCIR (Fixed tariffs) ==========
    ('CONDUCIR_NUEVO', 'EXPEDICION', 35000, 'XAF', 'FIXED', 'Reglamento de Conduccion Art. 15', CURRENT_DATE, TRUE),
    ('CONDUCIR_CANJE', 'EXPEDICION', 25000, 'XAF', 'FIXED', 'Reglamento de Conduccion Art. 18', CURRENT_DATE, TRUE),
    ('CONDUCIR_RENOVACION', 'RENOVACION', 20000, 'XAF', 'FIXED', 'Reglamento de Conduccion Art. 20', CURRENT_DATE, TRUE),
    ('CONDUCIR_DUPLICADO', 'DUPLICADO', 15000, 'XAF', 'FIXED', 'Reglamento de Conduccion Art. 22', CURRENT_DATE, TRUE),
    ('CONDUCIR_EXTENSION', 'EXPEDICION', 30000, 'XAF', 'FIXED', 'Reglamento de Conduccion Art. 25', CURRENT_DATE, TRUE),

    -- ========== FUNCION PUBLICA (Fixed tariffs) ==========
    ('FP_VERIFICACION_FUNCIONARIO', 'EXPEDICION', 5000, 'XAF', 'FIXED', 'Estatuto Funcion Publica Art. 80', CURRENT_DATE, TRUE),
    ('FP_CARNET_FUNCIONARIO', 'EXPEDICION', 10000, 'XAF', 'FIXED', 'Estatuto Funcion Publica Art. 82', CURRENT_DATE, TRUE),
    ('FP_PROMOCION_ADMINISTRATIVA', 'EXPEDICION', 0, 'XAF', 'FIXED', 'Estatuto Funcion Publica Art. 85', CURRENT_DATE, TRUE),
    ('FP_PERMISO_EXTRAORDINARIO', 'EXPEDICION', 0, 'XAF', 'FIXED', 'Estatuto Funcion Publica Art. 90', CURRENT_DATE, TRUE),
    ('FP_CERTIFICADO_ADMINISTRATIVO', 'EXPEDICION', 5000, 'XAF', 'FIXED', 'Estatuto Funcion Publica Art. 95', CURRENT_DATE, TRUE);

-- ============================================================================
-- 6. UPDATE VIEW FOR HIERARCHICAL WORKFLOWS
-- ============================================================================

DROP VIEW IF EXISTS v_workflows_hierarchy;

CREATE VIEW v_workflows_hierarchy AS
SELECT
    w.code,
    w.name_es,
    w.description_es,
    w.category,
    w.entity_code,
    w.workflow_type,
    w.requires_agent_validation,
    w.requires_appointment,
    w.is_generic,
    COALESCE(w.is_parent, FALSE) as is_parent,
    w.parent_workflow_code,
    COALESCE(w.tags, '[]'::jsonb) as tags,
    w.sla_hours,
    w.display_order,
    w.is_active,
    pw.name_es as parent_name_es,
    (SELECT COUNT(*) FROM workflow_document_requirements WHERE workflow_code = w.code) as documents_count,
    (SELECT COUNT(*) FROM workflow_tariffs WHERE workflow_code = w.code AND is_active = TRUE) as tariffs_count,
    (SELECT jsonb_agg(jsonb_build_object(
        'solicitud_type', wt.solicitud_type,
        'amount', wt.amount,
        'tariff_type', wt.tariff_type,
        'percentage_rate', wt.percentage_rate
    )) FROM workflow_tariffs wt WHERE wt.workflow_code = w.code AND wt.is_active = TRUE) as tariffs
FROM workflows w
LEFT JOIN workflows pw ON w.parent_workflow_code = pw.code
ORDER BY w.display_order, w.code;

COMMENT ON VIEW v_workflows_hierarchy IS 'Workflows with parent relationship and tariffs for hierarchical admin UI';

-- ============================================================================
-- 7. VERIFICATION QUERIES (run manually to verify)
-- ============================================================================

-- Verify parent workflows created:
-- SELECT code, name_es, is_parent, is_active FROM workflows WHERE is_parent = TRUE;

-- Verify child workflows have parents:
-- SELECT code, parent_workflow_code, tags FROM workflows WHERE parent_workflow_code IS NOT NULL;

-- Verify PASAPORTE tariffs are correct:
-- SELECT w.code, wt.solicitud_type, wt.amount, wt.tariff_type
-- FROM workflows w
-- JOIN workflow_tariffs wt ON w.code = wt.workflow_code AND wt.is_active = TRUE
-- WHERE w.code LIKE 'PASAPORTE%'
-- ORDER BY w.code;

-- Count by type:
-- SELECT
--   CASE WHEN is_parent THEN 'Parent' WHEN is_generic THEN 'Generic' ELSE 'Predefined' END as type,
--   COUNT(*)
-- FROM workflows
-- GROUP BY 1;

COMMIT;
