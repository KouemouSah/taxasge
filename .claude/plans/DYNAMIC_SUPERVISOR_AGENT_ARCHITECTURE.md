# Dynamic Supervisor Agent Architecture

**Status**: Phase 0 ANALYSIS COMPLETE — Ready for implementation
**Date**: 2026-03-05
**Priority**: High — foundational for multi-entity agent scalability
**Depends on**: Level 3 NLP (P1-P5 COMPLETE), AgentChatUI (COMPLETE)

---

## Problem Statement

Currently 2 hardcoded singleton agents (TreasuryAnalystService, AdminAssistantService) with:
- Fixed function sets (17 + 11) in Python classes
- Fixed system prompts
- 1:1 route-to-class mapping (`/treasury/analyst/ask`, `/admin/assistant`)
- No support for entity supervisors (CNEDOGE_PASAPORTE, DGT, MINFP, etc.)
- **SECURITY GAP**: 7/17 Treasury functions lack site scoping (satellite agents see all sites data)

12 entities exist, 5 with agents. Each entity supervisor needs an LLM assistant to manage their workflows, agents, SLA, and request pipeline — but creating N separate service classes is unmaintainable.

## Architecture Decision

**Single DynamicAnalystService + ToolRegistry pattern.**

- Treasury 17 functions: UNCHANGED functionally (5 get site-scoping fix in Phase 0.5)
- Admin 11 functions: UNCHANGED (moved to registry entry)
- Supervisor 8 functions: NEW (service_requests + agent_profiles scoped by entity+site)
- IntentCategory ML: KEPT for treasury/admin, SKIPPED for supervisor (Gemini routes natively)
- BaseAnalystService.process_question(): UNCHANGED
- 1 unified endpoint: `POST /agents/analyst/ask`
- Frontend: AgentChatUI with dynamic AgentChatConfig per entity
- **Future-proof**: ToolRegistry supports orchestrator agent (agent-of-agents pattern)

---

## Entity Landscape (from DB 2026-03-05)

| Entity | Workflows | Agents | Supervisors | Sites |
|--------|-----------|--------|-------------|-------|
| CNEDOGE_PASAPORTE | 5 (pasaporte) | 1 | 0 | 2 (MOSTOLES Malabo, Ngolo Bata) |
| CNEDOGE_RESIDENCIA | 2 (residencia) | 1 | 0 | 1 (MOSTOLES Malabo) |
| DGT | 5 (conducir) | 1 | 0 | 2 (MALABO II, BOME Bata) |
| TESORO | 0 (cross-cutting) | 2 | 1 | 3 (MALABO II*, TGE BATA, TGE OYALA) |
| CNEDOGE | 2 (residencia) | 0 | 0 | 1 |
| EXTRANJERIA | 2 (residencia) | 0 | 0 | 1 |
| POLICIA | 4 (visados) | 0 | 0 | 2 |
| MINFP | 5 (funcion publica) | 0 | 0 | 1 |
| OFIVE | 6 (vehiculos) | 0 | 0 | 2 |
| ONRC | 7 (contratos) | 0 | 0 | 1 |
| ITV | 1 (renovacion ITV) | 0 | 0 | 1 |
| COMISARIA | 0 | 0 | 0 | 1 |

*is_main_office = true

---

## Architecture Diagram

```
POST /agents/analyst/ask
  |
  v
resolve_agent_type(user_id)
  |--- agent_profiles.entity_id -> entities.code
  |--- agent_profiles.is_supervisor
  |--- agent_profiles.entity_location_id -> entity_locations.is_main_office
  |--- roles.permissions
  |
  v
+--------------------------------------------------+
| agent_type resolution:                            |
|   TESORO + treasury_stat.view -> "treasury"       |
|   admin role + agent.view    -> "admin"           |
|   Any entity with workflows  -> "supervisor"      |
+--------------------------------------------------+
  |
  v
ToolRegistry.get(agent_type)
  |
  +--> "treasury":    { 17 functions, treasury prompt, artifacts builder, max_rounds=3 }
  +--> "admin":       { 11 functions, admin prompt, no artifacts, max_rounds=2 }
  +--> "supervisor":  { 8 functions, dynamic prompt template, artifacts, max_rounds=2 }
  |
  v
DynamicAnalystService(agent_type, entity_context)
  |--- _get_function_declarations() -> from registry
  |--- _get_function_map()          -> from registry
  |--- _get_system_prompt()         -> from registry (template.format() for supervisor)
  |--- _get_agent_type()            -> agent_type string
  |
  v
BaseAnalystService.process_question()  <- UNCHANGED
  |--- NLP slot extraction (regex, universal)
  |--- ML intent classification (treasury/admin ONLY, skipped for supervisor)
  |--- Few-shot retrieval (pgvector, per agent_type)
  |--- Conversation memory (per session_id)
  |--- Gemini multi-round function calling
  |--- Fire-and-forget logging + embedding
```

### Future: Orchestrator Agent (agent-of-agents)

```
ToolRegistry["orchestrator"] = {
    "functions": {
        "ask_treasury":   -> delegates to DynamicAnalystService("treasury")
        "ask_admin":      -> delegates to DynamicAnalystService("admin")
        "ask_supervisor": -> delegates to DynamicAnalystService("supervisor", entity_code=X)
    }
    3 meta-functions, not 36 — Gemini routes to the right sub-agent
}
```
This is a future phase. The ToolRegistry supports it without modification.

