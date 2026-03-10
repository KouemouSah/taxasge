# Architecture : Flux Création Agents/Superviseurs, Rôles & Sidebars

> **Version** : 2.0 — Post Migration 201
> **Date** : 2026-03-10
> **Dernière vérification BD** : 2026-03-10 (données live Supabase)
> **Auteur** : Claude Opus 4.6

---

## Table des matières

1. [Vue d'ensemble RBAC](#1-vue-densemble-rbac)
2. [Hiérarchie des rôles (30 rôles)](#2-hiérarchie-des-rôles)
3. [Flux de création d'agent](#3-flux-de-création-dagent)
4. [Flux de création superviseur](#4-flux-de-création-superviseur)
5. [Flux de création admin](#5-flux-de-création-admin)
6. [Attribution des rôles & résolution permissions](#6-attribution-des-rôles--résolution-permissions)
7. [Sidebars par rôle](#7-sidebars-par-rôle)
8. [Matrice permissions complète](#8-matrice-permissions-complète)
9. [Entités & Workflows](#9-entités--workflows)
10. [Pages Admin (inventaire complet)](#10-pages-admin-inventaire-complet)
11. [Rapport critique & lacunes](#11-rapport-critique--lacunes)
12. [Fichiers clés](#12-fichiers-clés)

---

## 1. Vue d'ensemble RBAC

### Système 2 niveaux

```
NIVEAU 1 : users.role (PostgreSQL enum)
┌─────────────────────────────────────────────────────────────────────┐
│  citizen │ business │ accountant │ admin │ agent │ funcionario     │
└─────────────────────────────────────────────────────────────────────┘
    7p        14p          11p       208p    19-24p     (hérité)

NIVEAU 2 : roles table (30 rôles RBAC granulaires)
┌─────────────────────────────────────────────────────────────────────┐
│  id, code, parent_role_id, entity_type, menu_config, dashboard_    │
│  config, default_agent_config, is_system                           │
└─────────────────────────────────────────────────────────────────────┘

RÉSOLUTION : user_role_enum → users.role_id → roles → role_permissions
             + user_permissions (overrides) + parent_role_id (héritage CTE)
```

**Règle fondamentale** : Tous les agents ET superviseurs utilisent `user_role_enum = 'agent'`. La différenciation se fait uniquement via la table `roles` (RBAC granulaire) et le flag `agent_profiles.is_supervisor`.

### Chiffres clés (post-migration 201)

| Métrique | Valeur |
|----------|--------|
| Permissions totales | **208** (18 modules) |
| Rôles totaux | **30** (11 agent, 9 supervisor, 10 system/admin) |
| Rôles avec default_agent_config | **20/20** (100%) |
| Effective permissions MV rows | **407** |
| Users actifs | **8** (environnement dev) |

---

## 2. Hiérarchie des rôles

### Arbre complet

```
user_role_enum
├── citizen (7p) ─── is_system=true
├── business (14p) ── is_system=true
├── accountant (11p) ─ is_system=true
├── funcionario ────── (pas de rôle RBAC dédié, hérité de citizen)
│
├── admin ─────────── is_system=true, 208 permissions
│   ├── super_admin ── 290 permissions (admin + 82 exclusives)
│   ├── admin_agents ── 81p (Gestion agents, assignations, workloads)
│   ├── admin_config ── 56p (Communications, traductions, menus, webhooks)
│   ├── admin_services ─ 42p (Services fiscaux, entités, tarifs, workflows)
│   ├── admin_security ─ 26p (Audit, permissions, rôles)
│   └── admin_support ── 22p (Tickets, catégories, stats)
│
└── agent ─────────── user_role_enum='agent' pour TOUS
    │
    ├── AGENTS ENTITÉ (entity_type='agent', 19-24 perms directes)
    │   ├── agent_cnedoge_pasaporte ─── 24p
    │   ├── agent_cnedoge_residencia ── 24p
    │   ├── agent_dgt ──────────────── 24p
    │   ├── agent_extranjeria ─────── 24p
    │   ├── agent_itv ──────────────── 19p (pas de RDV)
    │   ├── agent_minfp ────────────── 24p
    │   ├── agent_ofive ────────────── 24p
    │   ├── agent_onrc ─────────────── 19p (pas de RDV)
    │   ├── agent_policia ──────────── 24p
    │   └── agent_tesoro ───────────── 23p
    │
    └── SUPERVISEURS ENTITÉ (entity_type='entity_agent')
        │ parent_role_id → agent correspondant (héritage CTE)
        │
        ├── supervisor_cnedoge_pasaporte ── 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_cnedoge_residencia ─ 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_dgt ────────────── 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_extranjeria ──────── 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_itv ──────────────── 39 direct + 19 hérités = 50 effectifs
        ├── supervisor_minfp ────────────── 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_ofive ────────────── 39 direct + 24 hérités = 55 effectifs
        ├── supervisor_onrc ─────────────── 39 direct + 19 hérités = 50 effectifs
        ├── supervisor_policia ──────────── 39 direct + 24 hérités = 55 effectifs
        └── supervisor_tesoro ──────────── 59 direct + 23 hérités = 66 effectifs
```

### Différence permissions agent_itv/agent_onrc (19p) vs autres (24p)

Les 5 permissions manquantes sont liées aux rendez-vous (ces entités n'en gèrent pas) :
- `service_request.cancel_appointment`
- `service_request.reschedule_appointment`
- `service_request.schedule_appointment`
- `service_request.view_appointments`
- `service_request.view_available_slots`

### Permissions exclusives supervisor_tesoro (vs entity supervisors)

34 permissions treasury-spécifiques (payment.*, treasury.*, receipt.*, webhook.*, reports.view_financial) :
- `treasury.*` (14 perms) : validate_payment, process_payment, reject_payment, reconcile, manage_settings, view_all, view_payment, view_reconciliation, anomaly CRUD, audit, exports, stats
- `payment.*` (12 perms) : cancel, reconcile, refund, update, view, view_all, view_reconciliation, receipt.*, payment_plan.*
- `webhook.update`, `webhook.view`
- `reports.view_financial`

---

## 3. Flux de création d'agent

### Architecture 2 étapes (invitation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ÉTAPE 1 : INVITATION (Admin)                             │
│                                                                             │
│  Page: /admin/agents/new?type=agent                                        │
│  Permission requise: agent.create                                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ FORMULAIRE CONTEXTUEL (7 cartes adaptatives)                         │  │
│  │                                                                       │  │
│  │ Carte 1: COMPTE         email, nom, prénom, tél, langue (es/fr/en)  │  │
│  │ Carte 2: ORGANISATION   type (ministry_agent | entity_agent)         │  │
│  │                          → ministère OU entité + localisation         │  │
│  │ Carte 3: RÔLE RBAC      dropdown rôles (entity_type='agent')        │  │
│  │                          + checkbox superviseur                       │  │
│  │ Carte 4: CAPACITÉS      [si superviseur] escalate, assign, reassign │  │
│  │ Carte 5: APPROBATION    [si entité paiement] montant max, illimité  │  │
│  │ Carte 6: PLANNING       heures début/fin, jours travaillés          │  │
│  │ Carte 7: RÉSUMÉ         erreurs (rouge) + warnings (orange)         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Pré-validation: POST /agents/validate → errors[] + warnings[]             │
│  Soumission:     POST /agents/invite                                        │
│                                                                             │
│  Backend (agent_profile_service.py):                                        │
│  1. Rate limit: 10 invitations/heure par admin                             │
│  2. Validation données agent (email unique, entité existe, etc.)           │
│  3. Génération code vérification 6 digits                                  │
│  4. INSERT INTO pending_registrations (metadata JSONB = tout le profil)    │
│  5. Envoi email invitation avec lien activation                            │
│  6. Retour AgentInviteResponse avec invitation_id                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                            📧 Email envoyé
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ÉTAPE 2 : ACTIVATION (Agent)                             │
│                                                                             │
│  Endpoint: POST /agents/activate                                            │
│  Input: { email, verification_code (6 digits), password }                  │
│  Aucune permission requise (lien public avec code)                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TRANSACTION ATOMIQUE (asyncpg)                                        │  │
│  │                                                                       │  │
│  │ 1. Fetch pending_registration (email + code, < 15min)                │  │
│  │ 2. INSERT INTO users                                                  │  │
│  │    - role = 'agent' (enum)                                            │  │
│  │    - email_verified = false                                           │  │
│  │    - password_hash = bcrypt(password, rounds=12)                      │  │
│  │ 3. UPDATE users SET role_id = rbac_role_id (table roles)             │  │
│  │ 4. INSERT INTO agent_profiles                                         │  │
│  │    - user_id, entity_id, entity_location_id, ministry_id             │  │
│  │    - agent_type, is_supervisor, capabilities                          │  │
│  │    - specializations, working_hours, working_days                     │  │
│  │ 5. INSERT INTO agent_workloads                                        │  │
│  │    - agent_profile_id, current_assignments=0                          │  │
│  │    - capacity_percentage=0, workload_status='available'               │  │
│  │    - availability='available', max_concurrent=20                      │  │
│  │ 6. DELETE FROM pending_registrations                                  │  │
│  │                                                                       │  │
│  │ COMMIT                                                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  7. Envoi email bienvenue                                                   │
│  8. Retour user + agent profile                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modèle Pydantic (AgentInviteRequest)

```python
AgentInviteRequest:
  user: AgentUserInfo
    email: EmailStr
    password: str (8-100 chars, uppercase+lowercase+digit+special)
    first_name: str
    last_name: str
    phone_number: Optional[str] (pattern: ^(222|555|551|333)\d{6}$)
    preferred_language: Optional[str] (es/fr/en, default es)
  agent_type: AgentType (ministry_agent | entity_agent)
  is_supervisor: bool (default False)
  entity_id: Optional[UUID]
  entity_location_id: Optional[UUID]
  ministry_id: Optional[int]
  rbac_role_id: Optional[UUID]
  can_approve_unlimited: bool (default False)
  max_approval_amount: Optional[Decimal]
  can_escalate: bool (default True)
  can_assign_tasks: bool (default False)
  can_reassign: bool (default False)
  specializations: List[str]
  working_hours_start: Optional[time]
  working_hours_end: Optional[time]
  working_days: List[int] (default [1,2,3,4,5])
```

### Tables impactées

| Table | Opération | Données |
|-------|-----------|---------|
| `pending_registrations` | INSERT → DELETE | code, email, metadata JSONB |
| `users` | INSERT | role='agent', role_id=rbac_role_id |
| `agent_profiles` | INSERT | 28 colonnes (voir section agent_profiles) |
| `agent_workloads` | INSERT | initial state (0 assignments, available) |

---

## 4. Flux de création superviseur

### Même flux que agent, avec 3 différences

```
SUPERVISEUR = AGENT + is_supervisor=true + rôle RBAC supervisor_* + capabilities élevées

┌────────────────────────────────────────────────────────────────────────────┐
│                    DIFFÉRENCES AGENT vs SUPERVISEUR                        │
│                                                                            │
│  ┌──────────────────────────┐      ┌──────────────────────────────────┐   │
│  │       AGENT              │      │         SUPERVISEUR              │   │
│  │                          │      │                                  │   │
│  │ is_supervisor = false    │      │ is_supervisor = true             │   │
│  │ role: agent_*            │      │ role: supervisor_*               │   │
│  │ perms directes: 19-24   │      │ perms directes: 39               │   │
│  │ perms effectives: 19-24 │      │ perms effectives: 50-55          │   │
│  │ can_escalate: true       │      │ can_escalate: true               │   │
│  │ can_assign_tasks: false  │      │ can_assign_tasks: true           │   │
│  │ can_reassign: false      │      │ can_reassign: true               │   │
│  │                          │      │                                  │   │
│  │ Sidebar:                 │      │ Sidebar: workflow menus + :      │   │
│  │   Workflow menus seult   │      │   + Panel de Control supervisor  │   │
│  │                          │      │   + Equipo (agents, workload)    │   │
│  │                          │      │   + Escalaciones (pending/resol) │   │
│  │                          │      │   + Asignaciones (manual/list/   │   │
│  │                          │      │     rules)                       │   │
│  │                          │      │   + Informes                     │   │
│  └──────────────────────────┘      └──────────────────────────────────┘   │
│                                                                            │
│  HIÉRARCHIE RÔLE RBAC (parent_role_id → CTE RECURSIVE) :                 │
│  ┌──────────────────────────────────────────────────────┐                 │
│  │  supervisor_cnedoge_pasaporte (39 direct)            │                 │
│  │    └─ parent → agent_cnedoge_pasaporte (24 hérités)  │                 │
│  │       = 55 permissions effectives uniques             │                 │
│  │                                                       │                 │
│  │  supervisor_tesoro (59 direct)                        │                 │
│  │    └─ parent → agent_tesoro (23 hérités)              │                 │
│  │       = 66 permissions effectives uniques             │                 │
│  └──────────────────────────────────────────────────────┘                 │
│                                                                            │
│  default_agent_config (auto-fill formulaire création) :                   │
│  Agent:      {"can_escalate":true, "can_reassign":false,                  │
│               "is_supervisor":false, "can_assign_tasks":false}            │
│  Superviseur: {"can_escalate":true, "can_reassign":true,                  │
│                "is_supervisor":true, "can_assign_tasks":true}             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Permissions superviseur-spécifiques (18 ajoutées par migration 201)

Les 18 permissions que SEULS les superviseurs ont (pas les agents) :

| Module | Permission | Description |
|--------|-----------|-------------|
| agent | `agent.manage_workload` | Modifier limites charge de travail |
| agent | `agent.set_availability` | Changer disponibilité agent |
| agent | `agent.view_workload` | Voir charge de travail |
| assignment | `assignment.create` | Créer assignation manuelle |
| assignment | `assignment.list` | Lister assignations |
| assignment | `assignment.view` | Voir détail assignation |
| assignment | `assignment.update_priority` | Modifier priorité |
| assignment | `rules.view` | Voir règles auto-assignation |
| assignment | `rules.create` | Créer règle |
| assignment | `rules.edit` | Modifier règle |
| assignment | `rules.activate` | Activer/désactiver règle |
| assignment | `reports.generate` | Générer rapports |
| assignment | `reports.export_excel` | Exporter Excel |
| reports | `reports.view_performance` | Voir rapports performance |
| dashboard | `dashboard.team_performance` | Dashboard performance équipe |
| dashboard | `dashboard.team_workload` | Dashboard charge équipe |
| dashboard | `dashboard.view_realtime` | Vue temps réel |
| service_request | `service_request.view_all` | Voir toutes les solicitudes |

---

## 5. Flux de création admin

### Même infrastructure que agent (invitation 2 étapes)

```
Page: /admin/agents/new?type=admin
Endpoint: POST /agents/admin/invite → POST /agents/admin/activate

Formulaire simplifié (1 carte au lieu de 7) :
  - Email, nom, prénom, tél, langue
  - PAS de : organisation, rôle RBAC, capacités, planning

Résultat :
  - users.role = 'admin'
  - users.role_id = rôle 'admin' (208 permissions)
  - PAS de agent_profiles
  - PAS de agent_workloads
```

### Admins scopés (sous-rôles admin)

L'attribution d'un rôle admin scopé se fait via la page Rôles & Permissions (`/admin/roles`) :
1. Créer l'utilisateur admin (invitation standard)
2. Dans la page rôles, changer son `role_id` vers `admin_agents`, `admin_config`, etc.
3. La sidebar se filtre automatiquement par `role_code`

---

## 6. Attribution des rôles & résolution permissions

### Schéma de données

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│ users            │     │ roles               │     │ permissions          │
│ ├─ id (uuid)     │     │ ├─ id (uuid)        │     │ ├─ id (uuid)         │
│ ├─ role (enum)   │     │ ├─ code (unique)     │     │ ├─ name (unique)     │
│ ├─ role_id ──────┼────►│ ├─ parent_role_id ──┐│     │ ├─ module_name       │
│ └─ status        │     │ ├─ entity_type      ││     │ └─ description       │
└─────────────────┘     │ ├─ menu_config      ││     └──────────────────────┘
                         │ ├─ dashboard_config ││              ▲
                         │ └─ default_agent_   ││              │
                         │    config           ││     ┌────────┴─────────────┐
                         └─────────────────────┘│     │ role_permissions     │
                                   ▲            │     │ ├─ role_id (FK)      │
                                   └────────────┘     │ ├─ permission_id (FK)│
                                  (recursive)         │ └─ granted (bool)    │
                                                      └──────────────────────┘
                         ┌──────────────────────┐
                         │ user_permissions      │  ← Overrides par utilisateur
                         │ ├─ user_id (FK)       │
                         │ ├─ permission_id (FK) │
                         │ ├─ granted (bool)     │
                         │ └─ expires_at         │
                         └──────────────────────┘
```

### Résolution permissions (ordre de priorité)

```
1. user_permissions.granted = false  →  DENY (override explicite)
2. user_permissions.granted = true   →  GRANT (override explicite)
3. role_permissions (rôle direct)    →  GRANT
4. role_permissions (parent CTE)     →  GRANT (héritage récursif)
5. Aucun match                       →  DENY (fail-closed)
```

### Cache 3 niveaux + invalidation temps réel

```
┌──────────────────────────────────────────────────────────────────────┐
│ CHECK PERMISSION (hot path, chaque requête API)                      │
│                                                                      │
│ L1: In-process dict ─── 0ms ──┐                                    │
│ L2: Redis/Upstash ──── 1-2ms ─┤  TTL: 10 min                      │
│ L3: effective_permissions_mv ──┤  Refresh: 60s CONCURRENTLY         │
│ L4: CTE RECURSIVE PostgreSQL ─┘  Fallback si MV inexistante       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ INVALIDATION TEMPS RÉEL                                              │
│                                                                      │
│ Admin change permission                                              │
│   → PG trigger (trg_notify_role_permissions)                        │
│   → NOTIFY 'rbac_changes' (payload JSON)                            │
│   → RBACListener (asyncpg LISTEN)                                   │
│     ├─ Redis cache invalidation (immédiate)                         │
│     └─ WebSocket broadcast → admin clients                          │
│       → Frontend React Query auto-invalidate                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Sidebars par rôle

### 7A. Routing sidebar (DashboardLayout.tsx)

```
user.role === ?
├─ 'admin'  ──► AdminSidebar.tsx + AdminCommandPalette (Ctrl+K)
│               Filtrage: canSeeSection(role_code) → SECTION_ROLE_MAP
│               Fail-closed: section inconnue = CACHÉE
│
├─ 'agent'  ──► GenericAgentSidebar.tsx + MobileAgentSidebar
│               Source: GET /menu-config/me (100% dynamique backend)
│               + Permission filtering côté frontend (migration 201)
│
└─ else     ──► DashboardSidebar.tsx (citizen/business/accountant/func.)
                Statique (hardcoded)
```

### 7B. Admin Sidebar — Matrice d'accès par role_code

```
┌──────────────────┬───────────┬────────────┬────────────┬────────────┬────────────┐
│     Section      │ admin /   │admin_agents│admin_config│admin_      │admin_      │
│                  │super_admin│  (81p)     │  (56p)     │services(42)│support(22) │
├──────────────────┼───────────┼────────────┼────────────┼────────────┼────────────┤
│ Dashboard        │     ✅    │     ✅     │     ✅     │     ✅     │     ✅     │
├──────────────────┼───────────┼────────────┼────────────┼────────────┼────────────┤
│ Gestion Accès    │     ✅    │     ✅     │     ❌     │     ❌     │     ❌     │
│  ├ Agents        │     ✅    │     ✅     │     ❌     │     ❌     │     ❌     │
│  ├ Utilisateurs  │     ✅    │     ✅     │     ❌     │     ❌     │     ❌     │
│  ├ Rôles & Perms │     ✅    │     ✅     │     ❌     │     ❌     │     ❌     │
│  └ Assignations  │     ✅    │     ✅     │     ❌     │     ❌     │     ❌     │
├──────────────────┼───────────┼────────────┼────────────┼────────────┼────────────┤
│ Services Fiscaux │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  ├ Catalogue     │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  ├ Ministères    │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  ├ Secteurs      │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  ├ Doc Templates │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  └ Proc Templates│     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
├──────────────────┼───────────┼────────────┼────────────┼────────────┼────────────┤
│ Configuration    │     ✅    │     ❌     │     ✅     │   partiel  │     ❌     │
│  ├ Communications│     ✅    │     ❌     │     ✅     │     ❌     │     ❌     │
│  ├ Workflows     │     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
│  ├ Système *     │     ✅    │     ❌     │     ❌     │     ❌     │     ❌     │
│  ├ Menu Config   │     ✅    │     ❌     │     ✅     │     ❌     │     ❌     │
│  └ Paiement Infra│     ✅    │     ❌     │     ❌     │     ✅     │     ❌     │
├──────────────────┼───────────┼────────────┼────────────┼────────────┼────────────┤
│ Support          │     ✅    │     ❌     │     ❌     │     ❌     │     ✅     │
└──────────────────┴───────────┴────────────┴────────────┴────────────┴────────────┘

* Système = admin_security voit : Audit, Traductions, Monitoring
```

### 7C. Agent Sidebar — 100% dynamique backend

```
Source: GET /menu-config/me

2 modes de génération:
┌──────────────────────────────────────────────────────────────────────┐
│ MODE 1: WORKFLOW-BASED (roles.menu_config = NULL)                   │
│ Condition: La majorité des agents                                    │
│ Source: entities.workflow_codes + workflow_menu_mapping               │
│                                                                      │
│ Exemple agent_cnedoge_pasaporte:                                     │
│ ┌────────────────────────────────┐                                  │
│ │ 🏠 Dashboard                   │                                  │
│ │ ✈️ Pasaportes          [▼]    │ ← workflow_menu_mapping           │
│ │   ├ 📋 Pendientes              │   include_pending=true           │
│ │   ├ ✅ Validación               │   include_validation=true        │
│ │   ├ 📅 Citas                   │   include_appointments=true      │
│ │   ├ 📜 Historial               │   include_history=true           │
│ │   ├ ✔️ Completados             │   custom_sub_items (filter)      │
│ │   └ ⚠️ Escalaciones            │   include_escalation=true        │
│ │ 📦 Solicitudes por lotes       │ ← static (non-TESORO)           │
│ │ ─────────────────────          │                                  │
│ │ 👤 Perfil                      │ ← static footer                 │
│ │ ⚙️ Configuración               │                                  │
│ │ 🚪 Cerrar sesión               │                                  │
│ └────────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ MODE 2: MODULE-BASED (roles.menu_config = JSONB)                    │
│ Condition: roles.menu_config IS NOT NULL                             │
│ Rôles concernés: agent_tesoro, supervisor_tesoro, agent_policia     │
│                                                                      │
│ Exemple agent_tesoro (v2.2):                                         │
│ ┌────────────────────────────────┐                                  │
│ │ 🏠 Dashboard                   │                                  │
│ │ 💳 Pagos              [▼]     │                                  │
│ │   ├ Validación                 │                                  │
│ │   ├ Escalaciones               │                                  │
│ │   └ Transacciones              │                                  │
│ │ 🤖 Analista                    │                                  │
│ └────────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 7D. Sidebar Superviseur (sections additionnelles)

Quand `is_supervisor=true`, le backend ajoute 5 sections via `_get_supervisor_menu_items()` :

```
┌────────────────────────────────────────────┐
│     SECTIONS SUPERVISEUR ADDITIONNELLES    │
│     (ajoutées APRÈS les workflow menus)     │
│                                             │
│ 🎛️ Panel de Control                        │  href: /dashboard/supervisor
│                                             │
│ 👥 Equipo                           [▼]    │
│   ├ 👤 Agentes                      │  permission: agent.view
│   ├ 📊 Carga de Trabajo             │  permission: agent.view_workload
│   └ 📈 Rendimiento                  │  permission: agent.view_performance
│                                             │
│ ⚠️ Escalaciones                (3)  [▼]    │  badge: count (poll 30s)
│   ├ 🕐 Pendientes                   │  permission: queue.escalate
│   └ ✅ Resueltas                     │  permission: queue.view
│                                             │
│ ⚙️ Asignaciones                     [▼]    │
│   ├ 👤+ Asignación Manual            │  permission: assignment.create
│   ├ 📋 Lista de Asignaciones        │  permission: assignment.list
│   └ ☑️ Reglas                        │  permission: rules.view
│                                             │
│ 📊 Informes                                │  permission: reports.view
└────────────────────────────────────────────┘
```

### 7E. Permission Filtering Frontend (nouveau, migration 201)

```typescript
// useAgentDashboard.ts — dynamicMenuItems useMemo
const checkPerm = (perm?: string) => {
  if (!perm) return true;              // Pas de permission → visible
  if (context?.isSupervisor) return true; // Superviseurs voient tout
  return userPermissions.has(perm);     // Check permission user
};

// Filtre top-level ET sub-items par permission
// Supprime les groupes vides après filtrage
items.filter(menu => checkPerm(menu.permission))
  .map(menu => ({
    ...menu,
    items: menu.items?.filter(item => checkPerm(item.permission))
  }))
  .filter(menu => menu.href || menu.items?.length > 0);
```

**Avant** : L'utilisateur voyait TOUS les items → 403 au clic.
**Après** : Seuls les items autorisés sont rendus.

### 7F. Citizen Sidebar (statique)

```
┌────────────────────────────────────────────┐
│ 🏠 Panel                                   │
│ 📋 Mis Solicitudes                         │
│ 📦 Solicitudes por lotes                   │
│ 💬 Chat                                    │
│ 🎫 Soporte                                 │
│                                             │
│ [si funcionario vérifié]                    │
│ 🏛️ Funcionario                             │ ← conditionnel
│                                             │
│ [DÉSACTIVÉ avec tooltip]                    │
│ 📊 Declaraciones                           │ ← legacy, grisé
│                                             │
│ ─────────────────────                       │
│ 👤 Perfil                                  │
│ ⚙️ Configuración                            │
│ 🚪 Cerrar sesión                            │
└────────────────────────────────────────────┘
```

---

## 8. Matrice permissions complète

### 8A. Permissions par module (208 total, 18 modules)

| Module | Count | Exemples clés |
|--------|-------|---------------|
| **admin** | 15 | manage_user, manage_entity, manage_workflow, run_migrations |
| **agent** | 16 | create, deactivate, manage_workload, set_availability, view_workload |
| **assignment** | 21 | create, list, view, reassign, rules.create/edit/activate/view |
| **audit** | 4 | export, search, view, view_stats |
| **city** | 8 | city.create/delete/update/view + entity.create/delete/update/view |
| **communication** | 20 | manage, send_email/sms/notification + template CRUD (4 types) |
| **dashboard** | 5 | team_performance, team_workload, view_own, view_realtime |
| **declaration** | 24 | create, submit, approve, reject, import_excel, view_stats |
| **document** | 11 | delete, download, view + ocr.reprocess/view_queue + template CRUD |
| **fiscal_service** | 12 | create, delete, update, bulk_import/export, manage_hierarchy |
| **funcionario** | 4 | export, process, read_all, view_stats |
| **menu** | 5 | create/delete/update_mapping, manage, view_mappings |
| **payment** | 13 | cancel, create, reconcile, refund + payment_plan + receipt |
| **permissions** | 12 | create, delete, update, view + roles CRUD + user_permissions |
| **reports** | 6 | export_json, schedule, view_comparison/financial/performance/trends |
| **service_request** | 21 | approve, reject, process, escalate, view_all, view_queue |
| **support** | 14 | assign, close, escalate, manage + categories + messages |
| **treasury** | 19 | validate/process/reject_payment, reconcile + anomaly/audit/export/stat |
| **translation** | 13 | CRUD + entity_translation + enum_translation + frontend sync |
| **webhook** | 7 | create, delete, test, update, view + logs |

### 8B. Permissions citoyens/entreprises

| Rôle | Permissions (7-14) |
|------|-------------------|
| **citizen** (7p) | assignment.view, declaration.amend/create/delete/submit/update/view |
| **business** (14p) | citizen + assignment.list, dashboard.view_own/stats, declaration.batch_create/batch_submit/import_excel, payment.create |
| **accountant** (11p) | assignment.list/view, declaration.amend/batch_create/batch_submit/create/delete/import_excel/submit/update/view |

### 8C. Permissions entity supervisor (55 effectifs, détail complet)

Vérification BD live — supervisor_cnedoge_pasaporte (représentatif) :

**Héritées du parent agent (24p)** :
- `agent.view_performance`, `document.download/view`
- `service_request.*` (16p) : approve, assign_to_self, cancel_appointment, escalate, export, process, reject, release, request_documents, reschedule_appointment, schedule_appointment, verify_manually, view, view_appointments/audit_log/available_slots/documents/extraction/my_queue/queue/queue_stats

**Directes superviseur (39p)** :
- `agent.*` (6p) : list, view, manage_workload, set_availability, view_performance, view_workload
- `assignment.*` (11p) : create, list, view, update_priority, update_notes, view_stats, reassign, reassign_in_progress
- `queue.*` (5p) : assign, complete, escalate, release, view
- `rules.*` (4p) : view, create, edit, activate
- `reports.*` (4p) : view, export_pdf, export_excel, generate, view_performance
- `dashboard.*` (3p) : team_performance, team_workload, view_realtime
- `document.*` (2p) : download, view
- `service_request.*` (4p) : escalate, process, view, view_all, view_queue, view_queue_stats

---

## 9. Entités & Workflows

### Inventaire complet (12 entités)

| Code | Nom | Type | Workflows | Rôle Agent | Rôle Superviseur |
|------|-----|------|-----------|------------|-----------------|
| CNEDOGE_PASAPORTE | Servicio Pasaportes | department | PASAPORTE_NUEVO, _RENOVACION, _PERDIDA, _ROBO, _DETERIORO | agent_cnedoge_pasaporte | supervisor_cnedoge_pasaporte |
| CNEDOGE_RESIDENCIA | Servicio Residencias | department | RESIDENCIA_PRIMERA_VEZ, _RENOVACION | agent_cnedoge_residencia | supervisor_cnedoge_residencia |
| DGT | Dir. Gen. de Tráfico | entity | CONDUCIR_NUEVO, _CANJE, _RENOVACION, _DUPLICADO, _EXTENSION | agent_dgt | supervisor_dgt |
| EXTRANJERIA | Comisaria Dept Extranjeria | department | RESIDENCIA_PRIMERA_VEZ, _RENOVACION | agent_extranjeria | supervisor_extranjeria |
| ITV | ITV | entity | VEHICULO_RENOVACION_ITV | agent_itv | supervisor_itv |
| MINFP | Min. Función Pública | entity | FP_VERIFICACION_FUNCIONARIO, _CARNET, _PROMOCION, _PERMISO_EXTRAORDINARIO, _CERTIFICADO | agent_minfp | supervisor_minfp |
| OFIVE | CUVE | entity | VEHICULO_PRIMERA_MATRICULACION, _TRANSFERENCIA, _RENOVACION_CUVE, _DUPLICADO_PERMISO, _DUPLICADO_CUVE, _CAMBIO_CARACTERISTICAS | agent_ofive | supervisor_ofive |
| ONRC | Of. Nac. Registro Contratos | entity | CONTRATO_OBRA, _SERVICIO, _SUMINISTRO, _CONCESION, _JOINT_VENTURE, _ARRENDAMIENTO, _OTRO | agent_onrc | supervisor_onrc |
| POLICIA | Comisaria Dept Visado | department | VISADO_ALTERNATIVO, SALIDA_VISADO_VENCIDO, PRORROGA_VISADO, PERMANENCIA_EXTRANJERIA | agent_policia | supervisor_policia |
| TESORO | Tesoro Público | treasury | [] (module-based, pas de workflows) | agent_tesoro | supervisor_tesoro |
| CNEDOGE | Centre National | entity | RESIDENCIA_PRIMERA_VEZ, _RENOVACION | (parent, pas de rôle direct) | — |
| COMISARIA | Comisaria Central | entity | [] (parent, workflows futurs) | (parent, pas de rôle direct) | — |

### workflow_menu_mapping (10 règles)

| Pattern | Groupe | Icône | RDV | Escalation |
|---------|--------|-------|-----|-----------|
| PASAPORTE_% | pasaportes | Plane | ✅ | ✅ |
| RESIDENCIA_% | residencias | Globe | ✅ | ✅ |
| CONDUCIR_% | licencias | Car | ✅ | ✅ |
| VEHICULO_% | vehiculos | Truck | ✅ | ✅ |
| CONTRATO_% | contratos | FileSignature | ❌ | ✅ |
| FP_% | funcionarios | Briefcase | ✅ | ✅ |
| VISADO_% | visado | Globe | ✅ | ✅ |
| PRORROGA_VISADO | visado | Globe | ❌ | ✅ |
| SALIDA_VISADO_VENCIDO | visado | Globe | ❌ | ✅ |
| PERMANENCIA_EXTRANJERIA | visado | Globe | ❌ | ✅ |

---

## 10. Pages Admin (inventaire complet)

### Arborescence des 80+ pages

```
/admin/
├── page.tsx                                      Dashboard Admin
├── agents/
│   ├── page.tsx                                  4 tabs: Agents, Admins, Vue d'ensemble, Assistant IA
│   ├── new/page.tsx                              Création Agent/Admin (?type=agent|admin)
│   └── [id]/page.tsx                             Détail agent (2 tabs: Profil, Activité)
├── users/
│   ├── page.tsx                                  Users publics (citizen/business/accountant/funcionario)
│   └── [id]/page.tsx                             Détail utilisateur (lecture seule)
├── roles/
│   ├── page.tsx                                  4 tabs: Rôles, Permissions, User Perms, Simulateur
│   └── [id]/
│       ├── page.tsx                              Édition rôle + permissions
│       └── menu-config/page.tsx                  Config menu JSON par rôle
├── assignments/
│   ├── page.tsx                                  Liste assignations
│   ├── [id]/page.tsx                             Détail assignation
│   ├── [id]/edit/page.tsx                        Édition
│   ├── [id]/reassign/page.tsx                    Réassignation
│   └── new/
│       ├── auto/page.tsx                         Règles auto-assignation
│       └── manual/page.tsx                       Assignation manuelle
├── entities/page.tsx                             Entités + Villes + Localisations
├── fiscal-services/                              850+ services (CRUD)
├── document-templates/                           Templates documents (CRUD)
├── procedure-templates/                          Templates procédures (CRUD + étapes)
├── menu-config/                                  Workflow menu mappings
├── service-requests/
│   ├── appointments/                             8 tabs: Calendar, Schedule, Today, Stats...
│   ├── documents/
│   ├── tariffs/
│   └── workflows/                                Liste + éditeur workflows
├── communications/                               6 sous-sections: email/sms/notif/push/webhooks/ussd
├── audit-logs/                                   Journal d'audit système
├── translations/                                 Gestion traductions i18n
├── monitoring/                                   Monitoring système
├── payment-gateways/                             Configuration paiements
├── settings/                                     Paramètres système
├── support/
│   ├── page.tsx                                  Tickets support
│   ├── [id]/page.tsx                             Détail ticket
│   └── categories/                               Catégories support
└── user-permissions/                             Overrides permissions par user
```

---

## 11. Rapport critique & lacunes

### Corrections appliquées (migration 201 + code)

| # | Sévérité | Problème | Correction |
|---|----------|----------|-----------|
| 1 | **CRITIQUE** | 9 superviseurs entité avaient 21 perms directes (MOINS que leurs agents à 24) | +18 perms superviseur-spécifiques → 39 direct |
| 2 | **MAJEUR** | 10 superviseurs sans permissions dashboard team | +4 perms (team_performance, team_workload, view_realtime, view_all) |
| 3 | **MAJEUR** | 6 rôles sans default_agent_config | Config ajoutée (agent: base, supervisor: élevée) |
| 4 | **MAJEUR** | Sidebar affichait items sans vérifier permissions → 403 au clic | Permission filtering frontend dans useAgentDashboard |
| 5 | **MOYEN** | Assignation manuelle absente du menu superviseur (page existait) | Ajout menu items: manual + list + rules |
| 6 | **MOYEN** | Items escalation/reports sans champ permission | Ajout permission: queue.escalate, queue.view, reports.view |
| 7 | **MINEUR** | Icône UserPlus manquante dans ICON_MAP frontend | Ajout import + mapping |

### Lacunes restantes (non bloquantes)

| # | Sévérité | Description | Recommandation |
|---|----------|-------------|----------------|
| 1 | MOYEN | Pas de visual menu builder (JSON brut pour menu_config) | Feature future : drag-and-drop menu editor |
| 2 | MOYEN | COMISARIA et TESORO ont workflow_codes=[] | TESORO = normal (module-based). COMISARIA = à remplir quand workflows créés |
| 3 | MINEUR | Supervisor = flag sur agent_profiles, pas type séparé | Design intentionnel — simplification création |
| 4 | MINEUR | Spécialisations agent visibles uniquement en mode édition | À évaluer si nécessaire à la création |
| 5 | MINEUR | Pas de bulk operations création agents | Volume actuel (8 users) ne le justifie pas |
| 6 | INFO | agent_itv et agent_onrc ont 19 perms (pas 24) | Correct — pas de RDV pour ces entités |
| 7 | INFO | Performance page superviseur = page treasury-specific | À généraliser quand d'autres entités auront des analytics |

---

## 12. Fichiers clés

### Backend

| Fichier | Rôle |
|---------|------|
| `packages/backend/app/modules/agents/api/profile_routes.py` | Endpoints CRUD agents, invitation, activation |
| `packages/backend/app/modules/agents/services/agent_profile_service.py` | Logique métier création/validation agent |
| `packages/backend/app/modules/agents/repositories/agent_profile_repository.py` | Requêtes BD agent_profiles |
| `packages/backend/app/modules/menu_config/services/menu_config_service.py` | Génération menus (workflow-based + module-based + superviseur) |
| `packages/backend/app/modules/menu_config/api/menu_config_routes.py` | Endpoint GET /menu-config/me |
| `packages/backend/app/modules/permissions/services/permission_service.py` | Vérification permissions |
| `packages/backend/app/modules/permissions/middleware/permission_middleware.py` | Middleware permission_required() |
| `packages/backend/app/modules/permissions/api/role_routes.py` | CRUD rôles + permissions |
| `packages/backend/app/modules/assignment/api/supervisor_routes.py` | Endpoints superviseur (dashboard, team, escalations) |
| `packages/backend/app/core/rbac_listener.py` | LISTEN PostgreSQL + invalidation cache + WS broadcast |
| `packages/backend/app/core/ws_manager.py` | WebSocket manager (broadcast RBAC events) |
| `packages/backend/app/core/ws_routes.py` | Endpoint WS /ws/admin |
| `packages/backend/database/migrations/198_role_hierarchy_and_audit_triggers.sql` | Hiérarchie rôles + triggers audit |
| `packages/backend/database/migrations/200_effective_permissions_materialized_view.sql` | Vue matérialisée permissions |
| `packages/backend/database/migrations/201_fix_supervisor_permissions_and_config.sql` | Fix superviseur 18 perms + default_config |

### Frontend

| Fichier | Rôle |
|---------|------|
| `packages/web/src/components/layout/DashboardLayout.tsx` | Routing sidebar par rôle |
| `packages/web/src/modules/admin/components/AdminSidebar.tsx` | Sidebar admin (role_code filtering) |
| `packages/web/src/modules/agent-dashboard/components/GenericAgentSidebar.tsx` | Sidebar agent (100% dynamique + permission filtering) |
| `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts` | Hook principal (menu, context, permissions) |
| `packages/web/src/modules/agent-dashboard/types/menu-config.ts` | Types menu dynamique |
| `packages/web/src/components/layout/DashboardSidebar.tsx` | Sidebar citoyen (statique) |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/agents/new/page.tsx` | Page création agent (7 cartes) |
| `packages/web/src/modules/agents-admin/components/form-sections/` | 7 composants formulaire réutilisables |
| `packages/web/src/modules/agents-admin/hooks/index.ts` | Hooks gestion agents |
| `packages/web/src/modules/roles-admin/` | Module RBAC admin (rôles, permissions, simulateur) |
| `packages/web/src/modules/roles-admin/hooks/useRbacWebSocket.ts` | WebSocket temps réel RBAC |
| `packages/web/src/modules/roles-admin/components/PermissionSimulatorTab.tsx` | Simulateur permissions |

### Base de données

| Table | Rôle |
|-------|------|
| `users` | Comptes utilisateurs (role enum + role_id FK) |
| `roles` | 30 rôles RBAC (hierarchy, menu_config, dashboard_config) |
| `permissions` | 208 permissions catalogue |
| `role_permissions` | Junction rôle→permissions (PK composite) |
| `user_permissions` | Overrides par utilisateur |
| `agent_profiles` | 28 colonnes profil agent (entity, capabilities, schedule) |
| `agent_workloads` | Charge de travail temps réel |
| `entities` | 12 entités gouvernementales (workflow_codes JSONB) |
| `entity_locations` | Sites/bureaux par entité |
| `workflow_menu_mapping` | 10 règles pattern→menu |
| `effective_permissions_mv` | Vue matérialisée (refresh 60s) |
| `pending_registrations` | Invitations en attente (15min expiry) |
| `permission_audit_log` | Historique changements permissions |

---

> **Migration 201 exécutée** : 126 + 40 permissions insérées, 6 rôles configurés, MV rafraîchie.
> **Prochaine étape** : Push develop → CI GitHub Actions → validation build.
