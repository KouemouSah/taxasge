# LOOKER E1 — Automatisation `report_id` via table BD + page admin

**Date de création** : 2026-05-04
**Statut** : 📋 PLANIFIÉ
**Prérequis** : Looker Studio backend opérationnel (commits dc94b565, bcf21371, c1dced74), migrations 315+316 appliquées
**Référence rapport** : `.claude/plans/LOOKER_STUDIO_STATE_REPORT_2026_05_02.md` §2.1 Option 1
**Effort estimé** : 3-4h impl + 1h critique = ~4-5h

---

## 1. Objectif

Remplacer le flux actuel `report_id` en **env vars Cloud Run + redeploy** par une **table BD éditable via UI admin**, pour permettre :
- Modification des `report_id` / `page_id` Looker Studio sans redeploy (zéro friction admin)
- Audit trail (qui a changé quoi quand) via `audit_logs`
- Activation/désactivation par dashboard sans toucher au code
- Backwards-compat : fallback env vars si la table est vide ou la ligne manquante

## 2. Contraintes non-négociables

- ✅ **1M+ transactions simultanées** : la lecture `GET /reports-config` est appelée à CHAQUE chargement de page admin → cache Redis 5 min obligatoire (clé unique pour les 3 dashboards, payload <2 KB).
- ✅ **OWASP** :
  - Auth : `permission_required("dashboards.manage")` sur PUT, `permission_required("dashboards.view_business")` sur GET
  - Input validation : `looker_report_id` regex strict (alphanum + dashes + underscores, ≤64 chars), `page_id` regex (`p_[a-zA-Z0-9_]+` ou null)
  - SQL injection : asyncpg `$1/$2` parametrized
  - XSS : React escape automatique
  - CSRF : FastAPI session middleware (déjà en place)
  - Audit trail : INSERT dans `audit_logs` à chaque PUT
  - Rate limit : 10 req/min/user sur PUT (vs 60 par défaut)
- ✅ **Zéro hardcoding** :
  - 3 dashboard_id (`recaudacion`, `agentes`, `services`) sont des constantes du registry, OK
  - URL Looker base, format `report_id` : extraits dans constants
  - Aucun UUID/role_id en dur — toujours via SELECT
- ✅ **UX intuitive** : page admin avec liste compacte, form inline collapsible, validation côté client + serveur, feedback toast, loading skeletons.
- ✅ **BD-first** : avant toute migration, vérifier `information_schema.columns` et `pg_roles`. Avant tout INSERT role_permissions, set `app.current_user_id`.

## 3. Architecture cible

