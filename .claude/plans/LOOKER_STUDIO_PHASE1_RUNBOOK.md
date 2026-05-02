# Looker Studio — Phase 1 Activation Runbook

**Last updated**: 2026-05-02 (v1.0)
**Companions**:
- [`LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md`](./LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md) — full strategic plan
- `packages/backend/database/migrations/315_looker_readonly_role.sql` — role + grants migration

This runbook walks the operator through **the irreducible UI steps** for activating Looker Studio against the Supabase PostgreSQL database. The Postgres role + GRANTs + secret topology have already been provisioned in code (Phase 1 of the plan, executed 2026-05-01). What is left is what Looker Studio's API does NOT expose: data source creation and the first dashboard.

**Time**: ~15-20 minutes for Phase 1.4–1.7 below.

---

## 1. Pre-flight checks (5 min)

### 1.1 Verify the Postgres role works

```bash
# Pull the credentials from GCP Secret Manager
LOOKER_URL=$(gcloud secrets versions access latest \
  --secret=looker-readonly-db-url --project=taxasge-dev)

# Smoke test (psql or pgcli)
psql "$LOOKER_URL" -c "SELECT count(*) AS treasury_rows FROM mv_treasury_daily_kpis;"
# expected: a number (5 as of 2026-05-01)

# Negative test — must fail
psql "$LOOKER_URL" -c "SELECT count(*) FROM users;"
# expected: ERROR: permission denied for table users
```

If either of those fails, **stop and re-run** `migrations/315_looker_readonly_role.sql` and confirm the GCP Secret Manager versions are not stale (`gcloud secrets versions list looker-readonly-pwd --project=taxasge-dev`).

### 1.2 Note the connection parameters

```
Host:     db.bpdzfkymgydjxxwlctam.supabase.co
Port:     6543                          (Supabase pooler — NOT 5432)
Database: postgres
User:     looker_readonly
Password: $(gcloud secrets versions access latest --secret=looker-readonly-pwd --project=taxasge-dev)
SSL:      Required
```

Why port 6543: Looker Studio holds a steady pool of connections during dashboard refresh (every 1-15 min). The Supabase pooler at 6543 (transaction mode) handles many short queries efficiently and is the recommended path for any analytics tool. Port 5432 is direct connection — fine for migrations, suboptimal for Looker.

---

## 2. Create the Looker Studio data source (1 min via Linking API)

The official Linking API lets us pre-fill the entire connector form via URL parameters (everything except the password — Google forbids credentials in URLs). One click → type pwd → done.

### 2.1 Generate the pre-filled URL

```bash
# Pre-fetch the connection URL once via shell (avoids the gcloud subprocess
# pipe hang observed when calling gcloud.cmd from Python on Cygwin bash).
export LOOKER_READONLY_DB_URL="$(gcloud secrets versions access latest \
    --secret=looker-readonly-db-url --project=taxasge-dev)"

# Generate the pre-filled Looker Studio create-datasource URL
python packages/backend/database/tools/looker_studio_url_generator.py datasource
```

If `LOOKER_READONLY_DB_URL` is unset the script falls back to spawning gcloud directly. The env var path is faster and avoids the known Cygwin pipe issue. Either way, the script prints a URL like:

```
https://lookerstudio.google.com/datasources/create?
  connectorId=2-c-postgres&
  ds.host=db.bpdzfkymgydjxxwlctam.supabase.co&
  ds.port=6543&
  ds.database=postgres&
  ds.username=looker_readonly&
  ds.enableSsl=true&
  ds.refreshFields=true
```

### 2.2 Open the URL in your browser

Sign in with the **same Google account that owns `taxasge-dev`** (`libressai@gmail.com`). The PostgreSQL connector form opens with every field pre-filled except password.

### 2.3 Type the password and authenticate

Paste the password from:

```bash
gcloud secrets versions access latest --secret=looker-readonly-pwd --project=taxasge-dev
```

Click **AUTHENTICATE**. Looker Studio connects, introspects the schema, and shows the 20 tables/views your role can SELECT on.

### 2.4 Trap: connectorId mismatch

If you get `Unknown connector` or `Connector not found`, the built-in PostgreSQL connector ID has changed. Recovery:

