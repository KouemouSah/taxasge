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

### Phase 3 — Frontend
- [ ] Plan détaillé phase 3 dans `.claude/plans/LOOKER_E1_PHASE3_DETAIL.md`
- [ ] Types TS mirroring Pydantic (`packages/web/src/modules/dashboards-admin/types/`)
- [ ] API service `updateDashboardConfig` + `fetchDashboardConfigs`
- [ ] Hook `useUpdateDashboardConfig` (React Query mutation, invalide `dashboard-configs`)
- [ ] Hook `useDashboardConfigs` (React Query, staleTime 5min)
- [ ] Component `DashboardConfigsListPage`
- [ ] Component `DashboardConfigForm` (Zod validation)
- [ ] Page route `/admin/dashboards/config`
- [ ] AdminSidebar link
- [ ] i18n keys es/fr/en (~10 keys)
- [ ] tsc --noEmit + ESLint

### Phase 4 — Integration & smoke
- [ ] Apply migration sur Supabase via script
- [ ] Verification post-apply : table existe, permission existe, granted to admin/super_admin
- [ ] Curl smoke : GET sans auth → 401, GET avec auth citoyen → 403, GET avec admin → 200
- [ ] Curl smoke : PUT happy path → 200 + audit_log row
- [ ] Curl smoke : PUT regex fail → 422
- [ ] Curl smoke : PUT non-existing dashboard_id → 404
- [ ] Test fallback env var : DELETE FROM dashboard_registrations → GET retourne env vars
- [ ] Test cache : 2nd GET dans 5min → log "cache hit"

### Phase 5 — Critique + commits
- [ ] Critique honnête : gaps, dette, OWASP, perf 1M+, hardcoding
- [ ] Auto-correction des bugs identifiés
- [ ] Update tous les plans (cocher checklist)
- [ ] Update MEMORY.md
- [ ] Commits locaux groupés sémantiques (1 par phase)
- [ ] Demande explicite confirmation push (Règle #13)

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
