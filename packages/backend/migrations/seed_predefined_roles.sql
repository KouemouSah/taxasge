-- ============================================================================
-- SEED PREDEFINED ROLES - Assign Permissions to System Roles
-- ============================================================================
-- This script assigns appropriate permissions to the 8 system roles
-- Created by: Migration 008 (Permissions Module)
-- Version: 1.0
-- Date: 2025-11-17
-- ============================================================================

-- IMPORTANT: This script should be run AFTER:
-- 1. Migration 008 (creates roles table)
-- 2. Permissions have been registered via PermissionRegistry
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER FUNCTION: Assign permission to role by name
-- ============================================================================
CREATE OR REPLACE FUNCTION assign_permission_by_name(
    p_role_code VARCHAR,
    p_permission_name VARCHAR,
    p_granted BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
    v_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO v_role_id FROM roles WHERE code = p_role_code;

    -- Get permission ID
    SELECT id INTO v_permission_id FROM permissions WHERE name = p_permission_name;

    -- Assign permission if both exist
    IF v_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, granted)
        VALUES (v_role_id, v_permission_id, p_granted)
        ON CONFLICT (role_id, permission_id) DO UPDATE
        SET granted = EXCLUDED.granted;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. ADMIN ROLE - Full Access to Everything
-- ============================================================================
DO $$
DECLARE
    v_admin_role_id UUID;
    v_perm RECORD;
BEGIN
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'admin';

    -- Grant ALL permissions to admin
    FOR v_perm IN SELECT id FROM permissions
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, granted)
        VALUES (v_admin_role_id, v_perm.id, TRUE)
        ON CONFLICT (role_id, permission_id) DO UPDATE
        SET granted = TRUE;
    END LOOP;

    RAISE NOTICE '✅ Admin: Granted ALL permissions';
END $$;


-- ============================================================================
-- 2. SUPERVISOR ROLES (DGI & Ministry) - Management Permissions
-- ============================================================================
-- Grant assignment management permissions to supervisors
DO $$
BEGIN
    -- Supervisor DGI
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.view');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.list');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.create');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.auto_assign');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.reassign');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.reassign_in_progress'); -- CRITICAL
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.cancel');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.update_priority');
    PERFORM assign_permission_by_name('supervisor_dgi', 'assignment.extend_deadline');

    -- Supervisor Ministry (same as DGI)
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.view');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.list');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.create');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.auto_assign');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.reassign');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.reassign_in_progress'); -- CRITICAL
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.cancel');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.update_priority');
    PERFORM assign_permission_by_name('supervisor_ministry', 'assignment.extend_deadline');

    RAISE NOTICE '✅ Supervisors: Granted management permissions';
END $$;


-- ============================================================================
-- 3. AGENT ROLES (DGI & Ministry) - Execution Permissions
-- ============================================================================
-- Agents can view, list, start, and complete their own assignments
DO $$
BEGIN
    -- DGI Agent
    PERFORM assign_permission_by_name('dgi_agent', 'assignment.view');
    PERFORM assign_permission_by_name('dgi_agent', 'assignment.list');
    PERFORM assign_permission_by_name('dgi_agent', 'assignment.start');
    PERFORM assign_permission_by_name('dgi_agent', 'assignment.complete');

    -- Ministry Agent (same as DGI)
    PERFORM assign_permission_by_name('ministry_agent', 'assignment.view');
    PERFORM assign_permission_by_name('ministry_agent', 'assignment.list');
    PERFORM assign_permission_by_name('ministry_agent', 'assignment.start');
    PERFORM assign_permission_by_name('ministry_agent', 'assignment.complete');

    RAISE NOTICE '✅ Agents: Granted execution permissions';
END $$;


-- ============================================================================
-- 4. TAXPAYER ROLE - Read-only Access
-- ============================================================================
-- Taxpayers can only view their own assignment status
DO $$
BEGIN
    PERFORM assign_permission_by_name('taxpayer', 'assignment.view');

    RAISE NOTICE '✅ Taxpayer: Granted read-only permissions';
END $$;


-- ============================================================================
-- 5. PROFESSIONAL ACCOUNTANT ROLE - Read-only + List
-- ============================================================================
-- Professional accountants can view and list assignments for their clients
DO $$
BEGIN
    PERFORM assign_permission_by_name('professional_accountant', 'assignment.view');
    PERFORM assign_permission_by_name('professional_accountant', 'assignment.list');

    RAISE NOTICE '✅ Professional Accountant: Granted read permissions';
