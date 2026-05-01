# Grafana — Business Questions PoC

**Last updated**: 2026-05-01 (v1.0)
**Owner**: Engineering
**Audience**: backend lead, ops manager — anyone evaluating whether to add Grafana as a permanent third dashboard tool alongside Sentry and Looker Studio.
**Companions**:
- [`LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md`](./LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md) — the alternative for business KPIs.
- [`OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md`](./OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md) §6.3 — initial rationale for the watch-list status.

This document describes a **bounded, time-boxed PoC** to evaluate Grafana Cloud (free tier) on **5 specific business questions** that Looker Studio cannot answer well. The PoC ends with an explicit **adopt / drop / partial-adopt** decision based on measurable criteria.

---

## 1. The PoC question

> Does Grafana give Facil enough unique business value over Looker Studio + Sentry to justify a third operational dashboard tool?

The answer is YES if and only if Grafana wins outright on at least 3 of the 5 questions in §3, with quantifiable evidence.

### 1.1 Hard constraints — out of scope

- **No backend code changes** that ship to production. Grafana reads via the same `looker_readonly` Postgres role used by Looker Studio. Adding `prometheus_client` to FastAPI is out of scope; we want to measure if Grafana brings value with **zero-effort instrumentation**.
- **No paid plan**. Grafana Cloud Free Tier only (10K active series / 50 GB logs / 14-day retention).
- **No long-lived dashboards** survive the PoC unless the decision is "adopt". If the decision is "drop", we tear down the workspace.
- **PoC duration: 1 week** (5 working days). After that, the decision must be made and recorded.

### 1.2 Soft constraints — preferences

- Reuse Sentry/Looker patterns where possible (same Postgres connector, same MVs).
- Default dashboards JSON-as-code in `infra/grafana/` so a re-creation later is trivial.

---

## 2. Setup (Day 0, ~2 hours)

### 2.1 Provision Grafana Cloud workspace

1. Sign up at https://grafana.com/products/cloud/ with the existing GitHub identity (`libressai@gmail.com`). Pick **Free Forever** plan.
2. Workspace name: `facil-poc`.
3. Region: closest to GCP `us-central1` to minimise cross-cloud latency.
4. Note the workspace URL: `https://facil-poc.grafana.net`.

### 2.2 Add the Postgres data source

1. Reuse `looker_readonly` Postgres credentials from GCP Secret Manager:
   ```bash
   gcloud secrets versions access latest --secret=looker-readonly-db-url --project=taxasge-dev
   ```
2. Grafana Cloud → Connections → Data sources → Add → PostgreSQL.
3. Fill in: host, port (6543 for Supabase pooler), database, user, password.
4. **TLS mode**: `require`. Supabase enforces it.
5. Name the data source `facil-postgres`.
6. Click "Save & test" — must show green "Database Connection OK".

**Trap**: Supabase pooler at port 6543 vs direct at 5432. Looker Studio is wired to 6543 (transaction-pooler mode); Grafana queries are short and read-only, so 6543 works fine. If timeouts surface, switch to 5432 for diagnostics only.

### 2.3 Folder + dashboards structure

```
infra/grafana/
├── README.md              — entry point: how to import these dashboards
├── datasources/
│   └── facil-postgres.yaml  — declarative datasource (provisioning friendly)
└── dashboards/
    ├── Q1-bange-volume-by-hour.json
    ├── Q2-agent-load-heatmap.json
    ├── Q3-sla-breach-by-workflow.json
    ├── Q4-backend-p95-by-endpoint.json
    └── Q5-service-request-funnel.json
```

The JSON files are exported via the **Grafana UI → Dashboard settings → JSON Model** after each dashboard is built. Stored in git so a contributor can re-import on a fresh workspace via `Dashboards → Import → Upload JSON`.

### 2.4 Permissions

- **Viewer role** for all team members during the PoC.
- **No public links**. PoC is internal-only.
- **No alert rules**. Free tier supports them but we don't want to operationalise alerts before the adopt decision.

---

## 3. The 5 business questions

Each question states: **the question**, **why Looker Studio fails or is awkward**, **the Grafana SQL/PromQL approach**, **the panel(s) to build**, and **the success criterion** ("adopted" or "rejected" for this question).

