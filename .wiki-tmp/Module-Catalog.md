# Module Catalog

## Overview

Facil is organized into independent feature modules on both backend and frontend. Each module encapsulates its own API routes, business logic, data access, and UI components.

## Backend Modules (30)

Located in `packages/backend/app/modules/`

### Identity & Access

| Module | Directory | Description |
|--------|-----------|-------------|
| **auth** | `auth/` | Authentication (login, register, email verification, password reset, JWT, 2FA TOTP) |
| **users** | `users/` | User profile management (self-service CRUD, avatar, preferences) |
| **permissions** | `permissions/` | RBAC system: 335 permissions, 47 roles, role-permission mapping, per-user overrides |

### Core Business

| Module | Directory | Description |
|--------|-----------|-------------|
| **fiscal_services** | `fiscal_services/` | 873+ services catalog, categories, search, bundles, config rules, templates, OMS |
| **service_requests** | `service_requests/` | Workflow engine: 36 workflows, wizard sessions, appointments, agent queue, cron jobs |
| **declarations** | `declarations/` | Tax declarations: 28 types (IVA, IRPF, petroleum, withholding), batch operations |
| **companies** | `companies/` | Company management, classification, dashboard, ministry integration, public directory |
| **payments** | `payments/` | BANGE integration (mobile money, card, bank transfer), receipts, installment plans |

### Agent Operations

| Module | Directory | Description |
|--------|-----------|-------------|
| **agents** | `agents/` | Agent profiles, unified analyst (AI-powered), availability management |
| **assignment** | `assignment/` | Task assignments, auto-assignment rules, supervisor dashboard, statistics/analytics |
| **inspections** | `inspections/` | Field inspections: 44 endpoints, missions, analytics, filters/export, collection |
| **treasury** | `treasury/` | Treasury agent operations, payment validation, bundle receipt generation |

### Documents & Verification

| Module | Directory | Description |
|--------|-----------|-------------|
| **documents** | `documents/` | Document upload, OCR extraction (Gemini), validation (70+ schema rules), risk analysis |
| **user_documents** | `user_documents/` | Document vault ("Mes Documents"), AI classification, expiry alerts |
| **funcionario** | `funcionario/` | Civil servant identity verification |
| **verified_identifiers** | `verified_identifiers/` | External document verification (cross-reference with government databases) |

### Communications

| Module | Directory | Description |
|--------|-----------|-------------|
| **communications** | `communications/` | Email (SMTP/Gmail), SMS, Push notifications, WhatsApp, email/push templates |
| **chatbot** | `chatbot/` | AI assistant: Gemini 2.0 Flash, RAG with pgvector, conversation management |
| **support** | `support/` | Support ticketing: tickets, messages, attachments, categories |

### Translations & i18n

| Module | Directory | Description |
|--------|-----------|-------------|
| **translations** | `translations/` | Unified translations (ENUMs, UI, Forms, Messages), entity translations, enum management, frontend JSON sync |

### Administration

| Module | Directory | Description |
|--------|-----------|-------------|
| **admin** | `admin/` | System diagnostics, migrations, user management (CRUD), monitoring, audit logs |
| **menu_config** | `menu_config/` | Dynamic agent menu configuration: workflow-based (auto) and module-based (manual) |

### Infrastructure

| Module | Directory | Description |
|--------|-----------|-------------|
| **webhooks** | `webhooks/` | BANGE payment callbacks, reconciliation |
| **homepage** | `homepage/` | Homepage statistics, category directory, featured services |
| **enrichment** | `enrichment/` | Gemini auto-enrichment of fiscal service descriptions (600 chars, 3 paragraphs) |
| **batch_requests** | `batch_requests/` | Bulk submission of N service requests at once |
| **entity_locations** | `entity_locations/` | Entity office locations per city |
| **cities** | `cities/` | Cities and entities reference data |
| **accountant** | `accountant/` | Accountant deadline tracking across client companies |
| **shared** | `shared/` | Shared utilities, base classes, common patterns |

---

## Frontend Modules (41)

Located in `packages/web/src/modules/`

