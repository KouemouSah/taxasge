-- =====================================================================
-- PERMISSIONS & RBAC VIEWS - TaxasGE Database
-- =====================================================================
-- Created: 2025-11-21
-- Purpose: Optimized views for permission management and RBAC operations
-- =====================================================================

-- =====================================================================
-- View 1: v_user_effective_permissions
-- Purpose: Complete view of user permissions (role-based + explicit grants)
-- Usage: Permission checking, user permission dashboard, security audit
-- =====================================================================
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    u.is_active as user_active,

    -- Admin flag
    (u.role = 'admin') as is_admin,

    -- Explicit permissions granted
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'permission_id', up.permission_id,
                'permission_name', p.name,
                'module', p.module,
                'granted_at', up.granted_at,
                'granted_by', up.granted_by_user_id,
                'granter_name', granter.full_name
            )
        ) FILTER (WHERE up.permission_id IS NOT NULL),
        '[]'::json
    ) as explicit_permissions,

    -- Permission count
    COUNT(DISTINCT up.permission_id) as explicit_permission_count,

    -- All modules user has access to (from explicit permissions)
    COALESCE(
        json_agg(DISTINCT p.module) FILTER (WHERE p.module IS NOT NULL),
        '[]'::json
    ) as accessible_modules,

    -- Role capabilities
    CASE u.role
        WHEN 'admin' THEN 'ALL_PERMISSIONS'
        WHEN 'ministry_agent' THEN 'AGENT_OPERATIONS'
        WHEN 'citizen' THEN 'SELF_SERVICE'
        WHEN 'business' THEN 'BUSINESS_OPERATIONS'
        ELSE 'LIMITED'
    END as role_capability_level,

    -- Last activity
    u.last_login_at,
    u.updated_at as profile_updated_at

FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
LEFT JOIN users granter ON up.granted_by_user_id = granter.id
GROUP BY
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.last_login_at,
    u.updated_at
ORDER BY u.role, u.email;

COMMENT ON VIEW v_user_effective_permissions IS
'Complete user permissions view combining role-based and explicit permissions.
Admins automatically have all permissions. Used for security audit and permission management UI.';


-- =====================================================================
-- View 2: v_permission_grants_audit
-- Purpose: Complete audit trail of permission grants and revocations
-- Usage: Security audit, compliance reporting, permission history
-- =====================================================================
CREATE OR REPLACE VIEW v_permission_grants_audit AS
SELECT
    up.user_id,
    u.email as user_email,
    u.full_name as user_name,
    u.role as user_role,

    up.permission_id,
    p.name as permission_name,
    p.module as permission_module,
    p.description as permission_description,

    up.granted_at,
    up.granted_by_user_id,
    granter.full_name as granted_by_name,
    granter.email as granted_by_email,
    granter.role as granted_by_role,

    -- Time metrics
    EXTRACT(DAY FROM NOW() - up.granted_at) as days_since_grant,

    -- Categorization
    CASE
        WHEN p.module = 'admin' THEN 'SYSTEM_ADMINISTRATION'
        WHEN p.module IN ('users', 'companies') THEN 'USER_MANAGEMENT'
        WHEN p.module IN ('declarations', 'payments') THEN 'FINANCIAL_OPERATIONS'
        WHEN p.module IN ('agents', 'assignments') THEN 'AGENT_OPERATIONS'
        WHEN p.module = 'documents' THEN 'DOCUMENT_MANAGEMENT'
        ELSE 'OTHER'
    END as permission_category,

    -- Risk level (based on permission name patterns)
    CASE
        WHEN p.name LIKE '%delete%' THEN 'HIGH'
        WHEN p.name LIKE '%update%' THEN 'MEDIUM'
        WHEN p.name LIKE '%create%' THEN 'MEDIUM'
        WHEN p.name LIKE '%view%' THEN 'LOW'
        ELSE 'MEDIUM'
    END as risk_level

FROM user_permissions up
JOIN users u ON up.user_id = u.id
JOIN permissions p ON up.permission_id = p.id
LEFT JOIN users granter ON up.granted_by_user_id = granter.id
ORDER BY up.granted_at DESC;

COMMENT ON VIEW v_permission_grants_audit IS
'Complete audit trail of permission grants with granter info and risk categorization.
Used for security audits, compliance reporting, and permission history tracking.';


