# Facil Direct — Looker Studio Community Connector

**Status**: Phase B.1 skeleton (2026-05-02). USER_PASS auth, hard-coded `recaudacion` dashboard, no RLS yet.
**Plan reference**: [`.claude/plans/LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md`](../../.claude/plans/LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md)

This is a [Looker Studio community connector](https://developers.google.com/looker-studio/connector/build) that proxies dashboard data through the Facil backend, with per-ministry row-level security applied server-side (B.2 onwards).

---

## Files

| File | Purpose |
|---|---|
| `appsscript.json` | Apps Script manifest + Looker Studio metadata + URL fetch whitelist |
| `Code.gs` | Connector implementation (getAuthType, getConfig, getSchema, getData, …) |
| `.clasp.json.example` | Template for `clasp` deployment config (rename to `.clasp.json` after `clasp create`) |
| `.gitignore` | Excludes `.clasp.json` (project ID leakage) |

---

## One-time setup (operator)

```bash
# 1. Install clasp globally
npm install -g @google/clasp

# 2. Login (opens browser, Google account = libressai@gmail.com)
clasp login

# 3. From this directory, create the Apps Script project
cd packages/looker-connector
clasp create --type standalone --title "Facil Direct (B.1)"

# 4. Copy template + verify scriptId
cp .clasp.json.example .clasp.json
# clasp create already wrote scriptId to .clasp.json; .example is for fresh checkouts.

# 5. Push the code
clasp push --force

# 6. (One-time) Open the script in browser and enable Looker Studio API
clasp open
# In the Apps Script editor → Services (left rail) → + → "Data Studio" → Add
```

---

## Deploy a new version

```bash
clasp push
clasp deploy --description "B.1 — skeleton USER_PASS"
```

The `clasp deploy` URL is what you paste into Looker Studio's **Connector URL** field when adding the connector to a data source.

---

## Test locally before deploy

Apps Script runs in Google's sandbox — there's no `node` runtime equivalent. The fastest test loop is:

1. `clasp push`
2. In Looker Studio → Add Data → Build your own → paste the connector deploy URL.
3. Authorize, configure, build a tiny dashboard.
4. If it works, ship.

For unit-level testing of the helpers (e.g. `_authHeaders`), wrap the function in a `test_*` function inside Code.gs and run it from the Apps Script editor's Run menu. Console output appears in the editor's "Execution log".

---

## Required backend endpoints

The connector calls 3 routes on the Facil backend:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/dashboards/_ping` | Health check used by `isAuthValid()` |
| `GET` | `/api/v1/dashboards/<id>/schema` | Field list for the dashboard |
| `GET` | `/api/v1/dashboards/<id>/data` | Rows for the dashboard |

Auth headers (until B.2 OAUTH2):
- `X-Facil-Email`: user email
- `X-Facil-Api-Key`: user's personal API key (revocable from `/profile/api-keys`)

---

## Environment override

Default backend URL is the staging Cloud Run URL. To point at a custom backend (PR preview, local), edit `BACKEND_URL` at the top of `Code.gs` and `clasp push` again.

---

## Phase roadmap

- **B.1** (this) — skeleton, 1 dashboard, USER_PASS, no RLS
- **B.2** — OAUTH2, RLS by `agent_profiles.ministry_id`, per-user cache scope
- **B.3** — production polish: 4 dashboards, audit log, rate limit, Sentry instrumentation
