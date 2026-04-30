# Observability — Sentry Dashboards & Backend Wiring

**Last updated**: 2026-04-30 (v1.0)
**Owner**: Engineering
**Audience**: engineers building new dashboards, on-call engineers reading them, ops setting up alerts.
**Companion docs**:
- [`OBSERVABILITY_STACK.md`](./OBSERVABILITY_STACK.md) — full reference (Sentry vs LogRocket model, secret topology, multi-cloud).
- [`OBSERVABILITY_QUICKSTART.md`](./OBSERVABILITY_QUICKSTART.md) — hands-on tutorial for new contributors.

This document is the single source of truth for:
1. **Q&A** — questions asked during the rollout, with expert answers.
2. **Tutorial** — how to create a new Sentry dashboard end-to-end (UI + API).
3. **Inventory** — the 8 Facil dashboards: rôle, widgets, audience, when to look at them.
4. **Backend wiring plan** — why we wired Sentry on the FastAPI backend, what it unlocks, current state, what still needs to operate it.
5. **Alert rules** — 6 rules to apply once the backend DSN is live in Cloud Run.

---

## 1. Q&A — answered during the rollout

### Q1 — Why Sentry **and** LogRocket? Aren't they the same?

No. They solve different problems and complement each other.

| | Sentry | LogRocket |
|---|---|---|
| Capture cadence | At error time only | Continuously, like a CCTV |
| What's stored | Stack trace + 60s of breadcrumbs before the crash | Full session video — clicks, scrolls, network, console, redux/zustand |
| Pricing model | Per error event | Per session |
| Free tier | 5K errors / month / project | 1K sessions / month |
| Best for | "Why did this crash?" — root-cause from a stack trace | "What did the user do before X?" — reproduce a parcours from a replay |

The eventual goal is the bridge: Sentry alerts you fast → a single click on the embedded `extra.logrocketURL` opens the LogRocket replay. **The bridge body was activated 2026-04-30** (web side) once `@sentry/nextjs` was wired — see `packages/web/src/core/observability/logrocket.ts:108`.

### Q2 — Are 6 dashboards enough? Don't document generation and AI/chat deserve their own?

**Yes — they do.** The original recommendation listed 6 dashboards; on review the SPOF (single-point-of-failure) audit revealed two more critical surfaces that were unobserved:

- **Document Lifecycle** — every PDF (citizen summary, proforma, license certificate, receipt) goes through generate → QR sign → Firebase Storage upload → vault registration → email PJ. Any failing link = citizen never receives their document = support ticket + lost trust. Today only the upload-error subset surfaced in `Service Request Workflow` dashboard, and the QR signing / email / regeneration paths were unmonitored.
- **AI & Chatbot** — Gemini API errors are **silent** today (no exception raised on rate limit; schema mismatch returns an empty extraction that propagates as if successful). Without dedicated observability we cannot answer "is the chatbot working?" with anything but a manual sanity check. RAG retrieval, tool registry, and agent_llm follow the same pattern.

Decision: **8 dashboards**. The 2 new ones (Document Lifecycle id=4509330, AI & Chatbot id=4509331) were created via Sentry API on 2026-04-30 — see §3.7 and §3.8.

The "AI Agents Overview" / "MCP Overview" / "AI Agents Tool Details" dashboards visible in the org list are **Sentry templates auto-installed by the org**, not Facil custom. They cover generic LLM/MCP traces but know nothing about Facil routes — keep them as a complement, not as a replacement for our custom AI dashboard.

### Q3 — What's the recommended order of operations to make the dashboards useful?

By ROI (highest first):

1. **(2-3 h) Wire Sentry backend** — unlocks 5 of 6 original dashboards in one move (Auth, Payment, Service Request, Agent Ops, API Performance) plus alerting on backend SPOFs.
2. **(1 h) Wire Sentry web** — unlocks the LogRocket↔Sentry bridge + funnels of web errors.
3. **(30 min) Source-map upload** — stack traces become readable everywhere (mobile + web).
4. **(15 min) Alert rules** — apply on the 4 critical paths (auth crash, payment fail spike, OCR queue dead, agent endpoint p95 > 5s). Done after #1, otherwise you alert on empty data.