---

## Security Scoping Model

### Principle: entity_code + entity_location_id ALWAYS

```
is_main_office = true  -> sees ALL data for their entity (global view)
is_main_office = false -> sees ONLY data from their site (satellite scope)
```

This applies to ALL 3 pools (treasury, admin, supervisor).

### Treasury Site Scoping Audit (2026-03-05)

| Function | Current Scope | Fix Needed? |
|----------|--------------|-------------|
| get_revenue_summary | entity + site | NO |
| get_revenue_by_service | entity + site | NO |
| get_agent_performance | entity + site | NO |
| get_payment_trends | entity + site | NO |
| get_top_payers | entity + site | NO |
| get_entity_comparison | entity + site | NO |
| get_period_comparison | entity + site | NO |
| get_cash_flow_daily | entity + site | NO |
| get_rejection_analysis | entity + site | NO |
| get_revenue_forecast | entity + site | NO |
| **get_sla_status** | **GLOBAL** | **YES — Phase 0.5** |
| **get_payment_aging** | **GLOBAL** | **YES — Phase 0.5** |
| **get_workflow_pipeline** | **GLOBAL** | **YES — Phase 0.5** |
| **get_anomaly_summary** | **GLOBAL** | **YES — Phase 0.5** |
| **get_anomaly_details** | **GLOBAL** | **YES — Phase 0.5** |
| get_reconciliation_status | GLOBAL (intentional) | NO — bank reconciliation is centralized |
| **get_workload_forecast** | **GLOBAL** | **YES — Phase 0.5** |

**6 functions to fix** (get_reconciliation_status is intentionally global).

### Supervisor Site Scoping

All 8 supervisor functions will scope by entity_code from day 1.
For multi-site entities (CNEDOGE_PASAPORTE has 2 sites), the same model applies:
- is_main_office supervisor -> all sites data
- satellite supervisor -> their site only (via entity_location_id on service_requests)

`service_requests` HAS `entity_location_id` column -> direct filter, no subselect needed.

---

## Tool Pools

### Pool 1: Treasury (17 functions — UNCHANGED functionally)

Source: `treasury_analyst_service.py` lines 1053-1074
Tables: `service_payments`, `payments`, `bank_transactions`, `agent_performance_stats`
Scope: entity_code + entity_location_id (10 already scoped, 6 fixed in Phase 0.5, 1 intentionally global)

| Function | Description | Site Scope |
|----------|-------------|-----------|
| get_revenue_summary | Revenue totals by period | entity+site |
| get_revenue_by_service | Revenue breakdown by fiscal service | entity+site |
| get_cash_flow_daily | Daily cash flow chart data | entity+site |
| get_reconciliation_status | Bank reconciliation health | GLOBAL (intentional) |
| get_payment_aging | Payment aging buckets | entity+site (Phase 0.5) |
| get_top_payers | Top contributing taxpayers | entity+site |
| get_payment_trends | Payment volume trends | entity+site |
| get_period_comparison | Period-over-period comparison | entity+site |
| get_entity_comparison | Cross-entity revenue comparison | entity+site |
| get_agent_performance | Treasury agent performance | entity+site |
| get_sla_status | Payment SLA compliance | entity+site (Phase 0.5) |
| get_anomaly_summary | Payment anomaly overview | entity+site (Phase 0.5) |
| get_anomaly_details | Anomaly drill-down | entity+site (Phase 0.5) |
| get_rejection_analysis | Payment rejection analysis | entity+site |
| get_workflow_pipeline | Payment workflow funnel | entity+site (Phase 0.5) |
| get_revenue_forecast | ML revenue forecast | entity+site |
| get_workload_forecast | Workload prediction | entity+site (Phase 0.5) |

### Pool 2: Admin (11 functions — UNCHANGED)

Source: `admin_assistant_service.py` lines 823-835
Tables: `agent_profiles`, `agent_workloads`, `agent_performance_stats`, `assignments`
Scope: GLOBAL (cross-entity) — intentional for admin role

| Function | Description |
|----------|-------------|
| get_agent_availability_snapshot | All agents status across entities |
| get_alerts_summary | Cross-entity alerts |
| get_agent_summary | Single agent detail by name |
| compare_entity_agents | Compare 2 entities |
| get_workload_distribution | Workload across entities |
| get_inactive_agents | Inactive agent detection |
| get_sla_report | SLA across all entities |
| analyze_performance_ranking | Agent ranking by metric |
| detect_anomalies | Workload/SLA anomalies |
| analyze_entity_balance | Inter-entity balance |
| get_processing_trends | Request processing trends |

### Pool 3: Supervisor Core (8 functions — NEW)

Source: NEW file `supervisor_tools.py`
Tables: `service_requests`, `agent_profiles`, `agent_workloads`, `agent_performance_stats`
Scope: entity_code + entity_location_id (site-scoped from day 1)

