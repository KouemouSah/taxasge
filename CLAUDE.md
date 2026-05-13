# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Facil** is a government digital process services platform for Equatorial Guinea. It's a monorepo with:
- **Backend**: Python 3.11+ / FastAPI / PostgreSQL (Supabase) / asyncpg
- **Frontend**: Next.js 14 / React 18 / TypeScript / Tailwind CSS / Shadcn/UI
- **Deployment**: Google Cloud Run (backend) + Firebase Hosting (frontend)
- **AI**: Google Vertex AI (Gemini 2.0 Flash) + pgvector for RAG chatbot

## Critical Rules

1. **NEVER build manually with gcloud** - Always push to remote branch and let GitHub Actions handle builds
2. **Source of Truth Hierarchy**:
   - Database schema : interroge directement la base de données
   - Environment variables (`packages/backend/.env`)
   - Existing code patterns
   - Documentation
3. **Never guess, always verify** - Check schema before database operations, check .env before integrations
4. **Challenge suggestions** - Be critical, don't invent, avoid bias

## Build & Test Commands

### Backend (packages/backend/)
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/test_config.py -v

# Type checking
mypy app --strict

# Linting & formatting
flake8 app --max-line-length=100
black app --check
isort app --check

# Run development server (local only)
uvicorn app.main:app --reload
```

### Frontend (packages/web/)
```bash
# Install dependencies (from repo root)
npm install --legacy-peer-deps

# Type checking
npm run type-check

# Linting
npm run lint
npx eslint src --ext .ts,.tsx --max-warnings=100

# Build
npm run build

# Run development server
npm run dev

