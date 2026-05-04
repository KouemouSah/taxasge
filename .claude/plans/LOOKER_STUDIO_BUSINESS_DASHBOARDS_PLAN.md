# Looker Studio — Business Dashboards Plan

**Last updated**: 2026-05-01 (v1.0)
**Owner**: Engineering + Operations
**Audience**: project lead, treasury supervisor, ops manager, ministry stakeholders.
**Companions**:
- [`OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md`](./OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md) — Sentry technical dashboards (engineering audience).
- [`GRAFANA_BUSINESS_POC_PLAN.md`](./GRAFANA_BUSINESS_POC_PLAN.md) — parallel PoC to compare Looker Studio vs Grafana on time-series fine-grain.

This document is the activation plan for **Looker Studio** as the canonical platform for business KPIs and management dashboards on Facil. It covers:
1. Why Looker Studio (and what is in scope vs. NOT in scope).
2. Architecture — how Looker reads from Supabase Postgres without breaking the production OLTP workload.
3. The **4 reference dashboards** to ship in the rollout, with widget-level breakdowns.
4. Six secondary dashboards on the watch-list, in priority order.
5. Six-phase implementation plan with exit criteria per phase.
6. Sharing model — who sees what, embed in `/admin`.
7. Cost model on Free tier and trigger for upgrade.

---

## 1. Why Looker Studio

### 1.1 What Looker Studio is good at

- **Free** for unlimited users on the SaaS tier (only paid billing is through BigQuery storage, if used as backend — and we will not use BigQuery initially).
- **Native PostgreSQL connector** — point at Supabase, write SQL, get a chart. No ETL pipeline to operate.
- **Embed via iframe** in our own `/admin` pages — restricted by Google account or by signed URL.
- **GCP-native** — IAM, secret management, audit logs all already in our org.
- **Drag-drop UI** for non-engineers — ministry stakeholders can clone a dashboard and edit it without writing SQL.

### 1.2 What it is NOT good at (and the workaround)

| Limitation | Concrete impact on Facil | Workaround |
|---|---|---|
| Refresh cadence — minimum 1-15 min cache | Cannot do "live" payment monitoring | Sentry handles real-time error alerting; Looker is for trends, not alarms |
| Limited heatmap / time-series fine-grain | Cannot do "agent activity heatmap by site × hour" cleanly | Grafana PoC (separate plan) covers this gap |
| Slow on > 100K row scans without pre-aggregation | Direct queries to `payments` table will get sluggish | Use materialized views + pre-aggregated tables (`payment_daily_stats`, etc.) |
| No alerting | Cannot ping Slack on KPI threshold | Cloud Monitoring alert on the same SQL query, OR Looker Studio's "scheduled email delivery" |
| No row-level access control on shared dashboards | A ministry stakeholder seeing the dashboard sees ALL ministries by default | Per-ministry **filtered copy** of the dashboard, OR a dynamic filter param backed by Looker's `@DS_USER_EMAIL` |

### 1.3 Why not BigQuery?

BigQuery is the typical backend for Looker Studio at scale. We are skipping it for now because:
- **Cost**: $0.02/GB stored + $5/TB queried. At Facil's volume that's $5-20/month, not free.
- **Data freshness**: BigQuery would need a daily Datastream / Federated Query → 24-hour stale dashboards instead of 1-15 min cache.
- **Operational overhead**: another secret store entry, another IAM role, another data drift surface.

