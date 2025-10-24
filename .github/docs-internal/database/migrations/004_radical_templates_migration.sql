-- ============================================
-- MIGRATION 004: RADICAL TEMPLATES ARCHITECTURE
-- TaxasGE v3.5.0
-- Date: 2025-10-10
-- ============================================

-- OBJECTIF: Architecture optimale templates procedures + documents
-- STRATÉGIE: Radical cleanup + templates only (no redundant tables)

-- ANALYSE QUANTITATIVE:
-- - Procedures actuelles: 4737 (dupliquées)
-- - Templates uniques: ~200
-- - Steps uniques: 1049
-- - Économie: 58.7% (9829 → 4060 rows total)

-- BREAKING CHANGES:
-- ⚠️  Supprime table service_procedures (remplacée par templates)
-- ⚠️  Supprime table service_required_documents (remplacée par templates)
-- ⚠️  Compatible seulement si DB vide ou backup fait

BEGIN;

-- ============================================
-- PHASE 0: CLEANUP (Vider tables existantes)
-- ============================================

-- Désactiver contraintes temporairement pour cleanup
SET CONSTRAINTS ALL DEFERRED;

-- Vider tables procedures (si existent)
-- Note: Nom vérifié depuis seed_procedures.sql
TRUNCATE TABLE IF EXISTS service_procedures CASCADE;

-- Vider tables documents (si existent)
-- Note: Vérifier nom réel en DB - peut être "required_documents" ou "service_required_documents"
TRUNCATE TABLE IF EXISTS service_required_documents CASCADE;
TRUNCATE TABLE IF EXISTS required_documents CASCADE;  -- Fallback si nom différent

-- Supprimer ancien schema (radical refactoring)
DROP TABLE IF EXISTS service_procedures CASCADE;
DROP TABLE IF EXISTS service_required_documents CASCADE;
DROP TABLE IF EXISTS required_documents CASCADE;  -- Fallback

COMMENT ON SCHEMA public IS 'Schema cleaned - radical templates migration 004';

-- ============================================
-- PHASE 1: PROCEDURES TEMPLATES
-- ============================================

-- Table 1: Templates de procedures (génériques réutilisables)
CREATE TABLE IF NOT EXISTS procedure_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    name_es VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),
    name_en VARCHAR(255),
    description_es TEXT,
    category VARCHAR(50),

    -- Métadonnées
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER,

    -- Contrainte format
    CONSTRAINT template_code_format CHECK (template_code ~ '^[A-Z0-9_]+$')
);

CREATE INDEX idx_procedure_templates_code ON procedure_templates(template_code);
CREATE INDEX idx_procedure_templates_category ON procedure_templates(category);
CREATE INDEX idx_procedure_templates_active ON procedure_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE procedure_templates IS 'Templates procedures réutilisables (anti-duplication)';
COMMENT ON COLUMN procedure_templates.template_code IS 'Code unique human-readable: PAYMENT_STANDARD_4STEPS';
COMMENT ON COLUMN procedure_templates.usage_count IS 'Nombre services utilisant ce template (dénormalisé)';

-- Table 2: Étapes des templates
CREATE TABLE IF NOT EXISTS procedure_template_steps (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES procedure_templates(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL CHECK (step_number > 0 AND step_number <= 100),

    -- Contenu (ES only, traductions dans entity_translations)
    description_es TEXT NOT NULL,
    instructions_es TEXT,

    -- Configuration
    estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes > 0),
    location_address TEXT,
    office_hours VARCHAR(100),
    requires_appointment BOOLEAN DEFAULT false,
    is_optional BOOLEAN DEFAULT false,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(template_id, step_number)
);

CREATE INDEX idx_template_steps_template ON procedure_template_steps(template_id, step_number);

COMMENT ON TABLE procedure_template_steps IS 'Étapes templates procedures (1 template = N steps)';
COMMENT ON COLUMN procedure_template_steps.description_es IS 'Contenu ES, traductions FR/EN dans entity_translations';