### 3.1 — Q1: Volume transactions BANGE par heure (peak detection / outage early-warning)

**Question**: "What is the per-hour BANGE webhook volume over the last 7 days, and where are the visible peaks/troughs that indicate outages or DDoS-like attempts?"

**Why Looker fails**: Looker's time-series renders are designed for daily/weekly trends. Per-hour granularity over 168 hours (7 days) renders poorly — labels overlap, no zoom UX, hard to compare hour-to-hour year-over-year.

**Grafana approach**: PostgreSQL data source query:
```sql
SELECT
  time_bucket('1h', created_at) AS time,
  count(*) AS bange_callbacks
FROM bank_transactions
WHERE bank_code = 'BANGE'
  AND created_at > $__timeFrom()
  AND created_at < $__timeTo()
GROUP BY 1
ORDER BY 1;
```

(Note: `time_bucket` is a TimescaleDB function — not available on vanilla Postgres. Use `date_trunc('hour', ...)` as fallback. If we adopt this dashboard for the long term, install TimescaleDB extension on Supabase or pre-aggregate via MV.)

**Panel**: Time-series, 1-week window, `Last 7 days` default range. Y-axis: `bange_callbacks`. Add **annotations** for known incidents (manually, or pulled from `audit_logs` by event type).

**Success criterion (adopt)**: built in < 30 min, renders < 2s on 168-bucket query, drag-zoom works fluidly, annotation overlay is readable. **If yes**, Grafana wins on time-series fine-grain.

**Why this matters for Facil**: BANGE is a 3rd-party API. We need fast detection of webhook drops (their side or ours) — Sentry alerts on errors, not on absence-of-events. A widget that shows "0 callbacks for 30 min during business hours" is a uniquely Grafana superpower (via "no data" alerting, future).

---

### 3.2 — Q2: Heatmap charge agents par site × heure × jour (capacity planning)

**Question**: "When are agents most overloaded? Show me a heatmap of agent decisions by site, by hour-of-day, by day-of-week, over the last 30 days."

**Why Looker fails**: Looker has no native heatmap chart type. Closest workaround is a pivot table with conditional color formatting, which is slow on > 50K row datasets and has poor color gradient control.

**Grafana approach**:
```sql
SELECT
  EXTRACT(dow FROM created_at) AS dow,    -- 0=Sunday, 6=Saturday
  EXTRACT(hour FROM created_at) AS hour_of_day,
  ap.site_id,
  count(*) AS decision_count
FROM workflow_transitions wt
JOIN agent_profiles ap ON ap.user_id = wt.actor_user_id
WHERE wt.transition_type = 'decision'
  AND wt.created_at > now() - interval '30 days'
GROUP BY 1, 2, 3;
```

**Panel**: Heatmap with `dow` on X-axis, `hour_of_day` on Y-axis, color by `decision_count`. Filter by site_id. One heatmap per site, in a row layout with site selector.

**Success criterion (adopt)**: heatmap renders < 3s, color gradient is actionable (peak hours are visibly red), hover shows exact count, time range selector works on the heatmap. **If yes**, Grafana wins on heatmap UX.

**Why this matters for Facil**: capacity planning for 100+ concurrent agents requires "where are the holes in coverage?". A heatmap is the canonical tool. Looker's pivot table is a poor substitute.

---

### 3.3 — Q3: Time-series SLA breach par workflow type (operational health)

**Question**: "Which workflow types have rising SLA breach rates over the last 90 days? Group by workflow_code."

**Why Looker fails**: it can do this, but the time-series chart with > 5 series becomes cluttered fast. No legend hover-to-isolate, no per-series visibility toggle, no quick "show only top 3".

**Grafana approach**:
```sql
SELECT
  date_trunc('day', sr.decision_made_at) AS time,
  fs.workflow_code AS metric,
  100.0 * count(*) FILTER (WHERE sr.sla_breached) / count(*) AS breach_rate
FROM service_requests sr
JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
WHERE sr.decision_made_at > now() - interval '90 days'
  AND sr.status = 'decided'
GROUP BY 1, 2
ORDER BY 1, 2;
```

