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

### Phase 4 : Frontend UX Production-Grade 🔄 EN COURS
**Objectif** : UX fluide, professionnelle, digne d'un système de gestion d'accès enterprise

**Étape 4.1 — Fix PermissionCheckbox (i18n + AlertDialog)** ✅
- [x] Remplacer `window.confirm()` par `AlertDialog` Shadcn (avec state `showCriticalDialog`)
- [x] Remplacer strings françaises hardcodées par `useTranslations('admin.permissions')`
- [x] Ajouter les clés i18n dans es.json, fr.json, en.json (6 clés: criticalDialog*, criticalBadge, criticalInfo)

**Étape 4.2 — Split page monolithique** ✅
- [x] Extraire Tab "Rôles" → `RolesTab.tsx` (composant dédié, i18n)
- [x] Extraire Tab "Catalogue" → `PermissionsCatalogTab.tsx` (+ PermissionRow factorisé)
- [x] Extraire Tab "Permissions Utilisateurs" → `UserPermissionsTab.tsx` (clés existantes mappées)
- [x] Page principale réduite à 87 lignes (layout + tabs + imports)
- [x] Barrel export mis à jour dans `roles-admin/index.ts`
- [x] TypeScript clean compile

**Étape 4.3 — Matrice de permissions visuelle** ✅
- [x] Composant `PermissionMatrix.tsx` : grille rôles × permissions avec checkboxes
- [x] Backend: `GET /roles/permission-matrix?module_name=X` — 3 queries optimisées (roles + perms + assignments)
- [x] Vue "matrice" en alternative à la vue "liste" sur le tab Rôles (toggle button)
- [x] Bulk toggle par colonne (rôle) via click sur header
- [x] Tooltips, sticky headers, critical indicators, grant counts per role

**Étape 4.4 — Recherche & filtres avancés** ✅
- [x] Debounce search (300ms) sur RolesTab et PermissionsCatalogTab
- [x] Filtres par module, criticité déjà en place (PermissionsCatalogTab)
- [x] Pagination client-side sur le catalogue permissions (20/page)

**Étape 4.5 — Indicateurs temps réel** (reporté — Phase 5+)
- [ ] Badge "Permissions critiques" avec count sur le header
- [ ] Timeline audit dans le drawer de chaque rôle/utilisateur
- [ ] Indicateur visuel "dernière modification" sur chaque rôle

**Checklist validation Phase 4:**
- [x] PermissionCheckbox: 0 window.confirm(), AlertDialog + i18n (es/fr/en)
- [x] Page principale 87 lignes (< 150 cible)
- [x] Matrice permissions affiche N rôles × M permissions (filtré par module)
- [x] Recherche debounce 300ms
- [ ] Quelques strings FR restantes dans RolesTab (héritage du code original)
- [x] TypeScript clean compile (0 errors)

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

### Phase 6 : Admin Modulaire (Delegation Chain) 🔶 PARTIELLEMENT COMPLÉTÉE (2026-03-10)
**Objectif** : Remplacer le modèle "1 super-admin voit tout" par des profils admin scopés par module

**Problème actuel** :
- 15 permissions `admin.*` existent en BD mais assignées à AUCUN rôle
- AdminSidebar.tsx = 30+ items hardcodés, zéro filtrage par permission
- 1 seul admin dans tout le système, aucune délégation possible
- Rôle `ADMIN` (29 perms) = fantôme (pas dans user_role_enum)

**Étape 6.1 — Créer les profils admin modulaires (migration BD)** ✅
- [x] `super_admin` : 291 permissions (ALL)
- [x] `admin_agents` : 81 permissions (agent + assignment + users + dashboard + reports + service_request read)
- [x] `admin_services` : 42 permissions (fiscal_service + document + workflows + tariffs + service_request read)
- [x] `admin_config` : 56 permissions (communication + menu + translation + webhook + system)
- [x] `admin_security` : 27 permissions (permissions + roles + audit + system, sans admin.run_migrations)
- [x] `admin_support` : 22 permissions (support + diagnostics + service_request read)
- [x] `admin` : 209 permissions (superset de tous les scoped admins, privilege inversion corrigée)
- [x] Created `admin.view_security` permission for anomaly endpoint
- [x] Migration: `194_scoped_admin_roles.sql` + `196_fix_admin_privilege_inversion.sql` (exécutées)

