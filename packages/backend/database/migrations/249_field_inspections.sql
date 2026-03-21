-- Migration 249: Field Inspections Module
-- Date: 2026-03-20
-- Creates: field_inspections table, permissions, notification templates, indexes
-- Dependencies: commercial_licenses (218), entities (221), agent_profiles (223)

BEGIN;

-- ============================================================
-- 1. FIELD INSPECTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS field_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    agent_id UUID NOT NULL REFERENCES users(id),
    agent_profile_id UUID NOT NULL REFERENCES agent_profiles(id),
    entity_id UUID NOT NULL REFERENCES entities(id),
    entity_location_id UUID NOT NULL REFERENCES entity_locations(id),

    -- What (license + company)
    license_id UUID NOT NULL REFERENCES commercial_licenses(id),
    company_id UUID NOT NULL REFERENCES companies(id),

    -- When
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Status lifecycle
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN (
            'in_progress',          -- Agent is filling the form
            'completed',            -- Inspection done, result recorded
            'mise_en_demeure',      -- MED issued
            'seal_proposed',        -- Seal proposed, awaiting supervisor
            'seal_approved',        -- Seal approved by supervisor
            'seal_rejected',        -- Seal rejected by supervisor
            'cancelled'             -- Cancelled
        )),

    -- Result
    result VARCHAR(20)
        CHECK (result IN ('conforme', 'non_conforme', 'pending')),

    -- Activity check
    activity_conforme BOOLEAN,
    activity_declared VARCHAR(200),
    activity_observed VARCHAR(200),

    -- Financial snapshot at inspection time
    unpaid_obligations_count INTEGER NOT NULL DEFAULT 0,
    unpaid_obligations_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_obligations_count INTEGER NOT NULL DEFAULT 0,

    -- Evidence
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    gps_latitude NUMERIC(10,7),
    gps_longitude NUMERIC(10,7),
    gps_accuracy NUMERIC(6,1),  -- meters
    notes TEXT,

    -- Mise en demeure
    mise_en_demeure_issued BOOLEAN NOT NULL DEFAULT false,
    mise_en_demeure_deadline TIMESTAMPTZ,
    mise_en_demeure_obligations JSONB,  -- array of obligation UUIDs

    -- Scellé (seal)
    seal_applied BOOLEAN NOT NULL DEFAULT false,
    seal_reason VARCHAR(50)
        CHECK (seal_reason IS NULL OR seal_reason IN (
            'non_paiement_apres_med',       -- Non-payment after MED expiry
            'activite_non_autorisee',        -- Unauthorized activity
            'fraude_fiscale',                -- Tax fraud
            'faux_documents',                -- Forged documents
            'refus_controle',                -- Refused inspection
            'non_conformite_grave',          -- Serious non-compliance
            'decision_judiciaire',           -- Court order
            'ordre_ministeriel'              -- Ministerial order
        )),
    seal_notes TEXT,
    seal_photo TEXT,  -- URL of seal photo
    seal_proposed_at TIMESTAMPTZ,
    seal_approved_by UUID REFERENCES users(id),
    seal_approved_at TIMESTAMPTZ,
    seal_rejection_reason TEXT,

    -- Payment collection (field)
    payment_collected BOOLEAN NOT NULL DEFAULT false,
    payment_id UUID REFERENCES service_payments(id),
    payment_receipt_number VARCHAR(50),
    payment_amount NUMERIC(12,2),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One inspection per agent per company per day
    CONSTRAINT uq_inspection_agent_company_day
        UNIQUE (agent_id, company_id, inspection_date)
);

-- Indexes for common queries
CREATE INDEX idx_fi_agent ON field_inspections(agent_id, inspection_date DESC);
CREATE INDEX idx_fi_company ON field_inspections(company_id, inspection_date DESC);
CREATE INDEX idx_fi_license ON field_inspections(license_id);
CREATE INDEX idx_fi_entity ON field_inspections(entity_id, inspection_date DESC);
CREATE INDEX idx_fi_status ON field_inspections(status) WHERE status IN ('in_progress', 'seal_proposed');
CREATE INDEX idx_fi_pending_seals ON field_inspections(entity_id, seal_proposed_at)
    WHERE status = 'seal_proposed';