**Panel**: Time-series with one line per `workflow_code`. Legend supports "click to isolate / hide". Tooltip shows all values at hover-time.

**Success criterion (adopt)**: lines per series toggleable, > 10 series remain readable via tooltip, can switch to "stacked area" for cumulative view. **If yes**, partial Grafana win on multi-series.

**Why this matters for Facil**: 14 workflow types, 100+ agents. SLA breach trends are crucial. A clean multi-line chart is the difference between "actionable" and "unreadable spaghetti".

---

### 3.4 — Q4: p95 latence backend par endpoint critique (perf insight, no Sentry overlap)

**Question**: "What is the p95 latency of `/payments/*`, `/agents/decisions/*`, `/declarations/submit` over the last 14 days, with day-of-week seasonality visible?"

**Why Looker fails**: percentile queries on large tables are slow. We don't have a `request_latency` table — Sentry has the perf data, but Sentry's dashboards aren't time-series-rich.

**Why Sentry isn't enough**: Sentry's perf widgets show p95 over a time range, but stacking 3 endpoints with day-of-week seasonality overlays is awkward in Sentry's UI.

**Grafana approach (caveat: this is the most expensive PoC)**: requires adding a backend middleware that logs `(endpoint, latency_ms, timestamp)` to a Postgres table `request_latencies` (or pulls from Cloud Logging via a connector). For the PoC, we can use Cloud Logging via Grafana's "Google Cloud Logging" data source (OAuth setup, 1h).

```sql
-- Hypothetical, if we add the table:
SELECT
  time_bucket('1h', timestamp) AS time,
  endpoint AS metric,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
FROM request_latencies
WHERE endpoint IN ('/payments', '/agents/decisions', '/declarations/submit')
  AND timestamp > now() - interval '14 days'
GROUP BY 1, 2;
```

**Panel**: Time-series, multi-line per endpoint, secondary Y-axis showing day-of-week markers (annotations).

**Success criterion (adopt)**: p95 query < 5s, day-of-week pattern visible, no Sentry overlap (Sentry shows p95 *for an alert*, not for *visual weekly trend analysis*). **If yes**, Grafana wins on perf time-series fine-grain.

**Risk**: setting up Cloud Logging data source might be too time-consuming for a 1-week PoC. If so, **fall back to running the query against Sentry's PostgreSQL dump or skip Q4**.

---

### 3.5 — Q5: Funnel conversion service request (deeper than Looker)

**Question**: "Of users who started a service request in the last 30 days, what % reached each step of the wizard, and where is the biggest drop-off, sliced by workflow_code?"

**Why Looker fails**: Looker Studio's Funnel chart is basic (single funnel, no slicing). Deep funnel analysis with multiple workflows requires building 14 separate funnels — unmaintainable.

**Grafana approach**: hand-built funnel via a Stat Grid + transformations:
```sql
SELECT
  fs.workflow_code,
  count(*) FILTER (WHERE sr.created_at > now() - interval '30 days') AS started,
  count(*) FILTER (WHERE sr.documents_uploaded_at IS NOT NULL) AS uploaded,
  count(*) FILTER (WHERE sr.submitted_at IS NOT NULL) AS submitted,
  count(*) FILTER (WHERE sr.assigned_at IS NOT NULL) AS assigned,
  count(*) FILTER (WHERE sr.decision_made_at IS NOT NULL) AS decided
FROM service_requests sr
JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
WHERE sr.created_at > now() - interval '30 days'
GROUP BY fs.workflow_code;
```

**Panel**: Stat Grid with 5 columns (started / uploaded / submitted / assigned / decided), one row per workflow_code. Color cells by drop-off ratio (e.g. `submitted/started < 50%` → red).

**Success criterion (adopt)**: query < 2s, table rendered with conditional color, sortable by any column, can drill into a single workflow_code. **If yes**, Grafana wins on multi-funnel analysis.

---

## 4. Decision matrix template

After 1 week, fill this matrix. Each cell scored 0/1/2 (0=fail, 1=acceptable, 2=clear win):

