# Looker Studio — Next Session Boot Prompt

**Last updated**: 2026-05-02 (end of session)
**Status**: backend complet, BD prête, password set — reste activation côté UI Looker Studio + automatisation des `report_id`.

> Si la session est perdue, **commence par lire** :
> 1. Ce fichier (vue d'ensemble + prochaines actions)
> 2. `.claude/plans/LOOKER_STUDIO_STATE_REPORT_2026_05_02.md` (rapport détaillé v1.3 — état + Q1-4 + guide UX)
> 3. `.claude/plans/LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` (plan stratégique 6 phases)
> 4. `.claude/plans/LOOKER_STUDIO_PHASE1_RUNBOOK.md` (runbook UI + Linking API)
> 5. `.claude/plans/LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` (Phase B community connector — RLS par entité)

---

## 1. Ce qui a été fait pendant la session 2026-05-02

### Commits déjà poussés (origin/develop)

| SHA | Description |
|---|---|
| `dc94b565` | B.3 — production polish (3 dashboards, audit, rate-limit, Sentry) |
| `bcf21371` | Phase 5 — admin embed Next.js + permission `dashboards.view_business` |
| `c1dced74` | Promote Business Dashboards link to top-level admin nav |

### BD Supabase — état réel vérifié 2026-05-02

- ✅ **Migration 315** appliquée : role `looker_readonly` créé (login=True, conn_limit=5, statement_timeout=30s, idle=60s, search_path=public)
- ✅ **Migration 316** appliquée (après corrections bugs colonnes + codes rôles)
- ✅ **Permission `dashboards.view_business`** : id=`fa9a4e7c-b333-4700-84dc-18c9b4c01a3b`, granted à 21 rôles réels (admin, super_admin + 19 agent_*)
- ✅ **Password `looker_readonly`** appliqué via ALTER ROLE (= `8wKSPFRjuAKm6569wvZAFqW4cUckCA_cYyvl_81yCAw`, identique au secret GCP `looker-readonly-pwd`)
- ✅ **Tests connexion** OK ports 5432 + 6543, SELECT autorisé sur 16 MVs/views, SELECT refusé sur PII
- ✅ **Non-régression** confirmée : permissions 335→336 (+1), role_permissions 1867→1888 (+21), 0 suppression

### Bugs critiques découverts/corrigés dans migration 316

La migration 316 (originale, créée hâtivement) référençait des colonnes/codes inexistants :

| Avant | Après | Pourquoi |
|---|---|---|
| `INSERT INTO permissions (..., category, ...)` | `INSERT INTO permissions (name, resource, action, description, module_name, is_critical, created_at)` | `category` n'existe pas ; vraies colonnes vérifiées via `information_schema.columns` |
| `INSERT INTO role_permissions (..., granted_at)` | `INSERT INTO role_permissions (role_id, permission_id, granted)` | `granted_at` n'existe pas ; vraie colonne = `granted` (bool) |
| Codes rôles inventés : `supervisor`, `agent_aduana`, `agent_dgi`, `agent_min_finanzas`, `agent_min_interior`, `agent_min_admin`, `agent_camara_comercio` | 21 codes réels en BD (admin, super_admin + 19 agent_*) | Liste vérifiée via `SELECT code FROM roles WHERE code LIKE 'agent_%' OR code IN ('admin','super_admin')` |

### Scripts laissés dans le repo (committables)

- `packages/backend/scripts/apply_migrations_315_316.py` — applique les 2 migrations + audit (idempotent, repeatable). Pattern psycopg2 sync (PAS asyncpg — asyncpg hangue depuis MSYS bash sur ce poste). Set audit trigger context (`app.current_user_id`) avant INSERT role_permissions.

### Rapport mis à jour

- `.claude/plans/LOOKER_STUDIO_STATE_REPORT_2026_05_02.md` v1.3 avec :
  - §6.0 credentials concrets (host, port, db, user, **password**, SSL)
  - §6.1-6.6 guide UX complet Path A vs Path B
  - §7 changelog v1.0→v1.3

---

## 2. Reste à faire — par ordre de priorité

### 🔴 Bloquant pour activer Looker (1-2h utilisateur)

#### Action U1 — Créer la 1ère datasource Looker Studio (UI)

**Fichier référence** : `LOOKER_STUDIO_PHASE1_RUNBOOK.md` §2.

**Credentials** :
| Champ | Valeur |
|---|---|
| Hôte | `db.bpdzfkymgydjxxwlctam.supabase.co` |
| Port | `6543` (pooler — recommandé) ou `5432` (direct) |
| Base | `postgres` |
| User | `looker_readonly` |
| Password | `8wKSPFRjuAKm6569wvZAFqW4cUckCA_cYyvl_81yCAw` |
| SSL | **Décocher** "Activer SSL" OU passer par onglet **URL JDBC** : `jdbc:postgresql://db.bpdzfkymgydjxxwlctam.supabase.co:6543/postgres?sslmode=require` |

**Note opérationnelle** : Looker Studio "Activer SSL" = mTLS (cert client). Inutile pour Supabase qui veut `sslmode=require` standard. Décocher la case ne désactive PAS le chiffrement (négocié implicitement par TLS).

#### Action U2 — Construire les 3 dashboards de référence (UI)

Dashboards à créer (specs widgets dans `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` §3) :
1. **Recaudación Fiscal** (`mv_treasury_daily_kpis`, 5 rows actuellement)
2. **Performance Agentes** (`mv_agent_daily_workload`, 3 rows)
3. **Catalogue Services** (`mv_services_translated`, 869 rows — celui-ci est déjà bien rempli)

#### Action U3 — Récupérer les `report_id` et les coller dans Cloud Run env vars

Pour chaque dashboard :
- URL Looker = `https://lookerstudio.google.com/reporting/<REPORT_ID>/page/<PAGE_ID>`
- Cloud Run → backend service → env vars :
  ```
  LOOKER_REPORTS_RECAUDACION_REPORT_ID=<id>
  LOOKER_REPORTS_RECAUDACION_PAGE_ID=<id>
  LOOKER_REPORTS_AGENTES_REPORT_ID=<id>
  LOOKER_REPORTS_AGENTES_PAGE_ID=<id>
  LOOKER_REPORTS_SERVICES_REPORT_ID=<id>
  LOOKER_REPORTS_SERVICES_PAGE_ID=<id>
  ```
- Redeploy → embed actif dans `/dashboard/admin/dashboards/[id]`

### 🟡 Améliorations identifiées (engineering — backlog priorisé)

#### Action E1 — Option 1 : automatisation `report_id` via table BD (3-4h)

Voir rapport §2.1 Option 1. **Recommandé** pour éviter le redeploy à chaque ajout/changement de rapport.

- [ ] Migration `dashboard_registrations(dashboard_id, looker_report_id, looker_page_id, is_active, updated_by, updated_at)`
- [ ] Endpoint `PUT /api/v1/admin/dashboards/{id}/looker-config` (permission `dashboards.manage`)
- [ ] Cache Redis 5 min (invalidé sur write)
- [ ] Page admin `/admin/dashboards/config` (formulaire inline)
- [ ] Refacto `GET /reports-config` pour lire la table avec fallback env vars

#### Action E2 — Plans à corriger : "ministry" → "entity" (30 min)

Le code utilise déjà `entity_codes` via `agent_profiles.entity_id → entities.code` (vérifié dans `rls.py`). Mais la doc plans utilise "ministry" en plusieurs endroits, créant de la confusion :

- [ ] `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` §3.1, §6.2, §6.3 : remplacer `ministry_*` par `entity_*`
- [ ] `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` §4.3 : table RLS rules per role
- [ ] Backend `dashboards.py` model : clarifier que le champ `ministry_id` est legacy/audit-only

#### Action E3 — `entity_location_id` granularité (4h, conditionnel)

Pour le dashboard `agentes` uniquement : un superviseur de site ne devrait pas voir les performances d'autres sites de la même entité.

- [ ] Vérifier si `mv_agent_daily_workload` contient `location_id`
- [ ] Étendre `AccessContext` avec `location_ids: tuple[uuid, ...]`
- [ ] Ajouter mode RLS `entity_location` au registry
- [ ] Tests négatifs CI : 2 agents même entité, sites différents → résultats disjoints

#### Action E4 — Phase B.2 OAUTH2 community connector (6-8h, conditionnel)

À déclencher quand un premier ministry stakeholder demande accès. Voir `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` §5.

#### Action E5 — Dashboard `adopcion` (1 jour, conditionnel)

Plan §3.2 — DAU/MAU/funnel. Nécessite création MV `mv_adoption_daily` (Phase 2 plan business).

#### Action E6 — dbt-core sur même Postgres (1 jour, optionnel)

Voir rapport §2.4 Q4 ETL. Discipline data quality + lineage + tests automatisés sans changer le datastore. Coût 0.

---

## 3. Décisions encore en attente (utilisateur)

Le rapport §5 liste 5 décisions. Statut :

| # | Décision | Statut |
|---|---|---|
| 1 | Automatisation `report_id` (Option 1 vs 2 vs 3) | ⏳ pending |
| 2 | Granularité RLS `entity_location_id` pour `agentes` ? | ⏳ pending |
| 3 | OK pour réécrire plans "ministry → entity" ? | ⏳ pending |
| 4 | ETL : statu quo / dbt-core / BigQuery ? | ⏳ pending |
| 5 | Ordre prochaine session | ⏳ pending — proposer (a) U1+U2+U3 (activation) puis (b) E1 (automatisation) |

---

## 4. Pièges techniques rencontrés (à NE PAS reproduire)

### Pattern Python+BD obligatoire sur ce poste

- **psycopg2 sync** (pas asyncpg) — asyncpg hangue depuis MSYS bash sur connexions Supabase
- **Trigger context** : avant tout `INSERT INTO role_permissions`, faire :
  ```python
  cursor.execute("SELECT id::text FROM users WHERE role::text IN ('admin','super_admin') ORDER BY created_at LIMIT 1")
  admin_id = cursor.fetchone()[0]
  cursor.execute("SELECT set_config('app.current_user_id', %s, false)", (admin_id,))
  ```
  Sinon le trigger `audit_role_permissions_change` crashe (FK vers users.id).

### Pattern gcloud subprocess

- `gcloud secrets versions access` depuis Python+MSYS hangue malgré `stdin=DEVNULL`
- Fallback : utiliser cmd.exe/PowerShell direct, OU pré-fetch via shell et passer en env var :
  ```bash
  export LOOKER_READONLY_DB_URL="$(gcloud secrets versions access latest --secret=looker-readonly-db-url --project=taxasge-dev)"
  ```
- **N'implémente PAS** un nouveau wrapper subprocess pour gcloud. Voir `database/tools/looker_studio_url_generator.py:fetch_db_url()` pour le pattern documenté.

### Toujours vérifier la BD AVANT d'écrire SQL

Règle mémoire #11, #12. Cette session a coûté 2 itérations sur 316 (`category` puis `granted_at`) parce que la migration originale n'a jamais été testée contre la vraie BD. **Toujours `SELECT column_name FROM information_schema.columns WHERE table_name=...` avant de patcher une migration**.

### Codes rôles à toujours valider

Règle mémoire #11. La liste à grant doit toujours venir de `SELECT code FROM roles WHERE ...`, jamais inventée.

---

## 5. Prompt de reprise (à coller en début de prochaine session)

```
Je reprends le travail Looker Studio sur Facil. Lis :
1. .claude/plans/LOOKER_NEXT_SESSION_BOOT.md (boot prompt + reste à faire)
2. .claude/plans/LOOKER_STUDIO_STATE_REPORT_2026_05_02.md (rapport v1.3)

Statut : backend complet, BD prête (migrations 315+316 appliquées 2026-05-02),
password looker_readonly set, tests connexion OK ports 5432/6543. Reste :
- U1+U2+U3 : créer datasource + 3 dashboards en UI Looker + coller report_id
- E1 : automatiser report_id via table BD + page admin (3-4h)
- E2 : corriger plans "ministry" → "entity" (30 min)
- E3-E6 : conditionnel (cf. plan)

Décide la priorité pour cette session. Mes 5 décisions pending sont
listées dans LOOKER_NEXT_SESSION_BOOT.md §3.
```

---

## 6. Files à committer en fin de session

```
M  packages/backend/database/migrations/316_dashboards_view_permission.sql
?? packages/backend/scripts/apply_migrations_315_316.py
?? .claude/plans/LOOKER_STUDIO_STATE_REPORT_2026_05_02.md
?? .claude/plans/LOOKER_NEXT_SESSION_BOOT.md
```

**À NE PAS committer** :
- `.claude/settings.local.json` (local config)
- `yarn.lock` (changement non lié)
- Autres fichiers untracked existants pré-session (MISSION_*, SESSION_BILAN_*, .claude/skills/, app.json, .tmp_dir.json)