# Run tests
npm test
npm run test:e2e
```

### CI/CD via GitHub Actions
- **CI tests**: Push to `main`, `develop`, or `feature/**` branches
- **Backend deploy**: Push to `develop` with changes in `packages/backend/`
- **Frontend deploy**: Push to `develop` with changes in `packages/web/`

## Architecture

### Backend (3-Tier Layered)
```
packages/backend/app/
├── config.py              # Pydantic Settings
├── main.py                # FastAPI app entry
├── database/connection.py # asyncpg connection pool
├── core/secrets.py        # Google Cloud Secret Manager
└── modules/               # 31 feature modules (vérifié 2026-05-11 via Glob)
    └── {module}/
        ├── api/{module}_routes.py       # FastAPI router
        ├── models/{module}.py           # Pydantic models
        ├── repositories/{module}_repository.py  # Data access (asyncpg)
        └── services/{module}_service.py # Business logic
```

**Modules backend complets (31)** :
- **Core** : auth, users, permissions, communications, documents, shared (utilities)
- **Government services** : fiscal_services (850+), declarations (28 types), service_requests, assignment, payments, companies, menu_config, homepage, dashboards, support, chatbot (RAG Gemini), translations, cities, entity_locations
- **Treasury/Workflow** : treasury (reconciliation + analytics + anomaly detection), inspections (field collection lock ordering), agents (auto-assignment 5-criteria scoring), accountant, funcionario, admin (endpoints spécialisés par rôle)
- **Identity/Documents** : verified_identifiers, user_documents, webhooks, enrichment, batch_requests, legal

**API**: 31+ routers registered in `main.py` - See `Documentations/PROJECT_CONTEXT.md` for full list

### Redis Cache (Upstash)
```
app/core/cache.py         # HybridCache with Redis + in-memory fallback
```

**Configuration**: `REDIS_URL` in `.env` (Upstash TLS connection)

**Cache instances** (with TTL):
- `get_cache()` - Default cache (5 min)
- `get_menu_cache()` - Menu configurations (5 min)
- `get_permissions_cache()` - User permissions (10 min)
- `get_services_cache()` - Fiscal services catalog (1 hour)
- `get_translations_cache()` - Translations (1 hour)

**Usage patterns**:
```python
# Basic operations
from app.core.cache import get_cache, CacheKeys
cache = get_cache()
await cache.set("key", {"data": "value"}, ttl=300)
data = await cache.get("key")

# Rate limiting
from app.core.cache import check_rate_limit
is_allowed, remaining = await check_rate_limit("user_id", "/endpoint", 100, 60)

# Cache invalidation
from app.core.cache import invalidate_user_permissions_cache
await invalidate_user_permissions_cache(user_id)
```

### Frontend (Module-Based)
```
packages/web/src/
├── app/[locale]/          # Next.js App Router with i18n (es/fr/en)
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected dashboard
│   └── (public)/          # Public pages
├── components/ui/         # Shadcn/UI components
├── modules/               # 42 feature modules (vérifié 2026-05-11 via Glob)
│   └── {module}/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── core/api/client.ts     # Axios with interceptors
└── i18n/messages/         # Translations (es.json, fr.json, en.json)
```

**Modules frontend complets (42)** :
- **Auth & users** : auth, users, users-admin, user-permissions-admin
- **Citizen-facing** : dashboard, declarations, payments, service-requests, support, chatbot, fiscal-services, user-documents, entity-locations
- **Agent-facing** : agent-dashboard, agents, agents-admin, assignment, assignments-admin, service-requests-admin
- **Admin** : admin, audit-logs-admin, dashboards-admin, permissions, permissions-admin, roles-admin, communications, documents, webhooks, translations, cities, batch-requests, templates
- **Specialized roles** : accountant, funcionario, inspections (inspector tablet), oms (Operations Management System)
- **Treasury/Bundle** : treasury, bundle-workflow
- **Companies** : companies, verified-identifiers, enrichment
- **Public** : homepage

## Database (PostgreSQL/Supabase)

**77 tables**, **25 enums** - Full reference: `.github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md`
*Last extracted: 2025-12-24*

### Tables by Domain (77 total)

#### Core Business (14 tables)
| Table | Description |
|-------|-------------|
| `users` | User accounts with roles (citizen, business, accountant, admin, supervisor, dgi_agent, ministry_agent) |
| `fiscal_services` | 850+ fiscal services catalog |
| `tax_declarations` | Tax declarations (20 types GE-specific) |
| `companies` | Company management |
| `user_company_roles` | User roles within companies |
| `ministries` | Government ministries (Spanish in DB, FR/EN via translations) |
| `sectors` | Ministry sectors |
| `categories` | Service categories |
| `service_keywords` | Search keywords for services |
| `service_document_assignments` | Required documents per service |
| `service_procedure_assignments` | Procedures per service |
| `procedure_templates` | Procedure templates |
| `procedure_template_steps` | Steps within procedures |
| `document_templates` | Document templates with validity duration |

#### Declarations & Workflow (12 tables)
| Table | Description |
|-------|-------------|
| `declaration_iva_details` | IVA declarations (90% volume) |
| `declaration_irpf_data` | IRPF/Income tax data (5% volume) |
| `declaration_petroliferos_details` | Petroleum sector declarations (4% volume, large amounts) |
| `declaration_retencion_details` | Withholding tax declarations |
| `declaration_other_details` | Generic JSONB for 7 other types |
| `declaration_amount_adjustments` | Amount adjustment audit trail |
| `declaration_corrections` | Correction/amendment history |
| `workflow_transitions` | Workflow state transitions |
| `assignments` | Agent task assignments |
| `assignment_rules` | Auto-assignment rules |
| `adjustment_reasons` | Predefined adjustment reason catalog |
| `calculation_history` | Tax calculation history |

#### Agents & Workload (7 tables)
| Table | Description |
|-------|-------------|
| `ministry_agents` | Ministry agents with full workflow |
| `agent_workloads` | Real-time agent workload tracking |
| `agent_work_queue` | Dynamic priority queue (SLA, amount, complexity scoring) |
| `agent_performance_stats` | Monthly performance metrics |
| `user_ministry_assignments` | User-ministry mappings |
| `ministry_validation_config` | Ministry validation settings |
| `system_rules` | Dynamic business rules (no redeploy needed) |

#### Payments (10 tables)
| Table | Description |
|-------|-------------|
| `payments` | Central polymorphic payments table |
| `service_payments` | Payments with agent workflow (pessimistic locking) |
| `payment_plans` | Installment payment schedules |
| `payment_installments` | Individual installments |
| `payment_receipts` | Generated PDF receipts |
| `payment_lock_history` | Payment lock audit |
| `payment_validation_audit` | Validation audit trail |
| `bank_configurations` | Bank API/webhook configurations |
| `bank_transactions` | Bank webhook transactions |
| `fiscal_service_data` | Fiscal service payment data |

#### Documents & OCR (5 tables)
| Table | Description |
|-------|-------------|
| `uploaded_files` | File metadata (Supabase Storage) |
| `document_processing_queue` | Async OCR queue with retry/fallback |
| `ocr_extraction_results` | Raw OCR extraction (JSONB) |
| `form_templates` | OCR field coordinates (14 form types) |
| `import_batches` / `import_batch_items` | Excel bulk import tracking |

#### Authentication & RBAC (9 tables)
| Table | Description |
|-------|-------------|
| `sessions` | JWT sessions |
| `refresh_tokens` | Refresh tokens with revocation |
| `pending_registrations` | Email verification (15min expiry) |
| `roles` | Custom roles |
| `permissions` | Permission catalog (50+) |
| `role_permissions` | Role-permission mappings |
| `user_permissions` | Per-user permission overrides |
| `permission_audit_log` | Permission change history |
| `audit_logs` | System-wide audit trail |

#### Communications (9 tables) - NEW
| Table | Description |
|-------|-------------|
| `communication_provider_settings` | Provider configs (SMS, Email, Push, WhatsApp) |
| `email_templates` | Multilingual email templates |
| `sms_templates` | SMS templates (160 char segments) |
| `push_templates` | Mobile/web push templates |
| `notification_templates` | In-app notification templates |
| `ussd_configurations` | USSD menu configs (Getesa, Muni) |
| `webhook_configurations` | WhatsApp Business API webhooks |
| `webhook_logs` | Webhook execution audit |

#### Support (4 tables) - NEW
| Table | Description |
|-------|-------------|
| `support_tickets` | User/agent support tickets |
| `support_messages` | Ticket messages |
| `support_attachments` | Message attachments |
| `support_categories` | Multilingual ticket categories |

#### Translations (3 tables)
| Table | Description |
|-------|-------------|
| `translations` | Unified translations (ENUMs, UI, Forms, System messages) |
| `entity_translations` | Optimized entity translations (40% storage reduction) |
| `user_favorites` | User service favorites |

### Key Enums (25 total)
| Enum | Values |
|------|--------|
| `user_role_enum` | citizen, business, accountant, admin, supervisor, dgi_agent, ministry_agent |
| `user_status_enum` | active, suspended, pending_verification, deactivated |
| `declaration_status_enum` | draft, submitted, processing, accepted, rejected, amended |
| `declaration_type_enum` | 34 types: income_tax, corporate_tax, vat_declaration, iva_destajo, iva_real, retencion_*, imp_*, cuota_min_*, impreso_* |
| `payment_status_enum` | pending, processing, completed, failed, refunded, cancelled |
| `payment_method_enum` | bank_transfer, card, mobile_money, cash, bange_wallet |
| `payment_type_enum` | full, partial, installment, complementary |
| `payment_workflow_status` | 17 states: submitted → auto_processing → pending_agent_review → locked_by_agent → approved/rejected → completed |
| `agent_action_type` | lock_for_review, approve, reject, request_documents, escalate, unlock_release, assign_to_colleague |
| `agent_availability_enum` | available, on_leave, sick_leave, training, mission, temporarily_unavailable |
| `workload_status_enum` | available, normal, busy, overloaded, unavailable |
| `assignment_status_enum` | assigned, in_progress, pending_review, completed, reassigned, cancelled, rejected |
| `escalation_level` | low, medium, high, critical |
| `communication_provider_type` | sms, email, push, whatsapp |
| `company_role_enum` | company_owner, company_admin, company_accountant, company_member |
| `service_status_enum` | active, inactive, draft, deprecated |
| `service_type_enum` | document_processing, license_permit, residence_permit, registration_fee, inspection_fee, administrative_tax, customs_duty, declaration_tax |
| `calculation_method_enum` | fixed_expedition, fixed_renewal, percentage_based, unit_based, tiered_rates, formula_based, fixed_plus_unit |

### Naming Conventions
- Tables: `snake_case` plural (users, fiscal_services)
- Columns: `snake_case` (full_name, created_at)
- Foreign keys: `{table}_id`
- Timestamps: `created_at`, `updated_at`
- Soft deletes: `deleted_at`

## Key Patterns

### Backend - Parameterized Queries (asyncpg)
```python
# Always use $1, $2 placeholders - NEVER string formatting
query = "SELECT * FROM users WHERE email = $1"
row = await db.fetchrow(query, email)
```

### Frontend - React Query + Zod
```typescript
// API calls with TanStack Query
const { data } = useQuery({
  queryKey: ['fiscal-services'],
  queryFn: fetchFiscalServices,
  staleTime: 5 * 60 * 1000,
});

// Form validation with Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Lock Ordering — Bundle / Field Payment (100+ concurrent agents)

For any transaction touching commercial licences AND field payments,
follow this canonical lock order to prevent deadlocks:

1. **`commercial_licenses`** — `SELECT ... FOR UPDATE` (the only explicit lock — root)
2. **`service_requests`** — `INSERT` only (optimistic via partial UNIQUE index `idx_sr_commercial_license_unique`, no `FOR UPDATE`)
3. **`license_obligations`** — `UPDATE` batch (locks acquired automatically by the update)
4. **`service_payments`** — `INSERT` final

**Always** set transaction-scoped timeouts at the start:
```sql
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '5s';
```

**Never** take `FOR UPDATE` on `service_requests` — concurrency is handled by
the partial unique index `idx_sr_commercial_license_unique` (migration 291)
plus `try/except asyncpg.UniqueViolationError` recovery (deterministic SELECT
by `commercial_license_id`, no retry/backoff).

Canonical implementation: `app/modules/inspections/services/collection_service.py::CollectionService.collect_field_payment`.
Plan reference: `.claude/plans/INSPECTION_BUNDLE_P1_DETAIL.md`.

## Authentication

- JWT tokens (access: 30min, refresh: 30 days)
- 2FA via TOTP (pyotp)
- RBAC with 50+ permissions
- Password hashing: bcrypt (12 rounds)

## Key Documentation

- Architecture: `Documentations/code-analysis.md`
- Project context: `Documentations/PROJECT_CONTEXT.md`
- Database schema: `.github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md`
- API docs: `/docs` endpoint (Swagger UI)

## Active Implementation Plans

| Plan | Status | Description |
|------|--------|-------------|
| `.claude/plans/HISTORY_PAGE_IMPLEMENTATION_PLAN.md` | ✅ COMPLETED | Page Historial pour agents CNEDOGE - Timeline des actions sur demandes |
| `.claude/plans/DYNAMIC_MENU_ADMIN_UI_IMPROVEMENT.md` | Phase 1 | Amélioration Admin UI - Gestion dynamique des menus |

## Menu Architecture (Agent Dashboards)

### Deux modes de génération de menu
1. **Workflow-based** (auto): `roles.menu_config = NULL` → généré depuis `entities.workflow_codes` + `workflow_menu_mapping`
2. **Module-based** (manuel): `roles.menu_config = JSON` → configuration explicite

### Tables clés
| Table | Usage |
|-------|-------|
| `workflow_menu_mapping` | Règles: pattern workflow → structure menu (icône, sous-menus) |
| `roles.menu_config` | JSONB - Config explicite si non-NULL |
| `roles.dashboard_config` | JSONB - Config widgets dashboard |
| `entities.workflow_codes` | Array des workflows gérés par l'entité |
| `agent_profiles.menu_overrides` | JSONB - Overrides par agent |

### Pages Admin existantes
- `/admin/menu-config` - Gestion workflow_menu_mapping
- `/admin/roles/[id]/menu-config` - Config JSON par rôle (à améliorer)
- `/admin/entities` - CRUD entités + workflow_codes

### Endpoints API
- `GET /menu-config/me` - Menu de l'agent connecté
- `GET/POST/PUT/DELETE /menu-config/workflow-mappings` - CRUD mappings
- `GET/PUT /roles/{id}/menu-config` - Config menu du rôle

## Implementation Patterns (IMPORTANT)

### Avant toute implémentation, TOUJOURS vérifier:
1. **Endpoints**: Tester avec curl que l'endpoint existe et retourne le bon format
2. **Tables/Colonnes**: Vérifier schema avec `information_schema.columns`
3. **Fichiers Frontend**: Confirmer existence avec `ls` ou `Glob`
4. **Types TypeScript**: Vérifier exports dans les fichiers types
5. **Permissions**: Vérifier existence dans table `permissions`

### Pattern de vérification SQL
```sql
-- Table existe?
SELECT table_name FROM information_schema.tables WHERE table_name = 'TABLE';
-- Colonnes?
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TABLE';
-- Permission existe?
SELECT name FROM permissions WHERE name = 'permission.name';
```

## Git Commit Convention
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Example: feat(auth): Add two-factor authentication support
```
