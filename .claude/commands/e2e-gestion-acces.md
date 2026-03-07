# E2E Test: Gestion des Accès (Access Management)

## Mission
Exécuter des tests E2E complets du module "Gestion des Accès" incluant:
- Tableau de bord Admin (stats)
- Gestion des Rôles
- Catalogue des Permissions
- Permissions Utilisateurs (overrides)
- Gestion des Agents & Admins
- Gestion des Assignments

---

## Configuration Requise

### Credentials (Variables d'environnement)
```
E2E_BASE_URL=https://taxasge.emacsah.com
E2E_API_BASE=https://taxasge-backend-staging-392159428433.us-central1.run.app

# Admin avec permissions complètes
E2E_ADMIN_EMAIL=sah@emacsah.com
E2E_ADMIN_PASSWORD=Taxasge@25

# Utilisateur de test
E2E_USER_EMAIL=libressay@gmail.com
E2E_USER_PASSWORD=Taxasge@26

# Agent de test a créer
E2E_AGENT_EMAIL=cnedoge26@gmail.com
E2E_AGENT_PASSWORD=Taxasge@25
```

### Utilisateurs de Test (Agents par Ministère/Entité) a créer

| Email | Ministère/Entité | Entité Liée | Département | agent_role | Dashboard |
|-------|------------------|-------------|-------------|------------|-----------|
| cnedoge26@gmail.com | CNEDOGE | - | - | - | - |
| denuciage@gmail.com | MIN SEGURIDAD | COMISARIA CENTRAL | PLAINTES | validator | - |
| extrangeriage@gmail.com | MIN SEGURIDAD | COMISARIA CENTRAL | EXTRANJERIAS | validator | - |
| trafico.ge26@gmail.com | MIN INTERIOR | DG TRAFICO | - | validator | - |
| cuve.ge@gmail.com | OFIVE | - | - | - | - |
| onrc.ge26@gmail.com | ONRC | - | - | - | - |
| funpu.ge@gmail.com | MIN FUNCION PUBLICA | - | - | - | - |
| tesoreria.ge@outlook.fr | MIN HACIENDA | TESORERIA | - | validator | treasury |

**Note:** Mot de passe par défaut pour tous les agents: `Taxasge@26`

---

## Architecture du Module

### Schéma DB ↔ Backend ↔ Frontend

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GESTION DES ACCÈS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │    DB       │    │    Backend      │    │          Frontend               │ │
│  │  (Tables)   │    │   (FastAPI)     │    │         (Next.js)               │ │
│  └─────────────┘    └─────────────────┘    └─────────────────────────────────┘ │
│                                                                                 │
│  users             →  users/models/      →  modules/users-admin/types/         │
│  roles             →  permissions/models/ →  modules/roles-admin/types/        │
│  permissions       →  permissions/models/ →  modules/permissions-admin/types/  │
│  role_permissions  →  permissions/models/ →  (embedded in roles-admin)         │
│  user_permissions  →  permissions/models/ →  modules/user-permissions-admin/   │
│  agent_profiles    →  agents/models/      →  modules/agents-admin/types/       │
│  agent_workloads   →  agents/models/      →  (embedded in agents-admin)        │
│  assignments       →  agents/models/      →  (assignments page)                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Endpoints API

| Module | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| Stats | `GET /admin/users/stats` | users.view_stats | User statistics |
| Stats | `GET /audit-logs/stats` | audit.view_stats | Audit statistics |
| Roles | `GET /roles` | roles.view | List roles |
| Roles | `POST /roles` | roles.create | Create role |
| Roles | `PUT /roles/{id}` | roles.edit | Update role |
| Roles | `DELETE /roles/{id}` | roles.delete | Delete role |
| Roles | `GET /roles/{id}/with-permissions` | roles.view | Role + perms |
| Permissions | `GET /permissions` | permissions.view | List permissions |
| User Perms | `GET /user-permissions/{user_id}` | permissions.view_user | User overrides |
| User Perms | `POST /user-permissions/{user_id}` | permissions.grant_user | Grant override |
| User Perms | `DELETE /user-permissions/{user_id}/{perm_id}` | permissions.revoke_user | Revoke |
| Agents | `GET /agents` | agents.view_all | List agents |
| Agents | `POST /agents/complete` | agents.create | Create agent + user |
| Agents | `PUT /agents/{id}` | agents.edit | Update agent |
| Admins | `GET /admin/users?role=admin` | users.view_all | List admins |
| Admins | `POST /agents/admin` | users.create | Create admin |

---

## Workflows à Tester

