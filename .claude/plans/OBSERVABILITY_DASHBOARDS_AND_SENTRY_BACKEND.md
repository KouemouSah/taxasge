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

## 6. Tools deliberately NOT adopted

The Sentry + LogRocket + Cloud Logging + GitHub Actions stack is the result of an explicit shortlist. This section documents the **8 alternatives we evaluated and rejected** — what they do, why we passed today, what would change our mind, and how much they would cost when we hit the trigger condition.

The intent is not to rank tools against each other in the abstract. It is to give a future engineer (or a future you) the receipts when someone says "should we add Datadog?" — so you can answer in 60 seconds with the relevant rationale instead of re-running the evaluation.

### Decision matrix at a glance

| # | Tool | Category | Lowest paid plan starts at | Status | When to reconsider |
|---|---|---|---|---|---|
| 1 | **Datadog APM** | Full APM (traces+metrics+logs) | $31/host/month + $0.10/M spans | ❌ Rejected | When > 200 concurrent agents AND multi-service backend (workers, queues, > 3 microservices) |
| 2 | **New Relic** | Full APM | Free 100 GB/month then $0.30/GB | ❌ Rejected | If GCP egress to Datadog/Sentry breaks the budget; New Relic free tier is generous |
| 3 | **Grafana Cloud (full SaaS)** | Metrics + logs + traces | Free 10K series / 50 GB then $8/user/month + usage | 🟡 PoC scheduled (separate `GRAFANA_BUSINESS_POC_PLAN.md`) | After PoC outcome — see that plan |
| 4 | **Honeycomb** | High-cardinality observability | Free 20M events/month, then $130/month | ❌ Rejected | When debugging needs cross-cut by `(user_id, ministry, workflow_code, agent_site)` simultaneously — i.e. when Sentry's tag filtering hits its ceiling |
| 5 | **Dynatrace** | Enterprise full-stack APM | $0.08/h for 8 GB host + $25/M log lines | ❌ Rejected | Never for Free-tier scale; reconsider only on government enterprise contract + on-prem requirement |
| 6 | **AWS CloudWatch RUM** | Real User Monitoring (frontend) | $1 per 100K events + retention | ❌ Rejected | If we migrate web frontend off GCP to AWS Amplify (replaces LogRocket for web crash/perf, NOT replays) |
| 7 | **Bugsnag** | Error tracking | Free 7.5K events/month, then $59/month | ❌ Rejected | If Sentry org is compromised AND we need a fast multi-vendor crash-tracking failover |
| 8 | **PostHog** | Product analytics + replay + feature flags | Free 1M events + 5K replays then usage | 🟡 Watch-list | When we add A/B testing to the wizard, OR when LogRocket replay quota becomes the bottleneck |

### 6.1 Datadog APM

**What it does**: full APM (distributed traces, infrastructure metrics, log aggregation, RUM, synthetic monitoring) on a single pane of glass. Industry-standard for "everything is a graph" ops culture.

**Why not now**:
- **Pricing model** punishes our shape: $31/host/month, and Cloud Run scaling means we instantiate 10+ short-lived containers per minute under load. Datadog charges per *host-hour*, not per request — even if 9 of those instances live 90 seconds, they still count as 9 separate "hosts" for the day's billing. Estimated cost at our staging traffic: $300-500/month minimum.
- **Sentry already covers** the 80% case (error grouping + perf sample + alerting). Datadog's distributed tracing adds value only when we have > 3 backend services calling each other in a chain — today it's monolithic FastAPI + 1 Postgres + 1 Redis.
- **Ops culture mismatch**: Datadog shines for teams of 10+ SREs running 50+ services. We have 1 backend lead and 1 monolith.

**When to flip**:
- Backend splits into > 3 microservices (declarations service, payments service, agents service, …) AND we hit > 200 concurrent agents in production.
- Or, an enterprise customer demands an on-prem APM with 3-year retention.

**Coût projeté à bascule** : $500-1500/month (5-10 hosts × $31 + $200/month spans + RUM).

**Alternative en place** : Sentry Performance (`traces_sample_rate=0.05`) + Cloud Logging — covers 80% of Datadog's APM value at $0/month inside Free tier.

### 6.2 New Relic

**What it does**: full APM very similar to Datadog, but pricing is per-GB-ingested rather than per-host. Free tier is famously generous (100 GB/month, 1 full user free).

**Why not now**:
- **Same overlap** with Sentry as Datadog — we'd pay for capability we don't use.
- **GB-based pricing trap**: 100 GB free sounds large until you turn on `traces_sample_rate=1.0` and ship full Postgres query traces — we'd burn 100 GB in days and start paying $0.30/GB unpredictably.
- **Single-user free** doesn't scale across the team — a second engineer needing access costs $99/user/month immediately.