**Étape 6.2 — Rendre le sidebar admin dynamique (role-filtered)** ⬜ BLOQUÉE
- [x] Code ajouté (SECTION_ROLE_MAP, SUBCAT_ROLE_MAP, canSeeSection)
- [x] Code RETIRÉ car `getAuthData().user.role` retourne toujours `'admin'` (enum BD users.role), JAMAIS le code RBAC scopé (`admin_agents`, etc.)
- [ ] **BLOQUEUR** : La réponse login doit inclure le code du rôle RBAC (table `roles`) en plus du `user.role` enum
- [ ] Tant que le bloqueur n'est pas résolu, tous les admins voient toutes les sections (backend enforce le vrai contrôle)

**Étape 6.3 — Middleware route protection** (DEFERRED)
- Requires auth context refactor to pass RBAC role code + permissions to middleware
- Current Next.js middleware only has access to role cookie (user.role enum)
- Dépend de la résolution du bloqueur 6.2

**Checklist validation Phase 6:**
- [x] Profils admin scopés créés en BD (6 rôles, permissions correctes, hiérarchie respectée)
- [x] admin.view_security permission existe et assignée
- [x] ADMIN fantôme already cleaned up (migration 193)
- [ ] ~~admin_agents sees ONLY relevant sections~~ **FAUX** — filtrage retiré (bloqueur architectural)
- [ ] Route-level middleware protection (deferred — backend already enforces)

---

### Phase 7 : Presets Agents & Superviseurs par Métier 🔶 PARTIELLEMENT COMPLÉTÉE (2026-03-10)
**Objectif** : Différencier les permissions par métier, créer les rôles manquants, enrichir les superviseurs

**Problème actuel** :
- 7 rôles agents non-treasury = CLONES (20 perms identiques)
- 5 rôles superviseurs non-treasury = 11 perms (ne peuvent pas voir agents/docs/requests)
- MINFP (5 workflows) n'a AUCUN rôle
- ITV (1 workflow) n'a AUCUN rôle
- EXTRANJERIA et POLICIA n'ont pas de supervisor
- Legacy `pasaporte` a 5 perms utiles absentes des `agent_*`