1. Open https://lookerstudio.google.com → **Create** → **Data source** → search **PostgreSQL** → click the official one.
2. Look at your browser URL bar. The `connectorId=...` query param is the current value.
3. Override:
   ```bash
   export LOOKER_PG_CONNECTOR_ID="<value from URL>"
   python packages/backend/database/tools/looker_studio_url_generator.py datasource
   ```
4. Use the regenerated URL.

This script-based discovery is the canonical way to keep the generator current — Google occasionally shuffles the built-in connector IDs.

### 2.5 Pick the first table to introspect

After authentication, Looker Studio shows the list of accessible tables. **You should see exactly 20 entries** (matches the GRANT count from migration 315). If you see 0, the password is wrong; re-pull and retry. If you see > 20, someone else has GRANTed extra tables to `looker_readonly` — re-run the integrity audit (`post_migration_integrity_audit.py`) before continuing.

For Phase 2 (dashboard 1 = Recaudación), select **`mv_treasury_daily_kpis`**.

Click **CONNECT** (top-right).

### 2.6 Adjust field types

Looker Studio auto-detects field types. **Override these** if needed:

| Field | Default | Override to |
|---|---|---|
| `report_date` | Date | Date (verify) |
| `total_amount` | Number | Currency (XAF) |
| `avg_amount`, `min_amount`, `max_amount` | Number | Currency (XAF) |
| `payment_count`, `completed_count`, etc. | Number | Number (integer) |
| `avg_processing_minutes` | Number | Number (1 decimal) |

Click **+ Add a Field** if you need calculated fields (e.g. completion rate = `completed_count / payment_count * 100`).

### 2.7 Name the data source

Top-left: rename to `Facil — mv_treasury_daily_kpis`. Saves to your Looker Studio "Data Sources" list.

---

## 3. Build the first dashboard — Recaudación Fiscal (10 min)

Following the plan §3.1 (`LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md`), 8 widgets.

### 3.1 Create the report

1. Top-right of the data source → **Create Report**. Or from the home page → **Create** → **Report** → use the data source you just made.
2. Title the report: `💰 Recaudación Fiscal — Facil`.
3. Set the **default date range** in the canvas → click any blank area → Setup panel → "Date range default" → Last 30 days. Bound to `report_date`.

### 3.2 Add the 8 widgets

Click **Add a chart** for each:

| # | Type | Configuration |
|---|---|---|
| 1 | Scorecard | Metric: `SUM(total_amount)`. Label: "Total recaudado (mes)". Filter date: This month. |
| 2 | Scorecard with sparkline | Metric: `SUM(total_amount)`. Compare to previous: Yesterday vs day before. Style → "Compare" → "Comparison value". |
| 3 | Time-series (line) | Dimension: `report_date`. Metric: `SUM(total_amount)`. Style → smooth line. |
| 4 | Bar (stacked) | Dimension: `ministry_name`. Breakdown: `payment_method`. Metric: `SUM(total_amount)`. Filter: this month. |
| 5 | Pie | Dimension: `payment_method`. Metric: `SUM(total_amount)`. Filter: this month. |
| 6 | Bar (horizontal) | Dimension: `service_name`. Metric: `SUM(total_amount)`. Sort desc. Limit 10. |
| 7 | Pivot table | Rows: `ministry_name`. Cols: `payment_method`. Metric: `SUM(total_amount)`. |
| 8 | Scorecard | Metric: `SUM(total_amount)` / `monthly_target` × 100. (Add `monthly_target` as a calculated field with a literal — see plan §9.) |

### 3.3 Filter bar

Top of canvas → **Add a control**:
- Date range
- Drop-down list bound to `ministry_name`
- Drop-down list bound to `payment_method`

All three apply to every chart by default.

### 3.4 Color thresholds (KPI traffic-light)

- Scorecard #1: Style → Conditional formatting → if value > monthly_avg×0.9 → green, < monthly_avg×0.7 → red, else amber.
- Scorecard #2: Style → already shows comparison delta — set "Compare" color thresholds.

### 3.5 Save and share

1. **Top-right → Share**. Add `libressai@gmail.com` as Editor (default).
2. **Get link** → set to "Restricted" (only people you add can view). Do NOT use "Public on the web".
3. Copy the report URL — to be embedded in `/admin/dashboards/recaudacion` (Phase 5).

---

## 4. Verification checklist