### 1. Dashboard Admin (Stats)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD ADMIN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Total      │  │ Rôles      │  │ Permissions│  │ Activité   │ │
│  │ Utilisat.  │  │ Actifs     │  │ Catalogue  │  │ 24h        │ │
│  │ [GET /stats]│  │ [calc]     │  │ [static]   │  │ [GET /audit]│ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
│                                                                  │
│  Frontend: modules/admin/components/StatsCards.tsx               │
│  Backend:  modules/admin/api/user_management_routes.py:425       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. CRUD Rôles

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LIST      │ ──▶ │   CREATE    │ ──▶ │    EDIT     │ ──▶ │   DELETE    │
│   Rôles     │     │   Rôle      │     │   Rôle      │     │   Rôle      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  GET /roles         POST /roles          PUT /roles/{id}    DELETE /roles/{id}
  roles.view         roles.create         roles.edit          roles.delete

Contraintes:
- is_system = true → Ne peut pas être modifié/supprimé
- code unique, lowercase avec underscores
- entity_type: 'DGI' | 'Ministry' | null (global)
```

### 3. Attribution Permissions aux Rôles

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SELECT    │ ──▶ │   ASSIGN    │ ──▶ │   REMOVE    │
│   Rôle      │     │   Perms     │     │   Perms     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
  GET /roles/{id}    POST /roles/{id}/     DELETE /roles/{id}/
  /with-permissions  permissions             permissions
```

### 4. User Permission Overrides

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SELECT     │ ──▶ │   VIEW      │ ──▶ │   GRANT     │ ──▶ │   REVOKE    │
│  User       │     │   Current   │     │   Override  │     │   Override  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  Search User         GET /user-perms/   POST /user-perms/    DELETE /user-perms/
                      {user_id}          {user_id}            {user_id}/{perm_id}

Fonctionnalités:
- Visualiser permissions du rôle
- Visualiser overrides existants
- Accorder permission (avec expiration optionnelle)
- Révoquer override
```

### 5. CRUD Agents

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LIST      │ ──▶ │   CREATE    │ ──▶ │    EDIT     │ ──▶ │  DEACTIVATE │
│   Agents    │     │   Agent     │     │   Agent     │     │   Agent     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  GET /agents        POST /agents/       PUT /agents/{id}   PUT /agents/{id}
  agents.view_all    complete            agents.edit        {is_active: false}
                     agents.create

Types d'agents:
- ministry_agent (lié à un ministère)
- entity_agent (lié à une entité)

Rôles d'agents:
- validator, approver, auditor, reviewer
```

---

## Procédure de Test E2E

### Phase 0: Initialisation
```
ACTIONS:
1. performance_start_trace - Démarrer l'enregistrement
2. navigate_page → E2E_BASE_URL
3. take_screenshot → "00-homepage.png"
4. list_console_messages → Vérifier erreurs initiales
```

### Phase 1: Authentification Admin
```
ACTIONS:
1. click → Bouton "Connexion"
2. fill → Email: E2E_ADMIN_EMAIL
3. fill → Password: E2E_ADMIN_PASSWORD
4. click → Submit
5. wait_for → Redirect dashboard
6. take_screenshot → "01-login-success.png"
7. list_network_requests → Vérifier /auth/login

VALIDATIONS:
- [ ] Login réussi (admin role)
- [ ] Token JWT avec permissions admin
- [ ] Redirect vers dashboard
```

### Phase 2: Dashboard Admin Stats
```
ACTIONS:
1. navigate_page → /dashboard/admin
2. wait_for → StatsCards chargées
3. take_screenshot → "02-admin-dashboard.png"
4. list_network_requests → Vérifier API calls
5. get_network_request → /admin/users/stats
6. get_network_request → /audit-logs/stats
7. list_console_messages → Erreurs

VALIDATIONS:
- [ ] Total Utilisateurs affiché (> 0)
- [ ] Rôles Actifs affiché
- [ ] Permissions affiché (52)
- [ ] Activité 24h affiché
- [ ] API /admin/users/stats → 200
- [ ] API /audit-logs/stats → 200
```

### Phase 3: Gestion des Rôles - List
```
ACTIONS:
1. click → Menu "Rôles & Permissions" ou navigate → /dashboard/admin/roles
2. wait_for → RolesTab chargé
3. take_screenshot → "03-roles-list.png"
4. list_network_requests → GET /roles
5. list_console_messages → Erreurs

VALIDATIONS:
- [ ] Liste rôles affichée
- [ ] Stats (Total, Système, Personnalisés) affichées
- [ ] Rôles système marqués avec badge "Système"
- [ ] Actions (Edit, Delete) visibles pour rôles personnalisés
```