-- Table 3: Association service ↔ template (N:M)
CREATE TABLE IF NOT EXISTS service_procedure_assignments (
    id SERIAL PRIMARY KEY,
    fiscal_service_id INTEGER NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES procedure_templates(id) ON DELETE RESTRICT,

    -- Configuration par service
    applies_to VARCHAR(20) CHECK (applies_to IN ('expedition', 'renewal', 'both')),
    display_order INTEGER DEFAULT 1,
    custom_notes TEXT,

    -- Override steps (optionnel, customisation service-specific)
    override_steps JSONB,

    -- Métadonnées
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INTEGER,

    UNIQUE(fiscal_service_id, template_id)
);

CREATE INDEX idx_service_proc_assignments_service ON service_procedure_assignments(fiscal_service_id);
CREATE INDEX idx_service_proc_assignments_template ON service_procedure_assignments(template_id);

COMMENT ON TABLE service_procedure_assignments IS 'Association service → template procedures (N:M, permet réutilisation)';
COMMENT ON COLUMN service_procedure_assignments.override_steps IS 'JSONB pour override steps individuels si customisation nécessaire';

-- ============================================
-- PHASE 2: DOCUMENTS TEMPLATES
-- ============================================

-- Table 4: Templates de documents
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    document_name_es VARCHAR(255) NOT NULL,
    description_es TEXT,
    category VARCHAR(50),

    -- Validité document (CRITIQUE - Ajouté suite audit)
    validity_duration_months INTEGER CHECK (validity_duration_months > 0),  -- Ex: Passeport=120, Certificat médical=3
    validity_notes TEXT,  -- Ex: "Renouvelable 6 mois avant expiration"

    -- Métadonnées
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER,

    CONSTRAINT doc_template_code_format CHECK (template_code ~ '^[A-Z0-9_]+$')
);

CREATE INDEX idx_document_templates_code ON document_templates(template_code);
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_active ON document_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE document_templates IS 'Templates documents réutilisables (anti-duplication)';
COMMENT ON COLUMN document_templates.template_code IS 'Code unique: DOC_COMPROBANTE_PAGO';

-- Table 5: Association service ↔ document template (N:M)
CREATE TABLE IF NOT EXISTS service_document_assignments (
    id SERIAL PRIMARY KEY,
    fiscal_service_id INTEGER NOT NULL REFERENCES fiscal_services(id) ON DELETE CASCADE,
    document_template_id INTEGER NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,

    -- Configuration par service
    is_required_expedition BOOLEAN DEFAULT true,
    is_required_renewal BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    custom_notes TEXT,

    -- Métadonnées
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INTEGER,

    UNIQUE(fiscal_service_id, document_template_id)
);

CREATE INDEX idx_service_doc_assignments_service ON service_document_assignments(fiscal_service_id);
CREATE INDEX idx_service_doc_assignments_template ON service_document_assignments(document_template_id);

COMMENT ON TABLE service_document_assignments IS 'Association service → template documents (N:M)';

-- ============================================
-- PHASE 3: TRIGGERS AUTOMATIQUES
-- ============================================

-- Trigger 1: Auto-increment usage_count (procedures)
CREATE OR REPLACE FUNCTION update_procedure_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE procedure_templates
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE procedure_templates
        SET usage_count = GREATEST(0, usage_count - 1),
            updated_at = NOW()
        WHERE id = OLD.template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_procedure_template_usage_count
AFTER INSERT OR DELETE ON service_procedure_assignments
FOR EACH ROW
EXECUTE FUNCTION update_procedure_template_usage_count();

-- Trigger 2: Auto-increment usage_count (documents)
CREATE OR REPLACE FUNCTION update_document_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE document_templates
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.document_template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE document_templates
        SET usage_count = GREATEST(0, usage_count - 1),
            updated_at = NOW()
        WHERE id = OLD.document_template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_template_usage_count
