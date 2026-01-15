# Analyse Module - Gestion des Acces (Access Management)
**Date:** 2026-01-15
**Environnement:** https://taxasge.emacsah.com (staging)
**Backend:** https://taxasge-backend-staging-392159428433.us-central1.run.app

---

## Resume Executif

| Categorie | Valeur |
|-----------|--------|
| Tables DB | 7 (roles, permissions, role_permissions, user_permissions, agent_profiles, agent_workloads, assignments) |
| Endpoints API | 15+ |
| Frontend Modules | 5 (users-admin, roles-admin, permissions-admin, agents-admin, assignments) |
| Statut Alignement | **OK - Coherent** |

---

## 1. Mapping DB Schema <-> Backend Models <-> Frontend Types

### 1.1 Table: roles

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| id | uuid | RoleResponse.id (str) | Role.id (string) | OK |
| name | varchar(100) | RoleResponse.name | Role.name | OK |
| code | varchar(50) | RoleResponse.code | Role.code | OK |
| entity_type | varchar(50) | RoleResponse.entity_type | Role.entity_type | OK |
| description | text | RoleResponse.description | Role.description | OK |
| is_system | boolean | RoleResponse.is_system | Role.is_system | OK |
| created_at | timestamp | RoleResponse.created_at | Role.created_at | OK |
| updated_at | timestamp | RoleResponse.updated_at | Role.updated_at | OK |
| created_by | uuid | RoleResponse.created_by | Role.created_by | OK |

**Backend Model:** `app/modules/permissions/models/role.py:RoleResponse`
**Frontend Type:** `modules/roles-admin/types/index.ts:Role`

### 1.2 Table: permissions

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| id | uuid | Permission.id | Permission.id | OK |
| name | varchar(100) | Permission.name | Permission.name | OK |
| resource | varchar(50) | Permission.resource | Permission.resource | OK |
| action | varchar(50) | Permission.action | Permission.action | OK |
| description | text | Permission.description | Permission.description | OK |
| is_critical | boolean | Permission.is_critical | Permission.is_critical | OK |
| module_name | varchar(50) | Permission.module_name | Permission.module_name | OK |
| created_at | timestamp | Permission.created_at | Permission.created_at | OK |
| updated_at | timestamp | Permission.updated_at | Permission.updated_at | OK |

**Backend Model:** `app/modules/permissions/models/permission.py:Permission`
**Frontend Type:** `modules/permissions-admin/types/index.ts:Permission`

### 1.3 Table: role_permissions

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| role_id | uuid (PK) | RolePermission.role_id | RolePermission.role_id | OK |
| permission_id | uuid (PK) | RolePermission.permission_id | RolePermission.permission_id | OK |
| granted | boolean | RolePermission.granted | RolePermission.granted | OK |
| created_at | timestamp | RolePermission.created_at | RolePermission.created_at | OK |
| created_by | uuid | RolePermission.created_by | RolePermission.created_by | OK |

**Backend Model:** `app/modules/permissions/models/role_permission.py`
**Frontend Type:** `modules/permissions-admin/types/index.ts:RolePermission`

### 1.4 Table: user_permissions

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| user_id | uuid (PK) | UserPermission.user_id | UserPermission.user_id | OK |
| permission_id | uuid (PK) | UserPermission.permission_id | UserPermission.permission_id | OK |
| granted | boolean | UserPermission.granted | UserPermission.granted | OK |
| granted_by | uuid | UserPermission.granted_by | UserPermission.granted_by | OK |
| granted_at | timestamp | UserPermission.granted_at | UserPermission.granted_at | OK |
| expires_at | timestamp | UserPermission.expires_at | UserPermission.expires_at | OK |
| reason | text | UserPermission.reason | UserPermission.reason | OK |

**Backend Model:** `app/modules/permissions/models/user_permission.py`
**Frontend Type:** `modules/permissions-admin/types/index.ts:UserPermission`

