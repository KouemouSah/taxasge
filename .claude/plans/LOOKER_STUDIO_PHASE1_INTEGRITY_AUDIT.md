# Looker Studio Phase 1 — Post-Migration Integrity Audit Report

**Date executed**: 2026-05-02
**Migration audited**: `packages/backend/database/migrations/315_looker_readonly_role.sql` (applied live 2026-05-01)
**Auditor**: post-migration script `post_migration_integrity_audit.py`
**Verdict**: **PASS — 9/9 checks green, no integrity damage to the database**

This document is the verified record that Phase 1 of the Looker Studio rollout did not silently break or compromise anything in the production Supabase database. It exists to (a) be cited if a future incident points fingers at this migration and (b) serve as the template for auditing future role-creation migrations.

---

## 1. What was audited

The migration creates a new Postgres role `looker_readonly`, applies 20 SELECT GRANTs (on aggregated MVs and reporting views), and 12 explicit REVOKEs on PII-bearing tables. The audit verified:

- The new role's attributes are exactly what we intended (no superuser escalation).
- No memberships were inherited (the role is fully isolated).
- No `pg_default_acl` entry would silently propagate privileges to future tables.
- No PII table is reachable, even via inheritance or RLS bypass.
- No object's owner was changed.
- No active session of any other role was affected.
- All Supabase-managed roles (`postgres`, `supabase_admin`, `anon`, `authenticated`, `service_role`, `authenticator`) are still healthy.

---

## 2. Detailed results

### 2.1 — `looker_readonly` final attributes (must be deny-by-default)

| Attribute | Expected | Actual | Status |
|---|---|---|---|
| `rolsuper` | False | False | ✅ |
| `rolcreaterole` | False | False | ✅ |
| `rolcreatedb` | False | False | ✅ |
| `rolcanlogin` | True | True | ✅ |
| `rolreplication` | False | False | ✅ |
| `rolbypassrls` | False | False | ✅ |
| `rolconnlimit` | 5 | 5 | ✅ |

### 2.2 — Group memberships (must be empty)

The `pg_auth_members` query returned **0 rows** for `looker_readonly`. The role has no inherited privileges from any group role.

### 2.3 — Default privileges (`pg_default_acl`)

`looker_readonly` does **not** appear in any default ACL. Future tables created in `public` will not auto-grant access to it.

### 2.4 — Effective SELECT privileges (must match the 20 GRANTs)

The role can SELECT on exactly **20 objects** (matches the migration grant count):

**Materialized views (18)**:
- `categories_with_services`
- `homepage_stats`
- `ministries_with_stats`
- `mv_agent_daily_workload`
- `mv_company_analytics`
- `mv_company_global_stats`
- `mv_company_stats_by_zone`
- `mv_fiscal_services_catalog`
- `mv_inspection_zone_analytics`
- `mv_obligation_stats_by_ministry`
- `mv_reconciliation_stats`
- `mv_services_translated`
- `mv_treasury_daily_kpis`
- `v_declarations_dashboard`
- `v_declarations_stats`
- `v_declarations_stats_by_type`
- `v_payment_plans_monitoring`
- `v_payments_dashboard`

**Standard views (2)**:
- `v_active_assignments`
- `v_active_service_request_assignments`

### 2.5 — Sensitive tables — PII denial check (25 tables)

Every PII-bearing table was tested with `has_table_privilege('looker_readonly', ..., 'SELECT')`. **All 25 returned `false`**:

`users`, `payments`, `service_payments`, `service_requests`, `audit_logs`, `permission_audit_log`, `sessions`, `refresh_tokens`, `agent_profiles`, `uploaded_files`, `ocr_extraction_results`, `support_messages`, `support_tickets`, `support_attachments`, `user_permissions`, `role_permissions`, `user_company_roles`, `user_documents`, `user_document_access_log`, `tax_declarations`, `declaration_iva_details`, `declaration_irpf_data`, `pending_registrations`, `import_batches`.

### 2.6 — Row-level security state on granted objects

For each of the 20 granted objects:
- `relrowsecurity` = false
- `relforcerowsecurity` = false
- `policy_count` = 0

No RLS is in effect on any granted object → the GRANTs are authoritative. No silent override risk.

### 2.7 — Owners of granted objects (none changed)

All 20 granted objects have `owner = postgres`, identical to pre-migration state. The migration did not transfer ownership.

### 2.8 — Health of critical Supabase roles (post-migration)

| Role | `rolcanlogin` | `rolsuper` | Status |
|---|---|---|---|
| `postgres` | True | False | ✅ unchanged |
| `supabase_admin` | True | True | ✅ unchanged |
| `anon` | False | False | ✅ unchanged |
| `authenticated` | False | False | ✅ unchanged |
| `service_role` | False | False | ✅ unchanged |
| `authenticator` | True | False | ✅ unchanged |

### 2.9 — Active connections sanity check

- `supabase_admin`: 4 sessions
- `authenticator`: 1 session
- `postgres`: 1 session

Normal operating pattern. No session was killed or affected by the migration. `looker_readonly` had zero sessions at audit time (expected — Looker Studio data source not yet created).

---

## 3. Conclusions

1. **No integrity damage** — the migration is strictly additive. No DROP, ALTER OWNER, REASSIGN, or DELETE was issued.
2. **No privilege escalation** — `looker_readonly` is the most restricted role in the database (no superuser, no createdb, no createrole, no replication, no bypass RLS, conn limit 5).
3. **No silent PII leak** — defense in depth holds: GRANTs are the only path to data, and 25 spot-checked PII tables are all denied.
4. **No collateral effect on other roles** — pg_auth_members shows the new role is fully isolated; existing roles' attributes and sessions are untouched.
5. **Idempotent on rerun** — the migration's `CREATE ROLE IF NOT EXISTS` + `GRANT` (no-op when already granted) + `REVOKE` (no-op when nothing to revoke) means re-running it has zero side effects beyond logging "role already exists".

---

## 4. Operational notes for future reviewers

- The `.sql` file in `migrations/` is reference + repeatability documentation only. The project does not use a runner (no `schema_migrations` table). Operator pattern is: `psql "$DATABASE_URL" -f packages/backend/database/migrations/315_looker_readonly_role.sql`.
- Password reset is intentionally NOT in the SQL file. It lives in GCP Secret Manager (`looker-readonly-pwd`, version 2 active, version 1 disabled). To rotate: generate a new value, `gcloud secrets versions add looker-readonly-pwd ...`, then `psql "$DATABASE_URL" -c "ALTER ROLE looker_readonly WITH PASSWORD '<paste>';"`. Update the `looker-readonly-db-url` secret in lockstep.
- This audit script (`post_migration_integrity_audit.py`) is the canonical template for any future role-creation migration. Adapt the role name + sensitive tables list and re-run.

---

## 5. Changelog

- **2026-05-02 v1.0** — initial integrity audit. PASS 9/9. Captured exact privilege list (20 objects), exact sensitive denial list (25 tables), and confirmed zero collateral on Supabase-managed roles.