AFTER INSERT OR DELETE ON service_document_assignments
FOR EACH ROW
EXECUTE FUNCTION update_document_template_usage_count();

-- Trigger 3: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_procedure_templates_updated_at
BEFORE UPDATE ON procedure_templates
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();

CREATE TRIGGER trigger_procedure_template_steps_updated_at
BEFORE UPDATE ON procedure_template_steps
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();

CREATE TRIGGER trigger_document_templates_updated_at
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();

-- ============================================
-- PHASE 4: VUES UTILITAIRES
-- ============================================

-- Vue 1: Procedures par service (avec traductions)
CREATE OR REPLACE VIEW v_service_procedures_full AS
SELECT
    fs.service_code,
    fs.service_name_es,
    pt.template_code,
    pt.name_es as template_name,
    pts.step_number,
    pts.description_es,
    pts.estimated_duration_minutes,
    pts.location_address,
    pts.requires_appointment,
    spa.applies_to,
    spa.display_order,

    -- Traductions (LEFT JOIN vers entity_translations)
    et_fr.translation_text as description_fr,
    et_en.translation_text as description_en

FROM service_procedure_assignments spa
JOIN fiscal_services fs ON fs.id = spa.fiscal_service_id
JOIN procedure_templates pt ON pt.id = spa.template_id
JOIN procedure_template_steps pts ON pts.template_id = pt.id
LEFT JOIN entity_translations et_fr ON (
    et_fr.entity_type = 'procedure_template_step'
    AND et_fr.entity_code = 'template:' || pt.template_code || ':step_' || pts.step_number
    AND et_fr.language_code = 'fr'
    AND et_fr.field_name = 'description'
)
LEFT JOIN entity_translations et_en ON (
    et_en.entity_type = 'procedure_template_step'
    AND et_en.entity_code = 'template:' || pt.template_code || ':step_' || pts.step_number
    AND et_en.language_code = 'en'
    AND et_en.field_name = 'description'
)
ORDER BY fs.service_code, pts.step_number;

COMMENT ON VIEW v_service_procedures_full IS 'Vue complète procedures par service avec traductions';

-- Vue 2: Documents par service (avec traductions)
CREATE OR REPLACE VIEW v_service_documents_full AS
SELECT
    fs.service_code,
    fs.service_name_es,
    dt.template_code,
    dt.document_name_es,
    dt.category,
    dt.validity_duration_months,
    dt.validity_notes,
    sda.is_required_expedition,
    sda.is_required_renewal,
    sda.display_order,

    -- Traductions
    et_fr.translation_text as document_name_fr,
    et_en.translation_text as document_name_en

FROM service_document_assignments sda
JOIN fiscal_services fs ON fs.id = sda.fiscal_service_id
JOIN document_templates dt ON dt.id = sda.document_template_id
LEFT JOIN entity_translations et_fr ON (
    et_fr.entity_type = 'document_template'
    AND et_fr.entity_code = 'template:' || dt.template_code
    AND et_fr.language_code = 'fr'
    AND et_fr.field_name = 'document_name'
)
LEFT JOIN entity_translations et_en ON (
    et_en.entity_type = 'document_template'
    AND et_en.entity_code = 'template:' || dt.template_code
    AND et_en.language_code = 'en'
    AND et_en.field_name = 'document_name'
)
ORDER BY fs.service_code, sda.display_order;

COMMENT ON VIEW v_service_documents_full IS 'Vue complète documents par service avec traductions';

-- Vue 3: Templates les plus utilisés
CREATE OR REPLACE VIEW v_templates_usage_stats AS
SELECT
    'procedure' as template_type,
    pt.template_code,
    pt.name_es,
    pt.category,
    pt.usage_count as declared_count,
    COUNT(spa.id) as actual_count,
    COUNT(DISTINCT spa.fiscal_service_id) as unique_services
