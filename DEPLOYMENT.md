# Deploying Facil

This guide walks through deploying Facil (backend + frontend) to **any** target environment using a single configuration file. The same flow works for:

- **Google Cloud Platform** (Cloud Run + Cloud SQL + Secret Manager) — production target
- **Local Docker Compose** — development / demo / self-hosted minimal install
- **AWS** — planned (Phase A.5.7), not yet implemented

The deploy system lives in `deploy/`. It does **not** copy or duplicate any application code. The single source of truth remains `packages/backend/` and `packages/web/`. The deploy scripts only orchestrate the build, configuration injection, secret binding, and infrastructure provisioning.

---

## Prerequisites (all targets)

- Python 3.11+ on the operator's machine
- `pip install pydantic pyyaml asyncpg` (asyncpg only required for the database init step)
- A filled-in `deploy/config.yaml` (see next section)

Per-target additional prerequisites are listed in [Targets](#targets).

---

## Quick start (recommended: use the wizard)

```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# 1. Run the interactive wizard. It generates deploy/config.yaml +
#    .env.secrets, auto-creates the random JWT/SECRET/TOTP/CRON keys,
#    and validates the schema before writing.
python deploy/init.py

# 2. End-to-end validation (no cloud changes).
python deploy/deploy.py --provider=gcp --action=validate

# 3. Show the deploy plan.
python deploy/deploy.py --provider=gcp --action=plan

# 4. Apply for real.
python deploy/deploy.py --provider=gcp --action=apply
```

For Docker Compose (local dev / demo):

```bash
python deploy/init.py                                    # answer 9 questions
python deploy/providers/docker_local.py --apply          # bring up stack
```

### Manual config (no wizard)

If you prefer editing files by hand (CI use, scripted setup):

```bash
cp deploy/config.example.yaml deploy/config.yaml
cp deploy/.env.secrets.example .env.secrets
$EDITOR deploy/config.yaml          # fill in project values
$EDITOR .env.secrets                # fill in secrets

python deploy/deploy.py --provider=gcp --action=apply
```

The wizard supports CI mode too — set `WIZ_*` env vars and run with
`--non-interactive --force`. See `python deploy/init.py --help` for the
list of variables.

---

## Configuration file

`deploy/config.yaml` is **gitignored** — your filled-in copy never enters git.

It declares **17 sections** covering everything Facil needs at runtime:

| Section | Purpose |
|---|---|
| `meta` | Project name, environment, version |
| `database` | Postgres connection (URL secret OR discrete fields) + Supabase bridge |
| `redis` | Redis URL + cache TTL |
| `auth` | JWT/session/TOTP secret names + token expiries |
| `firebase` | Project id, storage bucket, admin SDK secrets |
| `ai` | Gemini models + Vertex AI project (or API key secret) |
| `payments` | BANGE / Ecobank / MPGS gateways (each with `enabled` flag) |
| `smtp` | Outbound email |
| `observability` | Sentry, LogRocket, Grafana OTLP, MaxMind GeoIP |
| `server` | API host/port, frontend URL, log level |
| `legal` | Document versions surfaced in the app |
| `cron` | Bearer secret for `/cron/*` endpoints |
| `features` | Boolean toggles (scheduler, rate limit, metrics, etc.) |
| `gcp` | GCP-specific settings (project_id, region, service names) |
| `aws` | AWS placeholder (Phase A.5.7) |
| `docker_local` | Docker Compose ports + volume names |
| `env_overrides` | Optional dict to push any of the 95 backend TUNABLES |

**Convention** — fields whose name ends in `_secret`, `_secret_name`, or that are exact `secret_name` hold the **name** of a secret stored in your provider's secret store (GCP Secret Manager, AWS Secrets Manager, Docker secrets), **never the value itself**. Real values are fetched at deploy time and bound to the runtime via `--set-secrets` (Cloud Run) or `env_file` (Docker Compose).

The schema is enforced by `deploy/scripts/validate_config.py` (Pydantic v2). Errors include the exact JSON path of the offending field.

---

## How the pipeline works

`deploy/deploy.py` runs **4 sequential steps**, stopping at the first non-zero exit:

| Step | Script | Purpose |
|---|---|---|
| 1 | `scripts/validate_config.py` | Pydantic schema check + provider-specific required-field check |
| 2 | `scripts/render_env.py` | Read config + templates → write `<package>/.env.deploy.gen` + `deploy/.secrets-manifest.json` |
| 3 | `providers/<provider>.py --validate` | Provider prereqs (gcloud / docker installed, ADC configured) + secret name cross-check |
| 4 | `providers/<provider>.py --plan/--apply` | Show planned commands, or actually run them |

Three actions:

- `--action=validate` runs only steps 1–3 (read-only).
- `--action=plan` runs all four; step 4 prints the commands without executing.
- `--action=apply` runs all four; step 4 prompts the operator and executes.

Exit codes: `0` success, `1` validation/render error, `2` provider failed, `3` file missing.

---

## Targets

### GCP (production)

**Prerequisites**
- Google Cloud SDK (`gcloud`) installed
- `gcloud auth application-default login` (Application Default Credentials)
- Active GCP project with these APIs enabled:
  - `run.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `secretmanager.googleapis.com`
  - `containerregistry.googleapis.com`
- All secret names referenced in `config.yaml` must exist in **GCP Secret Manager** for that project. The pipeline cross-checks this in step 3 and refuses to proceed if any are missing.

**What it does at apply time**
- Builds backend + frontend images via Cloud Build (using each package's `Dockerfile`)
- Deploys two Cloud Run services (backend + frontend, names from `gcp.backend_service_name` / `frontend_service_name`)
- Wires secrets via `--set-secrets="ENV_VAR=secret-name:latest,..."` for each manifest entry
- Sets non-secret env vars from the rendered `.env.deploy.gen`
- Optional: domain mapping (when `gcp.custom_domain_*` is set)

**Database init** is **not** part of the pipeline yet — the existing `db-migrate-auto.yml` GitHub Actions workflow (or `python packages/backend/scripts/deploy/init_database.py --mode=hybrid`) handles it. Cloud Run Job integration is a planned follow-up.

### Docker Compose local

> **Step-by-step tutorial available**:
> [`docs/local-deployment-tutorial.md`](docs/local-deployment-tutorial.md)
> walks through prereqs, wizard, both database modes, and troubleshooting.

**Prerequisites**
- `docker` installed (Docker Desktop or Engine)
- `docker compose` v2 plugin available (legacy `docker-compose` v1 is NOT supported)

**Two database topologies**

The wizard asks you which mode to use:

  - **`local`** (default): compose generates a postgres container with a
    persistent volume. Zero external dependencies.
  - **`external`**: compose does NOT generate postgres. Backend + db-init
    use the `DATABASE_URL` from `.env.secrets` to connect to Supabase /
    AWS RDS / Cloud SQL via proxy / Neon / Railway / etc. Useful when
    you want a managed DB or to share data across a team.

**Setup**

Use the wizard (recommended) or copy the secrets template manually:

```bash
# Option A — wizard generates everything
python deploy/init.py

# Option B — manual
cp deploy/.env.secrets.example .env.secrets
$EDITOR .env.secrets
```

The `.env.secrets` file is gitignored at the repo root and contains JWT,
TOTP, CRON keys and the Gemini API key. `DATABASE_URL` and `REDIS_URL`
are injected automatically by the compose file (pointing to the in-stack
containers, not your local Postgres).

**Stack architecture (docker-local v2)**

The generated `docker-compose.local.yml` declares 5 services with
proper dependency ordering:

```
postgres   (healthcheck: pg_isready)
   ↓
redis      (healthcheck: redis-cli ping)
   ↓
db-init    ── one-shot service that runs scripts/deploy/init_database.py
              in --mode=hybrid:
                · DB empty + baseline.sql present → applies baseline +
                  seeds (~30s)
                · DB existing → applies pending migrations + seeds
              backend depends on this service exiting with code 0.
   ↓
backend    (uvicorn FastAPI, healthcheck: GET /health)
   ↓
frontend   (Next.js, depends on backend healthy)
```

`db-init` is the critical fix that makes the stack actually work — without
it, backend would start against an empty schema. It reuses the backend
image (no extra build) and runs once per `up`.

**Available commands**

```bash
# Validate prereqs (docker present, compose v2)
python deploy/providers/docker_local.py --validate

# Print the generated compose file without writing
python deploy/providers/docker_local.py --plan

# Bring the stack up (writes compose file, builds images, starts services)
python deploy/providers/docker_local.py --apply
python deploy/providers/docker_local.py --apply --yes   # skip prompts (CI)

# Tail logs of all services (Ctrl+C to stop)
python deploy/providers/docker_local.py --logs

# Restart services (no rebuild)
python deploy/providers/docker_local.py --restart

# Stop and remove containers, KEEP postgres data
python deploy/providers/docker_local.py --down

# Stop and WIPE postgres data
python deploy/providers/docker_local.py --down --volumes
```

URLs after `--apply`:
- Backend: `http://localhost:<docker_local.backend_port>` (default 8080)
- Frontend: `http://localhost:<docker_local.frontend_port>` (default 3000)

**SSR vs CSR API URLs**

The frontend container receives two URL variables:
- `NEXT_PUBLIC_API_URL=http://localhost:8080` — baked into the client bundle
  for browser-side fetches (you open the app from your host machine)
- `INTERNAL_API_URL=http://backend:8080` — runtime env for SSR fetches
  (Next.js code that runs server-side inside the frontend container)

If your Next.js code does server-side fetches (e.g., in
`getServerSideProps` / `loaders` / Server Components), it should branch
on `typeof window === 'undefined'` to pick the right URL. Browser code
keeps using `NEXT_PUBLIC_API_URL`.

### AWS (planned)

Phase A.5.7 of the deploy plan. ECS Fargate + RDS + ElastiCache + Secrets Manager + CloudFront. Not implemented yet.

---

## Seeds (this is a TaxasGE deployment, not a generic framework)

> **Honest scoping**: This repo is the **concrete TaxasGE deployment for
> Guinea-Ecuatorial gov services**, built on top of the Facil architecture.
> The seeds shipped here reflect that context. If you fork to deploy
> elsewhere (different country, private enterprise, SaaS, banking, etc.),
> you will need to **adapt the seeds** — see "Forking for another context"
> below.

The architecture (FastAPI/Next.js code, the 319 DDL migrations, the
init/render/provider scripts under `deploy/`) is reusable as-is. The
**data** in the seeds is TaxasGE-specific.

### Seeds shipped in this repo

`packages/backend/database/seeds/` contains the data needed to bring up
a working TaxasGE staging or production instance from a fresh DB:

- **TIER 0 (auto-applied by init_database.py mode `auto`/`hybrid`)** —
  RBAC + communication templates. ~2,400 rows across 9 tables:
  `roles` (47), `permissions` (337), `role_permissions` (1890),
  `email_templates` (32), `sms_templates` (34), `push_templates` (12),
  `notification_templates` (16), `ussd_configurations` (2),
  `communication_provider_settings` (4).

- **TIER 1 (NOT shipped, regenerable on demand)** — country taxonomies,
  fiscal services catalog (850+), procedures, document templates,
  translations. Run `extract_seeds.py --tier=1 --output-dir=...` against
  the staging DB whenever you need a fresh snapshot.

### Forking for another context

If you want to deploy Facil for a **different country**, a **private
enterprise**, a **multi-tenant SaaS**, or any other context, the seeds
shipped here are NOT directly applicable. The role codes, permission
names, ministry/branch names, fiscal service catalog, etc. all reflect
TaxasGE / Guinea-Ecuatorial gov.

Recommended fork workflow:

1. Fork the repo.
2. **Delete** the existing `packages/backend/database/seeds/*.sql`.
3. Run `init_database.py` against your fresh DB → applies the schema only.
4. Configure your own data via the admin UI:
   - Define your own roles (e.g. `customer`, `agent`, `manager` for an
     enterprise) and permissions (e.g. `order.create`, `invoice.approve`)
   - Define your own taxonomies / branches / catalog
5. Once your data is in your DB, run `extract_seeds.py` against it to
   capture **your own** seeds:
   ```bash
   python deploy/scripts/extract_seeds.py --tier=1 \
     --output-dir=packages/backend/database/seeds/
   ```
6. Commit your seeds to your fork. Future re-deploys (DR, new env) will
   use them.

A future "Voie B" project may abstract Facil into a true generic
framework with seed *profiles* (gov / enterprise / SaaS). For now, fork
+ adapt is the documented path.

### Regenerating seeds for THIS (TaxasGE) deployment

```bash
# Read-only against staging, captures the current state.
DATABASE_URL=$(grep DATABASE_URL packages/backend/.env | cut -d= -f2-) \
  python deploy/scripts/extract_seeds.py --tier=1 \
  --output-dir=packages/backend/database/seeds-tier1/
```

Output goes to a separate directory (`seeds-tier1/`) so it doesn't
overwrite the TIER 0 seeds. TIER 1 output is intentionally NOT in the
gitignore — commit it if you want a versioned snapshot for DR.

## Secrets management

The pipeline produces `deploy/.secrets-manifest.json` mapping each secret-bound env var to its provider secret name:

```json
{
  "DATABASE_URL": "database-url",
  "JWT_SECRET_KEY": "jwt-secret-key",
  ...
}
```

This file is regenerated at every `render_env.py` run, gitignored, and consumed by the provider script in step 3 to wire the `--set-secrets` payload (Cloud Run) or to verify presence in the secret store.

**Secrets fetched directly by the application code (not env-bound)**

A few secrets are read inside the backend via `app.core.secrets.get_secret(<name>)` — they don't go through the manifest:

- `verified-identifiers-aes-key` (AES-256 key for funcionario matricula encryption)
- `verified-identifiers-hmac-key` (HMAC key for matricula hashing)

These must still exist in your provider's secret store — the application calls Secret Manager / equivalent on its own.

---

## Adding a new env var

1. Add the `Field(..., env="MY_NEW_VAR")` to `packages/backend/app/config.py`.
2. If the value is **non-secret** and operator-configurable: add it to `deploy/config.example.yaml` under the right section AND add a `MY_NEW_VAR={{section.field}}` line to `deploy/templates/env.backend.template`.
3. If the value is a **secret**:
   - Add a new field to the appropriate Pydantic config class in `deploy/scripts/validate_config.py` (suffix the field name with `_secret`).
   - Add an entry to `SECRET_REF_TO_ENV_VAR` in `deploy/scripts/render_env.py`.
   - Add the field with the secret name in `deploy/config.example.yaml`.
4. If the value is a **TUNABLE** (rarely changed, defaults are good): no change to deploy needed. Operators can override via the `env_overrides:` dict in `config.yaml`.

Run `pytest deploy/` to verify schema and rendering tests still pass.

---

## Adding a new provider

Create `deploy/providers/<provider_name>.py` with the same CLI shape as `gcp.py` and `docker_local.py`:

- `--validate` (read-only prereqs + secret cross-check)
- `--plan` (read-only deploy plan)
- `--apply` (execute deploy)

Add the provider name to `deploy/deploy.py:SUPPORTED_PROVIDERS`. Add tests in `deploy/providers/test_<provider_name>.py`.

---

## Architecture (one-paragraph summary)

```
                ┌─────────────────────┐
                │ deploy/init.py      │  Q&A wizard (optional first step)
                │ (interactive)       │  generates config.yaml + .env.secrets
                └──────────┬──────────┘
                           │
                           ▼
+-------------------+         +---------------------+         +----------------------+
| deploy/config.yaml|  ───►   | scripts/validate    |  ───►   | scripts/render_env   |
| (filled by user   |         | _config.py          |         | (.env.deploy.gen +   |
|  or wizard)       |         | (Pydantic schema)   |         |  secrets-manifest)   |
+-------------------+         +---------------------+         +----------+-----------+
                                                                         │
                                                                         ▼
                                                              +----------+-----------+
                                                              | providers/<X>.py     |
                                                              | --validate / --plan  |
                                                              | --apply              |
                                                              | (gcp.py |            |
                                                              |  docker_local.py)    |
                                                              +----------+-----------+
                                                                         │
                                                                         ▼
                                                              ┌──────────┴───────────┐
                                                              │ Cloud Run / Docker / │
                                                              │ ECS (planned) / etc. │
                                                              └──────────────────────┘
```

The orchestrator `deploy.py` chains the validate → render → provider
steps and propagates failures with distinct exit codes. The wizard
`deploy/init.py` is an optional convenience layer that generates the
config files via guided Q&A. The validator, renderer, providers, and
wizard are independently testable Python modules with their own pytest
suites under `deploy/` (162+ tests passing).

For Docker local specifically, the in-stack `db-init` service runs
`scripts/deploy/init_database.py` once before the backend boots,
guaranteeing the schema is applied (baseline + seeds OR migrations).

---

## Testing locally

```bash
# Run all deploy tests (fast — no real cloud calls).
pytest deploy/ --no-cov

# Smoke-test the GCP provider against a real project (requires gcloud + ADC).
python deploy/providers/gcp.py --config=deploy/config.yaml --validate
```

The GCP provider's `--validate` mode is **read-only** and safe to run repeatedly. It prints exactly which secrets are missing and which prereqs are satisfied.

---

## Troubleshooting

**"ERROR: schema validation failed"**
Read the Pydantic error: it identifies the section and field that's wrong (e.g. `server.frontend_url: URL must start with http:// or https://`). The wizard `deploy/init.py` validates the same way before writing.

**"ERROR: 1 secret(s) MISSING in GCP"**
The cross-check found a secret name in your config that doesn't exist in GCP Secret Manager. Either create it (`gcloud secrets create`) or update `deploy/config.yaml` to point at the correct existing name.

**"ERROR: missing secrets file"** (docker-local)
You haven't created `.env.secrets` at the repo root. Either run the wizard (`python deploy/init.py`) or copy the template (`cp deploy/.env.secrets.example .env.secrets`).

**"gcloud not found"**
Install Google Cloud SDK (https://cloud.google.com/sdk/docs/install). On Windows, the script also looks at `C:/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd`.

**"docker compose plugin not available"**
Update Docker Desktop / Docker Engine. Compose v2 ships built-in since 2022; the legacy `docker-compose` v1 binary is **not** supported by this provider.

**"Application Default Credentials missing"**
Run `gcloud auth application-default login` once on the operator's machine.

**Docker stack: "port already allocated"**
A previous run is still up. Stop it first:
```bash
python deploy/providers/docker_local.py --down
python deploy/providers/docker_local.py --apply
```
The provider auto-detects this and prompts you (use `--yes` to skip the prompt in CI).

**Docker stack: backend keeps restarting / cannot connect to DB**
Inspect the logs:
```bash
python deploy/providers/docker_local.py --logs
```
The most common cause is `db-init` failing — it must exit 0 before backend
starts. If `db-init` errors, the backend will wait forever (compose
dependency). Check the `db-init` log lines for migration errors.

---

## References

- Wizard: `deploy/init.py` (interactive setup)
- Orchestrator: `deploy/deploy.py`
- Schema validator: `deploy/scripts/validate_config.py`
- Env renderer: `deploy/scripts/render_env.py`
- Providers: `deploy/providers/{gcp,docker_local}.py`
- Database init: `packages/backend/scripts/deploy/init_database.py`
- Schema baseline: `packages/backend/database/baseline/000_baseline_*.sql`
- Seeds (TIER_0 universal + TIER_1 deployment-specific): `packages/backend/database/seeds/`
- Plan: `.claude/plans/DEPLOY_SYSTEM_PLAN.md` (local only)
- Migrations refactor: `.claude/plans/MIGRATIONS_BASELINE_REFACTOR_PLAN.md` (local)
- Audit: `deploy/AUDIT.md`
- Backend config schema: `packages/backend/app/config.py`
- Project root: [README.md](README.md)