**Étape 7.1 — Enrichir le socle commun agent** ✅
- [x] 7 agents non-treasury ont les 4 perms legacy (escalate, export, view_audit_log, view_available_slots)
- [x] agent_itv (19) et agent_onrc (19) : view_available_slots exclue (pas d'appointments pour inspections/contrats)
- [x] Total agent de base : 24 permissions (ITV/ONRC: 19)

**Étape 7.2 — Ajouter les permissions métier-spécifiques** ⬜ NON FAIT
- [ ] `document.verify_vehicle`, `service_request.verify_plates` — **N'EXISTENT PAS en BD**
- [ ] `document.verify_contract`, `service_request.verify_signatures` — **N'EXISTENT PAS en BD**
- [ ] `document.verify_visa`, `service_request.verify_identity` — **N'EXISTENT PAS en BD**
- [ ] `service_request.manage_minors` — **N'EXISTE PAS en BD**
- **Décision** : Reportée — ces permissions seront créées quand les workflows métier-spécifiques en auront besoin. Pas de valeur à créer des permissions fantômes sans logique backend associée.

**Étape 7.3 — Enrichir les superviseurs non-treasury** ✅
- [x] 9 superviseurs non-treasury = 21 perms chacun (10 perms enrichies : agent.list/view/view_performance, document.view/download, service_request.view/view_queue, reports.view/export_pdf, service_request.escalate)

**Étape 7.4 — Créer les rôles manquants** ✅
- [x] agent_minfp (24) + supervisor_minfp (21)
- [x] agent_itv (19) + supervisor_itv (21)
- [x] supervisor_extranjeria (21) + supervisor_policia (21)
- [x] Migration: `195_agent_trade_presets.sql` (exécutée)

**Étape 7.5 — Supprimer le legacy** ✅
- [x] pasaporte, supervisor, ADMIN — tous supprimés (migration 193, vérifié 0 résultats en BD)

**Étape 7.6 — Templates de création de rôle (frontend)** ✅
- [x] Step 0 wizard avec 4 templates (Agent/Supervisor/Admin Module/Custom)
- [x] `rolesApi.getByCode()` et `getPermissions()` implémentés et exportés
- [x] 62 clés i18n en 3 langues (es/fr/en), 0 string FR hardcodée
- [x] entity_type corrigé : `agent`/`entity_agent`/`null` (pas `ministry_agent`)

**Checklist validation Phase 7:**
- [x] 9/9 entities have both agent + supervisor roles (100% coverage)
- [x] Superviseurs enrichis : 21 perms (était 11)
- [x] Agents enrichis : 19-24 perms selon métier
- [x] 6 rôles manquants créés (MINFP, ITV, EXTRANJERIA sup, POLICIA sup)
- [x] Legacy supprimé (pasaporte, supervisor, ADMIN)
- [x] Wizard creation page + templates fonctionnels
- [ ] **Permissions métier-spécifiques (7.2)** — reporté (pas de logique backend pour les utiliser)

---

## RÉSUMÉ MIS À JOUR

| Phase | Statut | Items | Impact |
|-------|--------|-------|--------|
| 1 - Fix CRITIQUES | ✅ | 3 bugs (modèle + 2 vues) | Endpoints cassés |
| 2 - Performance | ✅ | 4 fixes (N+1 + LIMIT + SQL + batch) | Performance |
| 3 - Nettoyage BD | ✅ | 2 cleanups (doublons rôles + hooks) | Cohérence |
| 4 - Frontend UX | 🔶 4/5 | i18n + split + matrice + search (4.5 reporté) | UX |
| 5 - Scale 100+ | ⬜ | 3 optimisations (cache + bulk + anomalies) | Production-grade |
| 6 - Admin Modulaire | 🔶 1/3 | BD OK, sidebar BLOQUÉE, middleware REPORTÉ | Delegation |
| 7 - Presets Métier | 🔶 5/6 | BD OK, templates OK, 7.2 métier-spécifique reporté | RBAC entité |

---

## PLAN ÉLÉMENTS REPORTÉS (Phase 4.5, 6.2/6.3, 7.2)

### Phase R1 : Propagation du rôle RBAC au frontend (BLOQUEUR 6.2 + 6.3)
**Priorité** : 🔴 P0 — Débloque sidebar dynamique + middleware + permissions client-side
**Prérequis** : Aucun
**Effort** : ~2-3h

**Problème** : `users.role` (enum BD) = `admin` pour TOUS les admin users. Le code RBAC scopé (`admin_agents`, `admin_security`, etc.) est dans `roles.code` mais n'est **jamais propagé** au frontend.

**Étape R1.1 — Backend: enrichir la réponse login**
- [ ] Modifier `auth_service.py` login response : ajouter `rbac_role_code` (requête `roles.code` via `user_permissions` ou `agent_profiles.role_id`)
- [ ] Ajouter `rbac_role_code: Optional[str]` au modèle `LoginResponse` / `UserResponse`
- [ ] Ajouter `rbac_permissions: list[str]` (optionnel, pour client-side permission check)
- [ ] Vérifier : comment l'admin est-il associé à son rôle RBAC ? Table `user_roles` ? `agent_profiles.role_id` ? Requêter la BD.

**Étape R1.2 — Frontend: stocker le rôle RBAC dans auth context**
- [ ] Modifier `core/auth/storage.ts` : stocker `rbac_role_code` dans le token/localStorage
- [ ] Modifier `getAuthData()` : exposer `rbac_role_code` en plus de `role`
- [ ] Créer hook `useRbacRole()` : retourne le code RBAC de l'utilisateur courant

**Étape R1.3 — Réactiver le sidebar filtering (Phase 6.2)**
- [ ] Restaurer `SECTION_ROLE_MAP` / `SUBCAT_ROLE_MAP` dans AdminSidebar.tsx
- [ ] Utiliser `useRbacRole()` au lieu de `getAuthData().user.role`
- [ ] Tester : admin_agents voit SEULEMENT Agents + Accès, admin_config voit Config + Traductions + etc.

**Étape R1.4 — Middleware route protection (Phase 6.3)**
- [ ] Stocker `rbac_role_code` dans un cookie httpOnly (ou JWT claim)
- [ ] Middleware Next.js : lire le cookie, vérifier les routes admin autorisées par rôle
- [ ] Rediriger vers `/dashboard` si route non autorisée

**Checklist validation R1:**
- [ ] Login response inclut `rbac_role_code`
- [ ] AdminSidebar filtre par rôle RBAC réel
- [ ] admin_agents ne peut PAS naviguer vers /admin/config (middleware bloque)
- [ ] Backend unchanged (enforce toujours via permissions)

---

### Phase R2 : Indicateurs temps réel (Phase 4.5)
**Priorité** : 🟡 P2 — UX professionnelle
**Prérequis** : Aucun (indépendant de R1)
**Effort** : ~1-2h

**Étape R2.1 — Badge permissions critiques**
- [ ] Header page "Gestion Accès" : badge compteur des permissions critiques assignées
- [ ] Requête : `SELECT COUNT(*) FROM role_permissions rp JOIN permissions p ON ... WHERE p.is_critical`

**Étape R2.2 — Timeline audit dans drawer rôle/utilisateur**
- [ ] Composant `AuditTimeline.tsx` : affiche `audit_logs` filtrés par entity_id (rôle ou user)
- [ ] Endpoint existant : `GET /audit-logs?entity_type=role&entity_id=X` (vérifier)
- [ ] Intégrer dans le drawer détail de chaque rôle (page roles/[id])

**Étape R2.3 — Indicateur "dernière modification"**
- [ ] Colonne `updated_at` déjà existante sur `roles`
- [ ] Afficher "Modifié il y a X" dans la liste des rôles
- [ ] Badge "Récent" si modifié dans les 24h

**Checklist validation R2:**
- [ ] Badge critiques visible dans le header
- [ ] Timeline audit fonctionnelle dans drawer rôle
- [ ] "Dernière modification" affichée dans la liste

---

### Phase R3 : Permissions métier-spécifiques (Phase 7.2)
**Priorité** : 🟢 P3 — À implémenter quand les workflows métier le nécessitent
**Prérequis** : Workflows métier actifs pour chaque entité
**Effort** : ~1h par entité

**Principe** : Ne créer une permission métier que quand la logique backend l'utilise réellement.

**Étape R3.1 — Par entité, quand le besoin se présente**
- [ ] CNEDOGE : `service_request.manage_minors` → quand le workflow mineur a un check backend
- [ ] DGT/OFIVE : `document.verify_vehicle` → quand l'agent fait une vérification véhicule
- [ ] ONRC : `document.verify_contract` → quand l'agent valide les signatures contrat
- [ ] EXTRANJERIA/POLICIA : `document.verify_visa` → quand le check visa est implémenté

**Règle** : JAMAIS de permission fantôme. Chaque permission DOIT avoir un `@permission_required()` backend qui l'utilise.

---

### BUGS À CORRIGER (identifiés lors de l'audit)

| # | Sévérité | Description | Fichier | Statut |
|---|----------|-------------|---------|--------|
| B1 | **MAJEUR** | RolesTab filter `ministry_agent` → corrigé en `agent` (valeur BD réelle) | `RolesTab.tsx:245` | ✅ CORRIGÉ |
| B2 | **MAJEUR** | Cache invalidation pas appelée après grant/revoke/deny | `user_permission_routes.py` | ⬜ À FAIRE |
| B3 | **MINEUR** | `use-enum-labels.ts` fallback values obsolètes (dgi_agent, ministry_agent) | `hooks/use-enum-labels.ts` | ⬜ À FAIRE |