CREATE INDEX idx_fi_med_deadline ON field_inspections(mise_en_demeure_deadline)
    WHERE mise_en_demeure_issued = true AND status = 'mise_en_demeure';
CREATE INDEX idx_fi_date ON field_inspections(inspection_date DESC);

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

INSERT INTO permissions (name, description, category)
VALUES
    ('inspection.create', 'Créer des inspections terrain', 'inspections'),
    ('inspection.view_own', 'Voir ses propres inspections', 'inspections'),
    ('inspection.view_entity', 'Voir toutes les inspections de son entité', 'inspections'),
    ('inspection.seal_propose', 'Proposer un scellé', 'inspections'),
    ('inspection.seal_approve', 'Approuver/rejeter un scellé (superviseur)', 'inspections'),
    ('inspection.collect_payment', 'Encaisser un paiement terrain', 'inspections'),
    ('inspection.mise_en_demeure', 'Émettre une mise en demeure', 'inspections'),
    ('inspection.view_reports', 'Voir les rapports d''inspections', 'inspections'),
    ('inspection.export', 'Exporter les données d''inspections', 'inspections')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- Field-facing agent roles (NOT tesoro — they process payments, not inspections)
-- ============================================================

-- Agent permissions: create, view_own, seal_propose, collect_payment, mise_en_demeure
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN (
    'agent_ayuntamiento', 'agent_camara',
    'agent_min_comercio', 'agent_min_hacienda',
    'agent_min_informacion', 'agent_min_turismo',
    'agent_min_agricultura', 'agent_min_electricidad',
    'agent_oms_polyvalent'
)
AND p.name IN (
    'inspection.create',
    'inspection.view_own',
    'inspection.seal_propose',
    'inspection.collect_payment',
    'inspection.mise_en_demeure'
)
ON CONFLICT DO NOTHING;