| Function | SQL Source | Description |
|----------|-----------|-------------|
| get_request_stats | service_requests GROUP BY status, workflow_code | Counts by status + workflow for entity (default 30 days) |
| get_request_pipeline | service_requests GROUP BY status ORDER | Funnel: submitted -> processing -> validated -> completed |
| get_request_sla | service_requests + timestamps | Avg processing time, requests >48h, >5 days, >15 days |
| get_request_rejections | service_requests WHERE status='REJECTED' | Rejection rate by workflow, top rejection_reason |
| get_request_trends | service_requests GROUP BY date_trunc | Daily/weekly submission + completion volumes |
| get_entity_agents | agent_profiles x agent_workloads WHERE entity | Agent list with availability, capacity, current load |
| get_agent_ranking | agent_performance_stats WHERE entity | Agent ranking: avg processing time, volume, rejection rate |
| get_pending_detail | service_requests WHERE status IN (pending) | Detailed pending list: reference, workflow, citizen, age |

---

## Prompt Templates

### Supervisor Dynamic Prompt (NEW)

```
Eres el asistente IA del supervisor de {entity_name}.
Sitio: {site_name} ({city}).

Workflows gestionados por esta entidad:
{workflow_list}

Agentes activos: {agent_count} | Disponibles: {available_count}

Tu rol es analizar las solicitudes de servicio, el rendimiento de los agentes,
los tiempos de procesamiento (SLA) y el pipeline de workflows para esta entidad.

REGLAS:
- NUNCA inventes datos. Solo usa las funciones proporcionadas.
- Responde SIEMPRE en espanol.
- Si no hay datos suficientes, dilo explicitamente.
- Todos los montos en XAF (Franco CFA).
- Fecha actual: {current_date} ({day_of_week}).
```

### Treasury Prompt — UNCHANGED
### Admin Prompt — UNCHANGED

---

## NLP Behavior per agent_type

| Feature | treasury | admin | supervisor |
|---------|----------|-------|------------|
| Slot extraction (regex) | YES | YES | YES |
| IntentCategory ML | YES (11 intents) | YES (11 intents) | NO (skipped) |
| Conversation memory | YES | YES | YES |
| Few-shot pgvector | YES (agent_type="treasury") | YES (agent_type="admin") | YES (agent_type="supervisor") |
| Few-shot TF-IDF fallback | YES | YES | YES |
| Enriched prompt | YES (intent + slots) | YES (intent + slots) | YES (slots only, no intent) |

**Rationale for keeping ML intent on treasury/admin:**
1. Already built and tested (444 seeds, 11 intents, ~0.3ms/query)
2. ConversationMemory uses `slots.confidence` for slot inheritance threshold
3. `agent_query_logs.detected_intent` + `intent_probabilities` feed the retrain cron (Phase 3 NLP)
4. Zero downside: existing code, negligible cost, improves enriched prompt

**Rationale for skipping ML intent on supervisor:**
1. The 11 IntentCategory values are treasury/admin-specific (REVENUE, RECONCILIATION, etc.)
2. Gemini with ToolConfig mode=ANY routes correctly among 8 supervisor functions
3. Building per-entity seed datasets = high effort, low marginal value
4. Supervisor accumulates its own few-shot examples via agent_query_logs naturally

---

## Implementation Phases

### Phase 0.5: Treasury Site Scoping Fix [SECURITY — PREREQUISITE]

**Goal**: Fix 6 Treasury functions missing site scoping. Satellite agents must see ONLY their site data.

**Files:**
- `packages/backend/app/modules/service_requests/services/treasury_analyst_service.py` — UPDATE
  - `get_sla_status` — add `_site_scope_validated(kwargs, "service_payments", 0)` for pending payments
  - `get_payment_aging` — add `_site_scope_validated(kwargs, "service_payments", 0)` for pending aging
  - `get_workflow_pipeline` — add `_site_scope_validated(kwargs, "service_payments", 0)` for pipeline
  - `get_anomaly_summary` — scope via service_payment_id -> validated_by_agent_id
  - `get_anomaly_details` — same pattern as anomaly_summary
  - `get_workload_forecast` — add site scope for historical volume query

**Scoping pattern for pending payments** (no validated_by_agent_id yet):
```python
# Pending payments: use assigned_agent_id for site scoping
# (the TESORO agent reviewing = the one at that site)
def _site_scope_pending(kwargs, sp_alias, param_offset):
    """Site-scope PENDING payments via the reviewing agent."""
    if not _needs_site_filter(kwargs):
        return "", []
    location_id = kwargs["_entity_location_id"]
    param_num = param_offset + 1
    clause = (
        f"AND {sp_alias}.assigned_agent_id IN ("
        f"SELECT ap_s.user_id FROM agent_profiles ap_s "
        f"WHERE ap_s.entity_location_id = ${param_num})"
    )
    return clause, [location_id]
```

Note: For pending payments, `assigned_agent_id` may be NULL (unassigned).
Unassigned payments should still be visible to satellite supervisors (they need to see their queue).
Solution: `AND (assigned_agent_id IS NULL OR assigned_agent_id IN (SELECT ...))` for pending.
For completed: use `validated_by_agent_id` (existing pattern).