Status as of 2026-04-30:
- ✅ Backend wired in code (`packages/backend/app/main.py:407-459`) + binding in CI (`.github/workflows/deploy-backend-staging.yml:165`). Pending: deploy.
- ✅ Web wired (`sentry.client/server/edge.config.ts` + `next.config.mjs` `withSentryConfig` + bridge body activated). Pending: deploy.
- ⏳ Source-map upload — handled by `withSentryConfig` (web) at build time when `SENTRY_AUTH_TOKEN` is present in CI. Mobile RN sourcemaps wired via Sentry CLI from `eas.json` (already in place).
- ⏳ Alert rules — listed in §5 of this doc, to apply via UI once first events arrive.

### Q4 — Do PII headers leak through Sentry?

No, by triple defense:
1. `send_default_pii: false` — SDK does not include cookies / IP / personal headers.
2. `before_send` (backend) / `beforeSend` (web client) — strips Authorization, Cookie, X-Api-Key, plus drops bodies on `/auth/login`, `/auth/register`, `/auth/2fa`, `/auth/refresh` regardless of context.
3. FastAPI's own scrubbing keeps secrets out of breadcrumbs.

LogRocket has its own redaction layers (`inputSanitizer: true` + custom `requestSanitizer`/`responseSanitizer` + `data-private` DOM attribute on PII fields).

### Q5 — Will Sentry blow our Free tier quota?

Calibrated to stay inside it:
- 5K errors / month / project: at current scale (97 mobile sessions in 14d, ~20 active staging users) this is ~50 errors / day capacity; ample headroom.
- 10K transactions / month / project: `traces_sample_rate=0.05` keeps backend at ~3-5K transactions/month assuming 100 reqs/min staging.
- Replays: **disabled** on Sentry web (`replaysSessionSampleRate: 0`). LogRocket already does that — no double-pay.
- 3 projects total (`python-backend`, `javascript-nextjs`, `react-native`) → 15K errors + 30K transactions monthly envelope.

When we exceed: bump to Team plan ($26/month/project) or shave sample rate to 0.02. Not before.

### Q6 — Why is `NEXT_PUBLIC_SENTRY_DSN` (web) public, but `SENTRY_DSN` (backend) is a secret?

The DSN itself is **always** present in the client bundle anyway (the browser SDK needs to know where to send events — there is no way to hide it). Marking it `NEXT_PUBLIC_*` is just a Next.js convention to bake it at build time. It's not a secret: knowing the DSN lets someone spam your project's quota, but they cannot **read** events. Sentry DSNs are write-only credentials.

The backend DSN is technically the same kind of write-only credential, but we keep it server-side because (a) the backend has no need to expose it to anyone, (b) GCP Secret Manager binding via `--set-env-vars` is the project's standard pattern, (c) consistency with other backend secrets (DATABASE_URL, JWT_SECRET_KEY) is worth the small extra step.

### Q7 — Why is the bridge `bridgeLogRocketToSentry()` called from `initLogRocket()` and not the other way around?

Both ordering choices work, but LogRocket's `getSessionURL()` callback fires **after** the first network flush (~2-5 s into the session), whereas Sentry events can be captured immediately on page load. Initialising LogRocket first and registering the bridge inside its init means: (a) by the time the bridge hooks in, Sentry is already listening, (b) the bridge call site lives next to the LogRocket init it depends on (single source of truth), (c) the alternative (Sentry init calling LogRocket) would create a circular dependency since LogRocket's init needs Sentry.

---

## 2. Tutorial — create a new Sentry dashboard

### When to create a dashboard

A new dashboard earns its place when:
1. **A new SPOF surface emerges** — e.g. a new external API integration, a new critical user journey, a new background worker.
2. **An existing dashboard becomes too crowded** — > 12 widgets, multiple unrelated KPIs.
3. **A specific role needs its own view** — supervisor view, treasury view, on-call view.

If your need is "one widget I want to see on Mondays", add it to an existing dashboard instead.

### Method A — via Sentry UI (recommended for ad-hoc)

