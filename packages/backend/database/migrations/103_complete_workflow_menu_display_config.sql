-- Migration 103: Complete workflow_menu_mapping with missing patterns
-- Purpose: Seed menu mapping entries for FP (Función Pública) and VISADO workflows
-- that were missing from the initial migration 063.
-- Date: 2026-02-14
--
-- Note: The workflow_sync_service handles full synchronization at app startup.
-- This migration provides the initial seed data and ensures ON CONFLICT works
-- correctly via the existing unique index (idx_workflow_menu_mapping_pattern).

BEGIN;

-- =============================================================================
-- 1. Add missing workflow_menu_mapping entries (5 patterns, GAP-04)
-- =============================================================================
-- Existing patterns (migration 063): PASAPORTE_%, RESIDENCIA_%, CONDUCIR_%, VEHICULO_%, CONTRATO_%
-- Missing: FP_%, and all VISADO prefixes (4 different prefixes for 4 codes)

INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_appointments, permission_prefix
) VALUES
    -- Función Pública: FP_VERIFICACION, FP_CARNET, FP_PROMOCION, FP_PERMISO, FP_CERTIFICADO
    ('FP_%', 'fp', 'agent.nav.fp', 'Briefcase', 6, TRUE, 'service_requests'),

    -- Visados: PRORROGA_VISADO, VISADO_ALTERNATIVO, PERMANENCIA_EXTRANJERIA, SALIDA_VISADO_VENCIDO
    -- TramitesVisadoWorkflow.menu_group = "VISADO", so this is the primary match
    ('VISADO_%', 'visados', 'agent.nav.visas', 'Globe', 7, FALSE, 'service_requests'),

    -- Fallback patterns for VISADO codes with non-VISADO prefixes
    -- These ensure pattern matching works even if category resolution falls back to prefix
    ('PRORROGA_%', 'visados', 'agent.nav.visas', 'Globe', 7, FALSE, 'service_requests'),
    ('PERMANENCIA_%', 'visados', 'agent.nav.visas', 'Globe', 7, FALSE, 'service_requests'),
    ('SALIDA_%', 'visados', 'agent.nav.visas', 'Globe', 7, FALSE, 'service_requests')
ON CONFLICT (workflow_pattern) DO NOTHING;

COMMIT;
