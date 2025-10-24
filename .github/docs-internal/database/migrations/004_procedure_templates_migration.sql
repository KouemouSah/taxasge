-- ============================================
-- MIGRATION 004: PROCEDURE TEMPLATES
-- TaxasGE v3.5.0
-- Date: 2025-10-10
-- ============================================

-- OBJECTIF: Éliminer duplication procedures (66% réduction)
-- STRATÉGIE: Migration progressive, backward compatible, zero downtime

-- ANALYSE QUANTITATIVE:
-- - Procedures actuelles: 4737
-- - Descriptions uniques: 1049
-- - Duplication: 15.1% (713 procedures)
-- - Économie finale: 66.3% (4737 → 1596 lignes)

BEGIN;

-- ============================================
-- PHASE 1: CRÉER NOUVELLES TABLES
-- ============================================

-- Table 1: Templates de procedures (génériques réutilisables)
CREATE TABLE IF NOT EXISTS procedure_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(100) UNIQUE NOT NULL,    -- 'LEGALIZATION_STANDARD_3STEPS'
    name_es VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),
    name_en VARCHAR(255),
    description_es TEXT,
    category VARCHAR(50),                           -- 'legalization', 'permit', 'certification'

    -- Métadonnées
    usage_count INTEGER DEFAULT 0,                  -- Nb services utilisant ce template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER,

    -- Index
    CONSTRAINT template_code_format CHECK (template_code ~ '^[A-Z0-9_]+$')
);

COMMENT ON TABLE procedure_templates IS 'Templates de procedures réutilisables (anti-duplication)';
COMMENT ON COLUMN procedure_templates.template_code IS 'Code unique human-readable, ex: PAYMENT_STANDARD_4STEPS';
COMMENT ON COLUMN procedure_templates.usage_count IS 'Nombre de services utilisant ce template (dénormalisé pour stats)';