**Verification Checklist — Phase 0.5:**
- [ ] Python syntax check passes on treasury_analyst_service.py
- [ ] `_needs_site_filter({"_is_main_office": True})` returns False (no change for main office)
- [ ] `_needs_site_filter({"_is_main_office": False, "_entity_location_id": "xxx"})` returns True
- [ ] get_sla_status: main_office user -> sees ALL pending (same as before)
- [ ] get_sla_status: satellite user -> sees ONLY pending assigned to their site agents
- [ ] get_payment_aging: same pattern as SLA (main vs satellite)
- [ ] get_workflow_pipeline: completed scoped by validated_by, pending scoped by assigned_to
- [ ] get_anomaly_summary: anomalies linked to site-scoped payments
- [ ] get_anomaly_details: same scope as summary
- [ ] get_workload_forecast: historical volume scoped by validated_by for completed
- [ ] get_reconciliation_status: UNCHANGED (intentionally global — 1 bank account)
- [ ] No regression: main_office users see exactly the same data as before
- [ ] SECURITY: satellite user CANNOT see data from other sites (test with 2 different location_ids)

### Phase 1: ToolRegistry + DynamicAnalystService [Backend Infrastructure]

**Goal**: Replace class-based agent dispatch with registry-based dynamic dispatch.
No new SQL functions yet — just refactoring the dispatch layer.

**Files:**
- `packages/backend/app/modules/shared/services/tool_registry.py` — NEW
  - `ToolSet` dataclass: function_declarations, function_map, prompt_template/prompt_fn, artifacts_builder, max_tool_rounds, second_call_max_tokens
  - `ToolRegistry` class: register(agent_type, ToolSet), get(agent_type) -> ToolSet
  - Register "treasury" entry (importing from treasury_analyst_service)
  - Register "admin" entry (importing from admin_assistant_service)
  - Register "supervisor" entry (placeholder — Phase 2 fills in the functions)

- `packages/backend/app/modules/shared/services/dynamic_analyst_service.py` — NEW
  - `DynamicAnalystService(BaseAnalystService)` — single class
  - `__init__(agent_type, entity_context)` — loads from ToolRegistry
  - Overrides: _get_function_declarations, _get_function_map, _get_system_prompt, _get_agent_type, _get_max_tool_rounds, _get_second_call_max_tokens, _build_artifacts
  - For supervisor: prompt_template.format(**entity_context)
  - For treasury: existing prompt generation (date injection)
  - For admin: existing static prompt
  - Factory: `create_analyst(agent_type, entity_context) -> DynamicAnalystService`

- `packages/backend/app/modules/shared/services/base_analyst_service.py` — MINOR UPDATE
  - Make `_build_artifacts()` a virtual method (default: empty list)
  - DynamicAnalystService delegates to registry's artifacts_builder if provided

- `packages/backend/app/modules/shared/services/nlp_preprocessor.py` — MINOR UPDATE
  - `extract_slots()`: accept optional `agent_type` param
  - If agent_type not in ("treasury", "admin", None), skip ML intent classification
  - Keep slot extraction (regex) for all agent_types
  - `build_enriched_prompt()`: skip `[INTENCION DETECTADA]` section when no ML intent

**Verification Checklist — Phase 1:**
- [ ] Python syntax check passes on ALL modified/new files
- [ ] ToolRegistry.get("treasury") returns ToolSet with 17 functions + correct prompt
- [ ] ToolRegistry.get("admin") returns ToolSet with 11 functions + correct prompt
- [ ] ToolRegistry.get("supervisor") returns ToolSet (placeholder, 0 functions for now)
- [ ] ToolRegistry.get("unknown") raises KeyError (no silent fallback)
- [ ] DynamicAnalystService("treasury", {}) instantiates without error
- [ ] DynamicAnalystService("admin", {}) instantiates without error
- [ ] DynamicAnalystService._get_function_declarations() returns same list as TreasuryAnalystService
- [ ] DynamicAnalystService._get_function_map() returns same dict as TreasuryAnalystService
- [ ] DynamicAnalystService._get_system_prompt() returns same string as TreasuryAnalystService
- [ ] DynamicAnalystService._get_agent_type() returns "treasury"
- [ ] DynamicAnalystService._build_artifacts() delegates to treasury builder
- [ ] NLP: extract_slots("ingresos del mes", agent_type="treasury") -> ML intent=REVENUE
- [ ] NLP: extract_slots("solicitudes pendientes", agent_type="supervisor") -> NO ML intent, slots regex works
- [ ] NLP: build_enriched_prompt with no ML intent -> no [INTENCION DETECTADA] section
- [ ] BACKWARD COMPAT: TreasuryAnalystService still works (not deleted yet)
- [ ] BACKWARD COMPAT: AdminAssistantService still works (not deleted yet)

### Phase 2: Supervisor Core SQL Functions [Backend Business Logic]

**Goal**: Implement 8 SQL functions for entity workflow supervision.

**Files:**
- `packages/backend/app/modules/shared/services/supervisor_tools.py` — NEW
  - 8 async functions: get_request_stats, get_request_pipeline, get_request_sla, etc.
  - All accept `db, **kwargs` with `_entity_code` + `_entity_location_id` injected
  - All use parameterized queries ($1, $2) — NEVER string interpolation
  - All return dict (JSON-serializable for Gemini)
  - Site scoping: `_needs_site_filter()` pattern (same as Treasury)
    - service_requests HAS entity_location_id -> direct WHERE filter (no subselect needed)
  - FunctionDeclaration list for Gemini (8 entries with parameter schemas)
  - FUNCTION_MAP dict for dispatch
  - SUPERVISOR_PROMPT_TEMPLATE string with {entity_name}, {site_name}, {workflow_list}, etc.

