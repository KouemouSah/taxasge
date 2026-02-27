-- Migration 140: Create supervisor roles for each entity
-- Currently only supervisor_tesoro exists. Each entity needs its own supervisor role
-- with proper permissions assigned.
--
-- Entities needing supervisor roles:
--   CNEDOGE_PASAPORTE, CNEDOGE_RESIDENCIA, ONRC, OFIVE, DGT
--   (TESORO already has supervisor_tesoro)
--
-- Each supervisor gets:
--   - All supervisor.* permissions (dashboard, team, workload, rules, stats, escalations)
--   - Agent self-management permissions
--   - Assignment team permissions
--   - Workload team permissions
--   - Entity-scoped workflow permissions

DO $$
DECLARE
  v_role_id UUID;
  v_perm_id UUID;
  v_inserted_roles INT := 0;
  v_inserted_perms INT := 0;
  v_role RECORD;
  v_perm TEXT;

  -- Supervisor roles to create (code, name, description)
  v_supervisor_roles TEXT[][] := ARRAY[
    ARRAY['supervisor_cnedoge_pasaporte', 'Supervisor CNEDOGE Pasaportes', 'Supervisor del servicio de pasaportes - CNEDOGE'],
    ARRAY['supervisor_cnedoge_residencia', 'Supervisor CNEDOGE Residencias', 'Supervisor del servicio de residencias - CNEDOGE'],
    ARRAY['supervisor_onrc', 'Supervisor ONRC', 'Supervisor de la Oficina Nacional de Registro de Contratos'],
    ARRAY['supervisor_ofive', 'Supervisor OFIVE', 'Supervisor de la Oficina de Vehículos - CUVE'],
    ARRAY['supervisor_dgt', 'Supervisor DGT', 'Supervisor de la Dirección General de Tráfico']
  ];

  -- Core supervisor permissions (must exist in permissions table)
  v_supervisor_permissions TEXT[] := ARRAY[
    -- Supervisor dashboard & team
    'supervisor.dashboard.view',
    'supervisor.team.view',
    'supervisor.team.manage',
    -- Supervisor workload
    'supervisor.workload.view',
    'supervisor.workload.balance',
    -- Supervisor assignment rules
    'supervisor.rules.view',
    'supervisor.rules.create',
    'supervisor.rules.update',
    'supervisor.rules.delete',
    'supervisor.rules.activate',
    -- Supervisor stats
    'supervisor.stats.view',
    'supervisor.stats.export',
    -- Escalations
    'escalations.view',
    'escalations.assign',
    'escalations.resolve',
    -- Agent self-management
    'agents.view_own_profile',
    'agents.update_availability',
    -- Assignment team visibility
    'assignments.view_own',
    'assignments.view_team',
    'assignments.reassign',
    'assignment.update_notes',
    'assignment.view_stats',
    -- Workload team visibility
    'workloads.view_own',
    'workloads.view_team',
    'workloads.manage',
    -- Service request processing
    'service_request.process',
    'service_request.escalate',
    -- Notifications
    'notifications.log.read'
  ];

  v_role_arr TEXT[];
BEGIN
  -- ============================================================
  -- Step 1: Create supervisor roles (ON CONFLICT skip if exists)
  -- ============================================================
  FOREACH v_role_arr SLICE 1 IN ARRAY v_supervisor_roles LOOP
    INSERT INTO roles (id, code, name, description, role_type, is_system, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_role_arr[1],
      v_role_arr[2],
      v_role_arr[3],
      'agent',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO NOTHING;

    IF FOUND THEN
      v_inserted_roles := v_inserted_roles + 1;
      RAISE NOTICE 'Created role: %', v_role_arr[1];
    ELSE
      RAISE NOTICE 'Role already exists: %', v_role_arr[1];
    END IF;
  END LOOP;

  -- ============================================================
  -- Step 2: Set default_agent_config for new supervisor roles
  -- ============================================================
  UPDATE roles
  SET default_agent_config = jsonb_build_object(
    'is_supervisor', true,
    'can_escalate', true,
    'can_assign_tasks', true,
    'can_reassign', true,
    'can_approve_unlimited', false
  )
  WHERE code LIKE 'supervisor_%'
  AND default_agent_config IS NULL;

  -- ============================================================
  -- Step 3: Assign permissions to ALL supervisor roles
  --         (including supervisor_tesoro and supervisor_agent)
  -- ============================================================
  FOR v_role IN
    SELECT id, code FROM roles WHERE code LIKE 'supervisor_%'
  LOOP
    FOREACH v_perm IN ARRAY v_supervisor_permissions LOOP
      SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm LIMIT 1;

      IF v_perm_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, granted_at)
        VALUES (v_role.id, v_perm_id, NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING;

        IF FOUND THEN
          v_inserted_perms := v_inserted_perms + 1;
        END IF;
      ELSE
        RAISE NOTICE 'Permission % not found — skipping for role %', v_perm, v_role.code;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Migration 140 complete: % roles created, % permission assignments added',
    v_inserted_roles, v_inserted_perms;
END $$;