-- =====================================================================
-- View 3: v_role_capabilities_summary
-- Purpose: Summary of capabilities by user role
-- Usage: Role management dashboard, capability planning
-- =====================================================================
CREATE OR REPLACE VIEW v_role_capabilities_summary AS
SELECT
    u.role,

    -- User counts
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
    COUNT(DISTINCT CASE WHEN u.is_active = false THEN u.id END) as inactive_users,

    -- Permission grants
    COUNT(DISTINCT up.permission_id) as unique_permissions_granted,
    COUNT(up.permission_id) as total_permission_grants,

    -- Most common permissions for this role
    (
        SELECT json_agg(
            json_build_object(
                'permission_name', p.name,
                'module', p.module,
                'grant_count', COUNT(*)
            )
            ORDER BY COUNT(*) DESC
        )
        FROM user_permissions up2
        JOIN users u2 ON up2.user_id = u2.id
        JOIN permissions p ON up2.permission_id = p.id
        WHERE u2.role = u.role
        GROUP BY p.name, p.module
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) as top_10_permissions,

    -- Module access distribution
    (
        SELECT json_object_agg(
            p.module,
            COUNT(DISTINCT up2.user_id)
        )
        FROM user_permissions up2
        JOIN users u2 ON up2.user_id = u2.id
        JOIN permissions p ON up2.permission_id = p.id
        WHERE u2.role = u.role
        GROUP BY p.module
    ) as module_access_distribution,

    -- Activity metrics
    AVG(EXTRACT(DAY FROM NOW() - u.last_login_at)) as avg_days_since_last_login,
    COUNT(CASE WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
    COUNT(CASE WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days

FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.role
ORDER BY
    CASE u.role
        WHEN 'admin' THEN 1
        WHEN 'super_admin' THEN 2
        WHEN 'ministry_agent' THEN 3
        WHEN 'business' THEN 4
        WHEN 'citizen' THEN 5
        ELSE 6
    END;

COMMENT ON VIEW v_role_capabilities_summary IS
'Aggregated capabilities and permission distribution by user role.
Used for role management, capability planning, and access pattern analysis.';


-- =====================================================================
-- View 4: v_permission_usage_analytics
-- Purpose: Permission usage patterns and frequency
-- Usage: Permission optimization, unused permission identification
-- =====================================================================
CREATE OR REPLACE VIEW v_permission_usage_analytics AS
SELECT
    p.id as permission_id,
    p.name as permission_name,
    p.module,
    p.description,

    -- Grant statistics
    COUNT(DISTINCT up.user_id) as users_with_permission,
    COUNT(up.user_id) as total_grants,

    -- User distribution by role
    COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count,
    COUNT(DISTINCT CASE WHEN u.role = 'ministry_agent' THEN u.id END) as agent_count,
    COUNT(DISTINCT CASE WHEN u.role = 'business' THEN u.id END) as business_count,
    COUNT(DISTINCT CASE WHEN u.role = 'citizen' THEN u.id END) as citizen_count,

    -- Activity metrics
    COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_users_30d,
    COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN u.id END) as active_users_7d,

    -- Grant timing
    MIN(up.granted_at) as first_granted,
    MAX(up.granted_at) as last_granted,
    AVG(EXTRACT(DAY FROM NOW() - up.granted_at)) as avg_days_held,

    -- Usage category
    CASE
        WHEN COUNT(DISTINCT up.user_id) = 0 THEN 'UNUSED'
        WHEN COUNT(DISTINCT up.user_id) < 5 THEN 'RARELY_USED'
        WHEN COUNT(DISTINCT up.user_id) < 20 THEN 'MODERATELY_USED'
        ELSE 'WIDELY_USED'
    END as usage_category,

    -- Recommendation
    CASE
        WHEN COUNT(DISTINCT up.user_id) = 0 THEN 'Consider removing if truly unused'
        WHEN COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '90 days' THEN u.id END) = 0
            THEN 'No active users - review necessity'
        ELSE 'Active usage - keep'
    END as recommendation

FROM permissions p
LEFT JOIN user_permissions up ON p.id = up.permission_id
LEFT JOIN users u ON up.user_id = u.id
GROUP BY p.id, p.name, p.module, p.description
ORDER BY COUNT(DISTINCT up.user_id) DESC, p.module, p.name;

COMMENT ON VIEW v_permission_usage_analytics IS
'Permission usage analytics with grant counts, user distribution, and optimization recommendations.
Used for permission lifecycle management and security policy optimization.';