- `packages/backend/app/modules/shared/services/tool_registry.py` — UPDATE
  - Register "supervisor" with real functions from supervisor_tools

**SQL Function Details:**

```python
# get_request_stats(db, days=30, **kwargs)
# SELECT status, workflow_code, COUNT(*) FROM service_requests
# WHERE entity_code = $1 AND created_at >= NOW() - interval '$2 days'
#   [AND entity_location_id = $3 IF satellite]
# GROUP BY status, workflow_code

# get_request_pipeline(db, **kwargs)
# SELECT status, COUNT(*), SUM(total_amount) FROM service_requests
# WHERE entity_code = $1 [AND entity_location_id = $2]
#   AND created_at >= NOW() - INTERVAL '90 days'
# GROUP BY status ORDER BY CASE WHEN status='SUBMITTED' THEN 1 ...

# get_request_sla(db, **kwargs)
# WITH times AS (
#   SELECT id, status,
#     EXTRACT(EPOCH FROM (validated_at - submitted_at))/3600 AS hours_to_validate,
#     EXTRACT(EPOCH FROM (completed_at - submitted_at))/3600 AS hours_total,
#     EXTRACT(EPOCH FROM (NOW() - submitted_at))/3600 AS hours_pending
#   FROM service_requests
#   WHERE entity_code = $1 [AND entity_location_id = $2]
#     AND submitted_at >= NOW() - INTERVAL '90 days'
# )
# SELECT
#   AVG(hours_to_validate) FILTER (WHERE hours_to_validate IS NOT NULL) AS avg_validation_hours,
#   AVG(hours_total) FILTER (WHERE hours_total IS NOT NULL) AS avg_total_hours,
#   COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED','REJECTED','EXPIRED') AND hours_pending > 48) AS overdue_48h,
#   COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED','REJECTED','EXPIRED') AND hours_pending > 120) AS overdue_5d,
#   COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED','REJECTED','EXPIRED') AND hours_pending > 360) AS overdue_15d

# get_request_rejections(db, days=30, **kwargs)
# SELECT workflow_code, rejection_reason, COUNT(*) FROM service_requests
# WHERE entity_code = $1 AND status = 'REJECTED'
#   AND updated_at >= NOW() - interval '$2 days'
#   [AND entity_location_id = $3]
# GROUP BY workflow_code, rejection_reason ORDER BY count DESC

# get_request_trends(db, days=30, **kwargs)
# SELECT DATE(created_at) AS date,
#   COUNT(*) AS submitted,
#   COUNT(*) FILTER (WHERE status='COMPLETED') AS completed
# FROM service_requests
# WHERE entity_code = $1 AND created_at >= NOW() - interval '$2 days'
#   [AND entity_location_id = $3]
# GROUP BY DATE(created_at) ORDER BY date

# get_entity_agents(db, **kwargs)
# SELECT u.full_name, aw.availability, aw.capacity_percentage,
#   aw.current_assignments, aw.max_concurrent_assignments,
#   el.location_name, el.city
# FROM agent_profiles ap
# JOIN users u ON u.id = ap.user_id
# JOIN entities e ON e.id = ap.entity_id
# LEFT JOIN agent_workloads aw ON ap.id = aw.agent_profile_id
# LEFT JOIN entity_locations el ON el.id = ap.entity_location_id
# WHERE e.code = $1 AND ap.is_active = true
#   [AND ap.entity_location_id = $2 IF satellite]

# get_agent_ranking(db, days=30, **kwargs)
# SELECT u.full_name,
#   aps.monthly_completed, aps.avg_processing_time_hours,
#   aps.success_rate, aps.escalation_rate
# FROM agent_performance_stats aps
# JOIN agent_profiles ap ON ap.id = aps.agent_profile_id
# JOIN users u ON u.id = ap.user_id
# JOIN entities e ON e.id = ap.entity_id
# WHERE e.code = $1
#   AND aps.period_start >= NOW() - interval '$2 days'
#   [AND ap.entity_location_id = $3]
# ORDER BY aps.monthly_completed DESC

# get_pending_detail(db, limit=20, **kwargs)
# SELECT sr.reference, sr.workflow_code, sr.status,
#   u.full_name AS citizen_name,
#   EXTRACT(EPOCH FROM (NOW() - sr.submitted_at))/3600 AS hours_pending,
#   sr.submitted_at, sr.assigned_to
# FROM service_requests sr
# LEFT JOIN users u ON u.id = sr.user_id
# WHERE sr.entity_code = $1
#   AND sr.status NOT IN ('COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED')
#   [AND sr.entity_location_id = $2]
# ORDER BY sr.submitted_at ASC LIMIT $N
```

