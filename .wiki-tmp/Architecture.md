# Architecture

## Overview

Facil is a monorepo with a clear separation between backend, frontend, mobile, and infrastructure concerns. The system follows a layered architecture on the backend and a module-based architecture on the frontend.

```
                         +------------------+
                         |   Firebase CDN   |
                         |  (Static Assets) |
                         +--------+---------+
                                  |
                    +-------------+-------------+
                    |                           |
            +-------+-------+         +--------+--------+
            | Next.js 14    |         | Expo Mobile     |
            | (Web Frontend)|         | (Citizen App)   |
            +-------+-------+         +--------+--------+
                    |                           |
                    +-------------+-------------+
                                  |
                          +-------+-------+
                          |   Cloud Run   |
                          |   (FastAPI)   |
                          +-------+-------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
      +-------+-------+  +-------+-------+  +--------+-------+
      | PostgreSQL    |  | Upstash Redis |  | Vertex AI      |
      | (Supabase)    |  | (Cache/Queue) |  | (Gemini 2.0)   |
      +---------------+  +---------------+  +----------------+
```

## Backend Architecture (3-Tier Layered)

Each backend module follows a strict 3-tier pattern:

```
packages/backend/app/
  config.py                    # Pydantic Settings (env vars)
  main.py                      # FastAPI app entry, router registration
  database/connection.py       # asyncpg pool manager (db_manager)
  core/
    cache.py                   # HybridCache: Redis + in-memory fallback
    events.py                  # EventBus: in-process pub/sub
    errors.py                  # TranslatedException, i18n error codes
    secrets.py                 # Google Cloud Secret Manager
    scheduler.py               # Internal cron (replaces Cloud Scheduler)
    rbac_listener.py           # PostgreSQL NOTIFY -> Redis cache invalidation
    db_error_handler.py        # asyncpg error -> structured API response
  modules/
    {module_name}/
      api/
        {module}_routes.py     # FastAPI router (endpoints, validation)
      services/
        {module}_service.py    # Business logic (orchestration, rules)
      repositories/
        {module}_repository.py # Data access (asyncpg queries)
      models/
        {module}.py            # Pydantic models (request/response)
      handlers/                # Event handlers (optional)
```

### Layer Responsibilities

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| **API** (Routes) | HTTP handling, request validation, auth guards, response formatting | Services |
| **Service** | Business logic, workflow orchestration, cross-module coordination | Repositories |
| **Repository** | SQL queries (asyncpg), data mapping, connection management | Database |

### Key Design Patterns

- **Parameterized Queries**: All SQL uses `$1, $2` placeholders via asyncpg -- never string formatting
- **Connection Pool**: Centralized `db_manager` with `async with db_manager.get_connection() as conn`
- **Event-Driven**: `EventBus` for decoupled cross-module communication (notifications, assignments, audit)
- **Cache-First**: `HybridCache` tries Redis, falls back to in-memory `TTLCache`
- **Pessimistic Locking**: `SELECT ... FOR UPDATE` for payment and assignment operations
- **RBAC Guards**: `require_permissions("permission.name")` decorator on endpoints

### Startup Sequence

On application start (`lifespan`), the following systems initialize in order:

1. Database connection pool (asyncpg)
2. RBAC permissions sync (Python definitions -> DB)
3. Workflow sync (Python workflow classes -> DB tables)
4. EventBus + handler registration (notifications, audit, agent queue, payments)
5. Self-healing: repair orphaned PAID requests
6. Cache system (Upstash Redis)
7. RBAC cache listener (PostgreSQL NOTIFY)
8. Internal cron scheduler

## Frontend Architecture (Module-Based)

```
packages/web/src/
  app/[locale]/                # Next.js 14 App Router with i18n
    (auth)/                    # Auth route group (login, register, verify)
    (dashboard)/               # Protected dashboard (citizens + agents + admin)
    (public)/                  # Public pages (homepage, services catalog)
    (chat)/                    # AI chatbot
  components/
    ui/                        # Shadcn/UI base components
    layout/                    # Layout components (sidebar, header)
  modules/                     # 41 feature modules
    {module-name}/
      components/              # React components
      hooks/                   # React Query hooks (useQuery, useMutation)
      services/                # API client functions (Axios)
      types/                   # TypeScript interfaces
  core/
    api/client.ts              # Axios instance with interceptors (JWT, refresh)
  i18n/                        # Internationalization config
  messages/                    # Translation JSON files (es.json, fr.json, en.json)
```

