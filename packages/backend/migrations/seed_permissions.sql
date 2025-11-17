-- ============================================================================
-- SEED PERMISSIONS - Insert all module permissions
-- ============================================================================
-- This script inserts all permissions for Assignment and Declarations modules
-- Version: 1.0
-- Date: 2025-11-17
-- ============================================================================

BEGIN;

-- ============================================================================
-- ASSIGNMENT MODULE PERMISSIONS (11 permissions)
-- ============================================================================

-- View permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.view', 'assignment', 'view', 'Ver detalles de asignación', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.list', 'assignment', 'list', 'Listar asignaciones', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.create', 'assignment', 'create', 'Crear asignación manual', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.auto_assign', 'assignment', 'auto_assign', 'Ejecutar asignación automática', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Agent actions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.start', 'assignment', 'start', 'Iniciar procesamiento de asignación', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.complete', 'assignment', 'complete', 'Completar asignación', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Management actions (supervisor only)
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.reassign', 'assignment', 'reassign', 'Reasignar declaración a nuevo agente', TRUE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.reassign_in_progress', 'assignment', 'reassign_in_progress', 'Reasignar tarea EN CURSO (crítico)', TRUE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.cancel', 'assignment', 'cancel', 'Cancelar asignación', TRUE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.update_priority', 'assignment', 'update_priority', 'Actualizar prioridad de asignación', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'assignment.extend_deadline', 'assignment', 'extend_deadline', 'Extender fecha límite de asignación', FALSE, 'assignment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- DECLARATIONS MODULE PERMISSIONS (24 permissions)
-- ============================================================================

-- View/Read permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.view', 'declarations', 'view', 'Ver detalles de declaración fiscal', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.list', 'declarations', 'list', 'Listar declaraciones fiscales', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.search', 'declarations', 'search', 'Buscar declaraciones (búsqueda avanzada)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create/Edit permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.create', 'declarations', 'create', 'Crear nueva declaración fiscal', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.update', 'declarations', 'update', 'Actualizar declaración fiscal (borrador)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.delete', 'declarations', 'delete', 'Eliminar declaración (solo borradores)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Workflow permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.submit', 'declarations', 'submit', 'Enviar declaración para procesamiento', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.withdraw', 'declarations', 'withdraw', 'Retirar declaración enviada (antes de revisión)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Document management
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.upload_documents', 'declarations', 'upload_documents', 'Subir documentos adjuntos', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.view_documents', 'declarations', 'view_documents', 'Ver documentos adjuntos', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.delete_documents', 'declarations', 'delete_documents', 'Eliminar documentos adjuntos', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Processing permissions (operators/admin)
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.assign', 'declarations', 'assign', 'Asignar declaración a operador', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.review', 'declarations', 'review', 'Revisar declaración (cambiar a processing)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.approve', 'declarations', 'approve', 'Aprobar declaración fiscal', TRUE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.reject', 'declarations', 'reject', 'Rechazar declaración fiscal', TRUE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.request_clarification', 'declarations', 'request_clarification', 'Solicitar aclaración/corrección', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Administrative permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.bulk_operations', 'declarations', 'bulk_operations', 'Operaciones en masa', TRUE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.view_all', 'declarations', 'view_all', 'Ver todas las declaraciones (admin)', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.export', 'declarations', 'export', 'Exportar datos de declaraciones', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.statistics', 'declarations', 'statistics', 'Ver estadísticas de declaraciones', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Payment-related permissions
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.mark_paid', 'declarations', 'mark_paid', 'Marcar como pagada', TRUE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.update_payment_info', 'declarations', 'update_payment_info', 'Actualizar información de pago', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Workflow tracking
INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.view_workflow', 'declarations', 'view_workflow', 'Ver estado del flujo de trabajo', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'declarations.view_activity_log', 'declarations', 'view_activity_log', 'Ver registro de actividades', FALSE, 'declarations', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================
DO $$
DECLARE
    v_total_permissions INTEGER;
    v_assignment_count INTEGER;
    v_declarations_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PERMISSIONS SEED REPORT';
    RAISE NOTICE '========================================';

    -- Count permissions by module
    SELECT COUNT(*) INTO v_total_permissions FROM permissions;
    SELECT COUNT(*) INTO v_assignment_count FROM permissions WHERE module_name = 'assignment';
    SELECT COUNT(*) INTO v_declarations_count FROM permissions WHERE module_name = 'declarations';

    RAISE NOTICE 'Total permissions: %', v_total_permissions;
    RAISE NOTICE '  Assignment module: %', v_assignment_count;
    RAISE NOTICE '  Declarations module: %', v_declarations_count;

    RAISE NOTICE '';
    RAISE NOTICE 'Critical permissions: %', (SELECT COUNT(*) FROM permissions WHERE is_critical = TRUE);

    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