### Phase 4: Gestion des Rôles - Create
```
ACTIONS:
1. click → Bouton "Créer un Rôle"
2. wait_for → Formulaire création
3. take_screenshot → "04-role-create-form.png"
4. fill → Nom: "Test E2E Role"
5. fill → Code: "test_e2e_role"
6. fill → Description: "Rôle créé par test E2E"
7. select → entity_type: "Global"
8. click → Bouton "Créer"
9. wait_for → Success message
10. take_screenshot → "05-role-created.png"
11. get_network_request → POST /roles

VALIDATIONS:
- [ ] API POST /roles → 201
- [ ] Rôle apparaît dans liste
- [ ] Toast success affiché
```

### Phase 5: Gestion des Rôles - Edit & Assign Permissions
```
ACTIONS:
1. click → Bouton Edit du rôle créé
2. wait_for → Page détail rôle
3. take_screenshot → "06-role-edit.png"
4. click → Tab "Permissions"
5. click → Checkbox permissions à assigner
6. click → Bouton "Sauvegarder"
7. wait_for → Success
8. take_screenshot → "07-role-permissions.png"
9. get_network_request → PUT /roles/{id}

VALIDATIONS:
- [ ] Permissions assignées
- [ ] API PUT → 200
- [ ] Permissions count mis à jour
```

### Phase 6: Gestion des Rôles - Delete
```
ACTIONS:
1. navigate → /dashboard/admin/roles
2. click → Bouton Delete du rôle test
3. wait_for → Dialog confirmation
4. take_screenshot → "08-role-delete-confirm.png"
5. click → Bouton "Supprimer"
6. wait_for → Rôle supprimé
7. get_network_request → DELETE /roles/{id}

VALIDATIONS:
- [ ] API DELETE → 200
- [ ] Rôle disparu de liste
- [ ] Toast success
```

### Phase 7: Catalogue Permissions
```
ACTIONS:
1. click → Tab "Catalogue Permissions"
2. wait_for → Liste permissions
3. take_screenshot → "09-permissions-catalog.png"
4. fill → Search: "users"
5. wait_for → Filtered results
6. take_screenshot → "10-permissions-filtered.png"
7. select → Module: "audit"
8. wait_for → Filtered results
9. list_console_messages → Erreurs

VALIDATIONS:
- [ ] Permissions listées (~52+)
- [ ] Groupement par module fonctionne
- [ ] Search fonctionne
- [ ] Badges "Critique" affichés
- [ ] Accordion expand/collapse fonctionne
```

### Phase 8: User Permissions
```
ACTIONS:
1. click → Tab "Permissions Utilisateurs"
2. wait_for → UserSelector visible
3. take_screenshot → "11-user-permissions-empty.png"
4. fill → Search user: "test"
5. click → Sélectionner un utilisateur
6. wait_for → Permissions chargées
7. take_screenshot → "12-user-permissions-loaded.png"
8. get_network_request → GET /user-permissions/{id}

VALIDATIONS:
- [ ] UserSelector fonctionne
- [ ] Overrides affichés
- [ ] Permissions effectives affichées
- [ ] Permissions du rôle affichées
```

### Phase 9: User Permissions - Grant Override
```
ACTIONS:
1. click → Bouton "Ajouter Override"
2. wait_for → Dialog grant permission
3. take_screenshot → "13-grant-dialog.png"
4. select → Permission à accorder
5. toggle → granted: true
6. fill → reason: "Test E2E"
7. click → Bouton "Accorder"
8. wait_for → Success
9. take_screenshot → "14-override-granted.png"
10. get_network_request → POST /user-permissions/{id}

VALIDATIONS:
- [ ] API POST → 201
- [ ] Override apparaît dans liste
- [ ] Permissions effectives mises à jour
```

### Phase 10: Agents & Admins
```
ACTIONS:
1. navigate → /dashboard/admin/agents
2. wait_for → AgentsTab chargé
3. take_screenshot → "15-agents-list.png"
4. list_network_requests → GET /agents
5. click → Tab "Admins"
6. wait_for → Admins list
7. take_screenshot → "16-admins-list.png"

VALIDATIONS:
- [ ] Agents listés
- [ ] Stats agents affichées
- [ ] Admins listés
- [ ] Filters fonctionnent
```

### Phase 11: Create Agent (Optional - requires test user)
```
ACTIONS:
1. click → Bouton "Créer Agent"
2. wait_for → Formulaire
3. take_screenshot → "17-agent-create-form.png"
4. fill → User info (email, password, name)
5. select → agent_type: "ministry_agent"
6. select → ministry: Choose one
7. click → Submit
8. wait_for → Success or error
9. take_screenshot → "18-agent-created.png"

VALIDATIONS:
- [ ] User créé si nouveau
- [ ] Profile agent créé
- [ ] Agent apparaît dans liste
```

