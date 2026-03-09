# Plan de Refonte Production-Grade : Gestion de Accesos

**Date** : 2026-03-09
**Statut** : EN ATTENTE VALIDATION
**Scope** : Backend (permissions module) + Frontend (3 modules admin)

---

## RAPPORT CRITIQUE D'AUDIT

### État actuel de la BD
- **290 permissions** réparties sur 23 modules
- **21 rôles** (dont doublons `admin`/`ADMIN`, legacy `pasaporte`)
- **129 user_permissions** (tous grants, 0 denies, 0 avec expiration)
- **295K entrées audit_log** (295K UPDATE = trigger sur bulk ops)
- **1 seule vue sur 3** existe (`v_permission_usage_analytics` OK, les 2 autres MANQUANTES)

### Bugs CRITIQUES (endpoints cassés en production)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| C1 | **CRITIQUE** | `GrantPermissionToUserRequest` et `RevokePermissionFromUserRequest` n'ont PAS de champ `user_id`, mais les endpoints `grant` (L131) et `revoke` (L177) font `request.user_id` → **AttributeError** | `models/user_permission.py` + `api/user_permission_routes.py` |
| C2 | **CRITIQUE** | Vue `v_user_effective_permissions` n'existe pas → `get_user_effective_permissions()` crashe | `repositories/permission_repository.py` L348-372 |
| C3 | **CRITIQUE** | Vue `v_overprivileged_users_detection` n'existe pas → `detect_overprivileged_users()` crashe | `repositories/permission_repository.py` L480-521 |

### Bugs MAJEURS (performance/sécurité)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| M1 | **MAJEUR** | N+1 dans `assign_permissions_to_role()` : 2N requêtes au lieu de 2 (validation individuelle + assignation individuelle) | `services/role_service.py` L270-294 |
| M2 | **MAJEUR** | `get_expired_permissions()` sans LIMIT → résultat illimité, risque OOM | `repositories/user_permission_repository.py` L150-165 |
| M3 | **MAJEUR** | Potentiel SQL injection dans `get_permission_usage_analytics()` (f-string dans WHERE) | `repositories/permission_repository.py` L415-420 |
| M4 | **MAJEUR** | Doublons rôles : `admin` (33 perms) vs `ADMIN` (29 perms) — confusion admin | BD |
| M5 | **MAJEUR** | Legacy role `pasaporte` (21 perms) coexiste avec `agent_cnedoge_pasaporte` (20 perms) | BD |

### Issues Frontend

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| F1 | **MINEUR** | `window.confirm()` hardcodé en français dans `PermissionCheckbox.tsx` au lieu de AlertDialog + i18n | `permissions-admin/components/PermissionCheckbox.tsx` L93-98 |
| F2 | **MINEUR** | Modules dupliqués : `useRoles` et `useUserPermissions` existent dans `permissions-admin` ET dans leurs modules dédiés | `permissions-admin/hooks/` |
| F3 | **MINEUR** | Page principale 1154 lignes — monolithique, devrait être split | `admin/roles/page.tsx` |

### Points positifs (à préserver)
- ✅ React Query bien structuré (query keys, invalidation, optimistic updates)
- ✅ 98% i18n coverage (next-intl)
- ✅ AlertDialog utilisé pour delete (sauf PermissionCheckbox)
- ✅ Audit log actif (trigger BD)
- ✅ Architecture hook-based propre (pas besoin de Context global)
- ✅ Collapsible module grouping dans l'UI permissions

---

## PLAN D'IMPLÉMENTATION

### Phase 1 : Fix CRITIQUES (endpoints cassés) ✅ COMPLÉTÉE
**Objectif** : Restaurer les endpoints grant/revoke qui crashent en production

**Étape 1.1 — Fix modèles Pydantic**
- [x] Ajouter `user_id: UUID` à `GrantPermissionToUserRequest`
- [x] Ajouter `user_id: UUID` à `RevokePermissionFromUserRequest`
- [x] Frontend déjà compatible (envoie `user_id` dans body)