-- Supervisor permissions: all inspection permissions (including approve + entity view + reports + export)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN (
    'supervisor_ayuntamiento', 'supervisor_camara',
    'supervisor_min_comercio', 'supervisor_min_hacienda',
    'supervisor_min_informacion', 'supervisor_min_turismo',
    'supervisor_min_agricultura', 'supervisor_min_electricidad',
    'supervisor_tesoro'
)
AND p.name IN (
    'inspection.create',
    'inspection.view_own',
    'inspection.view_entity',
    'inspection.seal_propose',
    'inspection.seal_approve',
    'inspection.collect_payment',
    'inspection.mise_en_demeure',
    'inspection.view_reports',
    'inspection.export'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. NOTIFICATION TEMPLATES
-- ============================================================

-- Email templates
INSERT INTO email_templates (template_code, name_es, name_fr, name_en,
    subject_es, subject_fr, subject_en,
    html_content, variables, category, is_active)
VALUES
(
    'inspection_completed',
    'Inspección completada', 'Inspection terminée', 'Inspection completed',
    'Resultado de inspección — {{company_name}}',
    'Résultat d''inspection — {{company_name}}',
    'Inspection result — {{company_name}}',
    '<h2>Inspección completada</h2><p>Empresa: {{company_name}} ({{company_nif}})</p><p>Resultado: {{result}}</p><p>Fecha: {{inspection_date}}</p><p>Agente: {{agent_name}}</p>',
    '["company_name","company_nif","result","inspection_date","agent_name"]',
    'inspections', true
),
(
    'mise_en_demeure_issued',
    'Mise en demeure emitida', 'Mise en demeure émise', 'Formal notice issued',
    'AVISO FORMAL — Regularice su situación fiscal — {{company_name}}',
    'MISE EN DEMEURE — Régularisez votre situation fiscale — {{company_name}}',
    'FORMAL NOTICE — Regularize your fiscal situation — {{company_name}}',
    '<h2>MISE EN DEMEURE</h2><p>Empresa: {{company_name}} ({{company_nif}})</p><p>Monto impago: {{unpaid_amount}} XAF</p><p>Plazo: {{deadline}}</p><p>Sin regularización, su establecimiento será sellado.</p>',
    '["company_name","company_nif","unpaid_amount","deadline","obligations_list"]',
    'inspections', true
),
(
    'seal_proposed',
    'Scellé propuesto', 'Scellé proposé', 'Seal proposed',
    'URGENTE: Scellé propuesto — {{company_name}} — Aprobación requerida',
    'URGENT: Scellé proposé — {{company_name}} — Approbation requise',
    'URGENT: Seal proposed — {{company_name}} — Approval required',
    '<h2>Scellé propuesto</h2><p>Empresa: {{company_name}} ({{company_nif}})</p><p>Motivo: {{seal_reason}}</p><p>Agente: {{agent_name}}</p><p>Por favor, apruebe o rechace esta propuesta.</p>',
    '["company_name","company_nif","seal_reason","agent_name","inspection_id"]',
    'inspections', true
),
(
    'seal_approved',
    'Scellé aprobado', 'Scellé approuvé', 'Seal approved',
    'Su establecimiento ha sido sellado — {{company_name}}',
    'Votre établissement a été mis sous scellé — {{company_name}}',
    'Your establishment has been sealed — {{company_name}}',
    '<h2>ESTABLECIMIENTO SELLADO</h2><p>Empresa: {{company_name}} ({{company_nif}})</p><p>Motivo: {{seal_reason}}</p><p>Para levantar el scellé, regularice todas sus obligaciones fiscales.</p>',
    '["company_name","company_nif","seal_reason","unpaid_amount"]',
    'inspections', true
)
ON CONFLICT (template_code) DO NOTHING;

-- SMS templates
INSERT INTO sms_templates (template_code, name_es, name_fr, name_en,
    content_es, content_fr, content_en,
    variables, category, max_segments, is_active)
VALUES
(
    'MISE_EN_DEMEURE',
    'Mise en demeure SMS', 'Mise en demeure SMS', 'Formal notice SMS',
    'FACIL: AVISO FORMAL a {{company_name}}. Monto impago: {{unpaid_amount}} XAF. Plazo: {{deadline}}. Regularice para evitar el scellé.',
    'FACIL: MISE EN DEMEURE à {{company_name}}. Montant impayé: {{unpaid_amount}} XAF. Délai: {{deadline}}. Régularisez pour éviter le scellé.',
    'FACIL: FORMAL NOTICE to {{company_name}}. Unpaid: {{unpaid_amount}} XAF. Deadline: {{deadline}}. Pay to avoid seal.',
    '["company_name","unpaid_amount","deadline"]',
    'inspections', 2, true
),
(
    'SEAL_APPROVED_SMS',
    'Scellé aprobado SMS', 'Scellé approuvé SMS', 'Seal approved SMS',
    'FACIL: Su establecimiento {{company_name}} ha sido SELLADO por impago. Regularice sus obligaciones para solicitar el levantamiento.',
    'FACIL: Votre établissement {{company_name}} a été SCELLÉ pour impayé. Régularisez pour demander la levée.',
    'FACIL: Your establishment {{company_name}} has been SEALED for non-payment. Pay your obligations to request unsealing.',
    '["company_name"]',
    'inspections', 2, true
)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================
-- 5. ADD INSPECTION MENU TO ENTITY MENUS
-- Add "Inspections" submenu to field-facing agent and supervisor roles
-- ============================================================

-- Agent roles: add field/inspection menu items
UPDATE roles
SET menu_config = jsonb_set(
    menu_config,
    '{menus}',
    menu_config->'menus' || '[{
        "id": "field_inspections",
        "icon": "ClipboardCheck",
        "titleKey": "inspection.nav.inspections",
        "items": [
            {
                "id": "field_dashboard",
                "href": "/dashboard/agent/oms/field",
                "icon": "Activity",
                "titleKey": "inspection.nav.dashboard",
                "permission": "inspection.view_own"
            },
            {
                "id": "field_scan",
                "href": "/dashboard/agent/oms/field/scan",
                "icon": "QrCode",
                "titleKey": "inspection.nav.scan",
                "permission": "inspection.create"
            },
            {
                "id": "field_reconcile",
                "href": "/dashboard/agent/oms/field/reconcile",
                "icon": "Wallet",
                "titleKey": "inspection.nav.reconcile",
                "permission": "inspection.collect_payment"
            }
        ]
    }]'::jsonb
)
WHERE code IN (
    'agent_ayuntamiento', 'agent_camara',
    'agent_min_comercio', 'agent_min_hacienda',
    'agent_min_informacion', 'agent_min_turismo',
    'agent_min_agricultura', 'agent_min_electricidad',
    'agent_oms_polyvalent'
)
AND menu_config IS NOT NULL
AND NOT (menu_config::text LIKE '%field_inspections%');