### Identity & Access

| Module | Directory | Description |
|--------|-----------|-------------|
| **auth** | `auth/` | Login, register, forgot password, reset password, email verification, 2FA |
| **users** | `users/` | User profile view and edit |

### Citizen Dashboard

| Module | Directory | Description |
|--------|-----------|-------------|
| **dashboard** | `dashboard/` | Citizen dashboard: stats, recent requests, notifications, quick actions |
| **service-requests** | `service-requests/` | Citizen service request wizard, list, detail, payment flow |
| **payments** | `payments/` | Payment pages, BANGE integration, receipt download |
| **documents** | `documents/` | Document upload, OCR results, validation status |
| **user-documents** | `user-documents/` | Document vault ("Mes Documents") |
| **companies** | `companies/` | Company management, employee roles, declarations |
| **chatbot** | `chatbot/` | AI chat interface |
| **support** | `support/` | Support ticket creation and tracking |
| **fiscal-services** | `fiscal-services/` | Services catalog browser, search, categories |
| **homepage** | `homepage/` | Public homepage, statistics, service directory |

### Agent Dashboards

| Module | Directory | Description |
|--------|-----------|-------------|
| **agent-dashboard** | `agent-dashboard/` | Generic agent dashboard: queue, stats, decisions |
| **agents** | `agents/` | Agent profile, availability, workload view |
| **assignment** | `assignment/` | Agent task assignment views |
| **bundle-workflow** | `bundle-workflow/` | OMS bundle payment processing (multi-entity) |
| **inspections** | `inspections/` | Field inspection management UI |
| **oms** | `oms/` | OMS (commercial license) agent views |
| **treasury** | `treasury/` | Treasury agent payment validation |
| **funcionario** | `funcionario/` | Civil servant verification UI |
| **verified-identifiers** | `verified-identifiers/` | External document verification UI |

### Admin Panels

| Module | Directory | Description |
|--------|-----------|-------------|
| **admin** | `admin/` | Admin dashboard, system settings |
| **agents-admin** | `agents-admin/` | Agent management: create, edit, assign entity |
| **assignments-admin** | `assignments-admin/` | Assignment rules, auto-assignment config |
| **audit-logs-admin** | `audit-logs-admin/` | Audit log viewer and search |
| **permissions-admin** | `permissions-admin/` | Permission catalog management |
| **roles-admin** | `roles-admin/` | Role CRUD, menu config, dashboard config |
| **service-requests-admin** | `service-requests-admin/` | Workflow admin, request oversight |
| **users-admin** | `users-admin/` | User management: search, edit, suspend |
| **user-permissions-admin** | `user-permissions-admin/` | Per-user permission overrides |

### Shared / Infrastructure

| Module | Directory | Description |
|--------|-----------|-------------|
| **translations** | `translations/` | Translation management UI, JSON sync |
| **communications** | `communications/` | Email/SMS/Push template management |
| **enrichment** | `enrichment/` | AI enrichment dashboard |
| **entity-locations** | `entity-locations/` | Entity location management |
| **cities** | `cities/` | City reference data management |
| **webhooks** | `webhooks/` | Webhook configuration and logs |
| **accountant** | `accountant/` | Accountant dashboard, deadline tracking |
| **batch-requests** | `batch-requests/` | Bulk request submission UI |
| **declarations** | `declarations/` | Tax declaration forms and list |
| **templates** | `templates/` | Document/procedure template management |

---

## Module Structure Pattern

### Backend Module

```
modules/{name}/
  __init__.py
  api/
    __init__.py
    {name}_routes.py         # FastAPI router
  services/
    {name}_service.py        # Business logic
  repositories/
    {name}_repository.py     # asyncpg queries
  models/
    {name}.py                # Pydantic models
  handlers/                  # Event handlers (optional)
    {name}_handler.py
```

### Frontend Module

```
modules/{name}/
  components/
    {ComponentName}.tsx      # React components
  hooks/
    use{Name}.ts             # React Query hooks
  services/
    {name}Api.ts             # Axios API client
  types/
    index.ts                 # TypeScript interfaces
```