1. Go to https://taxasge.sentry.io/dashboards/ → click **Create Dashboard** (top-right).
2. Click **+ Add Widget** → choose:
   - **Display type**: `Big Number` (single KPI), `Line / Area` (trend over time), `Bar` (categorical breakdown), `Table` (top-N).
   - **Dataset**: `Transactions / Spans` (perf data, every API call), `Errors` (exception events).
3. Build the query:
   - **Conditions** (Sentry query language): `is_transaction:true transaction:/payments/*` (perf), or `level:[error,fatal] transaction:/payments/*` (errors).
   - **Aggregates**: `count()`, `count_unique(user)`, `p95(span.duration)`, `failure_rate()`.
4. Click **Save**. Drag/resize on the dashboard grid.
5. **Title naming convention**: `<emoji> <Domain> — Facil` (e.g. `📄 Document Lifecycle — Facil`).
6. **Permissions**: keep **Editable by everyone** unless the dashboard contains audit-grade widgets.

### Method B — via Sentry API (recommended for reproducibility / version control)

When the team needs to keep dashboards in sync across environments (e.g. cloning the staging dashboards on a future production org), the API is the canonical path. The 2 latest Facil dashboards (Document Lifecycle, AI & Chatbot) were created this way.

#### Step 1 — Get a user auth token

```bash
gcloud secrets versions access latest --secret=sentry-auth-token --project=taxasge-dev
```

#### Step 2 — Discover the IDs you need

```bash
TOKEN="$(gcloud secrets versions access latest --secret=sentry-auth-token --project=taxasge-dev)"

# List projects (needed for widget.projects field)
curl -sS -H "Authorization: Bearer $TOKEN" \
  "https://sentry.io/api/0/organizations/taxasge/projects/" \
  | jq '.[] | {slug, id, platform}'

# Inspect an existing dashboard to clone its structure
curl -sS -H "Authorization: Bearer $TOKEN" \
  "https://sentry.io/api/0/organizations/taxasge/dashboards/4506911/" \
  | jq '.widgets[0]'
```

#### Step 3 — Build the dashboard payload

Minimum payload for a dashboard with 1 widget:

```json
{
  "title": "📊 My New Dashboard — Facil",
  "widgets": [
    {
      "title": "Errors per route (24h)",
      "displayType": "table",
      "widgetType": "error-events",
      "interval": "5m",
      "queries": [
        {
          "name": "",
          "conditions": "level:[error,fatal] transaction:/my-domain/*",
          "aggregates": ["count()", "count_unique(user)"],
          "fields": ["count()", "count_unique(user)"],
          "columns": [],
          "orderby": ""
        }
      ],
      "limit": 5
    }
  ],
  "projects": [4511310907899904, 4511310908030976, 4511293911531521],
  "filters": {},
  "permissions": {"isEditableByEveryone": true}
}
```

#### Step 4 — POST it

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @my-dashboard.json \
  "https://sentry.io/api/0/organizations/taxasge/dashboards/" | jq
```

Response includes `id` — the dashboard URL is `https://taxasge.sentry.io/dashboards/<id>/`.

#### Step 5 — Reusable Python template

The Facil project keeps a reusable script at `C:\Users\User\AppData\Local\Temp\create_dashboards.py` (run via Odoo Python). The pattern is:

```python
def widget(title, display_type, widget_type, queries):
    return {
        "title": title,
        "displayType": display_type,        # big_number | line | area | bar | table
        "widgetType": widget_type,          # spans | error-events
        "interval": "5m",
        "queries": [
            {"name": q[0], "conditions": q[1], "aggregates": q[2],
             "fields": q[2], "columns": [], "orderby": ""}
            for q in queries
        ],
        "limit": 5,
    }

dashboard = {
    "title": "📊 My New Dashboard — Facil",
    "widgets": [
        widget("My KPI", "big_number", "spans",
               [("", "is_transaction:true transaction:/my/*", ["count()"])]),
        # ...add up to ~10 widgets
    ],
    "projects": [BACKEND_PROJ, WEB_PROJ, MOBILE_PROJ],
    "filters": {},
    "permissions": {"isEditableByEveryone": True},
}
```

### Widget cookbook — what each display type is good for

