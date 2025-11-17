-- ===========================================================================
-- SEED CUSTOM ROLES - Rôles personnalisés exemples
-- ===========================================================================
-- Description: Création de 3 rôles custom pour démontrer la flexibilité
--              du système de permissions granulaires
-- Date: 2025-11-17
-- Author: Claude Code
-- ===========================================================================

-- Note: Ce script nécessite que seed_permissions.sql et seed_predefined_roles.sql
--       aient déjà été exécutés

-- ===========================================================================
-- RÔLE 1: Superviseur Junior DGI (Permissions Limitées)
-- ===========================================================================
-- Description: Superviseur avec permissions limitées
-- - PEUT: Voir dashboard, agents, statistiques, créer assignations
-- - NE PEUT PAS: Réassigner tâches en cours, supprimer règles, éditer rapports

INSERT INTO roles (code, name, entity_type, description, is_system)
VALUES (
    'supervisor_dgi_junior',
    'Superviseur Junior DGI',
    'DGI',
    'Superviseur DGI avec permissions limitées (formation/junior)',
    FALSE
) ON CONFLICT (code) DO NOTHING;

-- Accorder permissions au superviseur junior
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT
    r.id,
    p.id,
    TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'supervisor_dgi_junior'
AND p.name IN (
    -- Dashboard & Visualisation
    'dashboard.view',
    'dashboard.team_stats',
    'dashboard.agent_stats',

    -- Agents (lecture seule)
    'agents.view',
    'agents.view_workload',
    'agents.view_performance',

    -- Assignments (actions de base)
    'assignment.view',
    'assignment.list',
    'assignment.create',
    'assignment.auto_assign',
    'assignment.update_priority',
    'assignment.extend_deadline',
    'assignment.reassign',  -- Seulement tâches PENDING, pas in_progress

    -- Rules (lecture + création, pas suppression)
    'rules.view',
    'rules.create',
    'rules.edit',
    'rules.activate',
    'rules.view_effectiveness',

    -- Reports (lecture + génération, pas édition)
    'reports.view',
    'reports.generate',
    'reports.export_pdf',
    'reports.export_excel'

    -- EXCLUSIONS CRITIQUES:
    -- ❌ assignment.reassign_in_progress (permission critique)
    -- ❌ assignment.cancel (permission critique)
    -- ❌ rules.delete (permission critique)
    -- ❌ reports.edit (permission critique)
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===========================================================================
-- RÔLE 2: Superviseur Lecture Seule (Read-Only)
-- ===========================================================================
-- Description: Superviseur avec accès lecture seule (audit/consultation)
-- - PEUT: Voir tout (dashboard, agents, stats, règles, rapports)
-- - NE PEUT PAS: Créer, modifier, supprimer quoi que ce soit

INSERT INTO roles (code, name, entity_type, description, is_system)
VALUES (
    'supervisor_readonly',
    'Superviseur Lecture Seule',
    NULL,  -- Global (DGI + Ministry)
    'Superviseur avec accès lecture seule (audit, consultation, analyse)',
    FALSE
) ON CONFLICT (code) DO NOTHING;

-- Accorder UNIQUEMENT permissions de lecture
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT
    r.id,
    p.id,
    TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'supervisor_readonly'
AND p.name IN (
    -- Dashboard (lecture)
    'dashboard.view',
    'dashboard.team_stats',
    'dashboard.agent_stats',

    -- Agents (lecture)
    'agents.view',
    'agents.view_workload',
    'agents.view_performance',

    -- Assignments (lecture)
    'assignment.view',
    'assignment.list',

    -- Rules (lecture)
    'rules.view',
    'rules.view_effectiveness',

    -- Reports (lecture + export, pas génération/édition)
    'reports.view',
    'reports.export_pdf',
    'reports.export_excel'

    -- EXCLUSIONS: Toutes les permissions de création/modification/suppression
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===========================================================================
-- RÔLE 3: Superviseur Senior (Toutes Permissions)
-- ===========================================================================
-- Description: Superviseur avec TOUTES les permissions Assignment
-- - PEUT: Absolument tout, y compris permissions critiques
-- - Utilisation: Superviseurs expérimentés, managers senior

INSERT INTO roles (code, name, entity_type, description, is_system)
VALUES (
    'supervisor_senior',
    'Superviseur Senior',
    NULL,  -- Global (DGI + Ministry)
    'Superviseur senior avec toutes les permissions (y compris critiques)',
    FALSE
) ON CONFLICT (code) DO NOTHING;

-- Accorder TOUTES les permissions Assignment (29 permissions)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT
    r.id,
    p.id,
    TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'supervisor_senior'
AND (
    p.resource IN ('assignment', 'rules', 'reports', 'dashboard', 'agents')
    OR p.module_name = 'assignment'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===========================================================================
-- VÉRIFICATION
-- ===========================================================================

-- Vérifier que les 3 rôles ont été créés
SELECT
    code,
    name,
    entity_type,
    is_system,
    description
FROM roles
WHERE code IN ('supervisor_dgi_junior', 'supervisor_readonly', 'supervisor_senior')
ORDER BY code;

-- Compter les permissions par rôle custom
SELECT
    r.code AS role_code,
    r.name AS role_name,
    COUNT(rp.permission_id) AS permissions_count,
    STRING_AGG(
        CASE WHEN p.is_critical THEN p.name ELSE NULL END,
        ', '
    ) AS critical_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = TRUE
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('supervisor_dgi_junior', 'supervisor_readonly', 'supervisor_senior')
GROUP BY r.id, r.code, r.name
ORDER BY permissions_count DESC;

-- Détail des permissions par rôle
SELECT
    r.code AS role_code,
    r.name AS role_name,
    p.name AS permission_name,
    p.description,
    p.is_critical,
    rp.granted
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('supervisor_dgi_junior', 'supervisor_readonly', 'supervisor_senior')
ORDER BY r.code, p.resource, p.action;

-- ===========================================================================
-- RÉSULTAT ATTENDU
-- ===========================================================================

/*
supervisor_dgi_junior: ~20 permissions (permissions de base + non-critiques)
supervisor_readonly: ~12 permissions (lecture seule)
supervisor_senior: ~29 permissions (TOUTES les permissions Assignment)

Permissions critiques UNIQUEMENT dans supervisor_senior:
- assignment.reassign_in_progress
- assignment.cancel
- rules.delete
- reports.edit
*/

COMMIT;
