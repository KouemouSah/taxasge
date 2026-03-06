# Plan: Site-Scoping Global pour TOUS les Superviseurs

## Contexte
Un superviseur gere UNE entite mais peut avoir plusieurs sites (entity_locations).
- `is_main_office=true` : voit TOUS les sites avec dropdown filtre
- `is_main_office=false` : auto-scope a son site, pas de dropdown

## Principe cle
- Le scoping se fait via `assigned_ap.entity_location_id` (agent du site), PAS `sr.entity_location_id` (lieu de la demande)
- Pour TESORO: les agents traitent des paiements de TOUTE entite, le site = site TESORO de l'agent
- Pour les autres entites: le site = site de l'agent qui traite la demande

## Phase 1: supervisor_routes.py — get_agent_context + dashboard stats

### 1.1 get_agent_context (supervisor_routes.py)
- Ajouter `entity_location_id` et `is_main_office` via JOIN entity_locations

### 1.2 GET /supervisor/dashboard — team stats
- Filtre `entity_location_id` sur agents (`ap.entity_location_id`)

### 1.3 GET /supervisor/agents
- Passe `entity_location_id` a `get_available_agents()`

### 1.4 GET /supervisor/dashboard — escalation stats
- Filtre `escalated_by IN (agents du site)` pour non-main-office

### 1.5 GET /supervisor/dashboard — assignment stats
- Filtre `a.agent_profile_id IN (agents du site)` pour non-main-office

### 1.6 GET /supervisor/dashboard — performance stats
- Filtre `a.agent_profile_id IN (agents du site)` pour non-main-office

### 1.7 GET /supervisor/workload/balance
- Passe `entity_location_id` a `get_available_agents()`

## Phase 2: admin_routes.py — Treasury stats endpoints (7 endpoints)

### 2.1 GET /treasury/stats/dashboard — fix auto-scope
### 2.2 GET /treasury/stats/sla — ajout site-scoping
### 2.3 GET /treasury/stats/kpis — ajout site-scoping
### 2.4 GET /treasury/stats/agents — ajout site-scoping
### 2.5 GET /treasury/stats/workload-dashboard — ajout site-scoping (7 sub-queries)
### 2.6 GET /treasury/anomalies — scope par agent location
### 2.7 GET /treasury/audit — scope par agent location

## Phase 3: Escalation + Auto-Assignment (CRITIQUE)

### E1 Treasury escalation — superviseur du meme site que l'agent
- admin_routes.py:4579 — Avant: `LIMIT 1` random. Apres: meme site > fallback any
- Pattern: lookup `entity_location_id` de l'agent escaladant, cherche superviseur au meme site

### E2 Service request escalation — routing implicite
- agent_routes.py marque `escalated=true` sans `escalated_to`
- Le scoping est dans les queries dashboard supervisor (Phase 1.4)

### A1 service_request_service.py — entity_location_id manquant
- auto_assign_item() ne recevait pas entity_location_id
- Fix: passe `request.get("entity_location_id")` avec conversion UUID

## Phase 4: Frontend — manual assignments page
- Remplace `useEntities()` par `useSupervisorLocations(entityCode)`
- Dropdown site seulement si `isMainOffice && locations.length > 1`
- API call: `entity_location_id` au lieu de `entity_code`

## Phase 5: Validation
- Python syntax check (py_compile) — PASS
- TypeScript check (tsc --noEmit) — PASS
- Rapport d'implementation

## Checklist validation par endpoint
- [x] Phase 1.1: get_agent_context supervisor_routes.py
- [x] Phase 1.2: /supervisor/dashboard team stats
- [x] Phase 1.3: /supervisor/agents
- [x] Phase 1.4: /supervisor/dashboard escalation stats (+ site filter)
- [x] Phase 1.5: /supervisor/dashboard assignment stats (+ site filter)
- [x] Phase 1.6: /supervisor/dashboard performance stats (+ site filter)
- [x] Phase 1.7: /supervisor/workload/balance
- [x] Phase 2.1: /treasury/stats/dashboard (fix auto-scope)
- [x] Phase 2.2: /treasury/stats/sla
- [x] Phase 2.3: /treasury/stats/kpis
- [x] Phase 2.4: /treasury/stats/agents
- [x] Phase 2.5: /treasury/stats/workload-dashboard (7 queries)
- [x] Phase 2.6: /treasury/anomalies
- [x] Phase 2.7: /treasury/audit
- [x] Phase 3 E1: Treasury escalation same-site supervisor
- [x] Phase 3 E2: Escalation stats site-scoped (via Phase 1.4)
- [x] Phase 3 A1: service_request_service.py entity_location_id
- [x] Phase 4: Frontend manual assignments page
- [x] Phase 5: Python + TypeScript validation PASS