| `displayType` | When to use | Example |
|---|---|---|
| `big_number` | Single KPI you check daily — payment count, error count, p95 latency | "PDFs generated (24h): 142" |
| `line` | Trend over time, single series — p95 latency over 24h | OCR processing latency p95 |
| `area` | Funnel — multiple cumulative series | select → upload → submit → assigned → decided |
| `bar` | Categorical breakdown — counts per route / per status code | Submissions by route |
| `table` | Top-N with multiple columns — e.g. top failing endpoints with user count | Errors per workflow path |

### Naming conventions adopted in Facil

- **Dashboard title**: `<emoji> <Domain> — Facil` (the dash-Facil suffix lets you filter Facil dashboards from Sentry templates).
- **Widget title**: `<KPI> (24h)` for big numbers, `<KPI> p95` for percentiles, `<KPI> by <axis>` for breakdowns.
- **Conditions**: prefer `transaction:/foo/*` over fragile `transaction.op:` — routes are stable identifiers, ops are SDK-version-dependent.
- **Aggregates**: always include `count_unique(user)` next to `count()` on errors so you can distinguish "1 user × 100 retries" from "100 users × 1 error".

### Maintenance — keep dashboards alive

Dashboards rot fast when routes are renamed. To stay current:

- **Quarterly review**: open every dashboard, check that each widget returns non-empty in a "Last 7 days" window. Empty widgets = stale query.
- **On every route rename**: grep dashboards for the old route name (`curl ... /dashboards/<id>/ | jq '.widgets[].queries'`) and update.
- **On every new feature**: ask "is this domain covered by an existing dashboard?" If not and it's a SPOF, create a dashboard or add a widget to a related one.

---

## 3. The 8 Facil dashboards — inventory

All URLs use the `taxasge.sentry.io` org. Each entry: ID + URL + audience + role + key widgets + when to look at it.

### 3.1 — 📱 Mobile Health Overview (id=4506627)

**URL**: https://taxasge.sentry.io/dashboards/4506627/
**Audience**: mobile lead, on-call, release manager.
**Role**: top-level health of `packages/mobile` (Facil app for citizens).
**Coverage**: ✅ **Live** — 97 sessions / 14 days as of 2026-04-30. Sole dashboard already populated.
**Key widgets**: crash-free sessions per release, top issues, app start time p95, screens by usage, errors per route.
**When to look at it**: every morning + on every release tag. Drop in crash-free sessions = roll back the OTA / Play Store update.

### 3.2 — 🔐 Authentication & 2FA Funnel (id=4506825)

**URL**: https://taxasge.sentry.io/dashboards/4506825/
**Audience**: backend lead, security, on-call.
**Role**: track every step of sign-in (email → password → 2FA TOTP → JWT issued → session active).
**Coverage**: 🟡 Mobile only — full data once backend Sentry is live.
**Key widgets**: login attempts, 2FA failures, JWT refresh errors, session-active per minute, top auth error fingerprints.
**When to look at it**: after a regression on `app/modules/auth`, or when on-call sees a spike in unauthenticated 401 reports.

### 3.3 — 💳 Payment Workflow (BANGE Mobile Money) (id=4506854)

**URL**: https://taxasge.sentry.io/dashboards/4506854/
**Audience**: payments lead, treasury agent supervisor, on-call.
**Role**: BANGE webhook flow + pessimistic-lock contention + agent payment validation queue.
**Coverage**: 🟡 Scaffold — needs backend Sentry.
**Key widgets**: payment attempts (24h), BANGE webhook 4xx/5xx, lock conflict count, validation latency p95, payments waiting > 1h.
**When to look at it**: every spike in user complaints about "paid but not credited", or when treasury reports queue depth.

### 3.4 — 📋 Service Request Workflow (id=4506911)

**URL**: https://taxasge.sentry.io/dashboards/4506911/
**Audience**: workflow team, citizen-experience lead, on-call.
**Role**: full citizen journey from select → upload → form review → submit → assigned → decided.
**Coverage**: 🟡 Scaffold — needs backend Sentry.
**Key widgets**: requests submitted (24h), OCR queue errors, document upload errors, OCR processing p95, top failing routes, errors per workflow path.
**When to look at it**: weekly funnel review; on every release that touches `app/modules/declarations` or `app/modules/documents`.

### 3.5 — 👥 Agent Operations & SLA (id=4506968)