**When to flip**:
- If GCP egress charges to Sentry/Datadog become non-trivial AND we are willing to live with the New Relic UI (less polished than Datadog or Sentry).
- Or, for a quick "let me try APM for free" experiment — install the Python agent on staging for 1 week, see what it surfaces, decide.

**Coût projeté à bascule** : $0-100/month staying inside free; $300-500/month for a 3-engineer team on standard tier.

**Alternative en place** : Sentry Performance + Cloud Logging.

### 6.3 Grafana Cloud (full SaaS)

**What it does**: hosted Grafana + Prometheus (metrics) + Loki (logs) + Tempo (traces) + Pyroscope (profiling) on Grafana Labs' infra. Zero ops, all panels/alerts code-as-config via Terraform.

**Why not yet (vs. rejected outright)**:
- Grafana excels at **time-series + custom panels with rich PromQL/LogQL**. Our use case for time-series at this stage is limited (Sentry handles per-route latency; Looker Studio handles business KPIs).
- The free tier is real (10K active series, 50 GB logs, 14-day retention), but it requires us to instrument metrics export from FastAPI (`prometheus_client`), which is non-zero work.
- The bigger question is **"does Grafana's flexibility justify the second tool"** for *business* questions Looker Studio can answer with SQL alone. That's the explicit subject of the `GRAFANA_BUSINESS_POC_PLAN.md` PoC.

**When to flip**:
- After the 1-week PoC: if Grafana wins on heatmaps / time-series fine-grain / alerting flexibility, we keep it for ops-level dashboards while Looker Studio handles management dashboards.
- If we exceed Sentry Performance free quota (10K txn/month) AND need cheap long-tail latency analytics.

**Coût projeté à bascule** : $0/month inside free tier (10K series, 50 GB logs, 14d retention) ; $50-150/month if we exceed and stay on Pro plan.

**Alternative en place** : Sentry Performance + Cloud Monitoring (basic) + Looker Studio (planned, see `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md`).

### 6.4 Honeycomb

**What it does**: distributed tracing optimised for **high-cardinality** queries — "show me the slowest requests grouped by user_id × ministry × workflow_code simultaneously". Sentry tags get expensive past ~10 unique values per tag; Honeycomb's design eats 10K+ unique values per dimension without slowing down.

**Why not now**:
- Our current debugging questions are **low-cardinality** ("what's broken in `/payments/*`?"). Sentry's tag filtering is sufficient.
- Honeycomb pricing: Free tier is generous (20M events/month) but the next tier jumps to $130/month — no middle ground.
- The team needs to learn BubbleUp / heatmap UX, which is a non-trivial cognitive cost. Pays back only when high-cardinality analysis becomes routine.

**When to flip**:
- When investigations like "show me sessions where (user is in MIN_INTERIOR) × (workflow=Pasaporte_minor) × (ocr_engine=tesseract_fallback) × (latency > p99)" become weekly. This is a 100+ concurrent agents reality, not a 10 agents reality.
- Or, when AI/Gemini call observability needs cross-dimensional analysis (model × prompt-version × user_lang × cache_hit).

**Coût projeté à bascule** : $0/month inside free tier (20M events) ; $130/month for the Pro plan (50M events + 60d retention).

**Alternative en place** : Sentry tags + Cloud Logging structured queries.

### 6.5 Dynatrace

**What it does**: AI-driven full-stack APM with auto-instrumentation (Java/Node/Python agent injects bytecode), log analytics, RUM, infrastructure. Aimed at Fortune-500 ops teams.

**Why not now**:
- **Pricing**: $0.08/h per 8 GB host = $58/month per host MINIMUM, plus log volume, plus RUM volume. Three-figure floor before any usage.
- **Setup cost** is enterprise-grade — agent installation, OneAgent, SaaS tenant provisioning. 1-2 days of work to get a "hello world" graph.
- **Fit mismatch**: Dynatrace targets organisations where the *cost of an outage* is millions/hour. For Facil today, the cost of a 1-hour outage is "annoyed citizens + escalation to support". Sentry alerting is sufficient.

**When to flip**:
- Government enterprise contract: when we sell Facil-as-a-product to another country's tax authority and that customer requires Dynatrace as part of their security/audit baseline.
- Until then: never.

**Coût projeté à bascule** : $5-20K/month minimum at enterprise scale.

**Alternative en place** : Sentry + Cloud Logging suffice for the next 12-24 months.

### 6.6 AWS CloudWatch RUM

**What it does**: AWS-native browser SDK that captures page load metrics, JS errors, custom events. Plays nicely with CloudFront/CloudWatch Logs/Metrics if the app is on AWS.