**Étape 1.2 — Créer les vues BD manquantes**
- [x] Migration `192_create_permissions_views.sql` créée et exécutée
- [x] Vue `v_user_effective_permissions` : CTEs role_perm_counts + user_override_counts, capability_level
- [x] Vue `v_overprivileged_users_detection` : risk_score pondéré, risk_level, recommendation
- [x] Vue `v_permission_usage_analytics` : recréée avec colonnes `module`, `usage_category`, `users_with_permission` (ancien vue trop simple)
- [x] 15 permissions `admin.*` assignées au rôle `admin` (étaient assignées à PERSONNE)
- [x] Permissions `dashboard.*`, `reports.*`, `rules.*` ajoutées au rôle `admin`

**Checklist validation Phase 1:**
- [x] 3/3 vues existent en BD (vérifié via information_schema.views)
- [x] Admin role : 72 permissions (était 33)
- [x] SQL des vues testé en lecture (résultats cohérents)

---

### Phase 2 : Performance & Sécurité ✅ COMPLÉTÉE
**Objectif** : Éliminer N+1, ajouter LIMIT, sécuriser SQL

**Étape 2.1 — Batch assign_permissions_to_role()**
- [x] Validation : `SELECT id FROM permissions WHERE id = ANY($1::uuid[])` (1 query)
- [x] Assignation : `INSERT ... SELECT $1, unnest($2::uuid[]), $3, $4 ON CONFLICT DO UPDATE` (1 query)
- [x] Pattern `unnest` + `ANY` validé (utilisé dans supervisor_routes.py et permission_registry.py)

**Étape 2.2 — LIMIT sur get_expired_permissions()**
- [x] Paramètres `limit: int = 500` et `offset: int = 0` ajoutés
- [x] Route `/expired` : paramètres `limit` et `offset` exposés avec validation (ge=1, le=1000)

