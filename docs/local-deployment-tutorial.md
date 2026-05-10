# Local Deployment Tutorial — Step by Step

This tutorial walks you through bringing up the **Facil** stack on your
own machine using Docker Compose. Two database topologies are supported
and the wizard picks one for you:

  - **Local Postgres** (default): Docker spins up a postgres container
    alongside the app. Zero external dependencies. Best for first-time
    install, demo, offline dev.
  - **External Postgres** (Supabase / RDS / Cloud SQL via proxy / Neon /
    Railway / etc.): no postgres container; the stack connects to a
    Postgres URL you provide.

Both modes go through exactly the same `init_database.py` bootstrap so
the schema + seeds end up identical. Only the *where* differs.

---

## Prerequisites

Install once on your machine:

| Tool | Version | Why |
|---|---|---|
| Python | ≥ 3.11 | Wizard + deploy scripts |
| pip packages | `pyyaml`, `pydantic>=2`, `cryptography` (optional) | Wizard validation + Fernet keygen |
| Docker | recent (Desktop / Engine) | Container runtime |
| Docker Compose v2 | bundled with Docker Desktop | Stack orchestration |
| `git` | any | Clone the repo |

Sanity check:
```bash
python --version            # 3.11+
docker --version
docker compose version
```

---

## Step 1 — Clone & enter the repo

```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge
pip install pyyaml "pydantic>=2" cryptography
```

That's the only `pip install` you need on your host machine — everything
else runs inside the containers.

---

## Step 2 — Run the wizard

```bash
python deploy/init.py
```

The wizard asks 9 short sections of guided questions (project name,
environment, database, Redis, auth, Firebase, AI, server URLs, cron).

Two of those sections are central to local deployment:

### 2.1 — Auth secrets (section 4/9)

```
=== 4/9 — Auth secrets (JWT, session, TOTP) ===
? Auto-generate random JWT/SECRET/TOTP keys for you? [Y/n]: y
  ✓ Generated 4 cryptographic keys (will be written to .env.secrets)
```

Press Enter to accept. The wizard writes 4 cryptographically-random
keys (JWT, session, TOTP-Fernet, receipt-HMAC) directly to
`.env.secrets`. You never type a key by hand.

### 2.2 — Provider + Database location (section 9/9 + 9b/9)

```
=== 9/9 — Target deployment provider ===
? Provider [DOCKER-LOCAL/gcp/aws]: docker-local

=== 9b/9 — Docker local: database location ===
  - 'local'    : compose generates a postgres container (zero external
                 dependencies, good first install).
  - 'external' : connect to Supabase / RDS / Cloud SQL via the
                 DATABASE_URL you provide in .env.secrets.
? Database location [LOCAL/external]:
```

**Choose `local`** if you want zero setup beyond Docker.
**Choose `external`** if you already have a managed Postgres (Supabase
free tier, an RDS instance, etc.). The wizard then asks for the full
DATABASE_URL with a hidden prompt:

```
? Full DATABASE_URL (postgresql://user:pwd@host:port/dbname) (input hidden): ******
  ✓ DATABASE_URL stored in .env.secrets
```

When the wizard exits, you have:
  - `deploy/config.yaml` — operator-facing config (gitignored)
  - `.env.secrets` at the repo root — secrets file (gitignored)

Both are validated against the Pydantic schema. The wizard refused to
write if anything is wrong (missing required field, invalid URL, etc.).

---

## Step 3 — Bring up the stack

```bash
python deploy/providers/docker_local.py --apply
```

This single command does everything:

  1. Validates Docker + Compose v2 are present
  2. Renders `packages/backend/.env.deploy.gen` and
     `packages/web/.env.deploy.gen` from `config.yaml` (both gitignored)
  3. Writes `docker-compose.local.yml` at the repo root
  4. Runs `docker compose up -d --build` with BuildKit cache enabled

Expected output (excerpt):
```
[OK] Wrote docker-compose.local.yml

=== Building images + starting containers ===
 ✔ Container facil-postgres-1   Started      (local mode only)
 ✔ Container facil-redis-1      Started
 ✔ Container facil-db-init-1    Started      (one-shot, exits 0 once schema is ready)
 ✔ Container facil-backend-1    Started      (waits for db-init)
 ✔ Container facil-frontend-1   Started      (waits for backend healthy)

[OK] Stack up.
  Backend:  http://localhost:8080
  Frontend: http://localhost:3000
```

Total time on a warm Docker cache: ~30s. On a first build with empty
cache: 5-10 minutes (Python and Node deps download).

### What `db-init` does

The one-shot service `db-init` runs
`packages/backend/scripts/deploy/init_database.py --mode=hybrid` and
guarantees the schema is ready before backend boots. Its behavior:

  - **Empty DB + baseline.sql present** (the case for a brand-new
    Postgres): applies `baseline/000_baseline_*.sql` (~30s) + 39 seed
    files (`database/seeds/`). Marks every historical migration as
    "applied via baseline" so future runs skip them.
  - **Existing DB** (re-running on a populated Supabase project, or a
    second `--apply` after `--down`): applies only the migrations that
    aren't already in `schema_migrations`. Fast no-op if nothing new.

Backend is configured with
`depends_on: db-init: condition: service_completed_successfully` so it
literally cannot boot against an empty schema.

---

## Step 4 — Use the app

Open in your browser:

  - **Frontend**: http://localhost:3000
  - **API health**: http://localhost:8080/health
  - **API docs (Swagger UI)**: http://localhost:8080/docs