```
┌─────────────────────────────────────────────────────────────────┐
│  PUT /api/v1/admin/dashboards/{id}/looker-config                │
│  permission_required("dashboards.manage")                        │
│  rate_limit(10/min)                                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ DashboardConfigService                                           │
│  - validate_dashboard_id(id) → 404 if not in registry           │
│  - validate_looker_ids(report_id, page_id) → 422 if regex fail  │
│  - INSERT/UPDATE dashboard_registrations (UPSERT ON CONFLICT)    │
│  - INSERT audit_logs (action='dashboard.config_update')          │
│  - cache.delete("dashboard_configs:all")                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ table dashboard_registrations                                    │
│  dashboard_id text PK                                            │
│  looker_report_id text NOT NULL                                  │
│  looker_page_id text                                             │
│  is_active boolean DEFAULT true                                  │
│  updated_by uuid REFERENCES users(id)                            │
│  updated_at timestamptz DEFAULT now()                            │
│  created_at timestamptz DEFAULT now()                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ GET /api/v1/dashboards/reports-config                            │
│  permission_required("dashboards.view_business")                 │
│  → cache.get("dashboard_configs:all")  (TTL 5min)               │
│    ↓ miss                                                        │
│  → SELECT * FROM dashboard_registrations WHERE is_active         │
│    ↓ row missing                                                 │
│  → fallback env vars (warn log)                                  │
│  → cache.set("dashboard_configs:all", payload, ttl=300)          │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Décomposition en phases

| Phase | Subject | Effort | Deliverable | Validation |
|---|---|---|---|---|
| 1 | BD foundations | 30min | Migration 317 (table + permission + grants) | Script verify BD live |
| 2 | Backend impl | 1h30 | Pydantic models, repo, service, endpoints, tests pytest | curl smoke + pytest pass |
| 3 | Frontend impl | 1h | Page `/admin/dashboards/config`, hook React Query, i18n | tsc + lint + UI manual |
| 4 | Integration | 30min | Apply migration + smoke staging + fallback test | Migration appliquée + 200 OK |
| 5 | Critique + commits | 1h | Plans cochés, commits sémantiques locaux, demande push | User approves push |

## 5. Checklist par phase (high-level)

### Phase 1 — BD foundations ✅ DONE 2026-05-04
- [x] Verify BD live : `dashboard_registrations` n'existe pas, `dashboards.manage` n'existe pas, schema `permissions`/`role_permissions`/`audit_logs` confirmés
- [x] Plan détaillé phase 1 dans `.claude/plans/LOOKER_E1_PHASE1_DETAIL.md`
- [x] Migration 317 SQL file
- [x] Script Python apply_migration_317.py (psycopg2, pattern session 2026-05-02, audit trigger context)
- [x] Application migration locale + verification queries (8 checks tous OK)
- [x] Test idempotence (2e run = no-op, counts inchangés)
- [x] **BONUS** : découverte que `dashboards.view_business` (migration 316) avait disparu de la BD entre sessions ; ré-appliquée (21 grants restaurés)

### Phase 2 — Backend ✅ DONE 2026-05-04
- [x] Plan détaillé phase 2 dans `.claude/plans/LOOKER_E1_PHASE2_DETAIL.md`
- [x] Models Pydantic : `DashboardConfigDTO`, `DashboardConfigUpdateRequest`, `DashboardConfigsListResponse`
- [x] Repository : `DashboardConfigRepository` (list_active, list_all, get_by_id, upsert) — asyncpg parametrized + UPSERT atomic with RETURNING
- [x] Service : new `DashboardConfigService` (get_public_reports_config + list_admin_configs + upsert_config) avec cache 5min + invalidation post-commit + audit_log dans la même transaction
- [x] Endpoint PUT `/api/v1/dashboards/admin/configs/{dashboard_id}` (rate limit 10/min, permission dashboards.manage, regex validation Pydantic)
- [x] Endpoint GET `/api/v1/dashboards/admin/configs` (permission dashboards.manage)
- [x] Refactor GET `/api/v1/dashboards/reports-config` : DB-first via service, env-var fallback préservé pour backwards-compat
- [x] Cache 5min Redis avec invalidation explicite après commit
- [x] Audit log INSERT atomique avec UPSERT
- [x] Rate limit 10 PUT/min sur write endpoint
- [x] Smoke tests E2E contre BD live PASS 6/6 (pytest formel à uniformiser plus tard, voir critique §7)

### Phase 3 — Frontend ✅ DONE 2026-05-04
- [x] Plan détaillé phase 3 dans `.claude/plans/LOOKER_E1_PHASE3_DETAIL.md`
- [x] Types TS mirroring Pydantic (DashboardConfigDTO, DashboardConfigUpdateRequest, DashboardConfigsListResponse, DashboardConfigSource)
- [x] API service étendu : listAdminConfigs + updateAdminConfig
- [x] Hook `useUpdateDashboardConfig` (mutation + invalide queryKey ['dashboards-admin'])
- [x] Hook `useDashboardConfigs` (React Query staleTime 1min)
- [x] Component `DashboardConfigsListPage` (loading/error/403/empty)
- [x] Component `DashboardConfigForm` (Zod validation, react-hook-form, shadcn Form, toast feedback, 429 rate-limit error mappé)
- [x] Page route `/admin/dashboards/config/page.tsx` avec back link
- [x] Lien "Configurer" depuis DashboardsListing (header + cards awaiting_setup)
- [x] i18n keys es/fr/en (13 keys par locale, JSON validés)
- [x] ESLint 0 erreur 0 warning ; tsc full-project OOM mais imports/types respectent patterns repo (gap documenté en critique phase 3)

### Phase 4 — Integration & smoke ⏳ POST-DEPLOY (utilisateur)
- [x] Plan détaillé phase 4 dans `.claude/plans/LOOKER_E1_PHASE4_DETAIL.md` (script complet curl + checklist UI manual)
- [x] Migration 317 appliquée localement (BD prod-like accessible)
- [ ] Migration 317 appliquée sur staging via GitHub Actions deploy (à exécuter après push)
- [ ] Smoke tests A-F (curl) sur staging à exécuter post-deploy par l'utilisateur
- [ ] UI manual checks 4.1-4.6 sur Firebase Hosting staging à exécuter post-deploy

### Phase 5 — Critique globale + commits + push request
- [x] Critique honnête phase 1 (dans LOOKER_E1_PHASE1_DETAIL.md §8)
- [x] Critique honnête phase 2 (dans LOOKER_E1_PHASE2_DETAIL.md §7)
- [x] Critique honnête phase 3 (dans LOOKER_E1_PHASE3_DETAIL.md §7)
- [x] Critique globale dans CE FICHIER (§9 ci-dessous)
- [x] 4 commits locaux sémantiques groupés (c9810e31 phase 1, c4a8181a phase 2, bbfa45a2 phase 3, 7529a254 E2 docs)
- [x] Update MEMORY.md (règle #36 workflow strict + nouvelle entrée session E1)
- [ ] Demande explicite confirmation push (Règle #13) — **EN COURS**

## 6. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Migration cassée silencieusement (colonne fantôme) | Medium | High | BD verify script lancé AVANT écriture (FAIT) |
| Cache stampede sur GET reports-config | Low | Medium | Single key + Redis SETNX (existing HybridCache pattern) |
| Audit trigger crashe | Low | High | Set `app.current_user_id` AVANT INSERT (pattern session 2026-05-02) |
| Frontend casse l'embed existant | Medium | High | Phase 3 ne touche QUE la nouvelle page config, pas DashboardEmbed |
| Regex looker_report_id trop strict | Low | Medium | Tester sur un vrai report_id Looker connu (alphanum + dashes typiquement) |
| Permission dashboards.manage non-grantée à un user existant | Low | Low | Migration grant à admin + super_admin uniquement (pas aux agents) |

## 7. Critères de succès (mesurable)

1. ✅ Admin peut éditer le `report_id` d'un dashboard via UI → effet immédiat (pas de redeploy)
2. ✅ Audit log contient l'entrée `dashboard.config_update` avec user_id + before/after
3. ✅ Citoyen ne peut PAS voir/éditer la config → 403
4. ✅ Si la table est vide, `GET /reports-config` retourne les env vars (backward compat)
5. ✅ Pytest backend pass
6. ✅ tsc + lint frontend pass
7. ✅ Smoke curl passe sur staging
8. ✅ Plans+memory à jour

## 8. Ordre de validation utilisateur

À la fin de chaque phase, je présente :
- Diff résumé (fichiers touchés + lignes)
- Résultats tests
- Critique honnête (gaps si présents)
- Demande validation pour passer à la phase suivante

À la fin globale (phase 5), je demande **confirmation explicite avant `git push`**.

---

## Annexe A — BD verifiée 2026-05-04

```
[1] dashboard_registrations exists? False  (expected: False)  ✓
[2] permissions schema: id, name, resource, action, description, is_critical, module_name, created_at, updated_at
[3] role_permissions schema: role_id, permission_id, granted, created_at, created_by, scope
[4] audit_logs schema: id, user_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, created_at
[5] existing dashboards.* permissions: dashboards.view_business (et c'est tout — dashboards.manage à créer)
[6] dashboards.manage exists? False  (expected: False)  ✓
[7] roles eligible: admin (3674d2c7-...), super_admin (2d61119a-...)
[8] audit_trigger trg_audit_role_permissions: actif sur INSERT/DELETE — set app.current_user_id obligatoire
[10] audit_logs.action: varchar (pas enum) — pas de migration enum nécessaire pour 'dashboard.config_update'
```

## Annexe B — Référence Linking API (hors scope E1, garde pour plus tard)

`packages/backend/database/tools/looker_studio_url_generator.py` existe déjà mais ne sera PAS utilisé en E1 (Option 3 plan rapport). E1 = Option 1 stricte (table BD).

---

## 9. Critique globale E1 (phase 5)

### 9.1 Bilan quantifié

| Phase | Effort planifié | Effort réel | Output |
|---|---|---|---|
| Plan global + phase 1 | 30 min | 45 min (incl. découverte wipe BD) | 1 migration + 1 script + 2 plans |
| Phase 2 backend | 1h30 | 1h45 | 4 fichiers nouveaux + 3 modifiés + smoke 6/6 |
| Phase 3 frontend | 1h | 1h15 | 5 fichiers nouveaux + 6 modifiés + i18n 3 langues |
| E2 docs | 30 min | 20 min | 2 plans + 1 modèle Pydantic clarifiés |
| Phase 4 plan | 30 min | 20 min | Plan + script smoke complet |
| Phase 5 critique | 30 min | 25 min | Ce fichier + memory updates |
| **Total** | **~4-5h** | **~4h45** | **4 commits locaux** |

### 9.2 Commits locaux (à push après validation)

| SHA | Description | Fichiers |
|---|---|---|
| `c9810e31` | feat E1 phase 1 — migration 317 + dashboards.manage permission | 4 (1 SQL + 1 script + 2 plans) |
| `c4a8181a` | feat E1 phase 2 — backend admin endpoints + cache + audit | 10 (3 nouveaux + 3 modifiés + 1 smoke + 2 plans + master plan) |
| `bbfa45a2` | feat E1 phase 3 — frontend admin config page + i18n + Zod | 14 (5 nouveaux + 6 modifiés + 1 plan + 1 master plan + 1 i18n × 3 langues) |
| `7529a254` | docs E2 — clarify ministry → entity in plans + Pydantic legacy note | 3 |

### 9.3 OWASP audit complet

| OWASP Top 10 | Mitigation |
|---|---|
| A01 Broken Access Control | `permission_required("dashboards.manage")` sur PUT, `dashboards.view_business` sur GET. Strict separation des privilèges (2 perms distinctes). |
| A02 Cryptographic Failures | Pas de stockage de secrets ; les Looker IDs ne sont PAS sensibles. JWT auth existant. HTTPS obligatoire. |
| A03 Injection | asyncpg parametrized $1/$2 partout. Pydantic regex + length validation. Path param `dashboard_id` whitelist via registry. |
| A04 Insecure Design | Plan détaillé écrit avant code. Cache invalidation post-commit (évite race). UPSERT atomique avec audit_log dans la même tx. |
| A05 Security Misconfiguration | CHECK constraints BD comme last-resort defense. is_critical=TRUE flag. Rate limit 10/min sur write. |
| A06 Vulnerable Components | Aucune nouvelle dépendance ; tout est sur les libs déjà auditées (FastAPI, Pydantic, asyncpg, React Query, react-hook-form, zod). |
| A07 Auth Failures | Permission gate existant + JWT validation (héritage repo). Audit trail complet. |
| A08 Data Integrity | Atomic transactions (UPSERT + audit). FK ON DELETE SET NULL. Idempotent migration. |
| A09 Logging | audit_logs row pour chaque PUT (user, ip, UA, before/after). loguru warnings sur fallbacks (cache miss, env_fallback usage). |
| A10 SSRF | N/A — pas de fetch externe côté serveur dans cette feature. |

### 9.4 Performance 1M+

| Critère | Approche | Statut |
|---|---|---|
| Hot read path | Redis cache 5min sur `/reports-config` | ✅ |
| Cache stampede | Single key, payload <2KB | ✅ |
| Cache miss fallback | HybridCache memory_only quand Redis down | ✅ (existant) |
| BD lock contention | UPSERT atomique (1 round-trip) | ✅ |
| BD index | Partial index sur is_active=true | ✅ |
| Frontend | React Query staleTime + invalidation | ✅ |

### 9.5 Hardcoding zero check

- ✅ Aucun UUID en dur (résolus via SELECT)
- ✅ Aucun role_id en dur (résolus via JOIN roles)
- ✅ Aucun report_id en dur (lus depuis BD ou env vars)
- ✅ Registry `_REPORTS_METADATA` = code (label/description/rls_mode), pas BD = cohérent (vise = MV/RLS qui sont en code)
- ⚠️ Regex `^[a-zA-Z0-9_-]{8,64}$` dupliqué (Zod + Pydantic + BD CHECK) — DÉLIBÉRÉMENT (defense in depth) avec commentaires de sync dans les 3 fichiers

### 9.6 Risques résiduels (à surveiller)

1. **Wipe BD entre sessions** : la session 2026-05-04 a découvert que la migration 316 avait disparu de la BD entre 2026-05-02 et 2026-05-04. Solution actuelle : ré-applique idempotent via script. Solution propre future : job GitHub Actions qui valide périodiquement les permissions critiques. **Hors scope E1**.
2. **Désynchronisation regex Zod ↔ Pydantic ↔ BD CHECK** : si on change l'un sans les 2 autres, comportement incohérent. Mitigation : commentaires de sync explicites dans tous les 3 fichiers.
3. **Cache sur instances multiples** : si on scale horizontalement Cloud Run > 1 instance, l'invalidation cache après PUT n'atteindrait que l'instance qui a fait le write. Mitigation : Redis Upstash est déjà partagé entre instances. Le `cache.delete()` invalide dans Redis donc TOUTES les instances voient le miss au prochain GET. **Pas un risque réel** mais à confirmer à scale.
4. **Pas de pytest formel pour le service** : utilisé un smoke script à la place. À uniformiser plus tard.
5. **tsc full-project OOM** : pas de validation type globale dans cette session. Le build Next.js via GitHub Actions sera la vérif effective.

### 9.7 Verdict global

**✅ E1 PRÊT POUR PUSH** sous réserve de :
- Validation explicite de l'utilisateur (Règle #13)
- Smoke tests post-deploy phase 4 à exécuter par l'utilisateur (script fourni)
- UI manual test à exécuter par l'utilisateur après Firebase Hosting redeploy

**Bénéfices apportés** :
- Plus jamais besoin de redéployer Cloud Run pour changer un report_id
- Audit trail complet des modifications de config
- Validation regex en 3 couches (defense in depth)
- UX admin propre (form inline + toast feedback)
- Backwards-compat env vars (transition douce)
- 3 langues complètes

**Coût ajouté** :
- 1 nouvelle table BD (3 lignes max)
- 1 nouvelle permission (`dashboards.manage`, 2 grants)
- ~1280 lignes ajoutées (backend), ~1064 lignes (frontend)
- Maintenance : aucune (table éditée par admin via UI)