**URL**: https://taxasge.sentry.io/dashboards/4506968/
**Audience**: ops manager, agent supervisor, on-call.
**Role**: 100+ concurrent agent endpoints — assignment, decision flow, queue, escalation.
**Coverage**: 🟡 Scaffold — needs backend Sentry.
**Key widgets**: agent decisions (24h), assignment errors, queue depth, decision latency p95, escalations, SLA breach count.
**When to look at it**: daily by ops manager; immediate when on-call alert "agent_decisions p95 > 5s" fires.

### 3.6 — ⚡ API Performance & Scale (100+ concurrent agents) (id=4506969)

**URL**: https://taxasge.sentry.io/dashboards/4506969/
**Audience**: backend lead, infra, performance engineer.
**Role**: capacity-planning view — req/s, latency distribution, slowest endpoints, db query slowness.
**Coverage**: 🟡 Scaffold + perf widgets — needs backend Sentry **and** `traces_sample_rate=0.05` (already configured in `main.py`).
**Key widgets**: req/s by route, p50/p95/p99 latency, slowest endpoints, top slow DB queries, Redis miss rate.
**When to look at it**: capacity planning; weekly perf review; before any 100+ agent rollout.

### 3.7 — 📄 Document Lifecycle (id=4509330) **NEW 2026-04-30**

**URL**: https://taxasge.sentry.io/dashboards/4509330/
**Audience**: documents team, vault lead, on-call.
**Role**: every step of document delivery — generate PDF → QR sign → Firebase upload → vault register → email PJ.
**Coverage**: 🟡 Scaffold — needs backend Sentry to populate.
**Key widgets**: PDFs generated (24h), PDF generation errors, Firebase upload errors, vault registration errors, full delivery funnel area chart, PDF generation p95, errors by document type, 404 spikes on document download.
**When to look at it**: any user report of "I never received my licence/certificate"; on every release of `app/modules/documents`, `app/modules/vault`, `app/modules/payments` (receipts).

### 3.8 — 🤖 AI & Chatbot (id=4509331) **NEW 2026-04-30**

**URL**: https://taxasge.sentry.io/dashboards/4509331/
**Audience**: AI team, chatbot owner, on-call (silent-failure-aware).
**Role**: surface Gemini API errors (currently silent), RAG retrieval latency, tool registry failures, chat session funnel.
**Coverage**: 🟡 Scaffold — needs backend Sentry. Complementary to Sentry's auto-installed "AI Agents Overview" template (id=4254344) which covers generic LLM/MCP traces.
**Key widgets**: chat sessions (24h), Gemini API errors, RAG retrieval errors, tool registry / agent_llm errors, chat funnel area chart, Gemini call p95, RAG retrieval p95, top failing chat routes.
**When to look at it**: every Gemini quota/region change; weekly RAG quality review; whenever the `module-gemini-processor` or `chatbot` modules ship a release.

---

## 4. Backend Sentry wiring — plan and rationale

### 4.1 Why Sentry on the backend?

The backend is where the lion's share of operational surface lives:
- 31 routers, ~850+ fiscal services, 100+ concurrent agents target.
- 7 critical SPOFs unobserved without Sentry: auth flow, payment validation, OCR queue, agent decisions, BANGE webhook, document generation, Gemini AI.
- Cloud Logging gives you logs but **not** alerting on stack-trace fingerprints, **not** release-attributed grouping, **not** transaction-level performance histograms.

**What Sentry unlocks specifically**:

| Feature | What it does for us | Why we cannot get it from logs |
|---|---|---|
| **Stack trace fingerprinting** | Groups errors by their first-N frames so 1000 occurrences of one bug = 1 issue | Cloud Logging shows raw text — same error repeated 1000× looks like 1000 entries |
| **Alerting** | "ping me when error rate > 1% for 5 min" | Cloud Logging alerts are crude (textual match), no fingerprint awareness |
| **Release attribution** | Every event tagged with `release` (= `GIT_COMMIT_SHA`) — instantly see "this release introduced this bug" | Logs have no release tag by default |
| **Performance traces** | 5% sample of every request → p50/p95/p99 latency per endpoint, slow DB query traces | Cloud Logging ≠ APM |
| **Issue ownership** | Issues auto-assigned by code path → who broke it | Logs have no ownership signal |
| **Replay correlation** | (Once bridge is live) Sentry issue → LogRocket replay link | Logs are text only, no replay context |

