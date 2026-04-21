# Facil - Government Digital Services Platform

**Facil** is the digital government services platform for Equatorial Guinea, enabling citizens, businesses, and government agents to process administrative procedures online.

## Platform at a Glance

| Metric | Value |
|--------|-------|
| Fiscal Services | 873+ catalogued services |
| Database Tables | 145 tables across 10 domains |
| Workflows | 36 predefined workflows |
| Roles | 47 configurable roles |
| Permissions | 335 granular permissions |
| Government Entities | 20 processing entities |
| Languages | 3 (Spanish, French, English) |
| Backend Modules | 30 feature modules |
| Frontend Modules | 41 feature modules |
| API Routers | 50+ registered routers |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+ / FastAPI / asyncpg |
| Database | PostgreSQL (Supabase) + pgvector |
| Frontend | Next.js 14 / React 18 / TypeScript / Tailwind CSS / Shadcn/UI |
| Mobile (Citizen) | Expo SDK 54 / React Native / Expo Router |
| Mobile (Inspector) | Expo SDK 54 / React Native (separate app) |
| Cache | Upstash Redis (TLS) + in-memory fallback |
| AI | Google Vertex AI (Gemini 2.0 Flash) + RAG |
| Deployment | Google Cloud Run (backend) + Firebase Hosting (frontend) |
| CI/CD | GitHub Actions (6 workflows) |

## Wiki Pages

- [[Architecture]] -- System architecture, backend 3-tier, frontend module-based, database design
- [[API-Reference]] -- All API routers, authentication flow, key endpoints
- [[Database-Schema]] -- 145 tables grouped by domain, key enums, naming conventions
- [[Module-Catalog]] -- All 30 backend modules and 41 frontend modules
- [[Workflow-Reference]] -- 36 workflows, state machine, wizard steps, fee calculation
- [[Deployment-Guide]] -- Cloud Run deployment, GitHub Actions CI/CD, branch strategy
- [[Security]] -- OWASP compliance, JWT + 2FA, RBAC, rate limiting, audit logging
- [[i18n-Guide]] -- Trilingual support, translation files, sync scripts

## Quick Start

### Backend (Local Development)

```bash
cd packages/backend
pip install -r requirements.txt
cp .env.example .env  # Configure database URL, Redis, secrets
uvicorn app.main:app --reload
```

### Frontend (Local Development)

```bash
cd packages/web
npm install --legacy-peer-deps
npm run dev
```

### Mobile (Expo)

```bash
cd packages/mobile
npx expo start
```

## Key URLs

| Environment | URL |
|------------|-----|
| Staging Backend | `https://taxasge-backend-staging-392159428433.us-central1.run.app` |
| Staging API Docs (Swagger) | `https://taxasge-backend-staging-392159428433.us-central1.run.app/docs` |
| Frontend (Dev) | `https://taxasge-dev.web.app` |
| Frontend (Prod) | `https://taxasge.emacsah.com` |

## Repository Structure

```
taxasge/
  packages/
    backend/            # FastAPI Python backend
      app/
        modules/        # 30 feature modules (3-tier: api/services/repositories)
        core/           # Shared: cache, events, scheduler, errors, secrets
        database/       # asyncpg connection pool manager
    web/                # Next.js 14 frontend
      src/
        app/[locale]/   # App Router with i18n (es/fr/en)
        modules/        # 41 feature modules
        components/ui/  # Shared Shadcn/UI components
    mobile/             # Expo React Native citizen app ("Facil")
    inspector/          # Expo React Native inspector app ("Facil Inspector")
  migrations/           # PostgreSQL migration scripts (300+)
  scripts/              # Utility and maintenance scripts
  .github/
    workflows/          # 6 CI/CD GitHub Actions workflows
    docs-internal/      # Database schema reference
  Documentations/       # Project context and analysis docs
```

## Contributing

1. Create a feature branch from `develop`: `git checkout -b feature/my-feature`
2. Implement changes following module patterns (see [[Architecture]])
3. Ensure linting passes: `npm run lint` (frontend), `flake8 app` (backend)
4. Push to remote -- GitHub Actions runs CI automatically
5. Create a PR targeting `develop`
6. **Never build manually with `gcloud`** -- CI/CD handles all deployments