### Frontend Patterns

- **React Query** for server state (caching, refetching, optimistic updates)
- **Zod** for form validation (schema-first)
- **Zustand** for client-side state (auth store, wizard store)
- **Axios interceptors** for automatic JWT refresh and error handling
- **next-intl** for i18n with 3 locales (es, fr, en)
- **Shadcn/UI** + Tailwind CSS for consistent design system

## Database Architecture

PostgreSQL hosted on Supabase with 145 tables across 10 domains.

```
+------------------+     +------------------+     +------------------+
| Core Business    |     | Declarations     |     | Service Requests |
| (14 tables)      |     | (12 tables)      |     | (8 tables)       |
+------------------+     +------------------+     +------------------+
| users            |     | tax_declarations |     | service_requests |
| fiscal_services  |     | declaration_*    |     | wizard_sessions  |
| companies        |     | workflow_*       |     | workflow_tariffs |
| ministries       |     | assignments      |     | predefined_*     |
| sectors          |     | calculation_*    |     | appointment_*    |
+------------------+     +------------------+     +------------------+

+------------------+     +------------------+     +------------------+
| Agents & Roles   |     | Payments         |     | Documents & OCR  |
| (7 tables)       |     | (10 tables)      |     | (5 tables)       |
+------------------+     +------------------+     +------------------+
| agent_profiles   |     | payments         |     | uploaded_files   |
| agent_workloads  |     | service_payments |     | document_*_queue |
| agent_work_queue |     | payment_plans    |     | ocr_extraction_* |
| agent_perf_stats |     | payment_receipts |     | form_templates   |
+------------------+     +------------------+     +------------------+

+------------------+     +------------------+     +------------------+
| Auth & RBAC      |     | Communications   |     | Translations     |
| (9 tables)       |     | (9 tables)       |     | (3 tables)       |
+------------------+     +------------------+     +------------------+
| sessions         |     | email_templates  |     | translations     |
| refresh_tokens   |     | sms_templates    |     | entity_trans.    |
| roles            |     | push_templates   |     | user_favorites   |
| permissions      |     | webhook_configs  |     |                  |
| role_permissions |     | webhook_logs     |     |                  |
+------------------+     +------------------+     +------------------+
```

See [[Database-Schema]] for the full 145-table reference.

## Cache Architecture (Upstash Redis)

```
app/core/cache.py  -->  HybridCache
                          |
                    +-----+------+
                    |            |
              Redis (primary)  TTLCache (fallback)
```

| Cache Instance | TTL | Purpose |
|---------------|-----|---------|
| Default | 5 min | General purpose |
| Menu | 5 min | Agent menu configurations |
| Permissions | 10 min | User RBAC permissions |
| Services | 1 hour | Fiscal services catalog |
| Translations | 1 hour | UI translation strings |

Cache invalidation is real-time via PostgreSQL `NOTIFY` -> RBAC listener -> Redis `DEL`.

## Event-Driven Architecture

```
Service Layer  --->  EventBus.publish(event)
                          |
                    +-----+-----+-----+-----+
                    |           |           |
              Notification  Audit Log  Agent Queue
              Handler       Handler    Handler
```

Event types include: `PAYMENT_COMPLETED`, `REQUEST_SUBMITTED`, `DECISION_MADE`, `ASSIGNMENT_CREATED`, and more.

## Mobile Architecture

Two Expo React Native apps:

| App | Package | Purpose |
|-----|---------|---------|
| **Facil** | `packages/mobile/` | Citizen-facing: service requests, payments, documents |
| **Facil Inspector** | `packages/inspector/` | Field agents: inspections, compliance verification |

Both use: Expo Router (file-based), React Query, Zustand, React Native Paper (MD3), Zod validation.