### 1.5 Table: agent_profiles

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| id | uuid | AgentProfileWithDetails.id | AgentProfile.id | OK |
| user_id | uuid | AgentProfileWithDetails.user_id | AgentProfile.user_id | OK |
| agent_type | varchar(30) | AgentProfileWithDetails.agent_type | AgentProfile.agent_type | OK |
| entity_id | uuid | AgentProfileWithDetails.entity_id | AgentProfile.entity_id | OK |
| ministry_id | integer | AgentProfileWithDetails.ministry_id | AgentProfile.ministry_id | OK |
| agent_role | varchar(50) | AgentProfileWithDetails.agent_role | AgentProfile.agent_role | OK |
| can_approve_unlimited | boolean | AgentProfileWithDetails.can_approve_unlimited | AgentProfile.can_approve_unlimited | OK |
| max_approval_amount | numeric | AgentProfileWithDetails.max_approval_amount | AgentProfile.max_approval_amount | OK |
| can_escalate | boolean | AgentProfileWithDetails.can_escalate | AgentProfile.can_escalate | OK |
| can_assign_tasks | boolean | AgentProfileWithDetails.can_assign_tasks | AgentProfile.can_assign_tasks | OK |
| can_reassign | boolean | AgentProfileWithDetails.can_reassign | AgentProfile.can_reassign | OK |
| specializations | jsonb | AgentProfileWithDetails.specializations | AgentProfile.specializations | OK |
| working_hours_start | time | AgentProfileWithDetails.working_hours_start | AgentProfile.working_hours_start | OK |
| working_hours_end | time | AgentProfileWithDetails.working_hours_end | AgentProfile.working_hours_end | OK |
| working_days | integer[] | AgentProfileWithDetails.working_days | AgentProfile.working_days | OK |
| is_active | boolean | AgentProfileWithDetails.is_active | AgentProfile.is_active | OK |
| is_backup_agent | boolean | AgentProfileWithDetails.is_backup_agent | AgentProfile.is_backup_agent | OK |
| backup_for_profile_id | uuid | AgentProfileWithDetails.backup_for_profile_id | AgentProfile.backup_for_profile_id | OK |
| assigned_at | timestamp | AgentProfileWithDetails.assigned_at | AgentProfile.assigned_at | OK |
| assigned_by | uuid | AgentProfileWithDetails.assigned_by | AgentProfile.assigned_by | OK |
| deactivated_at | timestamp | AgentProfileWithDetails.deactivated_at | AgentProfile.deactivated_at | OK |
| deactivated_by | uuid | AgentProfileWithDetails.deactivated_by | AgentProfile.deactivated_by | OK |
| deactivation_reason | text | AgentProfileWithDetails.deactivation_reason | AgentProfile.deactivation_reason | OK |

**Backend Model:** `app/modules/agents/models/agent_profile.py:AgentProfileWithDetails`
**Frontend Type:** `modules/agents-admin/types/index.ts:AgentProfile`

### 1.6 Table: agent_workloads

| Colonne DB | Type DB | Backend Model | Frontend Type | Status |
|------------|---------|---------------|---------------|--------|
| id | uuid | AgentWorkload.id | AgentWorkload.id | OK |
| agent_profile_id | uuid | AgentWorkload.agent_profile_id | AgentWorkload.agent_profile_id | OK |
| current_assignments | integer | AgentWorkload.current_assignments | AgentWorkload.current_assignments | OK |
| pending_declarations | integer | AgentWorkload.pending_declarations | AgentWorkload.pending_declarations | OK |
| in_progress_declarations | integer | AgentWorkload.in_progress_declarations | AgentWorkload.in_progress_declarations | OK |
| max_concurrent_assignments | integer | AgentWorkload.max_concurrent_assignments | AgentWorkload.max_concurrent_assignments | OK |
| capacity_percentage | numeric | AgentWorkload.capacity_percentage | AgentWorkload.capacity_percentage | OK |
| workload_status | enum | AgentWorkload.workload_status | AgentWorkload.workload_status | OK |
| availability | enum | AgentWorkload.availability | AgentWorkload.availability | OK |
| avg_processing_time_hours | numeric | AgentWorkload.avg_processing_time_hours | AgentWorkload.avg_processing_time_hours | OK |

**Backend Model:** `app/modules/agents/models/agent.py:AgentWorkload`
**Frontend Type:** `modules/agents-admin/types/index.ts:AgentWorkload`

---

## 2. Workflows Identifies

### 2.1 Dashboard Admin Stats

```
Frontend: StatsCards.tsx
  ↓
usersApi.getStats() → GET /api/v1/admin/users/stats
  → Permission: users.view_stats
  → Returns: total_users, active_users, new_users_this_month, users_by_role, users_by_status

auditLogsApi.getStats() → GET /api/v1/audit-logs/stats
  → Permission: audit.view_stats
  → Returns: total_logs, recent_activity
```

### 2.2 Workflow CRUD Roles

```
LIST:      GET /api/v1/roles              → roles.view
CREATE:    POST /api/v1/roles             → roles.create
READ:      GET /api/v1/roles/{id}         → roles.view
UPDATE:    PUT /api/v1/roles/{id}         → roles.edit
DELETE:    DELETE /api/v1/roles/{id}      → roles.delete

Assign Perms: POST /api/v1/roles/{id}/permissions → roles.edit
Remove Perms: DELETE /api/v1/roles/{id}/permissions → roles.edit
```

### 2.3 Workflow User Permission Overrides

```
LIST:   GET /api/v1/user-permissions/{user_id}              → permissions.view_user
GRANT:  POST /api/v1/user-permissions/{user_id}             → permissions.grant_user
REVOKE: DELETE /api/v1/user-permissions/{user_id}/{perm_id} → permissions.revoke_user
```

### 2.4 Workflow CRUD Agents

```
LIST:        GET /api/v1/agents                   → agents.view_all
CREATE:      POST /api/v1/agents/complete         → agents.create
READ:        GET /api/v1/agents/{profile_id}      → agents.view
UPDATE:      PUT /api/v1/agents/{profile_id}      → agents.edit
DEACTIVATE:  PUT /api/v1/agents/{profile_id}      → agents.edit (is_active: false)

Admin CREATE: POST /api/v1/agents/admin           → users.create
```

### 2.5 Workflow Assignments