FROM procedure_templates pt
LEFT JOIN service_procedure_assignments spa ON spa.template_id = pt.id
GROUP BY pt.id, pt.template_code, pt.name_es, pt.category, pt.usage_count

UNION ALL

SELECT
    'document' as template_type,
    dt.template_code,
    dt.document_name_es as name_es,
    dt.category,
    dt.usage_count as declared_count,
    COUNT(sda.id) as actual_count,
    COUNT(DISTINCT sda.fiscal_service_id) as unique_services
FROM document_templates dt
LEFT JOIN service_document_assignments sda ON sda.document_template_id = dt.id
GROUP BY dt.id, dt.template_code, dt.document_name_es, dt.category, dt.usage_count

ORDER BY actual_count DESC;

COMMENT ON VIEW v_templates_usage_stats IS 'Statistiques utilisation templates (audit usage_count)';

-- ============================================
-- PHASE 5: FONCTIONS HELPER
-- ============================================

-- Fonction 1: Assigner template à service
CREATE OR REPLACE FUNCTION assign_procedure_template(
    p_service_code VARCHAR(50),
    p_template_code VARCHAR(100),
    p_applies_to VARCHAR(20) DEFAULT 'both'
)
RETURNS INTEGER AS $$
DECLARE
    v_service_id INTEGER;
    v_template_id INTEGER;
    v_assignment_id INTEGER;
BEGIN
    -- Trouver service
    SELECT id INTO v_service_id
    FROM fiscal_services
    WHERE service_code = p_service_code;

    IF v_service_id IS NULL THEN
        RAISE EXCEPTION 'Service % not found', p_service_code;
    END IF;

    -- Trouver template
    SELECT id INTO v_template_id
    FROM procedure_templates
    WHERE template_code = p_template_code;

    IF v_template_id IS NULL THEN
        RAISE EXCEPTION 'Template % not found', p_template_code;
    END IF;

    -- Créer assignment
    INSERT INTO service_procedure_assignments (
        fiscal_service_id, template_id, applies_to
    )
    VALUES (v_service_id, v_template_id, p_applies_to)
    ON CONFLICT (fiscal_service_id, template_id) DO UPDATE
    SET applies_to = EXCLUDED.applies_to
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_procedure_template IS 'Assigner template procedure à service';

-- Fonction 2: Créer template depuis scratch
CREATE OR REPLACE FUNCTION create_procedure_template(
    p_template_code VARCHAR(100),
    p_name_es VARCHAR(255),
    p_category VARCHAR(50) DEFAULT NULL,
    p_steps JSONB DEFAULT '[]'::JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_template_id INTEGER;
    v_step JSONB;
BEGIN
    -- Créer template
    INSERT INTO procedure_templates (template_code, name_es, category)
    VALUES (p_template_code, p_name_es, p_category)
    RETURNING id INTO v_template_id;

    -- Créer steps
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_steps)
    LOOP
        INSERT INTO procedure_template_steps (
            template_id,
            step_number,
            description_es,
            estimated_duration_minutes
        )
        VALUES (
            v_template_id,
            (v_step->>'step_number')::INTEGER,
            v_step->>'description_es',
            (v_step->>'estimated_duration_minutes')::INTEGER
        );
    END LOOP;

    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_procedure_template IS 'Créer template procedure avec steps (helper admin)';

