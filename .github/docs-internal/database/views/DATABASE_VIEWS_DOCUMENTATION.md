# TaxasGE Database Views - Complete Documentation

**Created:** 2025-11-21
**Author:** System Architecture Team
**Purpose:** Comprehensive documentation of all optimized database views for TaxasGE

---

## Table of Contents

1. [Overview](#overview)
2. [View Categories](#view-categories)
3. [Declarations Views](#declarations-views)
4. [Agent & Workload Views](#agent--workload-views)
5. [Payments & Reconciliation Views](#payments--reconciliation-views)
6. [Permissions & RBAC Views](#permissions--rbac-views)
7. [Performance Considerations](#performance-considerations)
8. [Installation & Usage](#installation--usage)
9. [Maintenance](#maintenance)

---

## Overview

### What are Database Views?

Database views are virtual tables created by stored queries that simplify complex joins, calculations, and aggregations. They provide:

- **Performance Optimization**: Pre-joined data reduces query complexity
- **Security**: Hide sensitive columns and enforce row-level security
- **Maintainability**: Centralize complex business logic
- **Developer Experience**: Simpler queries in application code

### TaxasGE Views Summary

| Category | Views Created | Total Columns | Primary Use Cases |
|----------|---------------|---------------|-------------------|
| Declarations | 4 | ~45 | Dashboard, Agent Queue, Payments, Analytics |
| Agents/Workload | 5 | ~60 | Capacity Planning, Performance Tracking, Assignment |
| Payments/Reconciliation | 6 | ~55 | Payment Tracking, Bank Reconciliation, Revenue |
| Permissions/RBAC | 6 | ~40 | Security Audit, User Management, Access Control |
| **TOTAL** | **21** | **~200** | **Complete Platform Operations** |

---

## View Categories

### 1. Declarations Views
**File**: `01_declarations_views.sql`
**Purpose**: Tax declaration lifecycle management

### 2. Agent & Workload Views
**File**: `02_agents_workload_views.sql`
**Purpose**: Agent capacity planning and performance tracking

### 3. Payments & Reconciliation Views
**File**: `03_payments_reconciliation_views.sql`
**Purpose**: Financial operations and bank reconciliation

### 4. Permissions & RBAC Views
**File**: `04_permissions_rbac_views.sql`
**Purpose**: Access control and security audit

---

## Declarations Views

### v_declarations_complete

**Purpose**: Single source of truth for complete declaration details with all type-specific data

**Key Features**:
- Joins all declaration types (IVA, IRPF, Petroliferos, Retencion)
- Includes user information
- Payment status
- Agent assignment details

**Use Cases**:
- Main dashboard listing
- Declaration detail pages
- Export functionality
- Admin oversight

**Example Query**:
```sql
-- Get all pending declarations for a specific user
SELECT
    id,
    declaration_type,
    calculated_tax,
    status,
    agent_name
FROM v_declarations_complete
WHERE user_id = 'USER_UUID'
AND status IN ('submitted', 'processing')
ORDER BY submitted_at DESC;
```

**Performance**: Indexed on `user_id`, `status`, `declaration_type`

---

### v_declarations_pending_review

**Purpose**: Smart queue for agent assignment with priority calculation

**Key Features**:
- Dynamic priority (HIGH/MEDIUM/LOW based on amount)
- SLA tracking (OVERDUE/AT_RISK/ON_TIME)
- Days waiting calculation
- Assignment status check

**Use Cases**:
- Agent work queue
- Auto-assignment algorithm
- SLA monitoring
- Priority-based routing

**Example Query**:
```sql
-- Get high-priority overdue declarations
SELECT
    id,
    user_name,
    calculated_tax,
    days_waiting,
    priority,
    sla_status
FROM v_declarations_pending_review
WHERE priority = 'HIGH'
AND sla_status = 'OVERDUE'
AND has_active_assignment = FALSE
ORDER BY submitted_at ASC
LIMIT 10;
```

**Business Rules**:
- **HIGH Priority**: Tax amount >= 10M CFA
- **MEDIUM Priority**: Tax amount >= 1M CFA
- **LOW Priority**: Tax amount < 1M CFA
- **OVERDUE**: > 24 hours since submission
- **AT_RISK**: > 20 hours since submission

---

### v_declarations_with_payments

**Purpose**: Complete payment reconciliation view

**Key Features**:
- Payment status (FULLY_PAID/PARTIALLY_PAID/UNPAID)
- Bank transaction details
- Payment plan tracking
- Reconciliation timestamps

**Use Cases**:
- Finance dashboard
- Payment reconciliation
- Revenue reporting
- User payment history

**Example Query**:
```sql
-- Find partially paid declarations for follow-up
SELECT
    declaration_id,
    user_name,
    calculated_tax,
    amount_paid,
    amount_due,
    payment_status
FROM v_declarations_with_payments
WHERE payment_status = 'PARTIALLY_PAID'
AND amount_due > 100000  -- > 100K CFA remaining
ORDER BY fiscal_year DESC, user_name;
```

---

### v_declaration_statistics_by_type

**Purpose**: Real-time analytics by declaration type

**Key Features**:
- Counts by status
- Revenue aggregations
- Average processing time
- Current month metrics

**Use Cases**:
- Executive dashboard
- Trend analysis
- Capacity planning
- Performance KPIs

**Example Query**:
```sql
-- Get current month statistics
SELECT
    declaration_type,
    count_current_month,
    revenue_current_month,
    avg_processing_hours,
    accepted_count,
    rejected_count
FROM v_declaration_statistics_by_type
ORDER BY revenue_current_month DESC;
```

---

## Agent & Workload Views

### v_agents_workload_dashboard

**Purpose**: Real-time agent capacity and performance monitoring

**Key Features**:
- Live capacity percentage
- Load level (FULL/HIGH/MEDIUM/LOW)
- Available capacity calculation
- Performance metrics (approval rate, quality score)
- Ministry assignment

**Use Cases**:
- Admin dashboard
- Load balancing algorithm
- Agent selection UI
- Capacity planning

**Example Query**:
```sql
-- Find available agents with capacity for new assignments
SELECT
    agent_id,
    agent_name,
    ministry_name,
    capacity_percentage,
    available_capacity,
    quality_score,
    approval_rate
FROM v_agents_workload_dashboard
WHERE can_accept_new_assignments = TRUE
AND is_active = TRUE
AND capacity_percentage < 80  -- Not at high load
ORDER BY capacity_percentage ASC, quality_score DESC
LIMIT 5;
```

**Capacity Calculation**:
```
capacity_percentage = (current_assignments / max_concurrent_assignments) * 100

Load Levels:
- FULL: >= 100%
- HIGH: >= 80%
- MEDIUM: >= 50%
- LOW: < 50%
```

---

### v_available_agents_by_ministry

**Purpose**: Ministry-level capacity planning

**Key Features**:
- Agent counts by status
- Aggregated capacity metrics
- Ministry load percentage
- Average performance scores

**Use Cases**:
- Cross-ministry workload balancing
- Ministry capacity planning
- Resource allocation
- Performance comparison

**Example Query**:
```sql
-- Find ministries with highest available capacity
SELECT
    ministry_name,
    total_agents,
    active_agents,
    available_agents,
    available_capacity,
    ministry_load_percentage,
    avg_quality_score
FROM v_available_agents_by_ministry
WHERE available_agents > 0
ORDER BY available_capacity DESC;
```

---

### v_agent_assignment_history

**Purpose**: Complete audit trail of assignments

**Key Features**:
- Timing metrics (hours to start, complete)
- Outcome tracking
- SLA compliance (24-hour target)
- Declaration and ministry context

**Use Cases**:
- Performance reviews
- Process optimization
- SLA reporting
- Audit trail

**Example Query**:
```sql
-- Analyze agent performance for specific agent
SELECT
    agent_name,
    COUNT(*) as total_assignments,
    AVG(total_hours) as avg_completion_hours,
    COUNT(CASE WHEN met_sla = TRUE THEN 1 END) as sla_compliant,
    COUNT(CASE WHEN outcome = 'APPROVED' THEN 1 END) as approvals,
    COUNT(CASE WHEN outcome = 'REJECTED' THEN 1 END) as rejections
FROM v_agent_assignment_history
WHERE agent_id = 'AGENT_UUID'
AND assigned_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_name;
```

**SLA Definition**: Assignment completed within 24 hours

---

### v_agent_performance_rankings

**Purpose**: Gamified performance tracking and bonuses

**Key Features**:
- Composite performance score (0-100)
- Overall and ministry-specific rankings
- Performance tiers (EXCELLENT/GOOD/AVERAGE/NEEDS_IMPROVEMENT)
- Multi-dimensional scoring

**Use Cases**:
- Performance reviews
- Bonus calculations
- Agent leaderboards
- Development programs

**Example Query**:
```sql
-- Get top 10 performers system-wide
SELECT
    agent_name,
    ministry_name,
    performance_score,
    overall_rank,
    performance_tier,
    total_assignments_completed,
    approval_rate,
    quality_score
FROM v_agent_performance_rankings
WHERE overall_rank <= 10
ORDER BY overall_rank;
```

**Performance Score Algorithm**:
```
performance_score =
    (quality_score * 0.4) +           -- 40% weight
    (approval_rate * 0.3) +           -- 30% weight
    (speed_score * 0.3)               -- 30% weight

Speed Score:
- <= 12 hours: 30 points
- <= 18 hours: 20 points
- <= 24 hours: 10 points
- > 24 hours: 0 points

Tiers:
- EXCELLENT: >= 80
- GOOD: >= 60
- AVERAGE: >= 40
- NEEDS_IMPROVEMENT: < 40
```

---

### v_agent_work_queue_priority

**Purpose**: Intelligent work queue with recommendations

**Key Features**:
- Priority calculation (complexity + amount + SLA)
- Lock management (agent reservations)
- Available agents count
- Queue status tracking

**Use Cases**:
- Auto-assignment algorithm
- Work distribution
- Queue management UI
- Lock timeout handling

**Example Query**:
```sql
-- Get next assignment for specific ministry
SELECT
    queue_id,
    declaration_id,
    declaration_type,
    calculated_priority,
    hours_in_queue,
    queue_status,
    available_agents_count
FROM v_agent_work_queue_priority
WHERE ministry_id = 'MINISTRY_UUID'
AND queue_status = 'AVAILABLE'
ORDER BY calculated_priority DESC, hours_in_queue DESC
LIMIT 1;
```

---

## Payments & Reconciliation Views

### v_payments_lifecycle_dashboard

**Purpose**: Complete payment lifecycle tracking

**Key Features**:
- End-to-end payment journey
- Reconciliation status
- Payment plan details
- Timing metrics
- Outstanding amount calculation

**Use Cases**:
- User payment history
- Admin monitoring
- Payment status dashboard
- Support inquiries

**Example Query**:
```sql
-- Get unreconciled completed payments
SELECT
    payment_id,
    user_name,
    declaration_type,
    payment_amount,
    payment_method,
    paid_at,
    reconciliation_status,
    hours_to_payment
FROM v_payments_lifecycle_dashboard
WHERE reconciliation_status = 'AWAITING_RECONCILIATION'
AND paid_at >= NOW() - INTERVAL '7 days'
ORDER BY paid_at DESC;
```

---

### v_bank_reconciliation_matching

**Purpose**: Intelligent bank transaction matching

**Key Features**:
- Unreconciled transactions only
- Suggested matches with confidence scores
- Match count and potential matches
- Urgency levels
- Days unreconciled tracking

**Use Cases**:
- Reconciliation UI
- Automated matching
- Finance operations
- Exception handling

**Example Query**:
```sql
-- Get urgent unreconciled transactions with matches
SELECT
    bank_transaction_id,
    bank_reference,
    bank_amount,
    days_unreconciled,
    urgency_level,
    suggested_matches,
    potential_matches_count
FROM v_bank_reconciliation_matching
WHERE urgency_level = 'HIGH'
AND potential_matches_count > 0
ORDER BY days_unreconciled DESC;
```

**Match Scoring**:
```
100 points: Bank reference exact match
80 points: Amount exact match
60 points: Amount within 100 CFA
40 points: Timing match only

Filters:
- Amount tolerance: 1000 CFA
- Time tolerance: 3 days
```

---

### v_payment_plans_tracking

**Purpose**: Installment plan monitoring

**Key Features**:
- Progress percentage
- Payment status (OVERDUE/DUE_TODAY/DUE_SOON/ACTIVE)
- Recent and upcoming installments
- Days until next payment

**Use Cases**:
- Payment reminders
- Collection management
- User dashboard
- Default prevention

**Example Query**:
```sql
-- Find overdue payment plans
SELECT
    plan_id,
    user_name,
    user_email,
    user_phone,
    total_amount,
    completion_percentage,
    payment_status,
    days_until_next_payment,
    amount_remaining
FROM v_payment_plans_tracking
WHERE payment_status = 'OVERDUE'
ORDER BY days_until_next_payment DESC;
```

**Status Rules**:
- **COMPLETED**: Plan fully paid
- **CANCELLED**: Plan cancelled
- **OVERDUE**: Next due date < today
- **DUE_TODAY**: Next due date = today
- **DUE_SOON**: Next due date within 7 days
- **ACTIVE**: All other active plans

---

### v_revenue_analytics

**Purpose**: Financial reporting and trend analysis

**Key Features**:
- Time-series aggregations (day/week/month/quarter/year)
- Declaration type breakdown
- Payment method distribution
- Reconciliation rates
- Unique payer counts

**Use Cases**:
- Executive reporting
- Revenue forecasting
- Trend analysis
- Payment method optimization

**Example Query**:
```sql
-- Get monthly revenue by declaration type
SELECT
    payment_month,
    declaration_type,
    total_revenue,
    total_payments,
    avg_payment_amount,
    reconciliation_rate_percentage,
    unique_payers
FROM v_revenue_analytics
WHERE payment_month >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
ORDER BY payment_month DESC, total_revenue DESC;
```

---

### v_failed_payments_recovery

**Purpose**: Payment recovery operations

**Key Features**:
- Priority classification (CRITICAL/HIGH/MEDIUM/LOW)
- Recommended actions
- User payment history profile
- Days since failure tracking

**Use Cases**:
- Recovery queue
- Collection operations
- Retry scheduling
- Customer outreach

**Example Query**:
```sql
-- Get high-value failed payments for immediate action
SELECT
    payment_id,
    user_name,
    user_email,
    payment_amount,
    recovery_priority,
    recommended_action,
    days_since_failure,
    user_payment_profile
FROM v_failed_payments_recovery
WHERE recovery_priority IN ('CRITICAL', 'HIGH')
AND recommended_action = 'RETRY_NOW'
ORDER BY payment_amount DESC;
```

**Action Rules**:
- **ESCALATE_TO_COLLECTION**: > 30 days since creation
- **RETRY_NOW**: > 7 days since last attempt
- **SCHEDULE_RETRY**: > 3 days since last attempt
- **MONITOR**: < 3 days since last attempt

---

### v_reconciliation_health_metrics

**Purpose**: System-wide reconciliation monitoring

**Key Features**:
- Single-row snapshot view
- Unreconciled counts and amounts
- Aging analysis
- 30-day performance metrics

**Use Cases**:
- Finance dashboard
- Alerting/monitoring
- Performance tracking
- Health checks

**Example Query**:
```sql
-- Get current reconciliation health
SELECT
    snapshot_time,
    unreconciled_transactions,
    unreconciled_amount,
    unreconciled_over_7_days,
    reconciliation_rate_30d,
    avg_reconciliation_hours_30d,
    transactions_today,
    reconciled_today
FROM v_reconciliation_health_metrics;
```

---

## Permissions & RBAC Views

### v_user_effective_permissions

**Purpose**: Complete user permission audit

**Key Features**:
- Combines role-based + explicit permissions
- Admin auto-approval flag
- Module access list
- Last activity tracking

**Use Cases**:
- Security audit
- User permission dashboard
- Access reviews
- Compliance reporting

**Example Query**:
```sql
-- Audit all permissions for specific user
SELECT
    user_id,
    email,
    role,
    is_admin,
    explicit_permissions,
    explicit_permission_count,
    accessible_modules,
    last_login_at
FROM v_user_effective_permissions
WHERE user_id = 'USER_UUID';
```

---

### v_permission_grants_audit

**Purpose**: Complete permission grant history

**Key Features**:
- Grant timestamp and granter details
- Permission categorization
- Risk level assignment
- Days since grant

**Use Cases**:
- Compliance audits
- Permission history
- Security investigations
- Change tracking

**Example Query**:
```sql
-- Find high-risk permission grants in last 30 days
SELECT
    user_email,
    permission_name,
    permission_category,
    risk_level,
    granted_by_name,
    granted_at,
    days_since_grant
FROM v_permission_grants_audit
WHERE risk_level = 'HIGH'
AND granted_at >= NOW() - INTERVAL '30 days'
ORDER BY granted_at DESC;
```

**Risk Levels**:
- **HIGH**: Delete operations
- **MEDIUM**: Create/Update operations
- **LOW**: View operations

---

### v_role_capabilities_summary

**Purpose**: Role-based capability analysis

**Key Features**:
- User counts by role
- Permission distribution
- Top 10 permissions per role
- Module access patterns
- Activity metrics

**Use Cases**:
- Role management
- Capability planning
- Access pattern analysis
- Onboarding templates

**Example Query**:
```sql
-- Compare capabilities across roles
SELECT
    role,
    total_users,
    active_users,
    unique_permissions_granted,
    top_10_permissions,
    active_last_7_days,
    active_last_30_days
FROM v_role_capabilities_summary
ORDER BY total_users DESC;
```

---

### v_permission_usage_analytics

**Purpose**: Permission lifecycle management

**Key Features**:
- Usage categorization (UNUSED/RARELY_USED/MODERATELY_USED/WIDELY_USED)
- User distribution by role
- Active user counts
- Optimization recommendations

**Use Cases**:
- Permission optimization
- Security policy tuning
- Unused permission cleanup
- Access pattern analysis

**Example Query**:
```sql
-- Find unused or rarely used permissions
SELECT
    permission_name,
    module,
    users_with_permission,
    usage_category,
    active_users_30d,
    recommendation
FROM v_permission_usage_analytics
WHERE usage_category IN ('UNUSED', 'RARELY_USED')
ORDER BY users_with_permission DESC;
```

---

### v_overprivileged_users_detection

**Purpose**: Security threat detection

**Key Features**:
- Risk score calculation
- Risk level categorization
- Counts by permission type
- Actionable recommendations

**Use Cases**:
- Security audits
- Privilege escalation prevention
- Access reviews
- Compliance checks

**Example Query**:
```sql
-- Find users with excessive permissions
SELECT
    email,
    role,
    permission_count,
    delete_permissions,
    system_permissions,
    risk_score,
    risk_level,
    recommendation
FROM v_overprivileged_users_detection
WHERE risk_level IN ('CRITICAL', 'HIGH')
ORDER BY risk_score DESC;
```

**Risk Score Formula**:
```
risk_score =
    (permission_count * 1) +
    (delete_permissions * 5) +
    (admin_permissions * 10) +
    (system_permissions * 15)

Levels:
- CRITICAL: >= 100
- HIGH: >= 50
- MEDIUM: >= 20
- LOW: < 20
```

---

### v_permission_gaps_analysis

**Purpose**: Role-based provisioning recommendations

**Key Features**:
- Expected vs current permissions
- Missing permissions identification
- Gap count calculation
- Last login prioritization

**Use Cases**:
- Onboarding automation
- Permission provisioning
- Role compliance
- Access requests

**Example Query**:
```sql
-- Find active users with permission gaps
SELECT
    email,
    role,
    missing_permissions,
    gap_count,
    days_since_login
FROM v_permission_gaps_analysis
WHERE gap_count > 0
AND days_since_login < 30  -- Active users
ORDER BY gap_count DESC, days_since_login ASC;
```

**Expected Permissions by Role**:
- **ministry_agent**: agents.view, assignments.view, declarations.view, documents.view
- **business**: declarations.create, declarations.view, payments.view, documents.upload
- **citizen**: declarations.create, declarations.view, payments.view, documents.upload

---

## Performance Considerations

### Indexes

All views leverage existing table indexes. Key indexes created:

```sql
-- Declarations
CREATE INDEX idx_tax_declarations_user_status ON tax_declarations(user_id, status);
CREATE INDEX idx_tax_declarations_type_status ON tax_declarations(declaration_type, status);

-- Agents
CREATE INDEX idx_agents_active_availability ON ministry_agents(is_active, availability_status) WHERE is_active = TRUE;

-- Payments
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_declaration ON payments(tax_declaration_id);
```

### Query Optimization Tips

1. **Always filter views**: Views join many tables - always add WHERE clauses
   ```sql
   -- Good
   SELECT * FROM v_declarations_complete WHERE user_id = 'UUID';

   -- Bad (scans all rows)
   SELECT * FROM v_declarations_complete;
   ```

2. **Use specific columns**: Don't SELECT * in production
   ```sql
   -- Good
   SELECT id, status, calculated_tax FROM v_declarations_complete;

   -- Bad
   SELECT * FROM v_declarations_complete;
   ```

3. **Leverage view filters**: Many views pre-filter data
   - `v_declarations_pending_review`: Only submitted/processing
   - `v_bank_reconciliation_matching`: Only unreconciled
   - `v_payment_plans_tracking`: Only active/overdue

### Materialized Views (Future Enhancement)

For very large datasets (>1M rows), consider materializing high-traffic views:

```sql
-- Example: Materialize statistics view
CREATE MATERIALIZED VIEW mv_declaration_statistics_by_type AS
SELECT * FROM v_declaration_statistics_by_type;

-- Refresh schedule (e.g., hourly)
REFRESH MATERIALIZED VIEW mv_declaration_statistics_by_type;
```

---

## Installation & Usage

### 1. Apply Views to Database

**Method A: Direct SQL Execution**
```bash
# Apply all views in order
psql -U postgres -d taxasge_db -f 01_declarations_views.sql
psql -U postgres -d taxasge_db -f 02_agents_workload_views.sql
psql -U postgres -d taxasge_db -f 03_payments_reconciliation_views.sql
psql -U postgres -d taxasge_db -f 04_permissions_rbac_views.sql
```

**Method B: Combined Script**
```bash
# Create combined script
cat 0*_*.sql > all_views.sql

# Apply
psql -U postgres -d taxasge_db -f all_views.sql
```

**Method C: Python Migration Script**
```python
import asyncpg
import asyncio
from pathlib import Path

async def apply_views():
    conn = await asyncpg.connect(
        host='localhost',
        database='taxasge_db',
        user='postgres',
        password='your_password'
    )

    view_files = [
        '01_declarations_views.sql',
        '02_agents_workload_views.sql',
        '03_payments_reconciliation_views.sql',
        '04_permissions_rbac_views.sql'
    ]

    for view_file in view_files:
        sql = Path(view_file).read_text()
        await conn.execute(sql)
        print(f"✅ Applied {view_file}")

    await conn.close()

asyncio.run(apply_views())
```

### 2. Verify Installation

```sql
-- List all views
SELECT schemaname, viewname, viewowner
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Test each view
SELECT COUNT(*) as row_count FROM v_declarations_complete;
SELECT COUNT(*) as row_count FROM v_agents_workload_dashboard;
SELECT COUNT(*) as row_count FROM v_payments_lifecycle_dashboard;
SELECT COUNT(*) as row_count FROM v_user_effective_permissions;
```

### 3. Grant Permissions

```sql
-- Grant access to application role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO taxasge_app;
GRANT SELECT ON v_declarations_complete TO taxasge_app;
-- Repeat for all views...
```

### 4. Integration Examples

**FastAPI Repository Pattern**:
```python
# repositories/declaration_repository.py
class DeclarationRepository:
    async def get_pending_for_assignment(self, db, limit: int = 10):
        """Get declarations pending agent assignment using view"""
        query = """
            SELECT
                id, user_name, calculated_tax,
                priority, sla_status, days_waiting
            FROM v_declarations_pending_review
            WHERE has_active_assignment = FALSE
            ORDER BY priority, submitted_at
            LIMIT $1
        """
        rows = await db.fetch(query, limit)
        return [dict(row) for row in rows]
```

**Agent Selection Algorithm**:
```python
# services/assignment_service.py
async def find_best_agent(self, db, ministry_id: str):
    """Find best available agent using workload view"""
    query = """
        SELECT agent_id, agent_name, capacity_percentage
        FROM v_agents_workload_dashboard
        WHERE ministry_id = $1
        AND can_accept_new_assignments = TRUE
        ORDER BY capacity_percentage ASC, quality_score DESC
        LIMIT 1
    """
    result = await db.fetchrow(query, ministry_id)
    return dict(result) if result else None
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review slow view queries in logs
- Check view usage analytics
- Validate data accuracy

**Monthly**:
- Analyze view performance
- Update statistics
- Review and optimize indexes

**Quarterly**:
- Consider materialized views for heavy queries
- Review and remove unused views
- Update documentation

### Monitoring Queries

```sql
-- View usage statistics (requires pg_stat_statements)
SELECT
    schemaname,
    viewname,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND relname LIKE 'v_%';

-- Find slow view queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%v_%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Updating Views

```sql
-- Modify existing view
CREATE OR REPLACE VIEW v_declarations_complete AS
-- Updated query...

-- Drop and recreate (if structure changes significantly)
DROP VIEW IF EXISTS v_declarations_complete CASCADE;
CREATE VIEW v_declarations_complete AS
-- New query...
```

### Backup Strategy

```bash
# Backup all views
pg_dump -U postgres -d taxasge_db --schema=public --table='v_*' -f views_backup.sql

# Restore views
psql -U postgres -d taxasge_db -f views_backup.sql
```

---

## Migration Checklist

- [ ] Review all view SQL files for syntax errors
- [ ] Test views on staging database with production-like data
- [ ] Verify indexes exist on underlying tables
- [ ] Apply views to staging database
- [ ] Run integration tests
- [ ] Update application code to use views
- [ ] Document new API endpoints using views
- [ ] Apply views to production database
- [ ] Monitor view performance for 48 hours
- [ ] Update team documentation and training materials

---

## Support & Questions

For questions or issues with these views:
1. Check this documentation first
2. Review view comments in SQL files
3. Consult DATABASE_SCHEMA_REFERENCE.md
4. Contact: architecture@taxasge.cm

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Next Review**: 2025-12-21
