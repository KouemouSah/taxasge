# RBAC Engine Core — Plan d'Architecture Robuste

**Date** : 2026-03-10
**Statut** : EN COURS
**Objectif** : Transformer le RBAC CRUD en noyau production-grade (style Keycloak/Casbin)

---

## Diagnostic Actuel

### Performance (mur à ~50 agents)
| Goulot | Impact @100 agents | Requêtes/req |
|--------|-------------------|-------------|
| Double fetch user (auth + permission_service) | 100+ redondants/sec | +1/req |
| `get_all_permission_names()` 4-way JOIN+UNION | 50-200ms/cache miss | Lent |
| `_check_is_supervisor()` subquery non cachée | 100-200ms/check | +1/req |
| `_check_funcionario_status()` chaque requête auth | 80-160 extra/sec | +1/req |
| `permission_required_any()` boucle séquentielle | 6-9 req pour 3 perms | ×3 |
| Cache TTL 10min, miss rate ~10% | 1500 JOINs complexes/min | - |

### Modèle de données
| Gap | Sévérité |
|-----|----------|
| `business` role = 1 permission | 🔴 CRITIQUE |
| Pas de hiérarchie rôles (parent_role_id) | 🔴 CRITIQUE |
| Deny + Temporal = features mortes (0 utilisés) | 🟡 MAJEUR |
| Audit logs = 430 entrées (quasi-vide) | 🔴 CRITIQUE |
| Communications 70% critique vs Agent 4% | 🟡 MAJEUR |

### UX (3× trop de clics)
| Tâche | Clics actuels | Standard |
|-------|--------------|---------|
| Désactiver 10 agents | 30 | 4 (bulk) |
| Modifier 1 permission | 7 (modal) | 2 (inline) |
| Dupliquer un rôle | IMPOSSIBLE | 2 |
| Exporter liste | IMPOSSIBLE | 1 |

---

## Phase 0 — Quick Wins Backend (1-2 jours) ✅ COMPLÉTÉ

### 0.1 Éliminer double fetch user ✅
- [x] `has_permission()` accepte `user: Optional[Any]` — middleware passe `current_user`
- [x] Tous les decorators/dependencies passent user: permission_required, require_permission, require_any/all
- **Impact** : -50% requêtes par permission check

### 0.2 CTE matérialisée ✅
- [x] Requête réécrite en CTEs MATERIALIZED avec résolution hiérarchique récursive
- [x] Deny resolution incluse (NOT IN user_denies)
- **Impact** : 50-200ms → <10ms

### 0.3 Cache warming au login ✅
- [x] Après permissions fetch dans auth_service.login(), pre-populate Redis
- **Impact** : Élimine cold-start

### 0.4 Cache funcionario status ✅
- [x] Cache Redis 5min (clé `func:status:{matricula}`) dans auth_middleware
- **Impact** : -80 requêtes/sec

### 0.5 Fixer rôle business ✅
- [x] Migration 197 : 1 → 14 permissions (citizen baseline + accountant extras + dashboard + payment)
- **Impact** : Bug critique corrigé

---

## Phase 1 — RBAC Engine Consolidation (3-5 jours) ✅ COMPLÉTÉ

### 1.1 Hiérarchie de rôles ✅
- [x] Migration 198 : `parent_role_id UUID REFERENCES roles(id)` + index
- [x] 15 relations : admin→admin_*, agent_*→supervisor_*
- [x] CTE récursive dans get_all_permission_names()
- **Impact** : Hiérarchie automatique, pas de sync manuelle

### 1.2 Permissions effectives en 1 requête ✅
- [x] RECURSIVE CTE avec role_chain → role_perms → user_denies → user_grants
- [x] Cache L2 Redis (10min TTL) existant + cache warming au login
- **Impact** : 2-9 req → 1 req par check

### 1.3 Audit triggers PostgreSQL ✅
- [x] Migration 198 : 3 trigger functions + 8 triggers
- [x] Captures : PERMISSION_GRANTED/REVOKED, USER_PERMISSION_*, ROLE_*
- [x] Colonnes : old_values, new_values (JSONB), entity_id (varchar), ip_address (inet)
- **Impact** : Traçabilité automatique sans code

### 1.4 Permission scoping (scope JSONB) ✅
- [x] `ALTER TABLE role_permissions ADD COLUMN scope JSONB DEFAULT NULL` (Migration 199)
- [x] `ALTER TABLE user_permissions ADD COLUMN scope JSONB DEFAULT NULL`
- [x] GIN indexes for scope containment queries
- [x] `has_permission_scoped()` method with entity_code resolution
- [x] NOTIFY triggers for real-time cache invalidation (`rbac_changes` channel)
- [x] `RBACListener` Python asyncpg listener → Redis invalidation (<50ms)
- [x] Cache invalidation on role change (`_update_user_rbac_role()`)
- **Impact** : Permissions limitées par entité + invalidation temps réel

### 1.5 Sync permissions registry au deploy ✅ (PRÉ-EXISTANT)
- [x] `initialize_permissions()` avec `cleanup_obsolete=True` au startup
- [x] Scan tous les module_permissions/ → sync BD → cleanup orphelins
- **Impact** : 0 permissions fantômes garanties