**Verification Checklist — Phase 2:**
- [ ] Python syntax check passes on supervisor_tools.py
- [ ] get_request_stats(db, _entity_code="CNEDOGE_PASAPORTE") returns counts by status + workflow
- [ ] get_request_stats with 0 rows -> returns {"total": 0, "by_status": [], "by_workflow": []}
- [ ] get_request_pipeline(db, _entity_code="CNEDOGE_PASAPORTE") returns ordered funnel
- [ ] get_request_sla(db, _entity_code="CNEDOGE_PASAPORTE") returns avg times + overdue counts
- [ ] get_request_rejections(db, _entity_code="CNEDOGE_PASAPORTE") returns rates + top reasons
- [ ] get_request_trends(db, _entity_code="CNEDOGE_PASAPORTE") returns daily date + counts
- [ ] get_entity_agents(db, _entity_code="CNEDOGE_PASAPORTE") returns agent list with workload
- [ ] get_agent_ranking(db, _entity_code="CNEDOGE_PASAPORTE") returns agent metrics sorted
- [ ] get_pending_detail(db, _entity_code="CNEDOGE_PASAPORTE") returns pending request list
- [ ] SECURITY: get_request_stats(db, _entity_code="DGT") does NOT return CNEDOGE data
- [ ] SECURITY: satellite site agent -> only sees requests at their entity_location_id
- [ ] SECURITY: main_office supervisor -> sees ALL requests for entity (no site filter)
- [ ] All functions handle 0 rows gracefully (empty entity = empty results, not error)
- [ ] All functions use parameterized queries ($1, $2) — no string interpolation
- [ ] FunctionDeclaration list has 8 entries with correct parameter schemas (name, description, parameters)
- [ ] FUNCTION_MAP has 8 entries matching FunctionDeclaration names exactly
- [ ] ToolRegistry.get("supervisor") returns ToolSet with 8 functions
- [ ] SUPERVISOR_PROMPT_TEMPLATE has all required placeholders

### Phase 3: Unified Endpoint + Agent Resolution [Backend API]

**Goal**: Single endpoint that resolves user -> agent_type -> dispatches to DynamicAnalystService.

**Files:**
- `packages/backend/app/modules/agents/api/analyst_routes.py` — NEW
  - `POST /agents/analyst/ask` — unified endpoint
  - `GET /agents/analyst/briefing` — unified briefing
  - `_resolve_agent_context(db, user_id)` — resolves entity, site, agent_type, workflows
  - Permission: `analyst.ask` (new permission) OR fallback to existing permissions
  - Rate limiting per agent_type: 20/hour treasury, 10/min admin, 10/min supervisor
  - Cache per agent_type: 5min treasury (expensive queries), 2min supervisor, none admin
  - Session ID forwarding for conversation memory
  - Input sanitization (same _sanitize_question as existing endpoints)

- `packages/backend/app/main.py` — UPDATE
  - Register new router: `analyst_router` under `/agents`

- `packages/backend/app/modules/agents/api/profile_routes.py` — UPDATE
  - Keep `/admin/assistant` as backward-compat alias -> internal redirect to DynamicAnalystService("admin")

- `packages/backend/app/modules/service_requests/api/admin_routes.py` — UPDATE
  - Keep `/treasury/analyst/ask` as backward-compat alias -> internal redirect to DynamicAnalystService("treasury")
  - Keep `/treasury/analyst/briefing` as backward-compat alias

**Agent Resolution Logic (100% DB-driven, zero hardcoded entity names):**
```python
async def _resolve_agent_context(db, user_id):
    """Resolve user -> entity context + agent_type for dynamic dispatch.

    Resolution is 100% DB-driven. No entity names hardcoded.
    The agent_type is determined by:
      1. entities.entity_type — DB column (not code comparison)
      2. entities.workflow_codes — array length > 0 = has workflows
      3. roles.permissions — what the user is allowed to do

    Future: entities table could have an `agent_type_override` column
    for full admin control without code changes.
    """
    row = await db.fetchrow("""
        SELECT ap.entity_id, ap.is_supervisor, ap.entity_location_id,
               e.code AS entity_code, e.name AS entity_name,
               e.workflow_codes, e.entity_type,
               el.location_name AS site_name, el.city, el.is_main_office
        FROM agent_profiles ap
        JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN entity_locations el ON el.id = ap.entity_location_id
        WHERE ap.user_id = $1 AND ap.is_active = true
        LIMIT 1
    """, user_id)

    if not row:
        return None

    entity_code = row["entity_code"]
    workflow_codes = row["workflow_codes"] or []

    # Agent type resolution — fully dynamic, no entity name comparison
    # Rule 1: Entities with NO workflows AND entity_type = 'entity' = cross-cutting (treasury-like)
    # Rule 2: Entities WITH workflows = supervisor (workflow management)
    # Rule 3: Admin users (no agent_profile or special role) = admin
    if len(workflow_codes) == 0:
        # Cross-cutting entity (e.g., TESORO) — uses specialized tools if registered
        if tool_registry.has(entity_code.lower()):
            agent_type = entity_code.lower()  # e.g., "tesoro" if registered
        else:
            agent_type = "treasury"  # Default for cross-cutting financial entities
    else:
        agent_type = "supervisor"

    # Agent count for supervisor prompt (dynamic query, works for any entity)
    agent_count = 0
    available_count = 0
    if agent_type == "supervisor":
        counts = await db.fetchrow("""
            SELECT COUNT(*) AS total,
                   COUNT(*) FILTER (
                       WHERE aw.availability = 'available' OR aw.availability IS NULL
                   ) AS available
            FROM agent_profiles ap
            LEFT JOIN agent_workloads aw ON ap.id = aw.agent_profile_id
            WHERE ap.entity_id = $1 AND ap.is_active = true
        """, row["entity_id"])
        agent_count = counts["total"] or 0
        available_count = counts["available"] or 0

    return {
        "agent_type": agent_type,
        "entity_code": entity_code,
        "entity_name": row["entity_name"],
        "entity_location_id": str(row["entity_location_id"]) if row["entity_location_id"] else None,
        "is_main_office": row["is_main_office"] if row["is_main_office"] is not None else True,
        "site_name": row["site_name"] or "Principal",
        "city": row["city"] or "",
        "workflow_codes": workflow_codes,
        "is_supervisor": row["is_supervisor"] or False,
        "agent_count": agent_count,
        "available_count": available_count,
    }
```

