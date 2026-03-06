# Plan: Supervisor Assignment & Rules Refactor

**Date**: 2026-03-06
**Status**: IN PROGRESS
**Scope**: Move manual assignment to supervisor, fix broken rules pages, visual builder

## Context

- Page assignation manuelle est sous `/admin/` — bug architectural, doit etre sous `/supervisor/`
- 3 pages rules frontend TOTALEMENT cassees — champs `rule_type`, `criteria`, `is_active` n'existent ni dans le backend Pydantic ni dans la BD
- BD: `assignment_rules` utilise `conditions` (JSONB), `actions` (JSONB), `status` (rule_status_enum: active/inactive/draft/archived)
- 0 regles en BD — systeme fonctionne en fallback load-balance pur
- UX creation regles inutilisable (JSON brut, pas de dropdowns)

## DB Schema Reference (assignment_rules)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | varchar | Rule name |
| description | text | Optional |
| entity_type | varchar | 'ministry' or 'entity' |
| entity_id | varchar | Optional (global if null) |
| conditions | JSONB | Matching conditions |
| actions | JSONB | Actions to execute |
| priority | int | 1-100 (higher = more important) |
| status | rule_status_enum | active/inactive/draft/archived |
| times_applied/matched/successful/failed | int | Stats |
| success_rate | numeric | Auto-calculated |
| created_by | UUID | FK users |

### Conditions format (from rules_engine.py)
```json
{
  "item_types": ["PASAPORTE_NUEVO", "PASAPORTE_RENOVACION"],
  "min_amount": 50000,
  "max_amount": 500000,
  "min_priority": 7
}
```

### Actions format (from rules_engine.py)
```json
{
  "selection_strategy": "load_balance|round_robin|specialization",
  "specializations": ["PASAPORTE_NUEVO"],
  "max_workload_pct": 80
}
```

## Phase 1: Move Manual Assignment to Supervisor
- [x] Move page from `/admin/assignments/new/manual/` to `/supervisor/assignments/manual/`
- [x] Remove admin link in `/admin/assignments/page.tsx`
- [x] Add link in supervisor assignments area
- [x] Update all internal links (back button, etc.)
- [x] Fix backend enum bug (IN_REVIEW -> UNDER_REVIEW already done)
- [x] Verify TypeScript compiles
- [ ] Verify page loads correctly (manual test)

## Phase 2: Fix Rules List Page (Align with BD) ✅
- [x] Replace `rule_type`/`criteria`/`is_active` with `conditions`/`actions`/`status`
- [x] Fix types import (AssignmentRule type aligned with backend)
- [x] Fix API param: `status` filter (string not boolean)
- [x] Show conditions/actions as readable badges instead of raw JSON
- [x] Show status badge (active/inactive/draft/archived)
- [x] Show entity_type/entity_id
- [x] Show stats (times_applied, success_rate)
- [x] Verify list page loads and displays data correctly (TypeScript OK)

## Phase 3: Fix Rules Create Page (Visual Builder) ✅
- [x] Remove fake `rule_type` field
- [x] Add `entity_type` dropdown (auto-filled from supervisor context)
- [x] Add `entity_id` dropdown (entities for selected type)
- [x] Build visual Conditions builder:
  - "Tipo de tramite" -> multi-select toggle badges from workflow_codes
  - "Monto minimo/maximo" -> number inputs
  - "Prioridad minima" -> number input 1-10
- [x] Build visual Actions builder:
  - "Estrategia de asignacion" -> select (load_balance/round_robin/specialization)
  - "Especializaciones requeridas" -> multi-select toggle badges
  - "Carga maxima agente" -> slider 10-100%
- [x] Keep JSON editor as advanced toggle
- [x] Form sends correct fields: conditions/actions/entity_type/entity_id/status
- [x] TypeScript compiles

## Phase 4: Fix Rules Edit Page ✅
- [x] Same alignment as Create page
- [x] Pre-fill visual builder from existing conditions/actions
- [x] Status dropdown (active/inactive/draft/archived)
- [x] Read-only stats display (times_applied, success_rate)
- [x] TypeScript compiles

## Phase 5: Entity Scoping + Preview + Quality Refactor ✅

### Original Phase 5 items
- [x] Auto-detect supervisor entity via useAgentProfile() → entity_code
- [x] Filter entities dropdown to supervisor's entity + child entities
- [x] Auto-fill entity on create page (with loop-safe guard)
- [x] Preview: uses server-side total count (not broken client-side amount/priority filter)
- [x] TypeScript type-check passes
- [x] ESLint passes (0 errors)

### Critical fixes from self-critique
- [x] **#2 CRITIQUE**: `entity_type` now read from backend `EntityResponse.entity_type` (was guessed from workflow_codes presence)
- [x] **#3 CRITIQUE**: Preview uses server-side `total` from assignable-items (amount/priority not in response — filter deferred to rules_engine at runtime)
- [x] **#5 MAJEUR**: Extracted `_shared.tsx` (hooks + components) — eliminated ~300 lines of duplication between new/edit
- [x] **#6 MAJEUR**: List page relies on backend entity scoping (confirmed: supervisor_routes.py L896-901 already filters by agent_context)
- [x] **#7 MAJEUR**: Pagination fully server-side (page/page_size params sent to backend, total from response)
- [x] **#8**: Edit handleSubmit uses `filteredEntities` (consistent with rest)
- [x] **#9 MAJEUR**: Full i18n via `useTranslations('supervisor.rules')` — 62 new keys added to es/fr/en
- [x] **#10 MAJEUR**: All API calls use `apiClient` (removed `fetchClient` usage)
- [x] **#11**: Separate `conditionsJsonError`/`actionsJsonError` states
- [x] **#12**: Preview card uses `bg-primary/5 border-primary/20` (dark-mode compatible)
- [x] **#13**: Edit page resets workflows on entity change (with guard to skip initial load)
- [x] **#14**: Auto-fill uses `entityAutoFilled` flag instead of `entityCode` in deps (no loop risk)
- [x] **Backend param fix**: Status filter sends `status_filter` (not `status`) — matches backend Query param name

### Files created/modified
- `rules/_shared.tsx` — NEW: shared hooks (useEntities, useSupervisorEntities, usePreviewCount) + components (ConditionsBuilder, ActionsBuilder, PreviewBanner) + build helpers
- `rules/page.tsx` — REWRITTEN: server-side pagination, i18n, correct status_filter param
- `rules/new/page.tsx` — REWRITTEN: uses _shared, i18n, proper entity_type, loop-safe auto-fill
- `rules/[id]/edit/page.tsx` — REWRITTEN: uses _shared, i18n, entity change reset guard
- `messages/es.json` — 62 new keys in supervisor.rules
- `messages/fr.json` — 63 new keys in supervisor.rules
- `messages/en.json` — 63 new keys in supervisor.rules

## Phase 6: Commit & Push
- [ ] Commit all changes
- [ ] Push to develop
- [ ] Verify GitHub Actions