**Étape 2.3 — SQL injection analytics**
- [x] Faux positif : le code utilise déjà des paramètres $N (pas d'injection)
- [x] Vue `v_permission_usage_analytics` recréée avec colonnes manquantes (Phase 1)

**Étape 2.4 — Bulk remove permissions**
- [x] `remove_permissions_batch()` ajoutée : `DELETE WHERE permission_id = ANY($2::uuid[])`
- [x] `remove_permissions_from_role()` utilise maintenant le batch (1 query)

**Checklist validation Phase 2:**
- [x] assign : 2 queries batch au lieu de 2N boucles
- [x] remove : 1 query batch au lieu de N boucles
- [x] get_expired_permissions : LIMIT/OFFSET appliqués
- [x] Aucune SQL injection (vérifié : tous les filtres utilisent $N)

---

### Phase 3 : Nettoyage BD & Cohérence ✅ COMPLÉTÉE
**Objectif** : Supprimer doublons, nettoyer legacy

**Étape 3.1 — Migration 193 exécutée**
- [x] ADMIN perms mergées dans admin → admin user migré → ADMIN supprimé
- [x] 4 perms utiles du legacy `pasaporte` ajoutées aux 7 agent_* (sauf agent_tesoro)
- [x] 11 perms essentielles ajoutées aux 5 supervisors non-treasury (21 perms, était 11)
- [x] Safety check avant suppression (DO $$ RAISE EXCEPTION si users restants)
- [x] Rôles supprimés : ADMIN (fantôme), pasaporte (legacy), supervisor (147 perms, non-assignable)

**Étape 3.2 — Hooks frontend nettoyés**
- [x] `permissions-admin/hooks/useRoles.ts` supprimé (dupliquait roles-admin)
- [x] `permissions-admin/hooks/useUserPermissions.ts` supprimé (dupliquait user-permissions-admin)
- [x] Barrel export nettoyé, 0 imports cassés (vérifié via grep)

**Checklist validation Phase 3:**
- [x] 0 rôles fantômes/legacy en BD (ADMIN, pasaporte, supervisor tous supprimés)
- [x] Admin user sur rôle `admin` lowercase (72 perms)
- [x] Agents non-treasury : 24 perms chacun (+4)
- [x] Supervisors non-treasury : 21 perms chacun (+10)
- [x] agent_tesoro inchangé (23 perms, pas de service_request.*)
- [x] supervisor_tesoro inchangé (55 perms)
- [x] 0 hooks dupliqués frontend

---

### Phase 4 : Frontend UX Production-Grade ⬜
**Objectif** : UX fluide, professionnelle, digne d'un système de gestion d'accès enterprise

**Étape 4.1 — Fix PermissionCheckbox (i18n + AlertDialog)**
- [ ] Remplacer `window.confirm()` par `AlertDialog` Shadcn
- [ ] Remplacer strings françaises hardcodées par `useTranslations('admin.permissions')`
- [ ] Ajouter les clés i18n dans es.json, fr.json, en.json

**Étape 4.2 — Split page monolithique**
- [ ] Extraire Tab "Rôles" → `RolesTab.tsx` (composant dédié)
- [ ] Extraire Tab "Catalogue" → `PermissionsCatalogTab.tsx`
- [ ] Extraire Tab "Permissions Utilisateurs" → `UserPermissionsTab.tsx`
- [ ] Page principale réduite à ~100 lignes (layout + tabs + imports)

**Étape 4.3 — Matrice de permissions visuelle**
- [ ] Composant `PermissionMatrix.tsx` : grille rôles × permissions avec checkboxes
- [ ] Vue "matrice" en alternative à la vue "liste" sur le tab Rôles
- [ ] Toggle vue matrice / vue liste
- [ ] Bulk toggle par ligne (rôle) ou colonne (permission)

**Étape 4.4 — Recherche & filtres avancés**
- [ ] Debounce search (300ms) sur tous les tabs
- [ ] Filtres par module, criticité, statut (actif/expiré)
- [ ] Badge count sur chaque tab
- [ ] Pagination serveur-side sur le catalogue permissions (290 entrées)

**Étape 4.5 — Indicateurs temps réel**
- [ ] Badge "Permissions critiques" avec count sur le header
- [ ] Timeline audit dans le drawer de chaque rôle/utilisateur (dernières 20 modifications)
- [ ] Indicateur visuel "dernière modification" sur chaque rôle

**Checklist validation Phase 4:**
- [ ] 0 strings hardcodées en français
- [ ] Page principale < 150 lignes
- [ ] Matrice permissions affiche correctement N rôles × M permissions
- [ ] Recherche < 100ms (debounce)
- [ ] Chaque tab a un badge count

---

### Phase 5 : Optimisation Scale (100+ agents) ⬜
**Objectif** : Architecture prête pour 100+ agents, caching, audit automatique

**Étape 5.1 — Cache Redis permissions**
- [ ] Cache `user_effective_permissions:{user_id}` (TTL 10min, déjà partiellement en place)
- [ ] Invalidation automatique sur grant/revoke/role change
- [ ] Endpoint `GET /permissions/me` avec cache-first

**Étape 5.2 — Bulk operations API**
- [ ] `POST /roles/{id}/permissions/bulk` — assigner/retirer N permissions en 1 appel
- [ ] `POST /user-permissions/bulk-grant` — accorder N permissions à N users
- [ ] `POST /user-permissions/bulk-revoke` — retirer N permissions à N users
- [ ] Toutes les opérations dans une transaction unique

**Étape 5.3 — Détection anomalies automatique**
- [ ] Créer la vue `v_overprivileged_users_detection` fonctionnelle
- [ ] Endpoint `GET /permissions/anomalies` — utilisateurs sur-privilégiés, permissions orphelines, rôles vides
- [ ] Widget dashboard admin "Alertes Accès"

**Checklist validation Phase 5:**
- [ ] Cache hit > 90% sur permissions/me
- [ ] Bulk operations < 200ms pour 50 permissions
- [ ] Anomalies détectées automatiquement

---

## RÉSUMÉ

| Phase | Items | Priorité | Impact |
|-------|-------|----------|--------|
| 1 - Fix CRITIQUES | 3 bugs (modèle + 2 vues) | 🔴 P0 | Endpoints cassés |
| 2 - Performance | 4 fixes (N+1 + LIMIT + SQL + batch) | 🟠 P1 | Performance dégradée |
| 3 - Nettoyage BD | 2 cleanups (doublons rôles + hooks) | 🟡 P2 | Cohérence |
| 4 - Frontend UX | 5 améliorations (i18n + split + matrice + search + audit) | 🟡 P2 | UX professionnelle |
| 5 - Scale 100+ | 3 optimisations (cache + bulk + anomalies) | 🟢 P3 | Production-grade |

**Estimation** : Phases 1-2 (critique, immédiat), Phase 3 (court terme), Phases 4-5 (moyen terme), Phases 6-7 (production-grade)

---

### Phase 6 : Admin Modulaire (Delegation Chain) ⬜
**Objectif** : Remplacer le modèle "1 super-admin voit tout" par des profils admin scopés par module

**Problème actuel** :
- 15 permissions `admin.*` existent en BD mais assignées à AUCUN rôle
- AdminSidebar.tsx = 30+ items hardcodés, zéro filtrage par permission
- 1 seul admin dans tout le système, aucune délégation possible
- Rôle `ADMIN` (29 perms) = fantôme (pas dans user_role_enum)

**Étape 6.1 — Créer les profils admin modulaires (migration BD)**
- [ ] `super_admin` : TOUTES les 290 + 15 admin.* permissions
- [ ] `admin_agents` : `agent.*` + `assignment.*` + `roles.view` + `user.view` + `user.manage`
- [ ] `admin_services` : `fiscal_service.*` + `admin.manage_workflow` + `admin.manage_tariff` + `document.*` + `admin.view_workflow`
- [ ] `admin_config` : `menu.*` + `communication.*` + `translation.*` + `admin.manage_entity` + `city.*` + `admin.manage_system`
- [ ] `admin_security` : `permissions.*` + `roles.*` + `user_permissions.*` + `audit.*`
- [ ] `admin_support` : `support.*` + `admin.view_diagnostics` + `admin.view_system`
- [ ] Assigner les 15 `admin.*` au rôle `admin` existant (actuellement manquantes !)
- [ ] Supprimer le rôle fantôme `ADMIN` (migrer ses perms uniques vers `admin`)
- [ ] Migration: `193_admin_modular_roles.sql`

**Étape 6.2 — Rendre le sidebar admin dynamique (permission-filtered)**
- [ ] Mapper chaque section du sidebar à une permission :
  - `access` → `agent.list` ou `user.view`
  - `fiscal` → `fiscal_service.view`
  - `config.communications` → `communication.view`
  - `config.workflows` → `admin.view_workflow`
  - `config.system` → `admin.view_system` ou `audit.view`
  - `support` → `support.view`
- [ ] Créer hook `useAdminPermissions()` qui charge les permissions effectives
- [ ] Filtrer dynamiquement les items du sidebar en fonction des permissions
- [ ] Admin modulaire ne voit QUE ses sections autorisées
- [ ] Fichier: `AdminSidebar.tsx`

**Étape 6.3 — Middleware route protection**
- [ ] Protéger chaque route admin avec la permission correspondante
- [ ] `/admin/agents/*` → require `agent.list`
- [ ] `/admin/roles/*` → require `roles.view`
- [ ] `/admin/fiscal-services/*` → require `fiscal_service.view`
- [ ] Retour 403 avec message clair si permission manquante
- [ ] Fichier: `middleware.ts` (extension de la logique existante)

**Checklist validation Phase 6:**
- [ ] Un `admin_agents` ne voit QUE la section Agents dans le sidebar
- [ ] Un `admin_agents` reçoit 403 sur `/admin/fiscal-services`
- [ ] Un `super_admin` voit tout (comme avant)
- [ ] Le rôle `ADMIN` fantôme est supprimé
- [ ] Les 15 `admin.*` sont assignées au rôle `admin`

---

### Phase 7 : Presets Agents & Superviseurs par Métier ⬜
**Objectif** : Différencier les permissions par métier, créer les rôles manquants, enrichir les superviseurs

**Problème actuel** :
- 7 rôles agents non-treasury = CLONES (20 perms identiques)
- 5 rôles superviseurs non-treasury = 11 perms (ne peuvent pas voir agents/docs/requests)
- MINFP (5 workflows) n'a AUCUN rôle
- ITV (1 workflow) n'a AUCUN rôle
- EXTRANJERIA et POLICIA n'ont pas de supervisor
- Legacy `pasaporte` a 5 perms utiles absentes des `agent_*`

**Étape 7.1 — Enrichir le socle commun agent**
- [ ] Ajouter à TOUS les `agent_*` les 5 perms manquantes du legacy `pasaporte` :
  - `service_request.escalate`
  - `service_request.export`
  - `service_request.view_audit_log`
  - `service_request.view_available_slots`
  - (`service_request.reassign` → NON, c'est supervisor-level)
- [ ] Total agent de base : 20 + 4 = 24 permissions

**Étape 7.2 — Ajouter les permissions métier-spécifiques**
- [ ] `agent_cnedoge_pasaporte` + `agent_cnedoge_residencia` : `+service_request.schedule_appointment` (déjà), `+service_request.manage_minors` (à créer si workflow mineur)
- [ ] `agent_dgt` + `agent_ofive` : `+document.verify_vehicle` (à créer), `+service_request.verify_plates`
- [ ] `agent_onrc` : `+document.verify_contract` (à créer), `+service_request.verify_signatures`
- [ ] `agent_extranjeria` + `agent_policia` : `+document.verify_visa` (à créer), `+service_request.verify_identity`
- [ ] Créer les nouvelles permissions si elles n'existent pas

**Étape 7.3 — Enrichir les superviseurs non-treasury**
- [ ] Ajouter à TOUS les 5 superviseurs les permissions manquantes :
  - `agent.list`, `agent.view`, `agent.view_performance` (voir ses agents)
  - `document.view`, `document.download` (voir les documents)
  - `service_request.view`, `service_request.view_queue` (voir les demandes)
  - `reports.view`, `reports.export_pdf` (rapports basiques)
  - `service_request.escalate` (escalader)
- [ ] Total supervisor de base : 11 + 11 = 22 permissions (vs 11 actuellement)

**Étape 7.4 — Créer les rôles manquants**
- [ ] `agent_minfp` : socle agent (24) + permissions Función Pública
- [ ] `supervisor_minfp` : socle supervisor (22)
- [ ] `agent_itv` : socle agent (24) + permissions inspection véhicules
- [ ] `supervisor_itv` : socle supervisor (22)
- [ ] `supervisor_extranjeria` : socle supervisor (22)
- [ ] `supervisor_policia` : socle supervisor (22)
- [ ] Tous avec `default_agent_config` approprié
- [ ] Migration: `194_agent_trade_presets.sql`

**Étape 7.5 — Supprimer le legacy**
- [ ] Déprécier rôle `pasaporte` (migrer users vers `agent_cnedoge_pasaporte`)
- [ ] Déprécier rôle `supervisor` générique (147 perms, non-assignable)
- [ ] Déprécier rôle `ADMIN` (déjà traité en Phase 6)

**Étape 7.6 — Templates de création de rôle (frontend)**
- [ ] Sur la page "Créer un rôle", ajouter étape 0 : "Choisir un template"
- [ ] Templates basés sur les profils existants :
  - `Agent [Entité]` → pré-sélectionne le socle agent + perms métier
  - `Supervisor [Entité]` → pré-sélectionne le socle supervisor
  - `Admin [Module]` → pré-sélectionne les perms admin module
  - `Personnalisé` → vierge (comportement actuel)
- [ ] L'admin peut ensuite ajuster les permissions pré-cochées
- [ ] Fichier: `admin/roles/new/page.tsx`

**Checklist validation Phase 7:**
- [ ] Chaque entité avec workflows a au moins 1 rôle agent + 1 rôle supervisor
- [ ] Les superviseurs non-treasury ont ≥22 permissions (vs 11 actuellement)
- [ ] Les agents non-treasury ont ≥24 permissions (vs 20 actuellement)
- [ ] MINFP et ITV ont leurs rôles dédiés
- [ ] Legacy `pasaporte`, `supervisor` générique, `ADMIN` supprimés
- [ ] Wizard création rôle propose des templates

---

## RÉSUMÉ MIS À JOUR

| Phase | Items | Priorité | Impact |
|-------|-------|----------|--------|
| 1 - Fix CRITIQUES | 3 bugs (modèle + 2 vues) | 🔴 P0 | Endpoints cassés |
| 2 - Performance | 4 fixes (N+1 + LIMIT + SQL + batch) | 🟠 P1 | Performance dégradée |
| 3 - Nettoyage BD | 2 cleanups (doublons rôles + hooks) | 🟡 P2 | Cohérence |
| 4 - Frontend UX | 5 améliorations (i18n + split + matrice + search + audit) | 🟡 P2 | UX professionnelle |
| 5 - Scale 100+ | 3 optimisations (cache + bulk + anomalies) | 🟢 P3 | Production-grade |
| **6 - Admin Modulaire** | **Profils admin scopés + sidebar dynamique + route protection** | **🔴 P1** | **Delegation chain** |
| **7 - Presets Métier** | **Rôles trade-specific + enrichissement superviseurs + templates création** | **🟠 P1** | **RBAC réel par entité** |

**Ordre d'exécution** : Phase 1 → 2 → 3 → 7 → 6 → 4 → 5