| Question | Looker Studio score | Grafana score | Winner |
|---|:-:|:-:|---|
| Q1 — BANGE volume per hour |  |  |  |
| Q2 — Agent heatmap |  |  |  |
| Q3 — SLA breach multi-series |  |  |  |
| Q4 — Backend p95 time-series |  |  |  |
| Q5 — Multi-workflow funnel |  |  |  |
| **Total** |  |  |  |

**Adopt rule**: Grafana adopted if `Grafana_total - Looker_total >= 3` AND Grafana wins outright on >= 3 of 5 questions.

**Drop rule**: Grafana dropped if `Grafana_total - Looker_total < 3`. Workspace decommissioned, dashboards archived in git for reference.

**Partial-adopt rule**: if the difference is +3 to +5 on exactly the *time-series* questions (Q1, Q3, Q4), Grafana adopted **only for those use cases**. Looker remains primary for Q2 (heatmaps) and Q5 (funnels) if it scores comparably.

---

## 5. Day-by-day plan

| Day | Activity | Output |
|---|---|---|
| **Day 0** | Setup workspace + datasource + folder structure | Working "Hello world" dashboard |
| **Day 1** | Build Q1 + Q2 | 2 dashboards committed to `infra/grafana/dashboards/` |
| **Day 2** | Build Q3 + Q5 | 4 dashboards total |
| **Day 3** | Q4 attempt (Cloud Logging integration) | Q4 dashboard OR documented blocker |
| **Day 4** | Cross-check with Looker Studio: build the same 5 questions there | Looker dashboards (or notes on why each fails) |
| **Day 5** | Score the matrix + write decision report | Decision recorded in `GRAFANA_POC_DECISION_REPORT.md` |

Total time investment: ~5 working days, distributed.

---

## 6. Risks and mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Grafana free tier quota exceeded mid-PoC | Low | Low | Free tier (10K series) is generous for a 1-week PoC; we have 5 dashboards × < 50 series each = 250 series max |
| Postgres direct queries slow under PoC load | Medium | Low | Same `looker_readonly` role; queries are read-only, short, and few per render |
| Q4 Cloud Logging integration takes > 1 day | High | Medium | Fall back to skipping Q4; document as "blocker" in decision report |
| PoC drags past 1 week | Medium | Medium | Hard stop at Day 5. If incomplete, score with what's available + note the gap |
| Grafana wins but team prefers Looker for cultural reasons | Low | Medium | Decision matrix is quantitative; cultural pref captured separately as "tiebreaker" notes |

---

## 7. What "success" looks like at end of PoC

A 1-page **Decision Report** committed to `.claude/plans/GRAFANA_POC_DECISION_REPORT.md` with:
1. The filled decision matrix.
2. A 3-paragraph executive summary: which question was the most valuable, which was the biggest disappointment, what the team consensus is.
3. A **next-action**:
   - **Adopt**: open the production setup ticket — workspace promotion, secret rotation cadence, alert rules definition, integration with `/admin/dashboards/*`.
   - **Drop**: archive `infra/grafana/dashboards/` to `infra/grafana/archive/` with a README explaining "evaluated and rejected because X".
   - **Partial adopt**: list the dashboards we keep, the ones we delete, and how Grafana co-exists with Looker (which tool answers which question).

---

## 8. Open decisions

- **Q4 fallback**: do we accept skipping Q4 if Cloud Logging integration takes > 4h? Recommendation: yes, document as "deferred to phase 2 if adopted".
- **Cultural preference weight**: if matrix says "drop" but team strongly prefers Grafana, do we override? Recommendation: no — quantitative wins. If team wants Grafana for non-business reasons (e.g. infra metrics later), that's a separate plan.
- **Decision authority**: who signs off the adopt/drop decision? Recommendation: backend lead + ops manager jointly, by Day 5 EOD.

---

## 9. Changelog

- **2026-05-01 v1.0** — initial PoC plan. 5 business questions targeting Grafana's stated strengths (heatmaps, multi-series time-series, fine-grain time-bucket queries). 1-week box, decision matrix, day-by-day plan. Free tier only. Adopt / drop / partial-adopt rules with quantitative threshold (>=3 wins out of 5).