**Why not now**:
- We're on **GCP** (Cloud Run, Firebase Hosting). Adding CloudWatch RUM means cross-cloud egress + IAM federation + double-billing for capability LogRocket already provides on the web.
- LogRocket gives us **session replays** (videos), CloudWatch RUM does **not** — CloudWatch is metrics + structured events only.
- Pricing ($1 per 100K events) is competitive only if you're already paying CloudWatch's ingest costs for everything else.

**When to flip**:
- If we migrate web frontend off Firebase Hosting to AWS Amplify (unlikely; Amplify SSR is weaker than Cloud Run for our use case).
- Or, if we open a US/EU instance for the same product on AWS for data-sovereignty reasons.

**Coût projeté à bascule** : ~$50-200/month at our scale on AWS.

**Alternative en place** : LogRocket web (replays) + Sentry web (errors, when wired).

### 6.7 Bugsnag

**What it does**: error tracking very similar to Sentry — stack traces, releases, user impact. Was a Sentry competitor in 2018; SmartBear acquisition in 2021 slowed innovation.

**Why not now**:
- **Direct overlap with Sentry** — same primitives, no unique advantage.
- Sentry's pricing is more competitive at our tier (5K free vs Bugsnag 7.5K free, but Sentry's paid plan starts at $26/month vs Bugsnag $59/month).
- Bugsnag's mobile SDK (`@bugsnag/react-native`) was the pre-Sentry standard — not anymore. Sentry RN is now better.

**When to flip**:
- If Sentry's billing model breaks our budget AND New Relic / Honeycomb don't fit.
- Or, as a fast multi-vendor failover if Sentry org is compromised and we need crash tracking back online in < 1 hour. (Realistic mitigation: keep Bugsnag SDK uninitialised in code, flip a flag to activate.)

**Coût projeté à bascule** : $0/month inside free (7.5K events) ; $59/month next tier ($89/month for 100K events).

**Alternative en place** : Sentry (3 projects = 15K events free quota).

### 6.8 PostHog

**What it does**: product analytics (event tracking like Mixpanel) + session replay (like LogRocket) + feature flags + experiments. All-in-one open-source play.

**Why on watch-list (not rejected)**:
- **Generous free tier**: 1M events/month + 5K replays/month + unlimited feature flags. Materially more than LogRocket's 1K replays.
- **Replay quality** is good but not on par with LogRocket for performance-heavy SaaS dashboards (LogRocket compresses better, has more dev-tooling depth).
- **Self-hostable** (open-source) — useful if data residency becomes a Guinea Equatorial regulatory requirement.
- **Adds A/B testing** primitives we currently lack — if we want to A/B test the wizard or onboarding, PostHog is the cheapest path.

**When to flip**:
- When LogRocket free quota (1K sessions/month) becomes the bottleneck — PostHog gives 5× more replay quota for free.
- When product team explicitly asks for A/B testing and feature flags (we do not have a feature-flag system today; this would be a Net-new capability).
- When data-residency rules require self-hosted analytics.

**Coût projeté à bascule** : $0/month inside free (1M events + 5K replays) ; $0.00045/event after — typically $50-200/month for a product with millions of users monthly.

**Alternative en place** : LogRocket (replay) + Sentry (errors). No A/B testing primitive today.

### 6.9 Decision principle to remember

The unifying rule across the 8 rejections is: **don't pay for capability the existing stack covers at 80%**. Sentry+LogRocket+Cloud Logging cover error tracking, perf sample, replay, structured logs. Anything that overlaps without adding a *different kind of insight* is rejected.

The two tools on the watch-list (Grafana, PostHog) earn that status because they bring something genuinely different (rich time-series queries / A/B + product analytics) — but only if a specific trigger condition fires. We track those triggers in `OBSERVABILITY_STACK.md §8 Future enhancements`.

---

## 7. Changelog

- **2026-05-01 v1.1** — added §6 "Tools deliberately NOT adopted" — 8 evaluated alternatives (Datadog APM, New Relic, Grafana Cloud, Honeycomb, Dynatrace, CloudWatch RUM, Bugsnag, PostHog) with rationale, trigger-to-flip, projected cost, and alternative-in-place. Promoted Changelog from §6 to §7.
- **2026-04-30 v1.0** — initial document. Captures: 8 dashboards (6 existing + 2 new Document Lifecycle id=4509330 + AI & Chatbot id=4509331), Sentry web wiring (4 configs + Dockerfile + workflow + bridge activation), backend wiring rationale + plan + 6 alert rules. Q&A persisted from the rollout conversation. Tutorial method (UI + API) for creating new dashboards, with reusable Python template.