**Note**: Admin users (superadmin role) access the admin agent via a separate check
on their role permissions, not via agent_profiles. The resolution above handles
entity-based agents only. Admin detection is role-based in the endpoint handler.

**Verification Checklist — Phase 3:**
- [ ] Python syntax check passes on ALL modified/new files
- [ ] New permission `analyst.ask` created and assigned to relevant roles
- [ ] Endpoint registered: `POST /agents/analyst/ask` returns 200 with valid auth
- [ ] Endpoint returns 401 without auth token
- [ ] Endpoint returns 403 without `analyst.ask` permission
- [ ] TESORO user (Sup Tesoro) -> agent_type="treasury", gets treasury functions
- [ ] TESORO user -> response identical to old `/treasury/analyst/ask` endpoint
- [ ] Admin user -> agent_type="admin", gets admin functions
- [ ] Admin user -> response identical to old `/admin/assistant` endpoint
- [ ] CNEDOGE_PASAPORTE supervisor -> agent_type="supervisor", 8 functions loaded
- [ ] DGT supervisor -> agent_type="supervisor", different entity_name in prompt
- [ ] User with no agent_profile -> returns 404 "No agent profile found"
- [ ] Rate limiting: 21st treasury request in 1 hour -> rate limit message
- [ ] Rate limiting: 11th supervisor request in 1 minute -> rate limit message
- [ ] Cache: same treasury question within 5min -> cached response
- [ ] Cache: same supervisor question within 2min -> cached response
- [ ] Session ID forwarded -> conversation memory works across turns
- [ ] Input sanitization: SQL injection attempt -> sanitized
- [ ] BACKWARD COMPAT: `/treasury/analyst/ask` still works (200 response)
- [ ] BACKWARD COMPAT: `/admin/assistant` still works (200 response)
- [ ] BACKWARD COMPAT: `/treasury/analyst/briefing` still works
- [ ] SECURITY: supervisor CNEDOGE_PASAPORTE CANNOT see DGT data
- [ ] SECURITY: satellite user CANNOT see main office data
- [ ] SECURITY: main office user CAN see all sites data

### Phase 4: Frontend Integration [Web]

**Goal**: Wire AgentChatUI to the unified endpoint for supervisor dashboards.

**Files:**
- `packages/web/src/modules/agent-dashboard/services/analystApi.ts` — NEW
  - `askAnalyst(question, sessionId?)` -> `POST /agents/analyst/ask`
  - `getAnalystBriefing()` -> `GET /agents/analyst/briefing`
  - Uses `apiClient` with auth interceptor (existing pattern)

- `packages/web/src/modules/agent-dashboard/components/SupervisorAssistantTab.tsx` — NEW
  - Uses AgentChatUI with dynamic config from agent profile
  - Entity name, accent color derived from entity_code
  - Maps entity_code to accent colors: `{ CNEDOGE_PASAPORTE: 'bg-blue-100', DGT: 'bg-orange-100', ... }`
  - Normalizes response format (backend returns tools_used snake_case -> compatible)

- `packages/web/src/modules/treasury/components/TreasuryAnalystTab.tsx` — KEEP AS-IS
  - No changes. Uses old endpoint `/treasury/analyst/ask` (backward compat alias active)
  - Migration to unified endpoint in a future phase

- `packages/web/src/modules/agents-admin/components/AdminAssistantTab.tsx` — KEEP AS-IS
  - No changes. Uses old endpoint `/admin/assistant` (backward compat alias active)
  - Migration to unified endpoint in a future phase

**Verification Checklist — Phase 4:**
- [ ] TypeScript type-check passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] SupervisorAssistantTab renders without errors
- [ ] SupervisorAssistantTab displays entity name in title
- [ ] Question sent to `/agents/analyst/ask` with Authorization header
- [ ] Response displayed: answer text + artifacts (if any)
- [ ] Session ID maintained across conversation turns (UUID generated on mount)
- [ ] Empty state: "Pregunta sobre solicitudes, agentes, SLA..." placeholder
- [ ] Error state: network error -> user-friendly message
- [ ] Rate limit state: rate limit response -> displayed correctly
- [ ] TreasuryAnalystTab UNCHANGED and still works
- [ ] AdminAssistantTab UNCHANGED and still works
- [ ] AgentChatUI shared component used (not duplicated code)
- [ ] ACCESSIBILITY: keyboard navigation works in chat
- [ ] RESPONSIVE: mobile layout (no horizontal scroll)