END $$;


-- ============================================================================
-- 6. DEVELOPER ROLE - Full Access for Debugging
-- ============================================================================
DO $$
DECLARE
    v_dev_role_id UUID;
    v_perm RECORD;
BEGIN
    SELECT id INTO v_dev_role_id FROM roles WHERE code = 'developer';

    -- Grant ALL permissions to developer (for debugging/testing)
    FOR v_perm IN SELECT id FROM permissions
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, granted)
        VALUES (v_dev_role_id, v_perm.id, TRUE)
        ON CONFLICT (role_id, permission_id) DO UPDATE
        SET granted = TRUE;
    END LOOP;

    RAISE NOTICE '✅ Developer: Granted ALL permissions (debug access)';
END $$;


-- ============================================================================
-- PERMISSIONS MODULE - Assign permissions for role/permission management
-- ============================================================================
DO $$
BEGIN
    -- Admin can manage all permissions/roles
    PERFORM assign_permission_by_name('admin', 'permissions.view');
    PERFORM assign_permission_by_name('admin', 'permissions.create');
    PERFORM assign_permission_by_name('admin', 'permissions.update');
    PERFORM assign_permission_by_name('admin', 'permissions.delete');

    PERFORM assign_permission_by_name('admin', 'roles.view');
    PERFORM assign_permission_by_name('admin', 'roles.create');
    PERFORM assign_permission_by_name('admin', 'roles.update');
    PERFORM assign_permission_by_name('admin', 'roles.delete');
    PERFORM assign_permission_by_name('admin', 'roles.assign_permissions');

    PERFORM assign_permission_by_name('admin', 'user_permissions.view');
    PERFORM assign_permission_by_name('admin', 'user_permissions.grant');
    PERFORM assign_permission_by_name('admin', 'user_permissions.revoke');
    PERFORM assign_permission_by_name('admin', 'user_permissions.update');
    PERFORM assign_permission_by_name('admin', 'user_permissions.cleanup');

    -- Supervisors can view permissions/roles (read-only)
    PERFORM assign_permission_by_name('supervisor_dgi', 'permissions.view');
    PERFORM assign_permission_by_name('supervisor_dgi', 'roles.view');
    PERFORM assign_permission_by_name('supervisor_dgi', 'user_permissions.view');

    PERFORM assign_permission_by_name('supervisor_ministry', 'permissions.view');
    PERFORM assign_permission_by_name('supervisor_ministry', 'roles.view');
    PERFORM assign_permission_by_name('supervisor_ministry', 'user_permissions.view');

    -- Developer can manage permissions (for development)
    PERFORM assign_permission_by_name('developer', 'permissions.view');
    PERFORM assign_permission_by_name('developer', 'permissions.create');
    PERFORM assign_permission_by_name('developer', 'roles.view');
    PERFORM assign_permission_by_name('developer', 'user_permissions.view');
    PERFORM assign_permission_by_name('developer', 'user_permissions.grant');

    RAISE NOTICE '✅ Permissions module: Access configured';
END $$;


-- ============================================================================
-- CLEANUP: Drop helper function
-- ============================================================================
DROP FUNCTION IF EXISTS assign_permission_by_name(VARCHAR, VARCHAR, BOOLEAN);


-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================
DO $$
DECLARE
    v_total_assignments INTEGER;
    v_role RECORD;
    v_perm_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLE PERMISSIONS ASSIGNMENT REPORT';
    RAISE NOTICE '========================================';

    -- Count total role-permission assignments
    SELECT COUNT(*) INTO v_total_assignments FROM role_permissions WHERE granted = TRUE;
    RAISE NOTICE 'Total permission grants: %', v_total_assignments;
    RAISE NOTICE '';

    -- Report by role
    FOR v_role IN
        SELECT r.code, r.name, COUNT(rp.permission_id) as perm_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = TRUE
        WHERE r.is_system = TRUE
        GROUP BY r.id, r.code, r.name
        ORDER BY perm_count DESC
    LOOP
        RAISE NOTICE '% (%): % permissions', v_role.name, v_role.code, v_role.perm_count;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Role permissions seed completed!';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
-- Run this script with:
-- psql -h localhost -U postgres -d taxasge -f seed_predefined_roles.sql
--
-- Or via Python:
-- python -c "import asyncpg; ..."
-- ============================================================================