-- Fonction 3: Assigner document template à service
CREATE OR REPLACE FUNCTION assign_document_template(
    p_service_code VARCHAR(50),
    p_template_code VARCHAR(100),
    p_is_required_expedition BOOLEAN DEFAULT true,
    p_is_required_renewal BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    v_service_id INTEGER;
    v_template_id INTEGER;
    v_assignment_id INTEGER;
BEGIN
    -- Trouver service
    SELECT id INTO v_service_id
    FROM fiscal_services
    WHERE service_code = p_service_code;

    IF v_service_id IS NULL THEN
        RAISE EXCEPTION 'Service % not found', p_service_code;
    END IF;

    -- Trouver document template
    SELECT id INTO v_template_id
    FROM document_templates
    WHERE template_code = p_template_code;

    IF v_template_id IS NULL THEN
        RAISE EXCEPTION 'Document template % not found', p_template_code;
    END IF;

    -- Créer assignment
    INSERT INTO service_document_assignments (
        fiscal_service_id, document_template_id,
        is_required_expedition, is_required_renewal
    )
    VALUES (v_service_id, v_template_id, p_is_required_expedition, p_is_required_renewal)
    ON CONFLICT (fiscal_service_id, document_template_id) DO UPDATE
    SET is_required_expedition = EXCLUDED.is_required_expedition,
        is_required_renewal = EXCLUDED.is_required_renewal
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_document_template IS 'Assigner template document à service';

-- Fonction 4: Créer document template
CREATE OR REPLACE FUNCTION create_document_template(
    p_template_code VARCHAR(100),
    p_document_name_es VARCHAR(255),
    p_category VARCHAR(50) DEFAULT NULL,
    p_description_es TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_template_id INTEGER;
BEGIN
    -- Créer document template
    INSERT INTO document_templates (
        template_code, document_name_es, description_es, category
    )
    VALUES (p_template_code, p_document_name_es, p_description_es, p_category)
    RETURNING id INTO v_template_id;

    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_document_template IS 'Créer template document (helper admin)';

COMMIT;

-- ============================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================

-- Vérifier tables créées
SELECT
    'procedure_templates' as table_name,
    COUNT(*) as row_count
FROM procedure_templates
UNION ALL
SELECT 'procedure_template_steps', COUNT(*) FROM procedure_template_steps
UNION ALL
SELECT 'service_procedure_assignments', COUNT(*) FROM service_procedure_assignments
UNION ALL
SELECT 'document_templates', COUNT(*) FROM document_templates
UNION ALL
SELECT 'service_document_assignments', COUNT(*) FROM service_document_assignments;
-- Expected: 0 | 0 | 0 | 0 | 0 (tables vides après migration)

-- Vérifier vues fonctionnent
SELECT COUNT(*) as view_procedures FROM v_service_procedures_full;
SELECT COUNT(*) as view_documents FROM v_service_documents_full;
-- Expected: 0 | 0 (pas de données encore)

-- Vérifier triggers créés
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%template%'
ORDER BY trigger_name;
-- Expected: 6 triggers (usage_count × 2, updated_at × 3)

-- ============================================
-- NOTES MIGRATION
-- ============================================

/*
ARCHITECTURE RADICALE:

1. ✅ Tables service_procedures + service_required_documents SUPPRIMÉES
2. ✅ Templates only (procedure_templates + document_templates)
3. ✅ Assignments N:M (service ↔ template)
4. ✅ Traductions template-based (entity_translations)

AVANTAGES:
- 58.7% économie storage (9829 → 4060 rows)
- 98% économie maintenance (1 UPDATE vs 52)
- Architecture clean (zero redondance)
- Performance optimale (queries simples)

BREAKING CHANGES:
- ⚠️  service_procedures supprimée (incompatible avec code existant)
- ⚠️  service_required_documents supprimée
- ⚠️  Queries backend doivent être mises à jour

ROLLBACK:
- Restaurer backup DB si problème
- Réexécuter migrations 001-003 (recréer ancien schema)

NEXT STEPS:
1. Exécuter cette migration: psql -f 004_radical_templates_migration.sql
2. Générer templates: node scripts/generate-radical-templates.mjs
3. Charger templates: psql -f data/seed/seed_radical_templates.sql
4. Générer traductions: node scripts/generate-template-translations-direct.mjs
5. Charger traductions: psql -f data/seed/seed_template_translations.sql
6. Mettre à jour queries backend (service_procedures → templates)
*/