Sign-up flow, login, browsing the catalog — all should work end to end
because seeds populated the RBAC + communication templates, and (in
local mode) the Postgres volume is fresh + persistent.

---

## Step 5 — Day-to-day commands

```bash
# Tail logs of all 5 services
python deploy/providers/docker_local.py --logs

# Restart services without rebuilding (e.g. after editing
# packages/backend/.env.local manually)
python deploy/providers/docker_local.py --restart

# Stop the stack, KEEP the postgres volume (data persists)
python deploy/providers/docker_local.py --down

# Stop + WIPE the postgres volume (fresh start next --apply)
python deploy/providers/docker_local.py --down --volumes
```

---

## Step 6 — Update flow when code changes

Most code changes are picked up by rebuilding the relevant image.
Compose detects them automatically:

```bash
# 1. Pull / commit code changes
git pull

# 2. Rebuild + restart
python deploy/providers/docker_local.py --apply
```

When you add a new SQL migration to
`packages/backend/database/migrations/337_*.sql` (or higher), the
`db-init` service applies it on the next `--apply` (or `--restart`).

If you want to re-run the wizard from scratch:
```bash
python deploy/init.py --force          # overwrites config.yaml + .env.secrets
```

---

## Mode comparison (local vs external)

| Aspect | `database_mode: local` | `database_mode: external` |
|---|---|---|
| Postgres setup effort | None — Docker pulls postgres:16-alpine | You create the project on Supabase / your cloud |
| Cost | $0 | Free tier or paid (Supabase free is generous) |
| Cold start | ~30s (image pull + db-init + warmup) | ~10s (no postgres container) |
| Data persistence | Local Docker volume (`facil_pgdata`) | Managed by your cloud provider |
| Internet required | No | Yes |
| Test resets | `--down --volumes` wipes everything | Wipe must happen via your cloud UI |
| Multi-developer | Each dev has own data | Can share a Supabase project |
| Production-like | Less (latency, network) | More (real network, real auth proxy) |

**Recommendation**:
  - Solo dev: `local`
  - Team demo / shared dataset: `external` (Supabase free tier)
  - Pre-prod-like testing: `external`

---

## Troubleshooting

### "ERROR: missing secrets file"

You skipped the wizard or deleted `.env.secrets`. Quickest fix:

```bash
cp deploy/.env.secrets.example .env.secrets
$EDITOR .env.secrets
```

Or rerun the wizard: `python deploy/init.py --force`.

### "port already allocated"

A previous `--apply` is still running. The provider auto-detects this
and prompts you. To skip the prompt in CI:

```bash
python deploy/providers/docker_local.py --down
python deploy/providers/docker_local.py --apply --yes
```

### Backend keeps restarting / "could not connect to database"

Most likely `db-init` failed. Check its logs:

```bash
python deploy/providers/docker_local.py --logs
# (look for the db-init service output)
```

Common causes:
  - **External mode, wrong DATABASE_URL**: edit `.env.secrets`,
    `--restart`.
  - **Local mode, port 5432 already used by your host Postgres**:
    edit `deploy/config.yaml` → `docker_local.backend_port` etc., or
    stop your host postgres (`brew services stop postgresql` /
    `systemctl stop postgresql`).
  - **Network ACL blocks Supabase / RDS**: ensure your machine can
    reach the host (try `psql $DATABASE_URL -c 'select 1'` from your
    host).

### "docker compose plugin not available"

You're on Compose v1. Update Docker Desktop / Docker Engine to a
recent version (Compose v2 ships built-in since 2022). Legacy
`docker-compose` v1 is **not** supported.

### Frontend SSR errors hitting `localhost:8080` from inside the container

The compose file sets `INTERNAL_API_URL=http://backend:8080` on the
frontend container. If your Next.js code does server-side fetches and
hardcodes `process.env.NEXT_PUBLIC_API_URL`, it will hit the wrong host
during SSR. Branch on `typeof window === 'undefined'` to pick
`INTERNAL_API_URL` instead.

---

## What's deployed under the hood

After `--apply`, you have 4 (external mode) or 5 (local mode) running
containers:

```
postgres  ── only in 'local' mode. Persistent volume facil_pgdata.
redis     ── cache + rate limit + idempotency.
db-init   ── one-shot. Runs init_database.py, exits 0, never restarts.
backend   ── FastAPI / uvicorn. Health-check /health. Restart unless-stopped.
frontend  ── Next.js. Depends on backend healthy. Restart unless-stopped.
```

Architecture rationale: the in-stack `db-init` service is what makes
the docker-local mode actually work. Without it, the backend would
boot against an empty Postgres and crash on every endpoint that
touches the DB. With it, the backend's compose `depends_on` clause
forces it to wait for a clean schema.

---

## Next steps

After the stack is up and you've validated the basic flow:

  - Set up your Firebase project + paste the admin SDK JSON in
    `.env.secrets` (`FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV=`)
  - Fill in observability secrets if you want Sentry / Grafana /
    LogRocket integration
  - For a multi-developer team: switch to external mode (Supabase),
    everyone shares the same DB, no migration drift

For production deployments (Cloud Run / GCP), see
[DEPLOYMENT.md](../DEPLOYMENT.md) — the docker-local stack is for
development and demos; the GCP provider is the production path.

---

## References

- [DEPLOYMENT.md](../DEPLOYMENT.md) — full deployment guide (all providers)
- `deploy/init.py` — interactive wizard source
- `deploy/providers/docker_local.py` — compose generator + commands
- `packages/backend/scripts/deploy/init_database.py` — schema bootstrap
- `deploy/config.example.yaml` — config template
- `deploy/.env.secrets.example` — secrets template
