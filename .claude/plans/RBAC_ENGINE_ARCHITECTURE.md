# RBAC Engine Core — Architecture Finale

**Date** : 2026-03-10
**Statut** : IMPLEMENTEE (Phases 0-4.1)

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RBAC ENGINE CORE — TaxasGE                          │
│                                                                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  ④ FRONTEND   │◄──│  ③ EVENT BUS +   │◄──│  ① POLICY STORE          │  │
│  │  Admin Center │    │  REAL-TIME       │    │  (PostgreSQL)            │  │
│  └──────┬───────┘    └────────┬─────────┘    └──────────┬───────────────┘  │
│         │                     │                          │                   │
│         │            ┌────────▼─────────┐    ┌──────────▼───────────────┐  │
│         └───────────►│  ② POLICY        │◄──│  MATERIALIZED VIEW       │  │
│          API calls   │  DECISION POINT  │    │  (effective_permissions)  │  │
│                      │  (3-tier cache)  │    └──────────────────────────┘  │
│                      └──────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ① Policy Store (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL — POLICY STORE                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA MODEL                            │    │
│  │                                                          │    │
│  │   roles                         permissions              │    │
│  │   ┌──────────────────┐          ┌──────────────────┐    │    │
│  │   │ id (PK)          │          │ id (PK)          │    │    │
│  │   │ code             │          │ name (unique)    │    │    │
│  │   │ name             │          │ module_name      │    │    │
│  │   │ parent_role_id ──┼──┐       │ is_critical      │    │    │
│  │   │ entity_type      │  │       │ description      │    │    │
│  │   │ is_system        │  │       └────────┬─────────┘    │    │
│  │   │ menu_config      │  │                │              │    │
│  │   │ dashboard_config │  │                │              │    │
│  │   │ default_agent_   │  │                │              │    │
│  │   │   config (JSONB) │  │                │              │    │
│  │   └────────┬─────────┘  │                │              │    │
│  │            │             │                │              │    │
│  │            │  ┌──────────┘                │              │    │
│  │            │  │  Recursive                │              │    │
│  │            │  │  Hierarchy                │              │    │
│  │            │  │                           │              │    │
│  │            │  │  admin                    │              │    │
│  │            │  │  ├── admin_agents         │              │    │
│  │            │  │  ├── admin_config         │              │    │
│  │            │  │  ├── admin_security       │              │    │
│  │            │  │  └── admin_support        │              │    │
│  │            │  │                           │              │    │
│  │            │  │  supervisor_*             │              │    │
│  │            │  │  └── agent_*              │              │    │
│  │            │  │                           │              │    │
│  │            ▼  ▼                           ▼              │    │
│  │   role_permissions              user_permissions         │    │
│  │   ┌──────────────────┐          ┌──────────────────┐    │    │
│  │   │ role_id (FK)     │          │ user_id (FK)     │    │    │
│  │   │ permission_id(FK)│          │ permission_id(FK)│    │    │
│  │   │ granted (bool)   │          │ granted (bool)   │    │    │
│  │   │ scope (JSONB)    │          │ scope (JSONB)    │    │    │
│  │   └──────────────────┘          │ expires_at       │    │    │
│  │                                  │ granted_by       │    │    │
│  │                                  └──────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PERMISSION RESOLUTION (CTE)                 │    │
│  │                                                          │    │
│  │  effective_perms = (role_hierarchy_perms               │    │
│  │                     - user_denies)                       │    │
│  │                     UNION user_grants                    │    │
│  │                                                          │    │
│  │  WITH RECURSIVE role_chain AS (                         │    │
│  │    user.role_id → roles.parent_role_id → ...            │    │
│  │  )                                                       │    │
│  │  role_perms = all granted=TRUE from chain               │    │
│  │  user_denies = user_permissions WHERE granted=FALSE     │    │
│  │  user_grants = user_permissions WHERE granted=TRUE      │    │
│  │  → FINAL = (role_perms - denies) ∪ grants              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            TRIGGERS & FUNCTIONS                          │    │
│  │                                                          │    │
│  │  ┌─────────────────────┐  ┌────────────────────────┐   │    │
│  │  │ audit_role_perms()  │  │ audit_user_perms()     │   │    │
│  │  │ audit_roles()       │  │ → permission_audit_log │   │    │
│  │  │ → 8 triggers        │  └────────────────────────┘   │    │
│  │  └─────────────────────┘                                │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ notify_rbac_change()                             │    │    │
│  │  │ → NOTIFY 'rbac_changes' (4 triggers)            │    │    │
│  │  │                                                   │    │    │
│  │  │  trg_notify_role_permissions (INSERT/UPDATE/DEL) │    │    │
│  │  │  trg_notify_user_permissions (INSERT/UPDATE/DEL) │    │    │
│  │  │  trg_notify_roles           (UPDATE/DELETE)      │    │    │
│  │  │  trg_notify_users_role      (UPDATE role_id)     │    │    │
│  │  │                                                   │    │    │
│  │  │  Payload: {table, op, user_id, role_id, ...}     │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ effective_permissions_mv (Materialized View)     │    │    │
│  │  │ → 403 rows (user_id × permission_name)          │    │    │
│  │  │ → 3 indexes (unique, user, perm)                 │    │    │
│  │  │ → refresh_effective_permissions() every 60s      │    │    │
│  │  │ → REFRESH CONCURRENTLY (non-blocking)            │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ v_overprivileged_users_detection (View)          │    │    │
│  │  │ → Risk scoring: +1/grant, +5/critical,           │    │    │
│  │  │   +10 if >50% above role avg, +15 if >10 crit   │    │    │
│  │  │ → risk_level: LOW/MEDIUM/HIGH/CRITICAL           │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  scope JSONB (Migration 199):                           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ {"entity_codes": ["CNEDOGE", "DGT"]}            │    │    │
│  │  │ → GIN indexes for @> containment queries         │    │    │
│  │  │ → has_permission_scoped(user, perm, entity)      │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  Migrations: 197, 198, 199, 200                         │    │
└──┼──────────────────────────────────────────────────────────┘    │
   │                                                                │
   └────────────────────────────────────────────────────────────────┘
```

---

## ② Policy Decision Point (3-Tier Cache)

```
┌─────────────────────────────────────────────────────────────────┐
│              POLICY DECISION POINT — 3-TIER CACHE                │
│                                                                  │
│  Request: has_permission(user_id, "service_requests.approve")    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  L1: In-Process Dict                                0ms  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ _permission_cache = {                              │  │   │
│  │  │   "user:abc:perms": {"service_requests.approve",   │  │   │
│  │  │                       "payments.view", ...}        │  │   │
│  │  │ }                                                  │  │   │
│  │  │ TTL: same as L2 (piggybacked)                     │  │   │
│  │  └──────────────────────┬─────────────────────────────┘  │   │
│  │                         │ MISS                            │   │
│  │                         ▼                                 │   │
│  │  L2: Redis / Upstash                             1-2ms   │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Key: "perms:user:{user_id}"                        │  │   │
│  │  │ Value: JSON set of permission names                │  │   │
│  │  │ TTL: 10 minutes (get_permissions_cache())          │  │   │
│  │  │                                                    │  │   │
│  │  │ Key: "func:status:{matricula}"                     │  │   │
│  │  │ Value: funcionario status                          │  │   │
│  │  │ TTL: 5 minutes                                     │  │   │
│  │  │                                                    │  │   │
│  │  │ Invalidation: instant via RBACListener             │  │   │
│  │  └──────────────────────┬─────────────────────────────┘  │   │
│  │                         │ MISS                            │   │
│  │                         ▼                                 │   │
│  │  L3: PostgreSQL CTE                              <10ms   │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ RECURSIVE role_chain → role_perms → denies/grants  │  │   │
│  │  │ MATERIALIZED CTEs for plan stability               │  │   │
│  │  │ Result cached in L2 + L1 for next request          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Cache Warming:                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Login → auth_service → fetch all permissions → Redis    │   │
│  │  Result: 0 cold-start latency for first request          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Permission Check Flow:                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. @require_permission("x") decorator                    │   │
│  │  2. → has_permission(user_id, "x", user=current_user)    │   │
│  │  3. → Check L1 (in-memory) → HIT? return                 │   │
│  │  4. → Check L2 (Redis) → HIT? populate L1, return        │   │
│  │  5. → Check L3 (CTE) → populate L2+L1, return            │   │
│  │  6. → Check user_permission deny (explicit override)      │   │
│  │  7. → Return True/False                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ③ Event Bus + Real-Time

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EVENT BUS + REAL-TIME PIPELINE                         │
│                                                                          │
│                                                                          │
│  ┌──────────────┐     NOTIFY      ┌───────────────┐                    │
│  │  PostgreSQL   │ ──────────────► │  RBACListener  │                    │
│  │  Trigger      │  'rbac_changes' │  (asyncpg      │                    │
│  │               │  {table, op,    │   LISTEN)       │                    │
│  │  4 triggers:  │   user_id,      │                 │                    │
│  │  role_perms   │   role_id}      │  Singleton:     │                    │
│  │  user_perms   │                 │  rbac_listener  │                    │
│  │  roles        │                 │                 │                    │
│  │  users(role)  │                 │  Dedicated conn │                    │
│  └──────────────┘                 │  (not from pool)│                    │
│                                    └───────┬─────────┘                    │
│                                            │                              │
│                              ┌─────────────┼─────────────┐               │
│                              │             │             │               │
│                              ▼             ▼             ▼               │
│                    ┌─────────────┐ ┌────────────┐ ┌────────────┐        │
│                    │ Redis Cache  │ │  EventBus   │ │ WebSocket  │        │
│                    │ Invalidation │ │  (in-proc)  │ │  Manager   │        │
│                    │              │ │             │ │            │        │
│                    │ user_perms:  │ │ 8 RBAC      │ │ broadcast  │        │
│                    │  invalidate  │ │ event types │ │ to admin   │        │
│                    │  user or ALL │ │             │ │ clients    │        │
│                    │              │ │ Handlers:   │ │            │        │
│                    │ Targeted:    │ │ • Audit     │ │ /ws/admin  │        │
│                    │  user change │ │ • Notif     │ │ JWT auth   │        │
│                    │  → 1 user    │ │ • Queue     │ │ admin+sup  │        │
│                    │              │ │ • Payment   │ │            │        │
│                    │ Broad:       │ │ • Verif     │ │ Reconnect  │        │
│                    │  role change │ │             │ │ w/ backoff │        │
│                    │  → all users │ └────────────┘ └────────────┘        │
│                    └─────────────┘                                        │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  EventType (8 RBAC events):                                   │       │
│  │                                                                │       │
│  │  RBAC_PERMISSION_GRANTED    "rbac.permission.granted"         │       │
│  │  RBAC_PERMISSION_REVOKED    "rbac.permission.revoked"         │       │
│  │  RBAC_ROLE_UPDATED          "rbac.role.updated"               │       │
│  │  RBAC_ROLE_CREATED          "rbac.role.created"               │       │
│  │  RBAC_ROLE_DELETED          "rbac.role.deleted"               │       │
│  │  RBAC_USER_ROLE_CHANGED     "rbac.user.role_changed"          │       │
│  │  RBAC_AGENT_DEACTIVATED     "rbac.agent.deactivated"          │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  Scheduler Jobs:                                               │       │
│  │                                                                │       │
│  │  refresh-effective-permissions   │ 60s  │ MV CONCURRENTLY     │       │
│  │  process-assignment-outbox       │ 5s   │ Auto-assignment     │       │
│  │  escalation-sla-check            │ 60s  │ SLA monitoring      │       │
│  │  payment-sla-check               │ 24h  │ Cash payment expiry │       │
│  │  ... (12 jobs total)                                           │       │
│  └───────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ④ Admin Command Center (Frontend)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ADMIN COMMAND CENTER (FRONTEND)                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  DashboardLayout                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  AdminCommandPalette (Cmd+K / Ctrl+K)                      │  │    │
│  │  │  ├── 15 navigation items (dashboard, roles, agents, ...)   │  │    │
│  │  │  └── 3 quick actions (create role, export, matrix)         │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │  useRbacWebSocket() ◄──── ws://host/ws/admin?token=<jwt>        │    │
│  │  ├── Auto-reconnect (exponential backoff, max 5 retries)        │    │
│  │  ├── Ping/pong keepalive (30s)                                   │    │
│  │  └── Auto-invalidate React Query caches on RBAC events          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  /admin/roles — Roles & Permissions Page                          │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  4 Tabs:                                                    │  │    │
│  │  │                                                             │  │    │
│  │  │  ┌─────────┬──────────────┬──────────────┬────────────┐   │  │    │
│  │  │  │  Roles  │  Permissions  │ User Perms   │ Simulator  │   │  │    │
│  │  │  └────┬────┴──────┬───────┴──────┬───────┴─────┬──────┘   │  │    │
│  │  │       │           │              │             │            │  │    │
│  │  │       ▼           ▼              ▼             ▼            │  │    │
│  │  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │  │    │
│  │  │  │RolesTab │ │Catalog   │ │UserPerms │ │Simulator   │    │  │    │
│  │  │  │         │ │Tab       │ │Tab       │ │Tab         │    │  │    │
│  │  │  │• Multi  │ │• All     │ │• User    │ │            │    │  │    │
│  │  │  │  select │ │  perms   │ │  grants  │ │ 3 sub-tabs:│    │  │    │
│  │  │  │• Bulk   │ │• By      │ │• Deny    │ │ ┌────────┐ │    │  │    │
│  │  │  │  delete │ │  module  │ │  overrides│ │ │Role    │ │    │  │    │
│  │  │  │• Clone  │ │• Critical│ │          │ │ │Perm Sim│ │    │  │    │
│  │  │  │• CSV    │ │  flag    │ │          │ │ ├────────┤ │    │  │    │
│  │  │  │  export │ │          │ │          │ │ │User    │ │    │  │    │
│  │  │  │• Sheet  │ │          │ │          │ │ │Role Sim│ │    │  │    │
│  │  │  │  panel  │ │          │ │          │ │ ├────────┤ │    │  │    │
│  │  │  │         │ │          │ │          │ │ │Anomaly │ │    │  │    │
│  │  │  │         │ │          │ │          │ │ │Detect  │ │    │  │    │
│  │  │  └─────────┘ └──────────┘ └──────────┘ │ └────────┘ │    │  │    │
│  │  │                                         └────────────┘    │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  /admin/agents — Agents Page                                      │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Inline Switch toggle (is_active) — replaces dropdown      │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │ Agent Name    │ Role            │ Entity  │ Active   │  │  │    │
│  │  │  │ Juan Perez    │ agent_cnedoge   │ CNEDOGE │ [●━━━]   │  │  │    │
│  │  │  │ Maria Lopez   │ supervisor_dgt  │ DGT     │ [━━━●]   │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Permission Simulator — Dry-Run RBAC Changes                      │    │
│  │                                                                    │    │
│  │  POST /permissions/simulate/role-permission                       │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Input: role_id + permission_names[] + action(grant/revoke)│  │    │
│  │  │  Output:                                                    │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  affected_users_count: 3                             │  │  │    │
│  │  │  │  ┌─────────┬──────────┬─────────────┬────────────┐  │  │  │    │
│  │  │  │  │ User    │ Role     │ Changes     │ Perms      │  │  │  │    │
│  │  │  │  │ Juan    │ agent_*  │ +perm.view  │ 24 → 25    │  │  │  │    │
│  │  │  │  │ Maria   │ sup_*    │ +perm.view  │ 39 → 40    │  │  │  │    │
│  │  │  │  │ Pedro   │ agent_*  │ +perm.view  │ 24 → 25    │  │  │  │    │
│  │  │  │  └─────────┴──────────┴─────────────┴────────────┘  │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  POST /permissions/simulate/user-role-change                      │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Input: user_id + new_role_id                              │  │    │
│  │  │  Output:                                                    │  │    │
│  │  │  ┌─────────────────────┬──────────────────────┐            │  │    │
│  │  │  │  + Permisos ganados │  - Permisos perdidos  │            │  │    │
│  │  │  │  ┌───────────────┐  │  ┌────────────────┐   │            │  │    │
│  │  │  │  │ agents.manage │  │  │ payments.view  │   │            │  │    │
│  │  │  │  │ roles.view    │  │  │ treasury.stats │   │            │  │    │
│  │  │  │  └───────────────┘  │  └────────────────┘   │            │  │    │
│  │  │  │  24 → 30 permisos   │  6 unchanged          │            │  │    │
│  │  │  └─────────────────────┴──────────────────────┘            │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  GET /permissions/anomalies/overprivileged                        │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Risk scoring engine (v_overprivileged_users_detection)    │  │    │
│  │  │  ┌─────────┬──────────┬──────────┬──────────────────┐     │  │    │
│  │  │  │ User    │ Role     │ Risk     │ Score            │     │  │    │
│  │  │  │ Admin   │ admin    │ CRITICAL │ 85               │     │  │    │
│  │  │  │ Juan    │ agent_*  │ MEDIUM   │ 32               │     │  │    │
│  │  │  └─────────┴──────────┴──────────┴──────────────────┘     │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow — Permission Check (Hot Path)

```
  HTTP Request
  GET /api/v1/service-requests
  Authorization: Bearer <jwt>
       │
       ▼
  ┌─────────────────────────┐
  │  auth_middleware          │
  │  get_current_user()      │
  │  → JWT verify (CPU only) │
  │  → Redis revocation check│
  │  → Idle timeout check    │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │  @require_permission     │
  │  ("service_requests.     │
  │   view")                 │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────┐
  │  has_permission(user_id, "service_requests.view")│
  │                                                   │
  │  1. L1 cache? → HIT (0ms)                        │
  │  2. L2 Redis? → HIT (1-2ms) → populate L1       │
  │  3. L3 CTE?   → HIT (<10ms) → populate L2, L1   │
  │                                                   │
  │  Check explicit deny:                             │
  │  user_permissions WHERE granted=FALSE             │
  │  → deny wins over role grant                      │
  │                                                   │
  │  Result: True/False                               │
  └──────────────────────────────┬────────────────────┘
                                 │
                          True   │   False
                         ┌───────┴───────┐
                         ▼               ▼
                    ┌─────────┐   ┌────────────┐
                    │  200 OK │   │  403 Forbid │
                    └─────────┘   └────────────┘
```

---

## Data Flow — RBAC Change (Real-Time)

```
  Admin clicks "Assign permission to role"
  POST /api/v1/roles/{id}/permissions
       │
       ▼
  ┌─────────────────────────┐
  │  INSERT INTO             │
  │  role_permissions        │
  │  (role_id, perm_id,     │
  │   granted=TRUE)          │
  └──────────┬──────────────┘
             │
             ▼  PostgreSQL Trigger fires
  ┌─────────────────────────────────────────────────────┐
  │  notify_rbac_change()                                │
  │  NOTIFY 'rbac_changes',                              │
  │    '{"table":"role_permissions","op":"INSERT",        │
  │      "role_id":"xxx"}'                                │
  └──────────┬──────────────────────────────────────────┘
             │
             ▼  asyncpg LISTEN callback (< 1ms)
  ┌─────────────────────────────────────────────────────┐
  │  RBACListener._handle_rbac_change()                  │
  │                                                       │
  │  ① invalidate_all_permissions_cache()                │
  │     → Redis DEL perms:user:* (all users)             │
  │     → < 50ms total                                    │
  │                                                       │
  │  ② EventBus.publish_nowait(RBAC_PERMISSION_GRANTED)  │
  │     → Audit handlers, notification handlers           │
  │                                                       │
  │  ③ ws_manager.broadcast("rbac.permission.granted")   │
  │     → All connected admin WebSocket clients           │
  │     → asyncio.gather (parallel send, 5s timeout)      │
  └──────────┬──────────────────────────────────────────┘
             │
             ▼  Frontend WebSocket receives event
  ┌─────────────────────────────────────────────────────┐
  │  useRbacWebSocket() onmessage                        │
  │  → queryClient.invalidateQueries(['roles'])          │
  │  → queryClient.invalidateQueries(['permissions'])    │
  │  → UI auto-refreshes with new data                   │
  └─────────────────────────────────────────────────────┘
```

---

## Fichiers Implémentés

```
packages/backend/
├── app/
│   ├── core/
│   │   ├── cache.py                    # HybridCache (L1 in-memory + L2 Redis)
│   │   ├── rbac_listener.py            # PostgreSQL NOTIFY → Redis + EventBus + WS
│   │   ├── ws_manager.py               # WebSocket connection manager (broadcast)
│   │   ├── ws_routes.py                # WS /ws/admin endpoint (JWT auth)
│   │   ├── scheduler.py                # +refresh-effective-permissions (60s)
│   │   └── events/
│   │       ├── event_bus.py            # In-process async EventBus
│   │       └── event_types.py          # +8 RBAC event types
│   │
│   └── modules/permissions/
│       ├── api/
│       │   ├── permission_routes.py    # +simulate endpoints + overprivileged
│       │   └── role_routes.py          # +clone, +bulk-delete, +export-csv
│       ├── middleware/
│       │   └── permission_middleware.py # str(current_user.id) fix
│       ├── repositories/
│       │   └── user_permission_repo.py # RECURSIVE CTE, has_permission_scoped()
│       └── services/
│           └── permission_simulator.py # Dry-run RBAC changes (batch MV query)
│
├── database/migrations/
│   ├── 197_fix_business_role_permissions.sql
│   ├── 198_role_hierarchy_and_audit_triggers.sql
│   ├── 199_permission_scoping_and_cache_events.sql
│   └── 200_effective_permissions_materialized_view.sql

packages/web/src/
├── modules/roles-admin/
│   ├── components/
│   │   ├── RolesTab.tsx                # +multi-select, bulk, clone, CSV, sheet
│   │   ├── PermissionSimulatorTab.tsx  # NEW — 3 sub-tabs simulator
│   │   └── ...
│   ├── hooks/
│   │   ├── useRoles.ts                # +useCloneRole, useBulkDelete, useSimulate*
│   │   └── useRbacWebSocket.ts        # NEW — WS real-time + auto-invalidate
│   ├── services/
│   │   └── api.ts                     # +permissionsSimulatorApi
│   └── types/
│       └── index.ts                   # +Simulate*, OverprivilegedUser types
│
├── components/layout/
│   └── DashboardLayout.tsx            # +AdminCommandPalette
│
├── modules/admin/components/
│   └── AdminCommandPalette.tsx        # NEW — Cmd+K navigation
│
└── app/[locale]/(dashboard)/dashboard/admin/
    ├── roles/page.tsx                 # +Simulator tab (4 tabs)
    └── agents/page.tsx                # +Switch inline toggle
```

---

## Performance Metrics

| Metric | Avant | Après |
|--------|-------|-------|
| Permission check (cold) | 50-200ms (4-JOIN) | <10ms (CTE L3) |
| Permission check (warm) | 50-200ms | 0ms (L1) / 1-2ms (L2) |
| Cache invalidation latency | 10min (TTL expiry) | <50ms (NOTIFY) |
| Queries per permission check | 2-9 (sequential) | 1 (single CTE) |
| Queries per auth request | 3-4 (user+perms+func+supervisor) | 1 (JWT + cached) |
| Bulk agent deactivation | 30 clicks (3×10) | 4 clicks (select+confirm) |
| Clone a role | IMPOSSIBLE | 2 clicks |
| Permission simulation | IMPOSSIBLE | 1 API call |
| Admin navigation | Mouse only | Cmd+K (keyboard) |
| RBAC change → UI update | Manual refresh | Real-time (WebSocket) |

---

## Scale Readiness

| Threshold | Solution | Status |
|-----------|----------|--------|
| 1-50 agents | CTE + Redis cache | ✅ Active |
| 50-200 agents | Materialized View (60s refresh) | ✅ Active |
| >200 agents | MV as primary lookup (scheduler) | ✅ Ready |
| >500 connections | PgBouncer pooling | ⬜ Config only |
| >10K users | Read replicas (analytics) | ⬜ Infra only |
| >1000 events/sec | EventBus → CloudAMQP | ⬜ Migration |