- [ ] Data source `Facil — mv_treasury_daily_kpis` exists in your Looker home.
- [ ] Report `💰 Recaudación Fiscal — Facil` exists.
- [ ] All 8 widgets render data (no "No data" placeholders).
- [ ] Filter bar works — picking a single ministry filters every chart.
- [ ] Refresh: open the report, wait > 1 min, click any chart → "View data" → confirm `last_refresh` timestamp moved.
- [ ] Negative test: open the report in incognito with a different Google account → should be denied (because share is "Restricted").

---

## 5. What's NOT in scope of Phase 1

- The remaining 3 reference dashboards (Adopción, Performance Agentes, Catalogue Services) — that's Phase 4 of the strategic plan.
- The new MV `mv_adoption_daily` (DAU/MAU/funnel) — Phase 2 if Adopción dashboard ships first.
- Per-ministry filtered share via `@DS_USER_EMAIL` — Phase 5 (sharing model).
- Embed in `/admin/dashboards/recaudacion` — Phase 5.
- Cron `refresh_dashboard_mvs` — NOT needed for Phase 1, because the existing MVs (`mv_treasury_daily_kpis` etc.) are already refreshed by the existing platform schedulers. Verify with:
  ```sql
  SELECT n.nspname || '.' || c.relname AS mv,
         pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
         (SELECT MAX(applied_at) FROM pg_stat_user_tables WHERE schemaname='public' AND relname=c.relname) AS last_seq_scan
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind='m' AND n.nspname='public';
  ```

---

## 6. Rollback (if you need to undo Phase 1)

```bash
# 1. Delete Looker Studio resources via UI:
#    Reports → "💰 Recaudación Fiscal — Facil" → 3-dot menu → Move to trash
#    Data sources → "Facil — mv_treasury_daily_kpis" → 3-dot menu → Disable

# 2. Drop the Postgres role
psql "$DATABASE_URL" <<'SQL'
BEGIN;
  REASSIGN OWNED BY looker_readonly TO postgres;
  DROP OWNED BY looker_readonly;
  DROP ROLE IF EXISTS looker_readonly;
COMMIT;
SQL

# 3. Disable the GCP secrets (don't delete — keep audit trail)
gcloud secrets versions disable $(gcloud secrets versions list looker-readonly-pwd \
  --project=taxasge-dev --filter="state=ENABLED" --format="value(name)") \
  --secret=looker-readonly-pwd --project=taxasge-dev
gcloud secrets versions disable $(gcloud secrets versions list looker-readonly-db-url \
  --project=taxasge-dev --filter="state=ENABLED" --format="value(name)") \
  --secret=looker-readonly-db-url --project=taxasge-dev
```

---

## 7. Free tier constraints — what to monitor

| Constraint | Limit | What happens at limit | Mitigation |
|---|---|---|---|
| Looker Studio | unlimited (free SaaS forever) | n/a | n/a |
| Supabase egress | 500 MB / month | dashboards stop refreshing | Upgrade to Pro $25/month for 2 GB |
| Supabase IP allowlist | NOT available on free | n/a (we rely on strong password) | Pro plan adds IP allowlist |
| Looker Studio refresh cache | 12-hour minimum on free; "Owner credentials" data sources can refresh as fast as 1 min | dashboards may show stale data | use "Owner credentials" mode (default) |

If we exceed Supabase egress, we'll see it on the Supabase project usage dashboard. Set a Cloud Monitoring alert at 80% of the 500 MB monthly cap.

---

## 8. Next steps after this runbook

1. **Confirm Phase 1 is fully green** — checklist §4 passes.
2. **Schedule Phase 4 work** — build the 3 remaining dashboards (Adopción, Performance Agentes, Catalogue Services). Each is ~1 day.
3. **Build `mv_adoption_daily`** if we want Adopción to ship first — depends on `users` activity tracking; check `audit_logs` for login events as the data source.
4. **Build the Next.js admin embed** — `/admin/dashboards/recaudacion` route with iframe + permission check.

---

## 9. Changelog

- **2026-05-02 v1.1** — added §2 reworking via Linking API. The datasource creation form is now pre-filled by URL (`packages/backend/database/tools/looker_studio_url_generator.py datasource`). Cuts §2 from 5 min to ~1 min — operator types only the password. New §2.4 documents the recovery path if Google ships a new connectorId.
- **2026-05-02 v1.0** — initial runbook. Phase 1 backend done (role + grants + secrets); UI step (datasource + first dashboard) is the operator's manual task. ~15-20 min.