```
LIST:     GET /api/v1/assignments          → assignments.view
CREATE:   POST /api/v1/assignments         → assignments.create
UPDATE:   PUT /api/v1/assignments/{id}     → assignments.edit
REASSIGN: POST /api/v1/assignments/reassign → assignments.reassign
```

---

## 3. Analyse Dashboard Admin

### 3.1 Composant StatsCards

**Fichier:** `packages/web/src/modules/admin/components/StatsCards.tsx`

```typescript
// API Calls
const { data: userStats } = useQuery({
  queryKey: ['admin', 'user-stats'],
  queryFn: () => usersApi.getStats(),
});

const { data: auditStats } = useQuery({
  queryKey: ['admin', 'audit-stats'],
  queryFn: () => auditLogsApi.getStats(),
});
```

### 3.2 Backend Endpoint Stats

**Fichier:** `packages/backend/app/modules/admin/api/user_management_routes.py:425`

```python
@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    admin_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.view_stats"))
):
    stats = await user_repository.get_user_stats()
    return stats
```

### 3.3 Repository Implementation

**Fichier:** `packages/backend/app/modules/users/repositories/user_repository.py:342`

```python
async def get_user_stats(self) -> UserStats:
    total_users = await self.count()
    active_users = await self.count({"status": UserStatus.active.value})

    # New users this month
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    new_users_query = "SELECT COUNT(*) FROM users WHERE created_at >= $1"
    new_users_this_month = await self.db_manager.execute_scalar(new_users_query, start_of_month)

    # Users by role
    role_stats_query = "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    users_by_role = {row["role"]: row["count"] for row in await self.db_manager.execute_query(role_stats_query)}

    # Users by status
    status_stats_query = "SELECT status, COUNT(*) as count FROM users GROUP BY status"
    users_by_status = {row["status"]: row["count"] for row in await self.db_manager.execute_query(status_stats_query)}

    return UserStats(
        total_users=total_users,
        active_users=active_users,
        new_users_this_month=new_users_this_month,
        users_by_role=users_by_role,
        users_by_status=users_by_status
    )
```

---

## 4. Permissions Requises pour Admin

### 4.1 Module Permissions Seedes

| Permission | Description | Module |
|------------|-------------|--------|
| users.view_stats | Ver estadisticas de usuarios | user |
| audit.view_stats | Ver estadisticas de auditoria | audit |
| roles.view | Ver roles | permissions |
| roles.create | Crear roles | permissions |
| roles.edit | Editar roles | permissions |
| roles.delete | Eliminar roles | permissions |
| permissions.view | Ver permisos | permissions |
| permissions.view_user | Ver permisos de usuario | permissions |
| permissions.grant_user | Otorgar permisos a usuario | permissions |
| permissions.revoke_user | Revocar permisos de usuario | permissions |
| agents.view_all | Ver todos los agentes | agents |
| agents.create | Crear agentes | agents |
| agents.edit | Editar agentes | agents |

### 4.2 Verification Admin Role

L'utilisateur admin (role='admin') a auto-approbation dans le middleware:

```python
# permission_service.py:66-74
# Check if user is admin (admins have all permissions)
user_query = "SELECT role FROM users WHERE id = $1"
row = await self.db.fetchrow(user_query, user_id)
if row and row["role"] == "admin":
    return True  # Admins auto-approved
```

---

## 5. Problemes Potentiels Identifies

### 5.1 Dashboard Stats - Aucun Bug Identifie

Le code backend et frontend semble correctement aligne:
- L'endpoint `/admin/users/stats` retourne `UserStats` avec tous les champs necessaires
- Le frontend attend les memes champs
- La permission `users.view_stats` est verifiee

### 5.2 Verification Necessaire

Pour confirmer que le dashboard charge les donnees:
1. Tester avec un utilisateur admin
2. Verifier que la permission `users.view_stats` est accordee
3. Verifier les logs backend pour erreurs

---

## 6. Fichiers Cles

### Backend
- `app/modules/admin/api/user_management_routes.py` - Routes users admin
- `app/modules/permissions/api/role_routes.py` - Routes roles
- `app/modules/permissions/api/permission_routes.py` - Routes permissions
- `app/modules/permissions/api/user_permission_routes.py` - Routes user perms
- `app/modules/agents/api/agent_routes.py` - Routes agents
- `app/modules/users/repositories/user_repository.py` - Repository users

### Frontend
- `modules/admin/components/StatsCards.tsx` - Dashboard stats
- `modules/roles-admin/` - Gestion roles
- `modules/permissions-admin/` - Catalogue permissions
- `modules/agents-admin/` - Gestion agents
- `app/[locale]/(dashboard)/dashboard/admin/` - Pages admin

---

## 7. Recommandations

1. **Tester le dashboard** avec les credentials admin pour verifier le chargement des stats
2. **Verifier les permissions** de l'utilisateur admin dans la DB
3. **Examiner les logs** backend pour toute erreur silencieuse
4. **Executer le test E2E** avec le fichier de commande cree: `.claude/commands/e2e-gestion-acces.md`

---

*Rapport genere automatiquement - 2026-01-15*