-- Supervisor roles: add inspection supervision menu items
UPDATE roles
SET menu_config = jsonb_set(
    menu_config,
    '{menus}',
    menu_config->'menus' || '[{
        "id": "inspection_supervision",
        "icon": "Shield",
        "titleKey": "inspection.nav.supervision",
        "items": [
            {
                "id": "inspection_overview",
                "href": "/dashboard/supervisor/inspections",
                "icon": "BarChart3",
                "titleKey": "inspection.nav.overview",
                "permission": "inspection.view_entity"
            },
            {
                "id": "pending_seals",
                "href": "/dashboard/supervisor/inspections/pending-seals",
                "icon": "ShieldAlert",
                "titleKey": "inspection.nav.pendingSeals",
                "permission": "inspection.seal_approve"
            },
            {
                "id": "agent_field_perf",
                "href": "/dashboard/supervisor/inspections/agents",
                "icon": "Users",
                "titleKey": "inspection.nav.agentPerformance",
                "permission": "inspection.view_reports"
            }
        ]
    }]'::jsonb
)
WHERE code IN (
    'supervisor_ayuntamiento', 'supervisor_camara',
    'supervisor_min_comercio', 'supervisor_min_hacienda',
    'supervisor_min_informacion', 'supervisor_min_turismo',
    'supervisor_min_agricultura', 'supervisor_min_electricidad',
    'supervisor_tesoro'
)
AND menu_config IS NOT NULL
AND NOT (menu_config::text LIKE '%inspection_supervision%');

-- ============================================================
-- 6. ADD INSPECTION EVENT TYPES (for reference - actual EventType enum is in Python)
-- ============================================================

-- Notification template mappings for EventBus integration
INSERT INTO notification_templates (template_code, name_es, name_fr, name_en,
    title_es, title_fr, title_en,
    body_es, body_fr, body_en,
    icon, action_url, variables,
    notification_type, priority, is_active)
VALUES
(
    'inspection_completed',
    'Inspección completada', 'Inspection terminée', 'Inspection completed',
    'Inspección completada', 'Inspection terminée', 'Inspection completed',
    'Resultado: {{result}} — {{company_name}}', 'Résultat: {{result}} — {{company_name}}', 'Result: {{result}} — {{company_name}}',
    'check-circle', '/dashboard/agent/oms/field', '["result","company_name"]',
    'info', 'normal', true
),
(
    'seal_proposed',
    'Scellé propuesto', 'Scellé proposé', 'Seal proposed',
    'Scellé a aprobar', 'Scellé à approuver', 'Seal to approve',
    '{{agent_name}} propone sellar {{company_name}} — {{seal_reason}}',
    '{{agent_name}} propose de sceller {{company_name}} — {{seal_reason}}',
    '{{agent_name}} proposes sealing {{company_name}} — {{seal_reason}}',
    'shield-alert', '/dashboard/supervisor/inspections/pending-seals',
    '["agent_name","company_name","seal_reason"]',
    'warning', 'high', true
),
(
    'seal_approved',
    'Scellé aprobado', 'Scellé approuvé', 'Seal approved',
    'Scellé aprobado', 'Scellé approuvé', 'Seal approved',
    '{{company_name}} ha sido sellada — {{seal_reason}}',
    '{{company_name}} a été scellée — {{seal_reason}}',
    '{{company_name}} has been sealed — {{seal_reason}}',
    'shield-off', '/dashboard/supervisor/inspections',
    '["company_name","seal_reason"]',
    'error', 'high', true
),
(
    'mise_en_demeure_issued',
    'Mise en demeure emitida', 'Mise en demeure émise', 'Formal notice issued',
    'Mise en demeure', 'Mise en demeure', 'Formal notice',
    'MED emitida a {{company_name}} — plazo {{deadline}}',
    'MED émise à {{company_name}} — délai {{deadline}}',
    'Formal notice to {{company_name}} — deadline {{deadline}}',
    'alert-triangle', '/dashboard/agent/oms/field',
    '["company_name","deadline"]',
    'warning', 'normal', true
)
ON CONFLICT (template_code) DO NOTHING;

COMMIT;
