# Looker Studio — Community Connector for per-ministry RLS

**Last updated**: 2026-05-02 (v1.0)
**Owner**: Engineering
**Audience**: backend lead, data team, anyone reviewing this design before commit.
**Status**: **PLAN — pending architecture decisions** (see §6). No code written yet.
**Companions**:
- [`LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md`](./LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md) — strategic plan, where this connector slots in (§5 Phase 6 / future-watch).
- [`LOOKER_STUDIO_PHASE1_RUNBOOK.md`](./LOOKER_STUDIO_PHASE1_RUNBOOK.md) — current Phase 1 (PostgreSQL connector, no RLS).

---

## 1. Why this connector?

The Phase 1 PostgreSQL connector exposes the same row set to every Looker Studio user with the role `looker_readonly`. That's fine for 4 reference dashboards consumed by **internal staff** (treasury, ops manager, exec). It does NOT scale to **ministry stakeholders**: a user from `MIN_INTERIOR` would see `MIN_FINANZAS` revenue without filtering at the source.

**Two ways to add per-ministry filtering**:

### Option A — Filtered dashboard copies
- Maintain N copies of each dashboard, one per ministry, each with a `ministry_code = 'MIN_INTERIOR'` filter baked in.
- Pros: zero engineering, pure UI work.
- Cons: O(n × m) maintenance burden (n dashboards × m ministries) — every widget tweak must propagate to N copies.

### Option B — Community connector with server-side RLS
- Build a Looker Studio **community connector** in Google Apps Script that auths the requesting Looker user, looks up their ministry, and returns only their slice of data.
- Pros: one canonical dashboard per topic; new ministry = zero work; row-level rules live next to backend code (auditable).
- Cons: ~12-18 hours dev, new Apps Script project to maintain, +1 critical path (Looker → Apps Script → backend → DB).

This document is the design for **Option B**. Option A remains the fallback.

---

## 2. Architecture

### 2.1 Data flow

```
Ministry stakeholder's browser
        │
        │ Looker Studio dashboard (refresh)
        ▼
Looker Studio cloud
        │
        │ JSON request: getData(connector, fields, filters, user_token)
        ▼
Apps Script community connector (Facil-Direct)
        │
        │ HTTPS request with OAuth2 token
        ▼
Facil backend: GET /api/v1/dashboards/<dashboard_id>/data
        │
        │ JWT validation → user.ministry_id lookup
        ▼
Postgres: SELECT ... FROM mv_treasury_daily_kpis WHERE ministry_id = user.ministry_id
        │
        ▼
Backend: rows + schema → connector
        │
        ▼
Connector: shape into Looker Studio Data Studio API rows[]
        │
        ▼
Looker Studio: render in chart
```

### 2.2 Components

| Component | Lives in | Owner |
|---|---|---|
| `Facil-Direct` Apps Script connector | https://script.google.com (Apps Script project) | Engineering, version-controlled in git via `clasp` |
| Connector manifest (`appsscript.json`) | Same project | Engineering |
| Backend endpoint `GET /api/v1/dashboards/<id>/data` | `packages/backend/app/modules/dashboards/` | Engineering |
| Per-dashboard SQL query | Backend service layer (parameterized by ministry_id) | Engineering |
| OAuth2 client for Facil | Backend (`/api/v1/auth/oauth2/*` routes) | Engineering |

### 2.3 Apps Script primitive functions to implement