-- Table 2: Étapes des templates
CREATE TABLE IF NOT EXISTS procedure_template_steps (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES procedure_templates(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,

    -- Contenu multilingue
    description_es TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    instructions_es TEXT,
    instructions_fr TEXT,
    instructions_en TEXT,

    -- Configuration
    estimated_duration_minutes INTEGER,
    location_address TEXT,
    office_hours VARCHAR(100),
    requires_appointment BOOLEAN DEFAULT false,
    is_optional BOOLEAN DEFAULT false,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(template_id, step_number)
);

COMMENT ON TABLE procedure_template_steps IS 'Étapes des templates (1 template = N steps)';

-- Index performance
CREATE INDEX idx_template_steps_template_id ON procedure_template_steps(template_id, step_number);

-- Table 3: Association service ↔ template (N:M)
CREATE TABLE IF NOT EXISTS service_procedure_assignments (
    id SERIAL PRIMARY KEY,
    fiscal_service_id INTEGER NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES procedure_templates(id) ON DELETE RESTRICT,

    -- Configuration par service
    applies_to VARCHAR(20) CHECK (applies_to IN ('expedition', 'renewal', 'both')),
    display_order INTEGER DEFAULT 1,                -- Si plusieurs templates par service
    custom_notes TEXT,                              -- Notes spécifiques au service

    -- Override steps (optionnel, pour customisation)
    override_steps JSONB,                           -- Ex: {"3": {"description_es": "Custom step 3"}}

    -- Métadonnées
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INTEGER,

    UNIQUE(fiscal_service_id, template_id)
);

COMMENT ON TABLE service_procedure_assignments IS 'Association service → template (permet réutilisation)';
COMMENT ON COLUMN service_procedure_assignments.override_steps IS 'JSONB pour override steps individuels si nécessaire';

-- Index performance
CREATE INDEX idx_service_assignments_service ON service_procedure_assignments(fiscal_service_id);
CREATE INDEX idx_service_assignments_template ON service_procedure_assignments(template_id);

-- ============================================
-- PHASE 2: MODIFIER TABLE EXISTANTE (BACKWARD COMPAT)
-- ============================================

-- Ajouter colonnes pour coexistence ancienne/nouvelle architecture
ALTER TABLE service_procedures
ADD COLUMN IF NOT EXISTS template_step_id INTEGER REFERENCES procedure_template_steps(id) ON DELETE SET NULL;

ALTER TABLE service_procedures
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false;

ALTER TABLE service_procedures
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ;

COMMENT ON COLUMN service_procedures.template_step_id IS 'Référence vers template_step (NULL = ancienne archi, NOT NULL = nouvelle archi)';
COMMENT ON COLUMN service_procedures.is_migrated IS 'Flag migration (permet coexistence ancienne/nouvelle)';

-- Index
CREATE INDEX IF NOT EXISTS idx_service_procedures_template_step ON service_procedures(template_step_id);
CREATE INDEX IF NOT EXISTS idx_service_procedures_migrated ON service_procedures(is_migrated);

-- ============================================
-- PHASE 3: TRIGGERS AUTOMATIQUES
-- ============================================

-- Trigger 1: Auto-increment usage_count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE procedure_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE procedure_templates
        SET usage_count = usage_count - 1
        WHERE id = OLD.template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_usage_count
AFTER INSERT OR DELETE ON service_procedure_assignments
FOR EACH ROW
EXECUTE FUNCTION update_template_usage_count();

-- Trigger 2: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_templates_updated_at
BEFORE UPDATE ON procedure_templates
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();

CREATE TRIGGER trigger_template_steps_updated_at
BEFORE UPDATE ON procedure_template_steps
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();

-- ============================================
-- PHASE 4: VUE UNIFIÉE (COMPATIBILITÉ QUERIES)
-- ============================================

-- Vue qui unifie ancienne + nouvelle architecture
-- Permet queries existantes de continuer à fonctionner
CREATE OR REPLACE VIEW v_service_procedures AS
SELECT
    -- Colonnes communes
    sp.id,
    sp.fiscal_service_id,
    sp.step_number,
    sp.applies_to,
    sp.is_migrated,

    -- Description: prendre template si migré, sinon ancienne colonne
    COALESCE(pts.description_es, sp.description_es) as description_es,
    COALESCE(pts.description_fr, sp.description_fr) as description_fr,
    COALESCE(pts.description_en, sp.description_en) as description_en,

    -- Instructions
    COALESCE(pts.instructions_es, sp.instructions_es) as instructions_es,
    COALESCE(pts.instructions_fr, sp.instructions_fr) as instructions_fr,
    COALESCE(pts.instructions_en, sp.instructions_en) as instructions_en,

    -- Configuration
    COALESCE(pts.estimated_duration_minutes, sp.estimated_duration_minutes) as estimated_duration_minutes,
    COALESCE(pts.location_address, sp.location_address) as location_address,
    COALESCE(pts.office_hours, sp.office_hours) as office_hours,
    COALESCE(pts.requires_appointment, sp.requires_appointment) as requires_appointment,

    -- Métadonnées template
    pt.template_code,
    pt.name_es as template_name_es,
    spa.display_order as template_display_order

FROM service_procedures sp
LEFT JOIN procedure_template_steps pts ON sp.template_step_id = pts.id
LEFT JOIN procedure_templates pt ON pts.template_id = pt.id
LEFT JOIN service_procedure_assignments spa ON (
    spa.fiscal_service_id = sp.fiscal_service_id
    AND spa.template_id = pt.id
);

COMMENT ON VIEW v_service_procedures IS 'Vue unifiée ancienne + nouvelle archi (backward compatible)';

-- ============================================
-- PHASE 5: FONCTIONS HELPER MIGRATION
-- ============================================

-- Fonction: Créer template depuis procedures existantes
CREATE OR REPLACE FUNCTION create_template_from_procedures(
    p_service_ids INTEGER[],
    p_template_code VARCHAR(100),
    p_template_name_es VARCHAR(255),
    p_category VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_template_id INTEGER;
    v_step_record RECORD;
BEGIN
    -- 1. Créer template
    INSERT INTO procedure_templates (template_code, name_es, category, usage_count)
    VALUES (p_template_code, p_template_name_es, p_category, array_length(p_service_ids, 1))
    RETURNING id INTO v_template_id;

    -- 2. Copier steps du premier service (comme référence)
    FOR v_step_record IN
        SELECT step_number, description_es, instructions_es,
               estimated_duration_minutes, location_address,
               office_hours, requires_appointment
        FROM service_procedures
        WHERE fiscal_service_id = p_service_ids[1]
        ORDER BY step_number
    LOOP
        INSERT INTO procedure_template_steps (
            template_id, step_number, description_es, instructions_es,
            estimated_duration_minutes, location_address,
            office_hours, requires_appointment
        )
        VALUES (
            v_template_id, v_step_record.step_number,
            v_step_record.description_es, v_step_record.instructions_es,
            v_step_record.estimated_duration_minutes,
            v_step_record.location_address,
            v_step_record.office_hours,
            v_step_record.requires_appointment
        );
    END LOOP;

    -- 3. Assigner template à tous les services
    INSERT INTO service_procedure_assignments (fiscal_service_id, template_id)
    SELECT unnest(p_service_ids), v_template_id;

    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_template_from_procedures IS 'Créer template depuis procedures existantes et assigner aux services';

-- Fonction: Migrer service vers template
CREATE OR REPLACE FUNCTION migrate_service_to_template(
    p_service_id INTEGER,
    p_template_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_step_record RECORD;
    v_template_step_id INTEGER;
BEGIN
    -- Pour chaque step du service
    FOR v_step_record IN
        SELECT * FROM service_procedures
        WHERE fiscal_service_id = p_service_id
        ORDER BY step_number
    LOOP
        -- Trouver step correspondant dans template
        SELECT id INTO v_template_step_id
        FROM procedure_template_steps
        WHERE template_id = p_template_id
          AND step_number = v_step_record.step_number;

        IF v_template_step_id IS NOT NULL THEN
            -- Lier à template
            UPDATE service_procedures
            SET template_step_id = v_template_step_id,
                is_migrated = true,
                migrated_at = NOW()
            WHERE id = v_step_record.id;
        END IF;
    END LOOP;

    -- Créer assignment si pas existe
    INSERT INTO service_procedure_assignments (fiscal_service_id, template_id)
    VALUES (p_service_id, p_template_id)
    ON CONFLICT (fiscal_service_id, template_id) DO NOTHING;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_service_to_template IS 'Migrer un service vers un template existant';

COMMIT;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Compter nouvelles tables
SELECT
    (SELECT COUNT(*) FROM procedure_templates) as templates,
    (SELECT COUNT(*) FROM procedure_template_steps) as template_steps,
    (SELECT COUNT(*) FROM service_procedure_assignments) as assignments;
-- Expected: 0 | 0 | 0 (tables vides après migration)

-- Vérifier colonnes ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_procedures'
  AND column_name IN ('template_step_id', 'is_migrated', 'migrated_at');
-- Expected: 3 rows

-- Vérifier vue
SELECT COUNT(*) FROM v_service_procedures;
-- Expected: count égal à service_procedures (même data, juste vue)

-- ============================================
-- NOTES MIGRATION
-- ============================================

/*
STRATÉGIE MIGRATION PROGRESSIVE:

1. ✅ Schema créé (cette migration)
2. Créer templates manuellement/script (Phase 1: top 20 duplicates)
3. Assigner services aux templates (Phase 1)
4. Migrer procedures vers templates (fonction migrate_service_to_template)
5. Valider data via v_service_procedures
6. Une fois 100% migré: DROP anciennes colonnes (description_es, etc.)
7. Renommer v_service_procedures → service_procedures

BACKWARD COMPATIBILITY:
- Vue v_service_procedures permet queries existantes continues
- Colonne is_migrated permet tracking progression
- template_step_id NULL = ancienne archi, NOT NULL = nouvelle archi
- Pas de breaking change pour API/frontend

ROLLBACK:
- Si problème: garder ancienne archi (is_migrated = false)
- Supprimer assignments: DELETE FROM service_procedure_assignments
- DROP nouvelles tables si besoin: DROP TABLE procedure_templates CASCADE
- Ancienne data préservée dans service_procedures
*/
