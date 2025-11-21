-- =====================================================================
-- MASTER VIEW APPLICATION SCRIPT - TaxasGE Database
-- =====================================================================
-- Created: 2025-11-21
-- Purpose: Apply all database views in correct order
-- Usage: psql -U postgres -d taxasge_db -f 00_apply_all_views.sql
-- =====================================================================
--
-- This script applies all TaxasGE optimized views:
-- - 4 Declarations views
-- - 5 Agent/Workload views
-- - 6 Payments/Reconciliation views
-- - 6 Permissions/RBAC views
-- Total: 21 views
--
-- =====================================================================

\echo '========================================='
\echo 'TaxasGE Database Views Installation'
\echo 'Started at: ' `date`
\echo '========================================='
\echo ''

-- Set client encoding
SET client_encoding = 'UTF8';

-- Enable timing
\timing on

\echo ''
\echo '========================================='
\echo 'Step 1/4: Creating Declarations Views'
\echo '========================================='
\echo ''

\ir 01_declarations_views.sql

\echo ''
\echo '✅ Declarations views created'
\echo ''

\echo ''
\echo '========================================='
\echo 'Step 2/4: Creating Agent & Workload Views'
\echo '========================================='
\echo ''

\ir 02_agents_workload_views.sql

\echo ''
\echo '✅ Agent & Workload views created'
\echo ''

\echo ''
\echo '========================================='
\echo 'Step 3/4: Creating Payments & Reconciliation Views'
\echo '========================================='
\echo ''

\ir 03_payments_reconciliation_views.sql

\echo ''
\echo '✅ Payments & Reconciliation views created'
\echo ''

\echo ''
\echo '========================================='
\echo 'Step 4/4: Creating Permissions & RBAC Views'
\echo '========================================='
\echo ''

\ir 04_permissions_rbac_views.sql

\echo ''
\echo '✅ Permissions & RBAC views created'
\echo ''

-- Verify all views exist
\echo ''
\echo '========================================='
\echo 'Verification: Listing All Created Views'
\echo '========================================='
\echo ''

SELECT
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'v_%'
ORDER BY viewname;

\echo ''
\echo '========================================='
\echo 'View Row Counts (Sample Data)'
\echo '========================================='
\echo ''

-- Count rows in each view (helps verify views work)
SELECT 'v_declarations_complete' as view_name, COUNT(*) as row_count FROM v_declarations_complete
UNION ALL
SELECT 'v_declarations_pending_review', COUNT(*) FROM v_declarations_pending_review
UNION ALL
SELECT 'v_declarations_with_payments', COUNT(*) FROM v_declarations_with_payments
UNION ALL
SELECT 'v_declaration_statistics_by_type', COUNT(*) FROM v_declaration_statistics_by_type
UNION ALL
SELECT 'v_agents_workload_dashboard', COUNT(*) FROM v_agents_workload_dashboard
UNION ALL
SELECT 'v_available_agents_by_ministry', COUNT(*) FROM v_available_agents_by_ministry
UNION ALL
SELECT 'v_agent_assignment_history', COUNT(*) FROM v_agent_assignment_history
UNION ALL
SELECT 'v_agent_performance_rankings', COUNT(*) FROM v_agent_performance_rankings
UNION ALL
SELECT 'v_agent_work_queue_priority', COUNT(*) FROM v_agent_work_queue_priority
UNION ALL
SELECT 'v_payments_lifecycle_dashboard', COUNT(*) FROM v_payments_lifecycle_dashboard
UNION ALL
SELECT 'v_bank_reconciliation_matching', COUNT(*) FROM v_bank_reconciliation_matching
UNION ALL
SELECT 'v_payment_plans_tracking', COUNT(*) FROM v_payment_plans_tracking
UNION ALL
SELECT 'v_revenue_analytics', COUNT(*) FROM v_revenue_analytics
UNION ALL
SELECT 'v_failed_payments_recovery', COUNT(*) FROM v_failed_payments_recovery
UNION ALL
SELECT 'v_reconciliation_health_metrics', COUNT(*) FROM v_reconciliation_health_metrics
UNION ALL
SELECT 'v_user_effective_permissions', COUNT(*) FROM v_user_effective_permissions
UNION ALL
SELECT 'v_permission_grants_audit', COUNT(*) FROM v_permission_grants_audit
UNION ALL
SELECT 'v_role_capabilities_summary', COUNT(*) FROM v_role_capabilities_summary
UNION ALL
SELECT 'v_permission_usage_analytics', COUNT(*) FROM v_permission_usage_analytics
UNION ALL
SELECT 'v_overprivileged_users_detection', COUNT(*) FROM v_overprivileged_users_detection
UNION ALL
SELECT 'v_permission_gaps_analysis', COUNT(*) FROM v_permission_gaps_analysis
ORDER BY view_name;

\echo ''
\echo '========================================='
\echo 'Installation Summary'
\echo '========================================='
\echo ''
\echo '✅ 4 Declarations views created'
\echo '✅ 5 Agent & Workload views created'
\echo '✅ 6 Payments & Reconciliation views created'
\echo '✅ 6 Permissions & RBAC views created'
\echo ''
\echo 'Total: 21 optimized database views'
\echo ''
\echo '========================================='
\echo 'Installation Complete!'
\echo 'Completed at: ' `date`
\echo '========================================='
\echo ''
\echo 'Next Steps:'
\echo '1. Review DATABASE_VIEWS_DOCUMENTATION.md'
\echo '2. Grant SELECT permissions to application roles'
\echo '3. Update application code to use views'
\echo '4. Monitor view performance'
\echo ''