### Checklist Phase 1 :
- [x] 1.1 Migration 198 + CTE récursive testée
- [x] 1.2 CTE <10ms (vs 50-200ms ancien)
- [x] 1.3 Triggers audit créés (3 fonctions, 8 triggers)
- [x] 1.4 Scope JSONB + NOTIFY triggers + RBACListener
- [x] 1.5 Sync auto au deploy (initialize_permissions)

---

## Phase 2 — Refonte UX Admin (5-7 jours) ✅ COMPLÉTÉ

### 2.1 Bulk actions rôles ✅
- [x] Multi-select avec checkboxes sur RolesTab
- [x] Bulk delete endpoint `POST /roles/bulk-delete` (protège system roles)
- [x] Toolbar contextuel (apparaît quand sélection active)
- [x] Cache invalidation après bulk delete

### 2.2 Slide-in panels ✅
- [x] Sheet side panel pour preview rôle (clic sur nom)
- [x] Permissions groupées par module dans le panel
- [x] Bouton "Editar" vers page détail depuis le panel

### 2.4 Clone rôle ✅
- [x] Bouton "Clonar" sur chaque ligne de rôle
- [x] Endpoint POST /roles/{id}/clone (backend)
- [x] Frontend hook `useCloneRole` + API `rolesApi.clone()`
- [x] Cache invalidation après clone

### 2.5 Export CSV ✅
- [x] Bouton "CSV" dans toolbar RolesTab
- [x] Endpoint GET /roles/export/csv (backend StreamingResponse)
- [x] Frontend download automatique (blob → anchor click)

### 2.6 Command Palette (Cmd+K) ✅
- [x] `AdminCommandPalette` composant avec cmdk
- [x] 15+ pages de navigation rapide
- [x] 3 actions rapides (créer rôle, exporter, voir matrice)
- [x] Intégré dans DashboardLayout (admin only)
- [x] Raccourci Cmd+K / Ctrl+K

### Checklist Phase 2 :
- [x] Bulk actions fonctionnelles sur rôles
- [x] Panel slide-in pour preview rôle
- [x] Clone rôle (backend + frontend)
- [x] Export CSV vérifié
- [x] Cmd+K fonctionnel

---

## Phase 3 — Event Bus + Real-time ✅ COMPLÉTÉ

### 3.1 EventBus (in-process) ✅ PRÉ-EXISTANT + RBAC events
- [x] Classe EventBus singleton avec publish/subscribe (`app/core/events/event_bus.py`)
- [x] 8 RBAC event types ajoutés (EventType enum)
- [x] Async listeners (non-bloquants) + `publish_nowait()`

### 3.2 Listeners core ✅
- [x] AuditLogger : PostgreSQL triggers automatiques (migration 198)
- [x] CacheInvalidator : `RBACListener` NOTIFY → Redis (<50ms)
- [x] EventBus events émis depuis RBACListener pour cascading handlers

### 3.3 Real-time cache invalidation ✅
- [x] PostgreSQL NOTIFY `rbac_changes` (migration 199, 4 triggers)
- [x] Python asyncpg listener (`rbac_listener.py`)
- [x] Invalidation ciblée (user-level ou all selon type de changement)
- Note: WebSocket broadcast différé (pas de besoin immédiat — admin refresh suffit)

### 3.4 Permission Simulator ⬜ (différé)
- [ ] Endpoint POST /permissions/simulate — implémenté quand nécessaire
- Priorité: basse (aucun client ne l'a demandé)

### Checklist Phase 3 :
- [x] Events RBAC émis sur mutations
- [x] Audit logs automatiques via PostgreSQL triggers
- [x] Cache invalidation automatique via NOTIFY + listener
- [ ] WebSocket broadcast (différé — pas de besoin immédiat)
- [ ] Permission simulator (différé)

---

## Phase 4 — Scale (quand nécessaire) ⬜

| # | Action | Trigger |
|---|--------|---------|
| 4.1 | Vue matérialisée permissions (refresh 1min) | >200 agents |
| 4.2 | PgBouncer connection pooling | >500 connexions |
| 4.3 | Read replicas analytics | >10K users |
| 4.4 | Event Bus → CloudAMQP/Pub-Sub | >1000 events/sec |

---

## Architecture Cible

```
┌─────────────────────────────────────────────┐
│              RBAC Engine Core                │
├─────────────────────────────────────────────┤
│ ① Policy Store (PostgreSQL)                 │
│   roles + parent_role_id (hiérarchie)       │
│   permissions + scope JSONB                 │
│   CTE récursive résolution                  │
│                                             │
│ ② Policy Decision Point (3-tier cache)      │
│   L1: in-process dict (0ms)                 │
│   L2: Redis (1-2ms)                         │
│   L3: PostgreSQL CTE (<10ms)                │
│                                             │
│ ③ Event Bus (in-process → CloudAMQP)        │
│   Auto-audit, auto-cache-invalidation       │
│   WebSocket real-time UI                    │
│                                             │
│ ④ Admin Command Center                      │
│   Cmd+K, bulk actions, inline edit          │
│   Permission simulator, export              │
└─────────────────────────────────────────────┘
```
