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

## Phase 0 — Quick Wins Backend (1-2 jours) ⬜

### 0.1 Éliminer double fetch user dans permission_service
- [ ] `has_permission()` accepte `user: UserResponse` en paramètre (déjà fetchée par middleware)
- [ ] `permission_required()` passe `current_user` au service au lieu de re-fetch
- **Impact** : -50% requêtes par permission check

### 0.2 CTE matérialisée pour get_all_permission_names
- [ ] Réécrire la requête UNION en CTE WITH MATERIALIZED
- [ ] Inclure deny resolution dans la CTE
- [ ] Benchmark avant/après
- **Impact** : 50-200ms → <10ms

### 0.3 Cache warming au login
- [ ] Après login réussi, pré-charger permissions dans Redis
- [ ] Évite le cache miss initial (première requête lente)
- **Impact** : Élimine latence première action post-login

### 0.4 Cacher _check_funcionario_status
- [ ] Ajouter cache Redis 5min pour statut funcionario
- [ ] Clé : `func:status:{matricula}`
- **Impact** : -80 requêtes/sec pour agents funcionarios

### 0.5 Fixer rôle business
- [ ] Migration : ajouter permissions essentielles (service_request.*, payment.*, document.*, company.*)
- [ ] Vérifier avec BD les permissions existantes
- **Impact** : Bug critique corrigé

### Checklist Phase 0 :
- [ ] 0.1 validé (tests)
- [ ] 0.2 validé (benchmark)
- [ ] 0.3 validé (test login)
- [ ] 0.4 validé (test fonctionnaire)
- [ ] 0.5 validé (query BD)

---

## Phase 1 — RBAC Engine Consolidation (3-5 jours) ⬜

### 1.1 Hiérarchie de rôles (parent_role_id + CTE récursive)
- [ ] Migration : `ALTER TABLE roles ADD COLUMN parent_role_id UUID REFERENCES roles(id)`
- [ ] Remplir : admin_agents.parent = admin, supervisor_*.parent = agent_*, etc.
- [ ] CTE récursive pour résolution permissions héritées
- [ ] Tests : modifier parent → enfants mis à jour
- **Impact** : Élimine maintenance manuelle 15+ rôles

### 1.2 Permissions effectives en 1 requête
- [ ] Nouvelle fonction `get_effective_permissions(user_id)` : 1 CTE unique
- [ ] Résolution : parent_role → role → user_grants - user_denies
- [ ] Cache L1 in-process (dict Python, invalidé par event)
- [ ] Cache L2 Redis (10min TTL)
- **Impact** : 2-9 req → 1 req par check

### 1.3 Audit triggers PostgreSQL
- [ ] Trigger sur role_permissions (INSERT/DELETE → audit_logs)
- [ ] Trigger sur user_permissions (INSERT/UPDATE/DELETE → audit_logs)
- [ ] Trigger sur roles (UPDATE → audit_logs)
- [ ] Format : `{action, entity_type, entity_id, old_data, new_data, performed_by}`
- **Impact** : Traçabilité automatique sans code applicatif

### 1.4 Permission scoping (scope JSONB)
- [ ] `ALTER TABLE role_permissions ADD COLUMN scope JSONB DEFAULT NULL`
- [ ] Scope = `{"entity_code": "CNEDOGE"}` ou `{"entity_codes": ["CNEDOGE", "DGT"]}`
- [ ] NULL = global (pas de restriction)
- [ ] Résolution dans CTE : scope match ou NULL
- **Impact** : Permissions limitées par entité

### 1.5 Sync permissions registry au deploy
- [ ] Script Python : scan tous les `@require_permission()` dans le code
- [ ] Compare avec BD : orphelins détectés, manquants signalés
- [ ] Rapport JSON dans CI/CD
- **Impact** : 0 permissions fantômes garanties

### Checklist Phase 1 :
- [ ] 1.1 Migration + CTE testée
- [ ] 1.2 Benchmark 1 req vs actuel
- [ ] 1.3 Triggers vérifiés (audit_logs se remplit)
- [ ] 1.4 Scope testé avec agent limité
- [ ] 1.5 Script CI/CD intégré

---

## Phase 2 — Refonte UX Admin (5-7 jours) ⬜

### 2.1 Bulk actions agents + rôles
- [ ] DataTable avec selection (copier pattern page users)
- [ ] Actions : activer/désactiver, assigner rôle, exporter
- [ ] Progress bar + rollback on failure

### 2.2 Slide-in panels (remplacer modals)
- [ ] RolePermissionsDialog → Sheet side panel
- [ ] Split layout : search gauche, sélection droite
- [ ] Permission preview en temps réel

### 2.3 Inline toggle agent actif/inactif
- [ ] Switch directement dans la ligne du tableau
- [ ] Optimistic update + rollback on error
- [ ] Toast avec undo 10s

### 2.4 Clone rôle
- [ ] Bouton "Dupliquer" sur chaque rôle
- [ ] Endpoint POST /roles/{id}/clone
- [ ] Copie nom + "_copy", toutes permissions

### 2.5 Export CSV
- [ ] Bouton export sur pages rôles, agents, permissions, users
- [ ] Backend : endpoint GET /export?format=csv
- [ ] Headers i18n selon locale

### 2.6 Command Palette (Cmd+K)
- [ ] Composant CommandDialog (cmdk library)
- [ ] Actions : navigation, search users/agents/roles, actions rapides
- [ ] Raccourcis clavier documentés

### Checklist Phase 2 :
- [ ] Bulk actions fonctionnelles sur agents
- [ ] Panels slide-in remplacent modals
- [ ] Toggle inline sans page reload
- [ ] Clone rôle testé
- [ ] Export CSV vérifié
- [ ] Cmd+K fonctionnel

---

## Phase 3 — Event Bus + Real-time (5-7 jours) ⬜

### 3.1 EventEmitter Python (in-process)
- [ ] Classe EventBus singleton avec publish/subscribe
- [ ] Events typés : PermissionGranted, RoleUpdated, AgentDeactivated, etc.
- [ ] Async listeners (non-bloquants)

### 3.2 Listeners core
- [ ] AuditLogger : écrit audit_logs automatiquement
- [ ] CacheInvalidator : purge permissions/menus automatiquement
- [ ] NotificationService : email/push sur events critiques

### 3.3 WebSocket broadcast
- [ ] FastAPI WebSocket endpoint /ws/admin
- [ ] Broadcast permission changes → sidebar se met à jour
- [ ] Frontend : useWebSocket hook avec reconnection

### 3.4 Permission Simulator
- [ ] Endpoint POST /permissions/simulate
- [ ] Input : action proposée (grant/revoke/role change)
- [ ] Output : liste des users impactés + permissions avant/après
- [ ] UI : diff view rouge/vert

### Checklist Phase 3 :
- [ ] Events émis sur mutations RBAC
- [ ] Audit logs automatiques via listener
- [ ] Cache invalidation automatique
- [ ] WebSocket real-time testé
- [ ] Simulator fonctionnel

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