### 4.2 Architecture decisions

- **3 separate Sentry projects** (`python-backend`, `javascript-nextjs`, `react-native`) instead of 1 shared. Reason: per-project Free tier quotas (5K errors / 10K transactions) — sharing would put backend errors at the mercy of a noisy mobile release.
- **`traces_sample_rate=0.05`** — calibrated for Free Developer plan. Bump to 0.20 once on Team plan or once we exceed 50K reqs/day staging.
- **`profiles_sample_rate=0.0`** — profiling adds another quota line (10K profiles / month) and is not actionable until we have a known hotspot. Off by default.
- **`send_default_pii=False`** + custom `before_send` scrubber — defense in depth on top of FastAPI's own scrubbing.
- **`environment` auto-detection** — `staging` if K_SERVICE contains `staging`, else `production`. Visible in every issue's filter.
- **`release=GIT_COMMIT_SHA`** — set by Cloud Build via `--set-env-vars`. Same commit hash visible in LogRocket's `release` field for cross-tool correlation.

### 4.3 Files involved

| File | Status | What it does |
|---|---|---|
| `packages/backend/requirements.txt:50` | ✅ Already in tree | `sentry-sdk[fastapi]>=1.38.0` |
| `packages/backend/app/config.py:511` | ✅ Already in tree | `SENTRY_DSN: Optional[str]` |
| `packages/backend/app/main.py:407-459` | 🟡 Uncommitted in working tree | Init block (gating, integrations, scrub) |
| `.github/workflows/deploy-backend-staging.yml:165` | 🟡 Uncommitted in working tree | `SENTRY_DSN=${{ secrets.SENTRY_DSN_BACKEND }}` |
| GCP SM `sentry-dsn-backend` | ✅ Created 2026-04-30 | Origin of truth for the DSN |
| GH repo secret `SENTRY_DSN_BACKEND` | ✅ Created 2026-04-30 | Mirror for CI consumption |
| GH repo secret `SENTRY_AUTH_TOKEN` | ✅ Created 2026-04-27 | Sourcemap upload (mobile + web) |

### 4.4 Operating procedure to make backend Sentry live

```bash
# 0. Verify the DSN is in place (idempotent)
gcloud secrets versions access latest --secret=sentry-dsn-backend --project=taxasge-dev

# 1. Commit the working-tree changes
git add packages/backend/app/main.py .github/workflows/deploy-backend-staging.yml
git commit -m "feat(backend/observability): wire Sentry SDK with FastAPI/Starlette/asyncpg/redis integrations"

# 2. Push (triggers deploy-backend-staging.yml, ~5 min build)
git push origin develop

# 3. Verify on Cloud Run that the env var is bound
gcloud run services describe taxasge-backend-staging \
  --region=us-central1 --project=taxasge-dev \
  --format='value(spec.template.spec.containers[0].env)' | grep SENTRY_DSN

# 4. Trigger a test exception (intentional 500)
curl -X POST https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/_internal/sentry-test \
  -H "X-Cron-Secret: $(gcloud secrets versions access latest --secret=cron-secret)"

# 5. Confirm the event in Sentry within 30 s
open https://taxasge.sentry.io/issues/?project=4511310907899904
```

(Step 4 requires creating a `/_internal/sentry-test` endpoint — optional. Easier path: trigger any genuine 500 then revert.)

### 4.5 What is **not** in scope (yet)

- **Distributed tracing** across backend ↔ web ↔ mobile via OpenTelemetry. Listed in `OBSERVABILITY_STACK.md §8` as "When >100 concurrent agents".
- **Profiling** (`profiles_sample_rate > 0`). Off until a known performance hotspot warrants it.
- **Custom dashboards on a per-ministry basis**. The 8 dashboards are app-wide. If a ministry like AYUNTAMIENTO needs its own view, clone an existing dashboard via the API and add a `tags[ministry]:AYUNTAMIENTO` filter.
- **Alerting via PagerDuty / OpsGenie**. Sentry can do email + Slack out of the box; the recommendation in §5 stays at Slack/email until on-call rotation is formalised.