### Phase 5: Supervisor Artifacts + Briefing [Enhancement]

**Goal**: Rich data visualization for supervisor queries + auto-briefing.

**Files:**
- `packages/backend/app/modules/shared/services/supervisor_tools.py` — UPDATE
  - Add `supervisor_build_artifacts(tool_results)` function
  - get_request_stats -> kpi_grid artifact (total, pending, completed, rejected)
  - get_request_pipeline -> table artifact (status funnel with amounts)
  - get_entity_agents -> table artifact (agent name, availability, capacity, load)
  - get_request_trends -> summary artifact (trend direction + volume)
  - get_request_sla -> kpi_grid artifact (avg times + overdue counts)

- `packages/backend/app/modules/shared/services/dynamic_analyst_service.py` — UPDATE
  - Add `generate_briefing(db, context)` method
  - For supervisor: runs get_request_stats + get_entity_agents + get_request_sla
  - Passes aggregated data to Gemini for natural language summary
  - Returns 3-4 paragraph entity state briefing

**Verification Checklist — Phase 5:**
- [ ] get_request_stats -> kpi_grid artifact with 4 metrics
- [ ] get_request_pipeline -> table artifact with headers + rows
- [ ] get_entity_agents -> table artifact with agent data
- [ ] get_request_sla -> kpi_grid artifact with SLA data
- [ ] Artifacts render correctly in AgentChatUI ArtifactRenderer
- [ ] Briefing returns non-empty text for entity with data
- [ ] Briefing returns "No hay datos suficientes" for empty entity
- [ ] Briefing cached (2min TTL) to avoid repeated Gemini calls
- [ ] Briefing endpoint: `GET /agents/analyst/briefing` returns briefing text
- [ ] Frontend: briefing strip displayed above chat (if available)

---

## Files Reference (All Phases)

| File | Phase | Change |
|------|-------|--------|
| `service_requests/services/treasury_analyst_service.py` | P0.5 | FIX — 6 functions site scoping |
| `shared/services/tool_registry.py` | P1, P2 | NEW — ToolRegistry + ToolSet |
| `shared/services/dynamic_analyst_service.py` | P1, P5 | NEW — DynamicAnalystService |
| `shared/services/base_analyst_service.py` | P1 | MINOR — virtual _build_artifacts |
| `shared/services/nlp_preprocessor.py` | P1 | MINOR — skip ML for non-treasury/admin |
| `shared/services/supervisor_tools.py` | P2, P5 | NEW — 8 SQL functions + artifacts |
| `agents/api/analyst_routes.py` | P3 | NEW — unified endpoint + resolution |
| `agents/api/profile_routes.py` | P3 | UPDATE — backward compat alias |
| `service_requests/api/admin_routes.py` | P3 | UPDATE — backward compat alias |
| `main.py` | P3 | UPDATE — register router |
| `web/modules/agent-dashboard/services/analystApi.ts` | P4 | NEW — API client |
| `web/modules/agent-dashboard/components/SupervisorAssistantTab.tsx` | P4 | NEW — supervisor UI |

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| ToolRegistry (dict), not class inheritance | N classes for N entities = unmaintainable. Registry = O(1) lookup, config-driven |
| Treasury/Admin as registry entries, not refactored | Zero risk. Same functions, same SQL, same behavior. Just different dispatch path |
| 8 supervisor functions (not 17 or 3) | 8 covers 80% of supervisor needs. More can be added per-entity later |
| Single endpoint, not N endpoints | `/agents/analyst/ask` resolves agent_type from user profile. No frontend routing logic |
| ML intent kept for treasury/admin | Already built, 0 cost, feeds retrain pipeline. Not needed for supervisor |
| ML intent skipped for supervisor | 11 intents are treasury/admin-specific. Gemini routes natively among 8 functions |
| Backward compat aliases | Treasury/Admin frontend not touched in Phase 4. Migrate later when stable |
| supervisor_tools.py (single file) | All 8 functions share same tables/patterns. No need for per-entity files |
| entity_context in constructor | Prompt template needs entity_name, workflows, site — injected at creation |
| Phase 0.5 security fix first | 6 Treasury functions leak cross-site data. MUST fix before adding more agents |
| Orchestrator as future phase | Agent-of-agents (3 meta-functions) > composition (36 functions). ToolRegistry supports both |
| service_requests.entity_location_id direct | No subselect needed for supervisor (unlike Treasury which needs agent->site join) |

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking existing Treasury/Admin | Backward compat aliases + no functional changes to their tools |
| Empty entity (0 requests, 0 agents) | All 8 functions handle 0 rows -> graceful empty results |
| Supervisor sees other entity data | _entity_code + _entity_location_id scoping in every SQL WHERE clause |
| Satellite sees main office data | is_main_office check before site filter (Phase 0.5 + Phase 2) |
| Gemini misroutes with 8 functions | ToolConfig mode=ANY forces function call. 8 < 17 = less ambiguity |
| Performance (new service per request) | Lightweight: dict lookup + string format. Gemini model cached |
| Orchestrator complexity | Future phase, not blocking. ToolRegistry designed to support it |
| NLP seeds not available for supervisor | Gemini routes without ML. Few-shot accumulates organically via logs |