The community connector contract (from https://developers.google.com/looker-studio/connector/build):

| Function | Purpose | Estimated lines |
|---|---|---|
| `getAuthType()` | Returns auth mode (we choose `OAUTH2`) | ~5 |
| `getConfig(request)` | Asks user for dashboard_id (one-time per data source) | ~30 |
| `getSchema(request)` | Returns field list — fetched from backend per dashboard_id | ~30 |
| `getData(request)` | Returns rows — calls backend with user's ministry context | ~80 |
| `get3PAuthorizationUrls()` | OAuth2 auth URL builder | ~10 |
| `authCallback()` | OAuth2 callback handler | ~30 |
| `isAuthValid()` | Checks if user's OAuth2 token is still valid | ~10 |
| `resetAuth()` | Clears user's stored OAuth2 token | ~5 |
| **Total** | ≈ 200 lines of Apps Script |

---

## 3. Auth choice — OAuth2 vs USER_PASS vs KEY

Three Apps Script auth modes are viable. Each has trade-offs:

| Mode | What user types in Looker Studio | Backend implication | Verdict |
|---|---|---|---|
| `NONE` | nothing | Connector public; everyone sees everything | ❌ Defeats the purpose |
| `KEY` | One API key | Each ministry gets a different API key, hardcoded in their data source | ⚠️ Workable but key rotation is painful, no link to user identity |
| `USER_PASS` | Email + password OR email + API key | Backend authenticates the email/password tuple, looks up ministry | ⚠️ Acceptable if we already have password auth on the user (we do, JWT) |
| `OAUTH2` | OAuth flow → user picks Facil account | Backend issues OAuth2 tokens, validates via JWKS | ✅ Best UX, audit trail, revocable per-user |

**Recommendation**: **OAUTH2**. We already have a JWT-based auth system; adding an OAuth2 layer is a focused 4-6 hour task. UX is far better (user clicks "Sign in with Facil" once instead of typing email+pwd in Looker Studio).

**Trade-off**: OAuth2 requires the backend to implement the **authorization code flow** (we have JWTs but those are direct logins). That's the biggest unknown — see §6 question 1.

**Fallback**: USER_PASS with `email + API key`. Each ministry-stakeholder user gets a personal API key (revocable from `/profile/api-keys`). Maps to the user's existing JWT identity at validation time. ~2 hours of work instead of 4-6.

---

## 4. Backend endpoint contract

### 4.1 New endpoint: `GET /api/v1/dashboards/<dashboard_id>/data`

**Auth**: `Authorization: Bearer <oauth2_token_or_jwt>`
**Path params**:
- `dashboard_id` ∈ `{recaudacion, adopcion, agentes, services, treasury_reconciliation, ...}`

**Query params** (passed by the connector from Looker's `request`):
- `fields` (CSV list of field names to return)
- `filters` (Looker Studio filter syntax → translated to SQL WHERE)
- `start_date`, `end_date` (date range filter)

**Response**:
```json
{
  "schema": [
    {"name": "report_date", "label": "Date", "dataType": "STRING", "semantics": {"conceptType": "DIMENSION", "semanticType": "YEAR_MONTH_DAY"}},
    {"name": "ministry_name", "label": "Ministry", "dataType": "STRING", "semantics": {"conceptType": "DIMENSION"}},
    {"name": "total_amount", "label": "Total recaudado", "dataType": "NUMBER", "semantics": {"conceptType": "METRIC", "semanticType": "CURRENCY_XAF"}}
  ],
  "rows": [
    {"values": ["2026-04-23", "AYUNTAMIENTO DE MALABO Y BATA", 163350.00]}
  ],
  "row_count": 1
}
```

### 4.2 RLS rule resolution

```python
# pseudocode
@router.get("/dashboards/{dashboard_id}/data")
async def get_dashboard_data(
    dashboard_id: str,
    fields: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    user: User = Depends(current_user),  # JWT or OAuth2 → user identity
):
    # 1. Resolve user's ministry context (could be > 1 if user is multi-ministry agent)
    user_ministries = await resolve_user_ministries(user.id)

    # 2. Resolve dashboard → MV
    if dashboard_id == "recaudacion":
        sql = """
            SELECT report_date, ministry_name, payment_method, total_amount
            FROM mv_treasury_daily_kpis
            WHERE ministry_id = ANY($1)
              AND report_date BETWEEN $2 AND $3
        """
        rows = await db.fetch(sql, user_ministries, start_date, end_date)
    elif dashboard_id == "agentes":
        # ... similar
        pass

    # 3. Map rows → connector schema
    return {
        "schema": _schema_for(dashboard_id),
        "rows": [{"values": list(r.values())} for r in rows],
        "row_count": len(rows),
    }
```

### 4.3 RLS rules per role (proposal)

| User role | What they see |
|---|---|
| `admin`, `treasury_supervisor` | All ministries (no filter) |
| `agent_*` (DGT, AYUNT, MIN_*) | Only their `agent_profiles.ministry_id` |
| `business`, `accountant`, `citizen` | Forbidden (403) |
| Connector-only access (e.g. via API key) | Whatever the user behind the key has |

---

## 5. Implementation phases

### Phase B.1 — End-to-end skeleton (4-6 h)

- [ ] Apps Script project bootstrap (`clasp create`, manifest)
- [ ] `getAuthType()` returns `USER_PASS` (simpler, defer OAUTH2 to B.2)
- [ ] `getConfig()` asks user for dashboard_id (drop-down with the 4 reference dashboards)
- [ ] `getSchema()` returns hard-coded schema for `recaudacion` only
- [ ] `getData()` calls backend with hard-coded URL, returns rows
- [ ] Backend `GET /api/v1/dashboards/recaudacion/data` (no RLS yet, returns full table)
- [ ] User test: install connector, build dashboard with 1 widget, see data
- **Exit criterion**: a manual end-to-end click works on staging.

### Phase B.2 — Auth + RLS (4-6 h)

- [ ] OAuth2 client app on the backend (`/api/v1/auth/oauth2/{authorize, token, userinfo, revoke}`)
- [ ] Apps Script connector switched to `OAUTH2`
- [ ] Backend `dashboards/{id}/data` filters by `user.ministry_id`
- [ ] Negative test: a `MIN_INTERIOR` agent's connector run does NOT return `MIN_FINANZAS` rows
- [ ] Cache: 1-min server-side, 5-min connector-side
- **Exit criterion**: per-ministry filtering proven by 2 distinct user accounts.

### Phase B.3 — Production polish (4-6 h)

- [ ] Connector deployed to org via `clasp deploy --description Facil-Direct-v1.0.0`
- [ ] Connector listed in our org's "Custom partner connectors" gallery
- [ ] All 4 reference dashboards backed by the connector (one per dashboard_id)
- [ ] Sentry instrumentation on the backend endpoint (latency p95 < 1s, error rate < 1%)
- [ ] Rate limit: 60 req/min per user
- [ ] Audit log: every `dashboards/data` call recorded with user_id + dashboard_id
- [ ] Migration of existing PostgreSQL-connector dashboards: archive them, replace with connector-backed copies
- **Exit criterion**: 4 connector-backed dashboards live, smoke tested by 1 ministry stakeholder.

---

## 6. Open architecture decisions (need user input before coding)

### Q1 — Auth mode: OAUTH2 or USER_PASS?

OAUTH2 = better UX + 4-6 h setup. USER_PASS = quick start + relies on a personal API key per user.

**My recommendation**: **USER_PASS for Phase B.1** (skeleton end-to-end), **upgrade to OAUTH2 for Phase B.2** (when we lock per-ministry RLS).

### Q2 — Should we maintain the PostgreSQL connector dashboards in parallel?

Once the connector ships, the 4 reference dashboards have 2 backings:
- PostgreSQL connector (for staff, no RLS)
- Custom connector (for ministry stakeholders, with RLS)

**Options**:
- (a) Maintain both: each dashboard exists twice; slightly more work, but staff keep their direct-SQL flexibility.
- (b) Migrate all to connector: single source of truth; staff lose ad-hoc filtering, gain consistency.

**My recommendation**: (a) for the first 3 months, then re-evaluate. Migration is a 1-day push if (b) wins.

### Q3 — Where does the Apps Script connector source code live?

- (a) Apps Script project on Google's infra (UI-edited, exported via `clasp pull`)
- (b) Git repo (`packages/looker-connector/`) version-controlled, deployed via `clasp push`

**My recommendation**: (b). Apps Script project is created once, then everything in code. CI auto-deploys via `clasp` on merge.

### Q4 — Connector publishing mode

- **Personal**: only operator can install it
- **Organisation**: any user in our Google Workspace can use it (we don't have a Workspace)
- **Public listing**: in Looker Studio's gallery — requires Google review

**My recommendation**: **Personal** for Phase B.1, **organisation** in Phase B.3 if we have a Google Workspace by then.

### Q5 — Performance / quota considerations

- Apps Script free quota: 6 min total runtime per execution, 1500 URLFetch calls per day per execution
- Looker Studio free tier: 12-hour cache by default; can refresh as fast as 1 min on owner credentials
- Backend: each dashboard refresh = N connector calls (one per chart with auto-refresh), each ~50ms

For 100 ministry stakeholders × 4 dashboards × 5 charts × refresh every 1 min = 2000 backend calls/min. Definitely OK on the backend (Cloud Run can handle), but this is a connector hot path that needs aggressive caching.

**My recommendation**: 5-min server cache + 5-min connector cache + 12-hour fallback if backend down. Document quota math in §7.

---

## 7. Risks and mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apps Script ecosystem learning curve | High | Medium | Start with USER_PASS; OAUTH2 is post-skeleton |
| Backend endpoint becomes hot path → latency creep | Medium | Medium | Aggressive cache + Sentry alerting on p95 > 500ms |
| Connector outage = all ministry dashboards stale | Medium | High | Fallback message in Looker Studio when connector unreachable; +cache 12h |
| Apps Script daily quota exceeded | Low | Medium | Monitor via the platform's own dashboards; upgrade to Workspace plan ($6/user/month) if hit |
| Ministry stakeholder confusion (manual install path) | Medium | Low | Ship a 1-page user-facing install guide; alternative is Google Workspace listing (Phase B.3) |
| OAuth2 implementation bugs (token theft, replay) | Medium | Critical | Use a battle-tested library (Authlib for FastAPI), short token lifetime (15min), refresh tokens revocable |
| Per-ministry RLS rule bug (data leak) | Low | Critical | Negative test in CI: 2 user accounts, query each, assert disjoint result sets |

---

## 8. Costs and time

- **Engineering time**: 12-18 hours total across B.1, B.2, B.3
- **Free tier**: yes, no paid plan needed for Apps Script + Looker Studio + Cloud Run
- **Maintenance**: ~1 h/quarter for connector version bumps + Apps Script API changes

---

## 9. Decision required from user

Before I start B.1, please confirm:

1. **Q1 (auth mode)**: OK to start with USER_PASS in B.1, upgrade to OAUTH2 in B.2?
2. **Q2 (dual backing)**: maintain both PostgreSQL + connector dashboards for 3 months, then re-evaluate?
3. **Q3 (source location)**: `packages/looker-connector/` in git, deployed via `clasp`?
4. **Q4 (publishing)**: Personal first, escalate later?
5. **Q5 (caching)**: 5-min server + 5-min connector + 12-hour fallback?

Default if no answer: my recommendations above (USER_PASS first, dual-backing, in-git, personal install, 5-min cache).

---

## 10. Changelog

- **2026-05-02 v1.0** — initial plan. 3 sub-phases (B.1 skeleton, B.2 RLS, B.3 production), 5 open architecture questions, OAUTH2-first recommended path (USER_PASS as B.1 quick start), Apps Script connector design, backend endpoint contract.