-- =====================================================================
-- View 5: v_overprivileged_users_detection
-- Purpose: Detect users with excessive permissions
-- Usage: Security audit, privilege escalation detection
-- =====================================================================
CREATE OR REPLACE VIEW v_overprivileged_users_detection AS
WITH user_permission_stats AS (
    SELECT
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        COUNT(DISTINCT up.permission_id) as permission_count,
        COUNT(DISTINCT p.module) as module_count,
        -- High-risk permissions
        COUNT(CASE WHEN p.name LIKE '%delete%' THEN 1 END) as delete_permissions,
        COUNT(CASE WHEN p.name LIKE '%admin%' THEN 1 END) as admin_permissions,
        COUNT(CASE WHEN p.module = 'system' THEN 1 END) as system_permissions
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    LEFT JOIN permissions p ON up.permission_id = p.id
    WHERE u.role != 'admin'  -- Exclude admins (they have all permissions by design)
    GROUP BY u.id, u.email, u.full_name, u.role
)
SELECT
    user_id,
    email,
    full_name,
    role,
    permission_count,
    module_count,
    delete_permissions,
    admin_permissions,
    system_permissions,

    -- Risk score calculation
    (
        (permission_count * 1) +
        (delete_permissions * 5) +
        (admin_permissions * 10) +
        (system_permissions * 15)
    ) as risk_score,

    -- Risk level
    CASE
        WHEN (
            (permission_count * 1) +
            (delete_permissions * 5) +
            (admin_permissions * 10) +
            (system_permissions * 15)
        ) >= 100 THEN 'CRITICAL'
        WHEN (
            (permission_count * 1) +
            (delete_permissions * 5) +
            (admin_permissions * 10) +
            (system_permissions * 15)
        ) >= 50 THEN 'HIGH'
        WHEN (
            (permission_count * 1) +
            (delete_permissions * 5) +
            (admin_permissions * 10) +
            (system_permissions * 15)
        ) >= 20 THEN 'MEDIUM'
        ELSE 'LOW'
    END as risk_level,

    -- Recommendation
    CASE
        WHEN permission_count > 30 THEN 'Review permissions - exceptionally high count'
        WHEN delete_permissions > 5 THEN 'Review delete permissions - security risk'
        WHEN system_permissions > 0 THEN 'Review system permissions - critical access'
        WHEN admin_permissions > 3 THEN 'Review admin permissions - elevated privileges'
        ELSE 'Permissions appear reasonable'
    END as recommendation

FROM user_permission_stats
WHERE
    permission_count > 10  -- Filter to users with significant permissions
    OR delete_permissions > 0
    OR admin_permissions > 0
    OR system_permissions > 0
ORDER BY risk_score DESC, permission_count DESC;

COMMENT ON VIEW v_overprivileged_users_detection IS
'Detects users with potentially excessive permissions using risk scoring.
Used for security audits and privilege escalation prevention.';


-- =====================================================================
-- View 6: v_permission_gaps_analysis
-- Purpose: Identify users who may need permissions based on their role
-- Usage: Permission planning, role-based access provisioning
-- =====================================================================
CREATE OR REPLACE VIEW v_permission_gaps_analysis AS
WITH role_expected_permissions AS (
    -- Define expected permissions by role
    SELECT
        'ministry_agent' as role,
        ARRAY['agents.view', 'assignments.view', 'declarations.view', 'documents.view'] as expected_permissions
    UNION ALL
    SELECT
        'business' as role,
        ARRAY['declarations.create', 'declarations.view', 'payments.view', 'documents.upload'] as expected_permissions
    UNION ALL
    SELECT
        'citizen' as role,
        ARRAY['declarations.create', 'declarations.view', 'payments.view', 'documents.upload'] as expected_permissions
)
SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,

    -- Expected permissions for role
    rep.expected_permissions,

    -- Permissions user currently has
    COALESCE(
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL),
        ARRAY[]::text[]
    ) as current_permissions,

    -- Missing permissions (expected but not granted)
    (
        SELECT array_agg(ep)
        FROM unnest(rep.expected_permissions) ep
        WHERE ep NOT IN (
            SELECT p2.name
            FROM user_permissions up2
            JOIN permissions p2 ON up2.permission_id = p2.id
            WHERE up2.user_id = u.id
        )
    ) as missing_permissions,

    -- Gap count
    (
        SELECT COUNT(ep)
        FROM unnest(rep.expected_permissions) ep
        WHERE ep NOT IN (
            SELECT p2.name
            FROM user_permissions up2
            JOIN permissions p2 ON up2.permission_id = p2.id
            WHERE up2.user_id = u.id
        )
    ) as gap_count,

    -- Last login (for prioritization)
    u.last_login_at,
    EXTRACT(DAY FROM NOW() - u.last_login_at) as days_since_login

FROM users u
LEFT JOIN role_expected_permissions rep ON u.role = rep.role
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.role != 'admin'  -- Admins have all permissions
AND u.is_active = true
GROUP BY
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.last_login_at,
    rep.expected_permissions
HAVING (
    SELECT COUNT(ep)
    FROM unnest(rep.expected_permissions) ep
    WHERE ep NOT IN (
        SELECT p2.name
        FROM user_permissions up2
        JOIN permissions p2 ON up2.permission_id = p2.id
        WHERE up2.user_id = u.id
    )
) > 0
ORDER BY gap_count DESC, u.last_login_at DESC;

COMMENT ON VIEW v_permission_gaps_analysis IS
'Identifies users missing expected permissions for their role.
Used for role-based access provisioning and onboarding automation.';
