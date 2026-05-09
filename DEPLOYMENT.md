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

## Quick start

```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# 1. Copy the template and fill in your values.
cp deploy/config.example.yaml deploy/config.yaml
$EDITOR deploy/config.yaml

# 2. End-to-end validation (no cloud changes).
python deploy/deploy.py --provider=gcp --action=validate

# 3. Show the deploy plan.
python deploy/deploy.py --provider=gcp --action=plan

# 4. Apply for real.
python deploy/deploy.py --provider=gcp --action=apply
```

For Docker Compose (local dev):

```bash
python deploy/deploy.py --provider=docker-local --action=apply
```

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

**Prerequisites**
- `docker` installed (Docker Desktop or Engine)
- `docker compose` v2 plugin available

**Setup**

Create a `.env.secrets` file at the repo root (gitignored) with the secret values that the backend expects:

```
JWT_SECRET_KEY=...
SECRET_KEY=...
TOTP_ENCRYPTION_KEY=...
GEMINI_API_KEY=...
CRON_SECRET=...
```

`DATABASE_URL` and `REDIS_URL` are injected automatically by the compose file (pointing to the local containers).

**Run**

```bash
python deploy/deploy.py --provider=docker-local --action=apply
```

This generates `docker-compose.local.yml` at the repo root and runs `docker compose -f docker-compose.local.yml up -d --build`. The stack includes:

- Postgres (with persistent volume named per `docker_local.postgres_volume`)
- Redis
- Backend (built from `packages/backend/Dockerfile`)
- Frontend (built from `packages/web/Dockerfile`)

URLs after start:
- Backend: `http://localhost:<docker_local.backend_port>` (default 8080)
- Frontend: `http://localhost:<docker_local.frontend_port>` (default 3000)

**Stop**: `docker compose -f docker-compose.local.yml down` (volumes preserved).

### AWS (planned)

Phase A.5.7 of the deploy plan. ECS Fargate + RDS + ElastiCache + Secrets Manager + CloudFront. Not implemented yet.

---

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
+-------------------+         +---------------------+         +----------------------+
| deploy/config.yaml|  ───►   | scripts/validate    |  ───►   | scripts/render_env   |
| (operator-filled) |         | _config.py          |         | (.env.deploy.gen +   |
+-------------------+         | (Pydantic schema)   |         |  secrets-manifest)   |
                              +---------------------+         +----------+-----------+
                                                                         │
                                                                         ▼
                                                              +----------+-----------+
                                                              | providers/<X>.py     |
                                                              | --validate / --plan  |
                                                              | --apply              |
                                                              +----------+-----------+
                                                                         │
                                                                         ▼
                                                              +---------+----------+
                                                              | Cloud Run / Docker |
                                                              | / RDS / ECS / ...  |
                                                              +--------------------+
```

The orchestrator `deploy.py` chains these steps and propagates failures with distinct exit codes. The validator, renderer, and providers are independently testable Python modules with their own pytest suites under `deploy/`.

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
Read the Pydantic error: it identifies the section and field that's wrong (e.g. `server.frontend_url: URL must start with http:// or https://`).

**"ERROR: 1 secret(s) MISSING in GCP"**
The cross-check found a secret name in your config that doesn't exist in GCP Secret Manager. Either create it (`gcloud secrets create`) or update `deploy/config.yaml` to point at the correct existing name.

**"gcloud not found"**
Install Google Cloud SDK (https://cloud.google.com/sdk/docs/install). On Windows, the script also looks at `C:/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd`.

**"docker compose plugin not available"**
Update Docker Desktop / Docker Engine. Compose v2 ships built-in since 2022; the legacy `docker-compose` v1 binary is **not** supported by this provider.

**"Application Default Credentials missing"**
Run `gcloud auth application-default login` once on the operator's machine.

---

## References

- Plan: `.claude/plans/DEPLOY_SYSTEM_PLAN.md` (local only)
- Audit: `deploy/AUDIT.md`
- Migrations refactor: `.claude/plans/MIGRATIONS_BASELINE_REFACTOR_PLAN.md`
- Backend config: `packages/backend/app/config.py`
- Project root README: [README.md](README.md)