We connect Looker **directly to Supabase Postgres** via the [PostgreSQL connector](https://lookerstudio.google.com/data?connectorId=postgresql). When we hit > 100K rows / second of query load on the OLTP, we add a Supabase **read replica** (separate database, replicating asynchronously) and point Looker at the replica — not BigQuery.

---

## 2. Architecture

### 2.1 Data flow

```
Supabase Postgres (primary, OLTP)
        │
        ▼  read-only credentials, IP allowlist
Looker Studio PostgreSQL connector
        │
        ▼  rendered dashboards, cached 1-15 min
        │
        ├── shared link (signed, expires 30d) → ministry stakeholders
        ├── embed iframe → /admin/dashboards/* in our Next.js
        └── scheduled email PDF (weekly digest) → exec stakeholders
```

### 2.2 Database access model

- **Dedicated read-only role** in Supabase: `looker_readonly`, granted SELECT on a curated allowlist of tables and views (NOT `*`).
- **Materialized views** for heavy aggregations refreshed via cron:
  - `mv_recaudacion_daily` (daily revenue by ministry × method × workflow)
  - `mv_adoption_daily` (DAU/MAU/conversion per workflow)
  - `mv_agent_performance_monthly` (per-agent SLA + decisions)
  - `mv_service_catalog_traffic_30d` (top services by request count)
- **Row Level Security**: NOT relied on for Looker (the `looker_readonly` role bypasses RLS). Per-ministry filtering is done via Looker's filter params, not Postgres RLS.
- **IP allowlist**: Supabase project firewall whitelists Looker Studio's published IP ranges (Google Cloud `_cloud.json` ranges; refreshed annually).

### 2.3 Secret management

| Secret | Where it lives | Who reads it |
|---|---|---|
| `looker-readonly-db-url` | GCP Secret Manager (taxasge-dev) | Engineer who creates the connector once |
| `looker-readonly-db-password` | Same | Same — rotated 180d |

Looker Studio stores the connection internally once configured; no env var injection at runtime. **Rotation**: change in Supabase + re-auth the connector once. Not breaking for the dashboards (they just re-read with the new credentials at next refresh).

### 2.4 Materialized views — refresh strategy

```sql
-- Examples of MVs the dashboards depend on. All refreshed by a cron in
-- app/core/scheduler.py:refresh_dashboard_mvs(), running every 15 min.
-- Source-of-truth is the LIVE table, not the MV — see Memory rule #22.
CREATE MATERIALIZED VIEW mv_recaudacion_daily AS
SELECT
  date_trunc('day', p.created_at) AS day,
  e.code AS entity_code,
  p.method,
  fs.workflow_code,
  count(*) AS payment_count,
  sum(p.amount) AS total_amount
FROM payments p
JOIN service_payments sp ON sp.payment_id = p.id
JOIN service_requests sr ON sr.id = sp.service_request_id
JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
JOIN entities e ON e.id = fs.entity_id
WHERE p.status = 'completed'
  AND p.created_at > now() - interval '90 days'
GROUP BY 1, 2, 3, 4;

CREATE INDEX ON mv_recaudacion_daily (day, entity_code);
```

> **Note (2026-05-04)** : la BD utilise `entities` (pas `ministries`) comme table de référence pour le routage workflow→organisme. Les MIN_* (Ministerio de Hacienda, etc.) sont des entités au même titre que AYUNT_*, CAMARA, ITV, DGT, OFIVE, etc. Le RLS Looker filtre via `entity_code` (résolu par `agent_profiles.entity_id → entities.code`). Voir `app/modules/dashboards/services/rls.py`.

**Refresh pattern**: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recaudacion_daily` requires a unique index. Add `UNIQUE INDEX (day, entity_code, method, workflow_code)` to allow concurrent refresh without locking readers.

**Cron registration**: `app/core/scheduler.py:refresh_dashboard_mvs` runs every 15 min on weekdays, every 1h on weekends. Uses `cron-secret` HMAC header. **Memory rule #23**: every cron MUST be registered in `scheduler.py` or it never runs.

---

## 3. The 4 reference dashboards

Each dashboard targets a specific stakeholder, answers 3-5 specific questions, and is composed of 6-10 widgets. The widget catalog uses Looker Studio primitives (Scorecard, Time-series, Bar, Pie, Geo Map, Pivot Table).

### 3.1 — 💰 Recaudación Fiscal (Treasury)

**URL (target)**: `lookerstudio.google.com/reporting/<id>` — embedded at `/admin/dashboards/recaudacion`
**Audience**: treasury supervisor, ministry of finance liaison, exec.
**Refresh**: 15 min.
**Source**: `mv_recaudacion_daily` + live `payments` for "today" widgets.

**Questions answered**:
- Are we hitting the monthly revenue target by ministry?
- Which payment method (BANGE / card / bank transfer / cash) is dominant?
- Which fiscal service generates the most volume?
- What is today's revenue vs. yesterday's?

**Widgets (8 total)**:

| # | Type | Title | Query / dimensions |
|---|---|---|---|
| 1 | Scorecard | Total recaudado (mes) | `SUM(amount)` filtered to current month, completed status |
| 2 | Scorecard with sparkline | Hoy vs ayer | `SUM(amount)` group by `date_trunc('day', created_at)`, last 2 days |
| 3 | Time-series (line) | Recaudación diaria (90d) | `SUM(amount)` × `day` from `mv_recaudacion_daily` |
| 4 | Bar (stacked) | Recaudación por entidad (mes) | `SUM(amount)` × `entity_code` × `method` |
| 5 | Pie | Repartition par método de pago | `SUM(amount)` × `method`, current month |
| 6 | Bar (horizontal, top-10) | Top 10 services en recaudación | `SUM(amount)` × `workflow_code`, current month |
| 7 | Pivot table | Recaudación par entidad × méthode | rows: entity_code, cols: method, value: SUM(amount) |
| 8 | Scorecard | Pourcentage du target mensuel atteint | `SUM(amount) / monthly_target * 100` — target stored in a 1-row config table or as a hardcoded parameter |

**Filter bar**: date range, entity selector (covers MIN_*, AYUNT_*, CAMARA, ITV, DGT, OFIVE…), payment method selector. All 3 are bound to every chart by default.

**KPI thresholds for color coding**:
- Daily revenue: green > 90% of 30-day moving avg, red < 70%, amber otherwise.
- Method distribution: amber if any method > 80% (concentration risk).

### 3.2 — 🏛️ Adopción Ciudadana (Citizen Adoption)

**URL (target)**: `/admin/dashboards/adopcion`
**Audience**: product owner, citizen-experience lead, marketing/comms.
**Refresh**: 15 min.
**Source**: `mv_adoption_daily` + live `service_requests` for "in progress" widgets.

**Questions answered**:
- Are users adopting the platform (DAU / MAU trends)?
- Which workflows have the worst drop-off?
- What is the conversion funnel from registration to first completed declaration?
- Where do citizens abandon (which step of the wizard)?

**Widgets (8 total)**:

| # | Type | Title |
|---|---|---|
| 1 | Scorecard | DAU (today) |
| 2 | Scorecard | MAU (last 30 days) |
| 3 | Time-series (area) | DAU + MAU trend (90d, dual axis) |
| 4 | Funnel chart | Registration → Login → First request started → First request submitted → First payment completed |
| 5 | Bar (horizontal) | Drop-off rate per workflow (%) — top 10 worst |
| 6 | Time-series (line) | New registrations per day (90d) |
| 7 | Pie | Distribution by user role (citizen / business / accountant) |
| 8 | Geo Map | Active users by region (uses `users.address` parsed) |

**Filter bar**: date range, workflow_code, user_role.

**KPI thresholds**:
- DAU drop > 20% week-over-week → red banner.
- Funnel conversion < 30% (registration → first payment) → amber.

### 3.3 — 👥 Performance Agentes (Agent SLA)

**URL (target)**: `/admin/dashboards/agents`
**Audience**: ops manager, agent supervisor, ministry of admin.
**Refresh**: 15 min.
**Source**: `mv_agent_performance_monthly` + live `agent_work_queue` for queue depth.

**Questions answered**:
- Are 100+ agents meeting their SLA?
- Which sites are overloaded?
- Who are the top performers / worst performers?
- How many requests are escalated, and to whom?

**Widgets (10 total)**:

| # | Type | Title |
|---|---|---|
| 1 | Scorecard | SLA respect rate (current month) |
| 2 | Scorecard | Total decisions (current month) |
| 3 | Scorecard | Average decision time (hours) |
| 4 | Time-series | SLA respect rate trend (90d) |
| 5 | Bar (horizontal) | SLA breach rate by site (%) |
| 6 | Bar (horizontal) | Decisions per agent (top 10) |
| 7 | Pivot table | Agent × workflow_code → decisions count |
| 8 | Bar | Escalation count per entity |
| 9 | Time-series (stacked area) | Queue depth by site (90d) |
| 10 | Pivot table | Site × status → request count |

**Filter bar**: date range, entity_code, site_id.

**KPI thresholds**:
- SLA breach rate > 15% per site → red banner with "site is at capacity" message.
- Top 10% performers / bottom 10% performers highlighted.

### 3.4 — 📊 Catalogue Services (Service Catalog Traffic)

**URL (target)**: `/admin/dashboards/services`
**Audience**: product owner, fiscal services maintenance team, content lead.
**Refresh**: 1h.
**Source**: `mv_service_catalog_traffic_30d`.

**Questions answered**:
- Which services drive the most traffic? (priority for UX investment)
- Are there orphan services (created but never used)?
- Are there fast-growing services (week-over-week increase)?
- What is the distribution of traffic across categories / ministries?

**Widgets (8 total)**:

| # | Type | Title |
|---|---|---|
| 1 | Scorecard | Total active services |
| 2 | Scorecard | Services with > 0 requests in last 30d |
| 3 | Bar (horizontal, top-50) | Top 50 services by request count (30d) |
| 4 | Bar (horizontal, top-20) | Fastest-growing services (week-over-week %) |
| 5 | Bar (horizontal, top-20) | Slowest / orphan services (count = 0 in 30d) |
| 6 | Pie | Distribution by category |
| 7 | Pie | Distribution by ministry |
| 8 | Pivot table | Workflow_code × ministry → request count |

**Filter bar**: ministry, category, status (active/inactive).

---

## 4. Six secondary dashboards (watch-list, prioritised)

Listed in implementation priority order. Each gets a one-line problem statement; full design happens when its phase is reached.

| # | Dashboard | Problem it solves | Audience |
|---|---|---|---|
| 5 | 📜 Compliance & Audit | "Did anyone tamper with permissions / sensitive data this week?" | Security, compliance, audit |
| 6 | 🏦 Treasury Reconciliation | "Did the BANGE webhook reconciled total match the bank statement?" | Treasury, finance |
| 7 | 📦 Document Delivery | "How many PDFs were generated, signed, uploaded, registered, emailed?" | Documents team, support |
| 8 | 🤖 Chatbot RAG Quality | "Are users finding answers? What's the abandon rate?" | AI team |
| 9 | 🏥 System Health Summary | "Is everything green today (1 dashboard for non-engineers)?" | Exec, ops manager |
| 10 | 🔍 Inspector Field Activity | "How many field inspections, by inspector, by site?" | Inspector lead, ops |

---

## 5. Six-phase implementation plan

### Phase 1 — GCP/Supabase foundation (estimated 1 day)

**Goal**: a Looker Studio dashboard reads `users` count from Supabase. Smoke test only.

- [ ] Create Supabase role `looker_readonly` with SELECT on a tiny scope (just `users.id`).
- [ ] Whitelist Looker Studio's IP ranges in Supabase project firewall.
- [ ] Store the readonly DB URL in GCP Secret Manager (`looker-readonly-db-url`).
- [ ] Create the PostgreSQL data source in Looker Studio with the credentials.
- [ ] Build a "Hello world" dashboard with 1 scorecard: `count(users)`.
- [ ] Verify the cache refresh setting (default 15 min, can drop to 1 min for live ops).
- **Exit criterion**: scorecard shows correct user count, refreshes within 15 min after a new signup.

### Phase 2 — Materialized view infrastructure (1 day)

**Goal**: the 4 MVs needed by the reference dashboards exist and refresh on schedule.

- [ ] Write the 4 MV SQL definitions and store them in `migrations/<num>_dashboards_mvs.sql`.
- [ ] Add `app/core/scheduler.py:refresh_dashboard_mvs` cron — every 15 min on weekdays, every 1h on weekends.
- [ ] Add a cron endpoint `/cron/refresh_dashboard_mvs` with HMAC auth (`cron-secret` header).
- [ ] Verify each MV refreshes via `pg_stat_statements` and produces non-empty rows.
- **Exit criterion**: every MV has rows for the last 24h after one cron tick.

### Phase 3 — Dashboard 1 (Recaudación Fiscal) — MVP (1 day)

**Goal**: ship one full reference dashboard, end-to-end, on staging.

- [ ] Extend `looker_readonly` SELECT permissions to the MVs + necessary tables.
- [ ] Build all 8 widgets per §3.1 specs.
- [ ] Configure filter bar.
- [ ] Add color thresholds.
- [ ] Validate data accuracy: pick a known historical day, manually compute revenue from `payments`, compare to dashboard. Variance < 1%.
- **Exit criterion**: stakeholder demo (treasury supervisor) approves; one specific question they had ("how much did MIN_INTERIOR collect last week?") is answered in < 30s.

### Phase 4 — Dashboards 2-4 (3 days)

**Goal**: ship the remaining 3 reference dashboards.

- [ ] Phase 4a — Adopción Ciudadana (1 day, depends on `mv_adoption_daily`).
- [ ] Phase 4b — Performance Agentes (1 day, depends on `mv_agent_performance_monthly`).
- [ ] Phase 4c — Catalogue Services (1 day, depends on `mv_service_catalog_traffic_30d`).
- **Exit criterion per dashboard**: one stakeholder demo + signoff per dashboard.

### Phase 5 — Sharing model + admin embed (1 day)

**Goal**: dashboards reachable from `/admin/dashboards/*` with proper RBAC.

- [ ] Add admin permission `view_business_dashboards` to the RBAC catalog.
- [ ] Create 4 routes `/admin/dashboards/{recaudacion,adopcion,agents,services}` in Next.js.
- [ ] Embed each dashboard via Looker Studio's iframe with `embedded=true&user_email=@DS_USER_EMAIL`.
- [ ] Configure share permissions: viewer access for ministry stakeholders, editor access for product owners.
- [ ] Set up scheduled weekly PDF email to exec list.
- **Exit criterion**: a citizen-role user gets 403; a ministry-stakeholder user sees only their ministry's data; a product-owner user sees everything.

### Phase 6 — Watch-list dashboards 5-10 (timeline TBD)

Triggered when each becomes a priority. Each estimated 1 day if MVs already exist; 2 days if MVs need to be added. Plan the MVs in advance so the dashboards ship fast when called.

---

## 6. Sharing model

### 6.1 Three audience tiers

| Tier | Sees | Access mechanism |
|---|---|---|
| **Internal engineers + ops** | All 4 reference dashboards, raw views | Google account login + GCP IAM role `lookerStudio.viewer` on the dashboards |
| **Ministry stakeholders** | Only their ministry's slice of dashboards 1, 3, 4 | Filtered copy of the dashboard, shared via Google account |
| **Exec** | Read-only summary dashboard 9 + scheduled weekly PDF digest | Email subscription, no login required |

### 6.2 Per-entity filtering pattern

Looker Studio supports `@DS_USER_EMAIL` as a built-in parameter. We map email → entity via the agent profile (canonical source — see `app/modules/dashboards/services/rls.py`):

```sql
-- Optional convenience view if you want a flat email→entity_code map for
-- Looker Path A. The Path B community connector resolves this server-side
-- via agent_profiles → entities directly, no view needed.
CREATE VIEW v_user_entity_map AS
SELECT DISTINCT u.email, e.code AS entity_code
FROM users u
JOIN agent_profiles ap ON ap.user_id = u.id
JOIN entities e ON e.id = ap.entity_id
WHERE ap.deactivated_at IS NULL;
```

In the Looker dashboard query (Path A, when relying on `@DS_USER_EMAIL`):

```sql
SELECT * FROM mv_recaudacion_daily
WHERE entity_code IN (
  SELECT entity_code FROM v_user_entity_map
  WHERE email = PARAM_USER_EMAIL
)
```

A user from `MIN_INTERIOR` (entity `MIN_INTERIOR`) only sees that entity's rows; a user from `AYUNT_MALABO` only sees Malabo town hall rows. Cross-entity comparison is reserved to `admin` / `super_admin` roles, who get the unfiltered dashboard.

> **Note RLS canonique** : le filtrage côté Path B (community connector) est piloté par `app/modules/dashboards/services/rls.py:resolve_user_access()` — il résout `entity_codes` directement depuis `agent_profiles.entity_id`, sans passer par une vue intermédiaire. Voir aussi `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` §4.

### 6.3 Embed in `/admin`

```tsx
// packages/web/src/app/[locale]/(dashboard)/admin/dashboards/recaudacion/page.tsx
export default function RecaudacionPage() {
  const { user } = useAuth();
  const url = `https://lookerstudio.google.com/embed/reporting/${RECAUDACION_DASHBOARD_ID}/page/p_xxx?user_email=${user.email}`;
  return (
    <iframe
      src={url}
      className="h-[calc(100vh-4rem)] w-full border-0"
      allowFullScreen
    />
  );
}
```

The 4 reference dashboards share a layout component. Permissions checked via `permission_required('view_business_dashboards')` on the route.

---

## 7. Cost model

### 7.1 Free tier scope

- **Looker Studio**: free for unlimited users, unlimited dashboards.
- **PostgreSQL connector**: free, no quota.
- **Supabase reads from Looker**: counted against the Supabase free 500 MB egress / month. Estimated 100-500 KB per dashboard render, 4 dashboards × ~50 renders/day = 100 MB/month. Well within free.
- **GCP Secret Manager**: 6 secrets × $0.06/version/month = $0.36/month.

**Total**: <$1/month at staging volume.

### 7.2 Trigger conditions for paid upgrade

- **Supabase egress** > 500 MB/month → upgrade to Pro $25/month for 2 GB.
- **Direct OLTP queries become slow** (Looker dashboards stall, OLTP latency increases) → migrate to a **Supabase read replica** (currently in beta on Pro plan).
- **BigQuery migration**: only when the historical dataset > 50 GB and we want OLAP-grade queries.

### 7.3 Rejected: BigQuery from day 1

Detailed in §1.3. Recap:
- $5-20/month minimum + ETL pipeline ops.
- 24-hour data freshness vs 15-min cache.
- Justifiable only when OLTP scans become OLTP-impacting, which we expect 12+ months out.

---

## 8. Risks and mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Looker Studio slow on direct OLTP queries | High | Medium | MVs + indexed columns; add read replica when latency > 30s |
| PII leak via shared link | Medium | High | Looker Studio role-based sharing only, never public links; per-ministry filtering enforced server-side |
| MV refresh failure silently breaks dashboards | Medium | Medium | Cron alerting (Sentry capture_message on cron handler exception) + dashboard "data freshness" widget showing latest refresh timestamp |
| Cross-cloud egress cost (if backend migrates off GCP) | Low | Low | Looker Studio is GCP-native but works against any Postgres; cost is on the source side, manageable |
| Stakeholder demands real-time (1s) refresh | Medium | Low | Educate: real-time is Sentry/Grafana's domain; Looker is for trends. If unavoidable, use Grafana for that specific KPI |

---

## 9. Open decisions / pending input

- **Monthly revenue targets**: where are they stored? (Today: nowhere. Recommendation: a `dashboard_targets` 1-row config table editable by treasury supervisor.)
- **Inspector field activity dashboard (#10)**: data sources need confirmation — `field_inspections` table is empty as of 2026-04-30, depends on inspector mobile app rollout.
- **Compliance dashboard (#5)**: who owns the audit_logs taxonomy? Currently logs every action but the schema for "what to surface" is undefined.

---

## 10. Changelog

- **2026-05-01 v1.0** — initial plan. 4 reference dashboards (Recaudación, Adopción, Performance Agentes, Catalogue Services) + 6 watch-list. 6-phase rollout. PostgreSQL direct connection (no BigQuery). Per-ministry filtering via `@DS_USER_EMAIL`. Cost model staying inside Supabase + GCP free tier.
