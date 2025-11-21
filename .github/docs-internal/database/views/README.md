# TaxasGE Database Views

Optimized PostgreSQL views for the TaxasGE tax declaration platform.

## 📁 Files

| File | Views | Purpose |
|------|-------|---------|
| `00_apply_all_views.sql` | Master | Single script to apply all views |
| `01_declarations_views.sql` | 4 views | Tax declaration lifecycle |
| `02_agents_workload_views.sql` | 5 views | Agent capacity and performance |
| `03_payments_reconciliation_views.sql` | 6 views | Payment tracking and bank reconciliation |
| `04_permissions_rbac_views.sql` | 6 views | Permission management and security audit |
| `DATABASE_VIEWS_DOCUMENTATION.md` | Docs | Complete documentation with examples |

**Total: 21 optimized views** covering all platform operations.

## 🚀 Quick Start

### Apply All Views

```bash
# PostgreSQL command line
psql -U postgres -d taxasge_db -f 00_apply_all_views.sql

# Or apply individually
psql -U postgres -d taxasge_db -f 01_declarations_views.sql
psql -U postgres -d taxasge_db -f 02_agents_workload_views.sql
psql -U postgres -d taxasge_db -f 03_payments_reconciliation_views.sql
psql -U postgres -d taxasge_db -f 04_permissions_rbac_views.sql
```

### Verify Installation

```sql
-- List all views
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Should return 21 views
```

## 📊 View Categories

### 1. Declarations (4 views)

- **v_declarations_complete** - Full declaration details with all joins
- **v_declarations_pending_review** - Agent work queue with priority
- **v_declarations_with_payments** - Payment reconciliation status
- **v_declaration_statistics_by_type** - Analytics and reporting

### 2. Agents & Workload (5 views)

- **v_agents_workload_dashboard** - Real-time capacity monitoring
- **v_available_agents_by_ministry** - Ministry capacity planning
- **v_agent_assignment_history** - Audit trail with SLA tracking
- **v_agent_performance_rankings** - Performance scoring and leaderboards
- **v_agent_work_queue_priority** - Intelligent work distribution

### 3. Payments & Reconciliation (6 views)

- **v_payments_lifecycle_dashboard** - Complete payment journey
- **v_bank_reconciliation_matching** - Intelligent transaction matching
- **v_payment_plans_tracking** - Installment plan monitoring
- **v_revenue_analytics** - Financial reporting and trends
- **v_failed_payments_recovery** - Payment recovery operations
- **v_reconciliation_health_metrics** - System health monitoring

### 4. Permissions & RBAC (6 views)

- **v_user_effective_permissions** - User permission audit
- **v_permission_grants_audit** - Permission grant history
- **v_role_capabilities_summary** - Role-based capabilities
- **v_permission_usage_analytics** - Permission lifecycle management
- **v_overprivileged_users_detection** - Security threat detection
- **v_permission_gaps_analysis** - Role-based provisioning

## 📖 Documentation

See **DATABASE_VIEWS_DOCUMENTATION.md** for:
- Detailed view descriptions
- Example queries
- Performance considerations
- Integration patterns
- Maintenance procedures

## 🔐 Permissions

Grant SELECT access to your application role:

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO taxasge_app;
```

## 🛠️ Maintenance

### Update a View

```sql
-- Views use CREATE OR REPLACE
CREATE OR REPLACE VIEW v_declarations_complete AS
-- Updated query...
```

### Drop All Views

```sql
-- Warning: Only do this if you need to rebuild
DROP VIEW IF EXISTS v_declarations_complete CASCADE;
DROP VIEW IF EXISTS v_declarations_pending_review CASCADE;
-- ... etc
```

## 📈 Performance

All views leverage existing table indexes:
- `tax_declarations(user_id, status)`
- `ministry_agents(is_active, availability_status)`
- `payments(user_id, status)`
- `user_permissions(user_id, permission_id)`

**Best Practice**: Always filter views with WHERE clauses to avoid full table scans.

## 🔗 Integration

```python
# FastAPI example
async def get_pending_declarations(db, limit: int = 10):
    query = """
        SELECT id, user_name, priority, sla_status
        FROM v_declarations_pending_review
        WHERE has_active_assignment = FALSE
        ORDER BY priority, submitted_at
        LIMIT $1
    """
    return await db.fetch(query, limit)
```

## 📝 Notes

- Views are **non-materialized** (always current data)
- No additional storage required
- Performance depends on underlying table indexes
- Consider materializing high-traffic views in production

---

**Created**: 2025-11-21
**Version**: 1.0
**Status**: Production-ready