---

## 5. Alert rules — to apply once backend Sentry receives its first events

Apply via Sentry UI → **Alerts** → **Create Alert Rule**. Sentry's API for alert rules requires elevated org-admin scopes; UI is the path of least resistance for these.

**Critical rule**: do not create these before the backend is live in Cloud Run. Alerts firing on empty data train the team to ignore Sentry.

### Rule 1 — Backend authentication crash spike

- **Project**: `python-backend`
- **Conditions**: Number of errors in an issue is > 10 in 5 minutes, where `transaction:/auth/*` AND `level:[error,fatal]`.
- **Action**: Slack `#oncall` + email backend-lead.
- **Why**: auth is the front door — > 10 errors / 5 min means everyone is locked out.

### Rule 2 — Payment failure spike

- **Project**: `python-backend`
- **Conditions**: Number of errors > 5 in 5 minutes, where `transaction:/payments/*` AND `level:[error,fatal]`.
- **Action**: Slack `#payments` + email payments-lead + treasury-supervisor.
- **Why**: every payment error potentially stranded money. Lower threshold than auth because each event is more critical.

### Rule 3 — OCR queue dead

- **Project**: `python-backend`
- **Conditions**: Issue is **first seen** AND `transaction:*ocr*` AND `level:[error,fatal]`. Plus a fallback: count of `transaction:/cron/process_ocr_queue` events drops to 0 over 30 min.
- **Action**: Slack `#documents` + email documents-lead.
- **Why**: OCR queue dying = no document gets processed = backlog. The "drop to 0" sub-rule catches the silent-failure case where the worker just stops emitting.

### Rule 4 — Agent endpoint p95 > 5 s

- **Project**: `python-backend`
- **Conditions**: Performance metric — p95 of `transaction:/agents/decisions/*` > 5000 ms over 10 min.
- **Action**: Slack `#oncall` + email backend-lead.
- **Why**: 100+ concurrent agents target. p95 > 5 s = UI freezes for half the agents = work stops. Threshold at 5 s because under normal load it should be < 1 s.

### Rule 5 — Document delivery silent failure

- **Project**: `python-backend`
- **Conditions**: Funnel drop > 30% over 1 h on Document Lifecycle dashboard widget — i.e. PDFs generated count > 0 but vault registrations count = 0.
- **Action**: Slack `#documents` + email documents-lead.
- **Why**: this is the classic "PDF generated, never delivered" case that has bitten the bundle workflow before (see `memory/patterns_bundle_documents.md` rules #29–32). Sentry doesn't have a single primitive for "drop %", so this rule is implemented as an **issue alert** on `transaction:*vault*register* level:[error,fatal]` count > 5 / 5 min, plus a manual weekly review of the Document Lifecycle dashboard.

### Rule 6 — Gemini API silent failure

- **Project**: `python-backend`
- **Conditions**: Number of errors > 3 in 10 min, where `transaction:*gemini* OR transaction:*vertex*` AND `level:[error,warning]` (note: warning included because Gemini rate-limits often surface as warnings, not errors).
- **Action**: Slack `#ai` + email AI-team-lead.
- **Why**: Gemini errors are silent today (no exception on rate limit; empty extraction returned). This rule is the canary that surfaces them via the explicit `sentry_sdk.capture_message()` calls we should add to `app/modules/chatbot/services/gemini_service.py` retry logic.

### Naming convention for alerts

`<severity emoji> <Project> — <Concise problem>`. Examples:
- `🔴 backend — Auth crash spike (>10 / 5 min)`
- `🟠 backend — Payment failure spike (>5 / 5 min)`
- `🟡 backend — Gemini silent failure (>3 / 10 min)`

Severity emoji helps Slack channel readers triage at a glance.

---

## 6. Changelog

- **2026-04-30 v1.0** — initial document. Captures: 8 dashboards (6 existing + 2 new Document Lifecycle id=4509330 + AI & Chatbot id=4509331), Sentry web wiring (4 configs + Dockerfile + workflow + bridge activation), backend wiring rationale + plan + 6 alert rules. Q&A persisted from the rollout conversation. Tutorial method (UI + API) for creating new dashboards, with reusable Python template.