### Phase 12: Performance Analysis
```
ACTIONS:
1. performance_stop_trace
2. performance_analyze_insight

MÉTRIQUES:
- FCP, LCP, TTI, TBT, CLS
- API response times par endpoint
- Memory usage
```

---

## Rapport d'Analyse

### Template
```markdown
# Rapport E2E - Gestion des Accès
**Date:** [DATE]
**Environnement:** [URL]
**Backend:** [API_URL]

---

## Résumé Exécutif

| Catégorie | Valeur |
|-----------|--------|
| Tests exécutés | X/Y |
| Bugs identifiés | N |
| Commits de correction | M |
| Statut | **SUCCES/ECHEC** |

---

## Tests par Module

### Dashboard Stats
- [ ] Stats chargées correctement
- [ ] Total users: [VALUE]
- [ ] API calls: [STATUS]

### Rôles
- [ ] List: [STATUS]
- [ ] Create: [STATUS]
- [ ] Edit: [STATUS]
- [ ] Delete: [STATUS]
- [ ] Assign perms: [STATUS]

### Permissions Catalogue
- [ ] List: [STATUS]
- [ ] Search: [STATUS]
- [ ] Filter: [STATUS]

### User Permissions
- [ ] Select user: [STATUS]
- [ ] View overrides: [STATUS]
- [ ] Grant override: [STATUS]
- [ ] Revoke override: [STATUS]

### Agents
- [ ] List agents: [STATUS]
- [ ] List admins: [STATUS]
- [ ] Create agent: [STATUS]
- [ ] Edit agent: [STATUS]

---

## Requêtes Réseau

| Endpoint | Méthode | Status | Temps | Commentaire |
|----------|---------|--------|-------|-------------|
| /admin/users/stats | GET | 200 | Xms | OK |
| /audit-logs/stats | GET | 200 | Xms | OK |
| /roles | GET | 200 | Xms | OK |
| /roles | POST | 201 | Xms | OK |
| ... | ... | ... | ... | ... |

---

## Erreurs Console
| Type | Message | Fichier | Ligne |
|------|---------|---------|-------|
| ... | ... | ... | ... |

---

## Corrections Appliquées
| Hash | Message |
|------|---------|
| ... | ... |

---

## Screenshots
- 00-homepage.png
- 01-login-success.png
- 02-admin-dashboard.png
- ...
```

---

## Consistance Modèles

### DB Schema → Backend Models

| Table DB | Backend Model | Status |
|----------|---------------|--------|
| roles | RoleResponse | ✅ |
| permissions | Permission | ✅ |
| role_permissions | RolePermission | ✅ |
| user_permissions | UserPermission | ✅ |
| agent_profiles | AgentProfileWithDetails | ✅ |
| agent_workloads | AgentWorkload | ✅ |

### Backend Models → Frontend Types

| Backend | Frontend | Status |
|---------|----------|--------|
| RoleResponse | Role | ✅ |
| Permission | Permission | ✅ |
| UserPermission | UserPermission | ✅ |
| AgentProfileWithDetails | AgentProfile | ✅ |
| AgentWorkload | AgentWorkload | ✅ |
| UserStats | UserStats | ✅ |

---

## Permissions Requises pour Tests

Pour exécuter tous les tests, l'utilisateur admin doit avoir:

```
# Dashboard
users.view_stats
audit.view_stats

# Roles
roles.view
roles.create
roles.edit
roles.delete

# Permissions
permissions.view
permissions.view_user
permissions.grant_user
permissions.revoke_user

# Agents
agents.view_all
agents.create
agents.edit

# Users
users.view_all
users.create
users.search
```

---

## Seuils de Performance

| Métrique | Bon | Acceptable | Mauvais |
|----------|-----|------------|---------|
| FCP | <1.8s | <3s | >3s |
| LCP | <2.5s | <4s | >4s |
| TTI | <3.8s | <7.3s | >7.3s |
| API Response | <500ms | <2s | >2s |
| List Load | <1s | <3s | >3s |

---

## Checklist Finale

### Fonctionnel
- [ ] Login admin OK
- [ ] Dashboard stats chargées
- [ ] CRUD Rôles complet
- [ ] Catalogue permissions consultable
- [ ] User permissions overrides fonctionnels
- [ ] Agents & Admins listés
- [ ] Création agent OK

### Technique
- [ ] Aucune erreur console critique
- [ ] APIs répondent correctement
- [ ] Permissions validées côté backend
- [ ] Pas de memory leaks

### UX
- [ ] Loading states visibles
- [ ] Messages d'erreur clairs
- [ ] Toast notifications OK
- [ ] Navigation fluide
