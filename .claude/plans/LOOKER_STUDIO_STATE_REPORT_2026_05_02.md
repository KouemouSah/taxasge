# Looker Studio — Rapport d'état & questions ouvertes

**Date** : 2026-05-02
**Auteur** : Claude (Opus 4.7)
**Audience** : project lead
**Statut** : rapport synthétique de l'état d'avancement + 3 questions ouvertes posées par l'utilisateur

---

## 1. Ce qui est déjà fait

### 1.1 Architecture choisie

**Looker Studio = BI/dashboards business** (recaudación, adoption, performance agents, catalogue services).
- **Pas du temps réel** — Sentry et Grafana s'occupent de l'alerting live ; Looker traite les **tendances** (cache 1-15 min).
- **Connexion directe PostgreSQL → Looker Studio** (pas BigQuery, pas ETL).
- **Source data** : Supabase Postgres + materialized views rafraîchies par cron 15 min.
- **Coût** : <$1/mois sur free tier (Looker Studio gratuit, MV refresh = scheduler interne).

### 1.2 Phases livrées (ordre chronologique des commits)

| Commit | Phase plan | Contenu |
|---|---|---|
| `db14c965` | B.1 | Skeleton community connector Apps Script |
| `1859aa6f` | B.2a | Entity-level RLS + 60s server cache |
| `a13fce99` | — | Linking API URL generator + runbook §2 |
| `dc94b565` | B.3 | Production polish — 3 dashboards, audit, rate-limit, Sentry |
| `bcf21371` | 5 | Admin embed Next.js + permission `dashboards.view_business` |
| `c1dced74` | — | AdminSidebar : Business Dashboards promu top-level |

### 1.3 Backend opérationnel

**Module `packages/backend/app/modules/dashboards/`** :
- **Registry pattern** (`dashboards_service.py`) — chaque dashboard = 1 entrée dans `_DASHBOARD_REGISTRY` avec son schema, table, date_column, mode RLS.
- **4 modes RLS** :
  - `entity` → `table.entity_code = ANY(user.entity_codes)`
  - `agent_via_join` → JOIN `agent_profiles` → `entities` (pour MVs qui n'ont que `agent_profile_id`)
  - `admin_only` → 403 sauf si `access.is_staff`
  - `public` → pas de filtre, n'importe quel authentifié
- **Endpoint `GET /api/v1/dashboards/<id>/data`** — appelé par le community connector, applique RLS.
- **Endpoint `GET /api/v1/dashboards/reports-config`** — appelé par le frontend admin, retourne la liste des `report_id` Looker depuis env vars Cloud Run.
- **Audit logs** (`audit_logs` table, action=`dashboard.read`).
- **Rate limit** 60 req/min/user.
- **Sentry context** (set_user + set_tag par dashboard).

**3 dashboards déjà câblés au backend** :
- `recaudacion` → `mv_treasury_daily_kpis` (entity-RLS)
- `agentes` → `mv_agent_daily_workload` (agent_via_join via `agent_profile_id` → `ap.entity_id` → `entities.code`)
- `services` → `mv_services_translated` (public)

**Reporté** :
- `adopcion` — nécessite nouvelle MV `mv_adoption_daily` (DAU/MAU/funnel) — Phase 2 plan business.

### 1.4 Frontend opérationnel

**Module `packages/web/src/modules/dashboards-admin/`** :
- `types/index.ts` — TS mirrors des Pydantic models backend.
- `services/api.ts`, `hooks/useReportsConfig.ts` — React Query 5 min staleTime.
- `components/DashboardsListing.tsx` — landing grid, états skeleton/403/empty/error.
- `components/DashboardEmbed.tsx` — iframe + placeholder "Awaiting setup" si `report_id` null.
- **Routes** : `/dashboard/admin/dashboards` (landing) + `/dashboard/admin/dashboards/[id]` (embed).
- **i18n** : 14 clés × 3 locales (es/fr/en) sous `admin.dashboards`.
- **AdminSidebar** : "Business Dashboards" promu **top-level** (commit `c1dced74`) — visible à tous les admin scopes, gating réel côté serveur via `dashboards.view_business`.

### 1.5 Sécurité / RBAC

- **Migration 316** : permission `dashboards.view_business` granted à `admin`, `supervisor`, et tous les rôles `agent_*`. Citoyens / business / accountants → 403.
- **Permission gate** via `permission_required("dashboards.view_business")` côté FastAPI.

---

## 2. Réponse aux 3 questions de l'utilisateur

### 2.1 — Peut-on automatiser le copier/coller des `LOOKER_REPORTS_<id>_REPORT_ID` ?

**Oui, totalement.** L'état actuel (env vars Cloud Run + redeploy) est le minimum viable, mais il y a 3 niveaux d'automatisation possibles, du plus simple au plus avancé :

#### Option 1 — Stocker dans une table BD (recommandé)

Créer une table `dashboard_registrations` :

```sql
CREATE TABLE dashboard_registrations (
  dashboard_id text PRIMARY KEY,        -- 'recaudacion', 'agentes', etc.
  looker_report_id text NOT NULL,
  looker_page_id text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);
```

- **Endpoint admin** `PUT /api/v1/admin/dashboards/{id}/looker-config` (permission `dashboards.manage`) — édite `report_id` + `page_id`.
- **`GET /api/v1/dashboards/reports-config`** lit la table au lieu des env vars.
- **Cache Redis** 5 min sur la lecture (invalidé sur write).
- **Avantage** : zéro redeploy, modification par l'admin via une page UI (`/admin/dashboards/config`), audit trail (qui a changé quoi quand).

**Effort** : ~3-4h (migration + endpoint + page admin minimaliste). Backwards-compat : env vars en fallback si table vide.

#### Option 2 — Synchronisation via Looker Studio API

Looker Studio expose une **API REST** (`https://lookerstudiodeveloperapi.googleapis.com/v1/`) qui peut **lister les rapports** d'un compte de service GCP. Cron quotidien :

1. Liste tous les rapports tagués `facil:dashboard:<id>` (tag custom Looker).
2. UPSERT dans `dashboard_registrations` — `report_id` détecté automatiquement.

- **Avantage** : créer un rapport dans Looker Studio + ajouter un tag = il apparaît dans Facil sans aucune action manuelle.
- **Inconvénient** : OAuth2 service account + quota API + dépendance externe à un cron.

**Effort** : ~6-8h. Justifié si ≥10 dashboards à gérer.

#### Option 3 — Linking API + génération à la volée

Notre `looker_studio_url_generator.py` (déjà au repo) construit déjà des URLs de rapport via la **Looker Studio Linking API**. Pour un dashboard standardisé (template existant) :

- Le backend génère l'URL d'embed à la demande à partir d'un **template Looker** + paramètres (data source ID, filtres pré-câblés).
- Pas de `report_id` à stocker — l'URL est calculée.
- **Limite** : ne marche que pour rapports basés sur un **template**. Pour rapports custom drag-drop, on retombe sur Option 1 ou 2.

**Effort** : déjà 80% fait. Manque de wirer le générateur côté `/admin/dashboards`.

#### Recommandation

**Option 1 maintenant** (3-4h, gros gain UX), **Option 2 si la liste explose** au-delà de 10. Option 3 reste valide pour les dashboards "templates ministère" répliqués N fois.

---

### 2.2 — Ministère vs entité (avec `entity_location_id`) : qui a raison ?

**L'utilisateur a raison sur la doc, le code est déjà correct.**

#### État réel du code (déjà mergé)

Le RLS utilise **déjà `entity_codes`** via `agent_profiles.entity_id → entities.code` :

```python
# packages/backend/app/modules/dashboards/services/rls.py
SELECT DISTINCT e.code AS entity_code
FROM agent_profiles ap
LEFT JOIN entities e ON e.id = ap.entity_id
WHERE ap.user_id = $1
```

Et le filtre :
```python
# Agent: ("entity_code = ANY($N::text[])", [list_of_entity_codes])
```

**Donc le filtrage RLS est bien entity-based**, pas ministry-based.

#### Mais la documentation parle de "ministry"

C'est un **héritage rédactionnel** des plans :
- `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` §6.2 : "Per-ministry filtering pattern" — `v_user_ministry_map` exemple obsolète.
- `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` §4.3 : "Only their `agent_profiles.ministry_id`" — mauvaise réf.
- `dashboards.py` (Pydantic model) a un champ `ministry_id: Optional[int]` non utilisé pour le filtrage (`primary_ministry` dans audit log).

**À corriger** :
1. Réécrire les plans : remplacer "ministry" par "entity" partout (Doc B.1 + Doc B.3).
2. Supprimer `ministry_id` du model `DashboardDataRequest` ou clarifier que c'est legacy/audit-only.

#### `entity_location_id` — niveau plus fin

Question pertinente. Aujourd'hui le RLS filtre à la granularité **entité** (`MIN_INTERIOR`, `AYUNT_MALABO`, `MIN_TRABAJO`...). Mais `agent_profiles` a aussi un champ `location_id` ou les `entity_locations` qui scopent un agent à un site précis.

**Cas d'usage** : un agent `MIN_INTERIOR` à Malabo ne devrait pas voir les statistiques de `MIN_INTERIOR` à Bata, dans le dashboard `agentes` (pour ne pas exposer les performances de collègues d'un autre site).

**État actuel** : pas implémenté. Le filtrage actuel est `entity_code IN (...)` — un agent voit toutes les sites de son entité.

**Si nécessaire** : étendre `AccessContext` avec `location_ids: tuple[uuid, ...]` et un mode RLS `entity_location` :
```python
clause = "(entity_code = ANY($N::text[]) AND location_id = ANY($M::uuid[]))"
```

**Effort** : ~4h, conditionnel à la disponibilité de `location_id` dans les MVs (à vérifier MV par MV).

#### Recommandation

1. **Corriger les plans** : "ministry" → "entity" partout (~30 min).
2. **Décider** si `entity_location_id` est en scope :
   - Pour `recaudacion` : probablement non (revenue par entité, pas par site, est plus utile).
   - Pour `agentes` : **oui** très probablement (un superviseur de site veut voir SON site, pas les autres).
   - Pour `services` : non (catalogue public).
3. Si oui pour `agentes` : **Phase 6 ou hotfix**, ~4h, ajout d'un mode `entity_location` au registry RLS.

---

### 2.4 — ETL : possible ? nécessaire ? (ajout post-rapport initial)

**Possible : oui.** Plusieurs options.
**Nécessaire : non, pas aujourd'hui.** Complexité prématurée. Les MVs remplissent déjà 90% du rôle ETL pour notre volume.

#### Ce qu'un ETL ferait chez nous

ETL = **E**xtract (lire OLTP) → **T**ransform (agréger, joindre, dénormaliser) → **L**oad (écrire dans store optimisé OLAP).

Cibles possibles : BigQuery (canonique GCP), Supabase read replica (Postgres dédié), DuckDB / ClickHouse (alternatives légères). L'ETL remplacerait nos `mv_treasury_daily_kpis`, `mv_agent_daily_workload`, etc.

#### Ce qu'on a déjà = ETL "interne" via MVs

| Étape ETL | Équivalent actuel |
|---|---|
| Extract | `SELECT … FROM payments JOIN service_requests …` |
| Transform | `GROUP BY day, entity_code, payment_method` dans la définition MV |
| Load | `REFRESH MATERIALIZED VIEW CONCURRENTLY` toutes les 15 min via cron |

**Différences avec vrai ETL** :
- Source et destination = même base (Supabase Postgres). Pas de duplication cross-system.
- Pas de schedulers spécialisés (Airflow, dbt) — juste `scheduler.py`.
- Pas de versioning des modèles (dbt l'apporterait).
- Pas de tests data quality automatisés (great_expectations / dbt tests).

#### Options ETL si on voulait y aller

| # | Outil | Setup | Coût | Quand justifié |
|---|---|---|---|---|
| 1 | **dbt-core** sur Postgres (open source) | ~1 jour | Gratuit | Versioning + tests des modèles MV (data quality, lineage) — reste sur même Postgres |
| 2 | **Datastream + BigQuery** (GCP managed) | ~2 jours | $5-20/mois + Datastream ~$1/GB | OLTP en danger, historique >50 GB, cross-tenant analytics |
| 3 | **Airbyte / Fivetran** (managed) | ~1 jour | $50-300/mois | Multi-source (CRM, Stripe, etc.) — pas notre cas |
| 4 | **pg_cron + scripts Python** custom | ~3-5 jours | Gratuit | Réinvention de la roue, déconseillé |

**Seul qui apporte de la valeur maintenant : Option 1 (dbt-core).** Les autres règlent des problèmes qu'on n'a pas encore.

#### Pourquoi pas nécessaire aujourd'hui (3 raisons)

1. **Volume actuel** : tables `payments`, `service_requests` < quelques millions de rows. Les MVs refresh en quelques secondes. BigQuery = sur-dimensionnement + 24h de latence en prime via Datastream.

2. **Source de vérité unique** : ETL → BigQuery introduit 2 schémas à synchroniser. Chaque migration backend = risque de drift. Aujourd'hui le schéma est dans Postgres point. On ajoute une MV, on ajoute un index, fini.

3. **Coût/bénéfice négatif** : ETL = $5-300/mois + maintenance + bug surface (sync échoue, schémas divergent, retention à gérer). Bénéfice = "Looker plus rapide" — alors que les MVs + index résolvent ça à 0€.

#### Quand y revenir (signaux concrets)

| Signal | Action |
|---|---|
| Latence OLTP +20% pendant pics refresh dashboards | **D'abord read replica Supabase** ($25/mois), pas ETL |
| Queries Looker >30s sur dashboards de référence | Tuner index sur MVs, sinon read replica |
| Historique > 50 GB ET besoin OLAP (cohortes 2 ans) | **Là** Datastream → BigQuery devient justifié |
| Besoin de versionner/tester les modèles MV | **dbt-core** (pas de migration data, juste le tooling) |
| Volume > 100M payments/an | Datastream → BigQuery + read replica |

#### Recommandation

- **Court terme** : laisser tomber l'ETL. Garder MVs + cron refresh. Ajouter index si nécessaire.
- **Moyen terme (formalisation)** : **dbt-core sur le même Postgres**. Gain : versioning modèles (`mv_treasury_daily_kpis.sql` en git), tests automatisés (`unique`, `not_null`, `relationships`), lineage graph, doc auto-générée. Effort ~1 jour, coût 0. Amélioration zéro risque.
- **Long terme** : Datastream → BigQuery uniquement si un signal ci-dessus déclenche.

#### Verdict

**Pas nécessaire maintenant.** Justifiable plus tard via 2 portes d'escalade :
1. dbt-core (discipline) — sans changer le store.
2. BigQuery (scale) — quand les signaux le justifient.

---

### 2.3 — Aurait-on dû passer par BigQuery au lieu de PostgreSQL direct ?

**Non, pas à ce stade.** Mais c'est une décision à revisiter à 12-18 mois, pas définitive. Détail du raisonnement :

#### Pour PostgreSQL direct (choix actuel)

| Critère | Verdict |
|---|---|
| Coût | Gratuit (vs $5-20/mois min BigQuery) |
| Fraîcheur des données | 1-15 min (vs 24h avec Datastream) |
| Setup | Trivial (1 connecteur) (vs ETL pipeline) |
| Source de vérité unique | Oui (vs duplication OLTP→OLAP) |
| Maintenance | Aucune (vs schema sync, retention, monitoring ETL) |

#### Contre PostgreSQL direct (limites connues)

| Critère | Verdict |
|---|---|
| Risque OLTP impact | **Vrai** — un dashboard mal conçu peut surcharger la BD. Mitigation : MVs + read replica futur. |
| Scans gros datasets | **Vrai** au-delà de 100K rows/sec — on n'y est pas. |
| Historique long | **Vrai** au-delà de 50 GB — pour Facil c'est dans 12+ mois. |
| Pas d'OLAP-grade aggrégation | **Vrai** — mais nos KPIs business sont simples (sum, count, group by). |

#### Quand bascule-t-on vers BigQuery ?

3 signaux concrets, pas un seul :

1. **Latence OLTP** monte de >20% pendant les pics de refresh dashboards (alertable via Sentry/Cloud Monitoring).
2. **Looker Studio queries durent >30s** sur les 4 dashboards de référence.
3. **Historique de données >50 GB** et besoin de queries OLAP (cohort analysis, time-window aggregations sur 2+ ans).

**Plan de migration si déclenché** :
- Étape intermédiaire : **Supabase read replica** ($25/mois Pro). Looker pointe sur la replica. Pas de BigQuery, juste isoler l'OLTP.
- Si ça ne suffit pas : Datastream Postgres → BigQuery (24h sync), Looker pointe sur BigQuery. ~$5-20/mois + ~2 jours d'ingénierie.
- Coût total à ce stade : ~$50-100/mois. Justifiable si Facil a >10K agents actifs et >100M payments/an.

#### Verdict

**PostgreSQL direct était le bon choix initial.** Les MVs + cron refresh = 95% des bénéfices de BigQuery sans le surcoût. La discipline est de :
- Surveiller les 3 signaux ci-dessus (Sentry + Cloud Monitoring).
- Ne pas écrire de queries Looker qui scannent les tables OLTP brutes — toujours via MV.
- Préparer l'option "read replica" comme escape hatch avant BigQuery.

**Aurait-on dû** ? Non. **Faut-il y revenir ?** Pas avant 12 mois, et la première bascule devrait être read replica, pas BigQuery directement.

---

## 3. Points d'attention identifiés

### 3.1 Doc à corriger

- Remplacer "ministry" par "entity" dans :
  - `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` §3.1, §6.2, §6.3 (et tous les autres `ministry_code` qui devraient être `entity_code`).
  - `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md` §4.3 (table RLS rules per role).
  - Backend : `dashboards.py` model — clarifier que `ministry_id` est legacy.
- Mettre à jour le runbook B.3 pour refléter `entity_codes`.

### 3.2 Automatisation `report_id` (Q1)

- **Décision pending** : Option 1 (table BD) vs Option 3 (Linking API à la volée).
- **Sans automatisation**, chaque ajout/changement de rapport = redeploy Cloud Run = 5-10 min de friction.

### 3.3 Granularité RLS — `entity_location_id` (Q2)

- **Décision pending** par dashboard :
  - `recaudacion` : entité OK (ne pas raffiner).
  - `agentes` : ajouter `entity_location` ? (recommandé)
  - `services` : N/A (public).

### 3.4 Dashboard `adopcion` reporté

- MV `mv_adoption_daily` à créer (DAU/MAU/funnel).
- Phase 2 plan business — non bloquant pour les 3 autres.

### 3.5 Connector OAUTH2 — Phase B.2 incomplète

- B.1 (skeleton USER_PASS) + B.2a (entity-RLS côté backend) faits.
- B.2 complet (OAUTH2 dans le connector Apps Script) **pas commencé**.
- Aujourd'hui, le connector authentifie via JWT direct passé dans header — fonctionne mais nécessite au admin de coller son JWT dans la config connector. UX médiocre pour ministry stakeholders.

---

## 4. Recommandations ordonnées

| # | Action | Effort | Priorité | Justification |
|---|---|---|---|---|
| 1 | Corriger plans : "ministry" → "entity" | 30 min | High | Doc anachronique, source de confusion |
| 2 | Implémenter Option 1 (table `dashboard_registrations` + page admin) | 3-4h | High | Évite redeploys ; UX admin |
| 3 | Ajouter mode RLS `entity_location` pour dashboard `agentes` | 4h | Medium | Privacy entre sites |
| 4 | Créer rapports Looker Studio dans l'UI + wirer les 3 dashboards | 2h | High | Activation effective |
| 5 | Phase B.2 OAUTH2 complet (Apps Script) | 6-8h | Medium | UX ministry stakeholders |
| 6 | Dashboard `adopcion` (MV + RLS + UI) | 1 jour | Medium | Plan §4 dashboard #2 |

---

## 5. Décisions requises (utilisateur)

1. **Option d'automatisation `report_id`** : Option 1 (table BD), Option 2 (sync API), Option 3 (génération à la volée via Linking API), ou laisser env vars ?
2. **`entity_location_id` granularité** : ajouter au RLS pour `agentes` ?
3. **Plans à corriger** : OK pour réécrire les sections "ministry → entity" ?
4. **ETL** : (a) statu quo MVs ; (b) ajouter dbt-core ~1 jour pour discipline ; (c) plan ETL→BigQuery (déconseillé maintenant) ?
5. **Ordre prochaine session** : (a) corrections doc + Option 1 ; (b) activation rapports Looker UI ; (c) phase OAUTH2 ; (d) dashboard `adopcion` ; (e) dbt-core setup ?

---

## 6. Guide UX — configurer Looker Studio pour Facil

> **Référence visuelle** : `Documentations/workflow/debug/tesoro/data1.png` montre la page **Ajouter des données → Connexion aux données**. C'est le bon point d'entrée. Ce guide te dit quoi cliquer ensuite.

### 6.0 Pré-requis avant de commencer

Avant la première connexion, vérifier que ces 4 éléments existent côté backend (déjà faits selon le rapport §1) :

| # | Élément | Qui l'a fait | Comment vérifier |
|---|---|---|---|
| 1 | Rôle Supabase `looker_readonly` (SELECT scoped) | Backend | `SELECT rolname FROM pg_roles WHERE rolname='looker_readonly'` |
| 2 | IP allowlist Supabase ouverte aux IPs Looker Studio | DevOps | Dashboard Supabase → Settings → Database → Connection pooling |
| 3 | Materialized views créées (`mv_treasury_daily_kpis`, `mv_agent_daily_workload`, `mv_services_translated`) | Backend | `SELECT matviewname FROM pg_matviews WHERE matviewname LIKE 'mv_%'` |
| 4 | Cron `refresh_dashboard_mvs` enregistré dans `app/core/scheduler.py` | Backend | Vérifier les logs Cloud Run après le passage de 15 min |

**Credentials à utiliser** (vérifiés en BD le 2026-05-02 — migrations 315+316 appliquées, role activé, password set, double test ports 5432/6543 OK) :

| Champ | Valeur réelle |
|---|---|
| **Hôte** | `db.bpdzfkymgydjxxwlctam.supabase.co` |
| **Port** | `6543` (pooler — recommandé pour Looker) ou `5432` (direct) |
| **Base de données** | `postgres` |
| **Utilisateur** | `looker_readonly` |
| **Mot de passe** | `8wKSPFRjuAKm6569wvZAFqW4cUckCA_cYyvl_81yCAw` |
| **SSL** | ✅ requis (`sslmode=require`) |

**État BD vérifié** :
- Role `looker_readonly` : `login=True`, `connection_limit=5`, `statement_timeout=30s`, `idle_in_transaction_session_timeout=60s`, `search_path=public`
- SELECT autorisé sur 16 MVs/views agrégées (`mv_treasury_daily_kpis`, `mv_agent_daily_workload`, `mv_services_translated`, `mv_fiscal_services_catalog`, `mv_company_global_stats`, etc.)
- SELECT REFUSÉ sur PII (`users`, `payments`, `audit_logs`, `service_payments`, `service_requests`, `agent_profiles`, `uploaded_files`, etc.)
- Permission `dashboards.view_business` : id=`fa9a4e7c-b333-4700-84dc-18c9b4c01a3b`, granted à 21 rôles (admin, super_admin + 19 agent_*)
- Test connexion en tant que `looker_readonly` → OK sur les 2 ports
- **Non-régression confirmée** : permissions 335→336 (+1 nouvelle), role_permissions 1867→1888 (+21 grants), 0 ligne supprimée

**Pour rotation future** : `gcloud secrets versions access latest --secret=looker-readonly-pwd --project=taxasge-dev` (à lancer depuis cmd.exe/PowerShell où `gcloud` est dans le PATH ; le subprocess Python hangue sur ce poste depuis MSYS bash, il faut donc soit shell direct soit CI).

---

### 6.1 Choix du connecteur — Path A vs Path B

Looker Studio offre **deux connecteurs valides** pour Facil. Le choix dépend de l'audience finale du dashboard :

| | **Path A — PostgreSQL direct** | **Path B — Connector "Facil-Direct"** |
|---|---|---|
| Tile à cliquer dans la capture | **PostgreSQL** (carré bleu, "Par Google") | **Custom partner connectors** (en bas de page, à scroller) |
| Audience cible | Staff interne : admin, treasury supervisor, exec | Ministry stakeholders, agents scopés à une entité |
| Filtrage données | **Aucun** — voit toutes les entités | **Per-entity RLS** automatique (l'agent voit seulement son entité) |
| Auth | Username/password Supabase | OAuth2 (ou JWT Bearer) Facil |
| Source | Tables/MVs Postgres directement | Endpoint backend `/api/v1/dashboards/{id}/data` |
| Statut | **Recommandé pour les 3 dashboards initiaux** | À utiliser si on partage avec un agent ministériel |

**Recommandation pour la première mise en service** : **Path A** pour les 3 dashboards (`recaudacion`, `agentes`, `services`). Les staff internes sont les premiers utilisateurs ; on activera Path B (community connector) en Phase B.2 quand on partagera à des stakeholders ministère.

---

### 6.2 Path A — Configuration pas-à-pas (PostgreSQL direct)

#### Étape 1 — Créer la source de données

1. Dans la capture (data1.png), cliquer le tile **PostgreSQL**.
2. Cocher **« Activer SSL »** (obligatoire pour Supabase).
3. Renseigner :
   - **Hôte ou adresse IP** : `db.<project_ref>.supabase.co`
   - **Port** : `5432`
   - **Base de données** : `postgres`
   - **Nom d'utilisateur** : `looker_readonly`
   - **Mot de passe** : (depuis Secret Manager)
4. Cliquer **« Authentifier »** → Looker teste la connexion. Si erreur "connection refused" → IP allowlist Supabase, étape 7.0 #2.
5. Sélectionner **« Tableau personnalisé (CUSTOM QUERY) »** (PAS un tableau existant).

#### Étape 2 — Coller la requête source pour Dashboard 1 — Recaudación

```sql
-- Dashboard 1: Recaudación Fiscal
SELECT
  report_date,
  entity_code,
  entity_name,
  payment_method,
  workflow_code,
  payment_count,
  total_amount
FROM mv_treasury_daily_kpis
WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'
```

Cliquer **« AJOUTER »** → Looker analyse les colonnes et propose les types. Vérifier :
- `report_date` → type **Date** (pas String)
- `entity_code`, `entity_name`, `payment_method`, `workflow_code` → **Texte** (Dimension)
- `payment_count`, `total_amount` → **Nombre** (Mesure, sum par défaut)

#### Étape 3 — Construire les widgets selon `LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md` §3.1

| # | Widget | Type Looker | Configuration |
|---|---|---|---|
| 1 | Total recaudado (mois) | **Carte de score** | Métrique : `SUM(total_amount)`. Filtre date : current month |
| 2 | Hoy vs ayer | **Carte de score avec variation** | Métrique : `SUM(total_amount)`. Comparaison : période précédente (1 jour) |
| 3 | Recaudación diaria 90j | **Graphique linéaire chronologique** | X : `report_date`. Y : `SUM(total_amount)` |
| 4 | Par entité × méthode | **Histogramme empilé** | X : `entity_code`. Empilage : `payment_method`. Y : `SUM(total_amount)` |
| 5 | Répartition par méthode | **Camembert** | Dimension : `payment_method`. Métrique : `SUM(total_amount)` |
| 6 | Top 10 services | **Histogramme horizontal** | Dimension : `workflow_code`. Métrique : `SUM(total_amount)`. Tri : DESC, limite 10 |
| 7 | Pivot entité × méthode | **Tableau croisé dynamique** | Lignes : `entity_code`. Colonnes : `payment_method`. Valeur : `SUM(total_amount)` |
| 8 | % target mensuel | **Carte de score** | Métrique : `SUM(total_amount) / 1000000` puis ajouter target manuel comme paramètre |

**Filtre global (filter bar en haut du rapport)** :
- Plage de dates : par défaut « Ces 30 derniers jours »
- Sélecteur **entity_code** (déroulant multi-sélection)
- Sélecteur **payment_method**

**Couleurs / seuils** :
- Carte score #1 : vert si > 90% target, rouge si < 70%, ambre sinon (paramétrable dans Style → Conditional formatting).

#### Étape 4 — Récupérer le report_id

1. Une fois le rapport sauvegardé, regarder l'**URL** dans le navigateur :
   ```
   https://lookerstudio.google.com/reporting/abc123def456-7890-fghi-jklm-nopqrstuvwxy/page/p_1234567
   ```
2. La partie après `/reporting/` = **report_id** (`abc123def456-7890-fghi-jklm-nopqrstuvwxy`)
3. La partie après `/page/` = **page_id** (`p_1234567`)

#### Étape 5 — Câbler le rapport dans Facil

**Aujourd'hui (env vars Cloud Run)** :
1. Aller dans **Cloud Run → service backend → Modifier et déployer une nouvelle révision → Variables et secrets**.
2. Ajouter :
   ```
   LOOKER_REPORTS_RECAUDACION_REPORT_ID = abc123def456-7890-fghi-jklm-nopqrstuvwxy
   LOOKER_REPORTS_RECAUDACION_PAGE_ID   = p_1234567
   ```
3. Sauvegarder → redeploy automatique → 5-10 min plus tard, l'embed apparaît dans `/dashboard/admin/dashboards`.

**Après l'Option 1 (table BD, voir §2.1)** : aller dans `/admin/dashboards/config` → coller `report_id` + `page_id` → Save. Effet immédiat, pas de redeploy.

#### Étape 6 — Répéter pour Dashboards 2 et 3

**Dashboard 2 — Performance Agentes** :
- Source SQL :
  ```sql
  SELECT
    report_date, entity_code, entity_name, agent_full_name,
    site_id, site_name, decisions_count, sla_respected, sla_breached,
    avg_decision_hours, queue_depth
  FROM mv_agent_daily_workload
  WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'
  ```
- Widgets : 10 widgets selon plan §3.3 (SLA respect rate, decisions per agent, queue depth, etc.)
- Env var : `LOOKER_REPORTS_AGENTES_REPORT_ID` + `LOOKER_REPORTS_AGENTES_PAGE_ID`

**Dashboard 3 — Catalogue Services** :
- Source SQL :
  ```sql
  SELECT
    workflow_code, service_name_es, service_name_fr, service_name_en,
    entity_code, category_code, request_count_30d, completed_count_30d
  FROM mv_services_translated
  ```
- Widgets : 8 widgets selon plan §3.4 (top 50 services, growth rate, distribution par catégorie/entité, orphan services)
- Env var : `LOOKER_REPORTS_SERVICES_REPORT_ID` + `LOOKER_REPORTS_SERVICES_PAGE_ID`

---

### 6.3 Path B — Community connector "Facil-Direct" (Phase B.2 OAUTH2)

⚠️ **Pas encore opérationnel** — le connector skeleton existe (commit `db14c965`) mais la phase B.2 OAUTH2 reste à faire (~6-8h, voir §4 recommandation #5).

Quand il sera déployé, le flux sera :

1. Cliquer sur la barre de recherche en haut de la page (capture data1.png).
2. Taper **« Facil-Direct »** → tile custom apparaît dans **Custom partner connectors**.
3. Cliquer → écran d'auth → **« Se connecter avec Facil »** (OAuth2).
4. Sélectionner le `dashboard_id` dans une liste déroulante (`recaudacion`, `agentes`, `services`).
5. Looker affiche le schema retourné par `GET /api/v1/dashboards/{id}/data` → tu construis tes widgets normalement.
6. **Différence clé vs Path A** : la query backend filtre **automatiquement** par `entity_code` de l'utilisateur connecté. Un agent `MIN_INTERIOR` ne verra que ses lignes dans CHAQUE widget, sans config supplémentaire.

---

### 6.4 Pièges UX courants à éviter

| Piège | Symptôme | Solution |
|---|---|---|
| Connecter sur la table source (`payments`) au lieu de la MV | Dashboard lent (>15s), risque OLTP | **Toujours connecter sur les `mv_*`** — c'est pour ça qu'elles existent |
| Date au format STRING | Plage de dates ne marche pas, pas de groupement temporel | Cast explicite dans SQL : `report_date::date AS report_date` |
| Pas de filtre date dans la requête source | Looker scanne toute la table à chaque refresh | Toujours `WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'` |
| Cocher "Owner credentials" pour sharing | Tous les viewers voient avec **TES** droits (bypass RLS) | Mettre **« Viewer credentials »** quand path B sera dispo. Pour path A staff = "Owner" est OK |
| Embed iframe non-restricted | Tout internaute avec l'URL voit le rapport | Partage → restreindre à **« Personnes spécifiques »** ou **domaine Workspace** |
| Refresh > 15 min cache | Données stale jusqu'à 15 min | Si besoin frais : Fichier → Paramètres du rapport → **Fraîcheur des données → 1 min** (peut coûter en quota Postgres) |

---

### 6.5 Checklist de mise en service (3 dashboards initiaux)

Cocher dans cet ordre :

- [ ] **Pré-requis backend** (§7.0) : rôle, IP, MVs, cron — vérifier les 4 points
- [ ] **Dashboard 1 — Recaudación** : créer source → widgets → save → copier report_id → env var Cloud Run → vérifier dans `/dashboard/admin/dashboards/recaudacion`
- [ ] **Dashboard 2 — Agentes** : idem
- [ ] **Dashboard 3 — Services** : idem
- [ ] **Validation data accuracy** : sur Dashboard 1, choisir une journée passée connue, calculer manuellement `SUM(amount)` via psql, comparer au scorecard. Tolérance < 1%.
- [ ] **Stakeholder demo** : 1 question concrète par dashboard répondue en < 30s (ex : "combien MIN_INTERIOR a collecté la semaine dernière ?")
- [ ] **Sharing** : restreindre les rapports à `dashboards@taxasge` (groupe à créer) ou aux emails admin/treasury
- [ ] **Doc opérateur** : noter dans un README quels report_id correspondent à quels dashboard_id

---

### 6.7 ⚠️ JDBC visibility — Materialized Views invisibles + auto-sync

**Symptôme observé 2026-05-04** : un admin connecte Looker Studio en JDBC à `db.bpdzfkymgydjxxwlctam.supabase.co:6543`, ouvre l'onglet **TABLEAUX**, et ne voit que **2 relations** :
- `v_active_assignments`
- `v_active_service_request_assignments`

Pourtant `looker_readonly` a SELECT sur ~18 relations agrégées (vérifié par `has_table_privilege` + listing `pg_class`).

**Cause racine** : le driver JDBC PostgreSQL utilisé par Looker Studio appelle `DatabaseMetaData.getTables(types={"TABLE","VIEW"})` pour peupler son picker. PostgreSQL classifie les Materialized Views avec `pg_class.relkind='m'`, **qui n'est pas dans `{TABLE, VIEW}`** — le driver les filtre en silence. Seules les relations avec `relkind='r'` (table) ou `relkind='v'` (vue régulière) apparaissent. Tes 2 vues visibles sont les seules `relkind='v'` ; les 16+ MVs ont `relkind='m'` et restent invisibles, **même** avec les grants explicites en place.

**Ce n'est PAS un bug Facil** — comportement universel de tout client JDBC qui n'override pas le filtre par défaut (DBeaver, JetBrains DataGrip, certains BI tools). Documenté côté Postgres : https://www.postgresql.org/docs/current/catalog-pg-class.html#CATALOG-PG-CLASS-RELKIND.

#### Solution retenue (auto, durable, sans migration manuelle)

Hook au boot de l'app FastAPI : `sync_looker_view_wrappers()` dans
`packages/backend/app/modules/dashboards/services/looker_wrappers_sync.py`.
Appelé depuis `main.py` après `initialize_permissions`.

**Algorithme** :
1. Vérifier que le rôle `looker_readonly` existe ; sinon, log warning et exit.
2. Lister toutes les MVs (`relkind='m'`) du schéma `public` où `looker_readonly` a déjà SELECT (le grant = whitelist explicite "expose à Looker").
3. Pour chaque MV `<nom>` :
   - Calculer le nom du wrapper : `mv_<x>` → `vw_<x>`, `v_<x>` → `vw_<x>`, `<x>` → `vw_<x>`.
   - `CREATE OR REPLACE VIEW vw_<x> AS SELECT * FROM <nom>` (idempotent).
   - `GRANT SELECT ON vw_<x> TO looker_readonly`.
   - `COMMENT ON VIEW` documente l'origine auto-générée.
4. Détecter les wrappers orphelins (vw_* dont la MV source n'est plus grantée) → log info, **sans suppression** (politique non-destructive cohérente avec `cleanup_obsolete=False` sur les permissions).

**Pourquoi ça marche pour Looker** :
- Chaque wrapper est `relkind='v'` → visible dans le picker JDBC.
- Le planner Postgres inline `SELECT * FROM mv_<x>` → zéro storage, zéro latence ajoutée.
- Le backend continue de query `mv_<x>` directement (aucun changement code).

**Pourquoi c'est auto** :
- À chaque deploy GitHub Actions → Cloud Run reboot → boot exécute `sync_looker_view_wrappers()` → wrappers à jour.
- Quand un dev backend ajoute une nouvelle MV via migration et écrit `GRANT SELECT ON mv_xxx TO looker_readonly` à la fin de sa migration, **le prochain deploy crée le wrapper automatiquement**. Aucune migration séparée requise pour le wrapper. Aucune action manuelle de l'admin/utilisateur.

**Convention pour les futurs dev backend** :
- Ne PAS créer de wrapper `vw_xxx` à la main dans une migration. Le sync au boot s'en occupe.
- Dans la migration qui crée la nouvelle MV : ajouter UNE seule ligne `GRANT SELECT ON public.<nom_mv> TO looker_readonly;` à la fin. C'est tout.
- Si une MV ne doit PAS être exposée à Looker (ex : contient PII), ne pas la granter — elle restera invisible. C'est le mode opt-in via grant.

**État vérifié 2026-05-04 (test E2E contre BD live)** :
- 18 wrappers créés auto au 1er run
- Idempotent : 2e run = 0 changement (CREATE OR REPLACE no-op)
- Looker JDBC verra désormais **20 VIEWs** au lieu de 2 (les 2 anciennes + 18 nouvelles)
- Transparence vérifiée : `SELECT count(*) FROM vw_treasury_daily_kpis` == `SELECT count(*) FROM mv_treasury_daily_kpis` (5 rows)
- Pas de migration 318 requise — le boot suffit

**Action utilisateur** : après le prochain deploy backend (push 2026-05-04 + GitHub Actions), reconnecte le datasource JDBC dans Looker Studio. Tu verras 18 nouvelles vues `vw_*` cliquables dans l'onglet TABLEAUX.

**Alternatives écartées** (pour mémoire) :
- *Custom Query par dashboard* : marche, mais friction SQL pour chaque dashboard, pas auto.
- *Convertir MVs en VIEWs régulières* : query cost remonte sur l'OLTP à chaque refresh dashboard — inacceptable à 1M+ users.
- *Migration SQL avec wrappers en dur* : auto à la première fois, mais nécessite une migration à chaque ajout de MV. Pas durable.
- *PostgreSQL EVENT TRIGGER sur DDL* : élégant mais nécessite SUPERUSER, indisponible sur Supabase managed.
- *Cron toutes les X min* : ajoute latence (X min entre création MV et apparition wrapper) sans gain par rapport au boot sync.

**Note 2026-05-04 — limite UI Looker Studio sur le picker** : malgré les 20 VIEWs grantées et exposées correctement par le driver JDBC (vérifié par psql en tant que `looker_readonly` : `information_schema.tables` retourne bien 20 lignes), le picker UI Looker Studio **plafonne à ~9 entrées affichées sans pagination ni recherche dans cette version du connector**. Tester avec `packages/backend/scripts/test_looker_jdbc_view.py` confirme : la BD livre les 20 lignes sur les deux ports (5432 + 6543), le driver les reçoit, c'est l'UI qui tronque l'affichage. Comportement non documenté côté Google. **Solution opérationnelle** : voir §6.9 (REQUÊTE PERSONNALISÉE), garantie à 100% peu importe le cap UI.

### 6.8 Datasource model Looker Studio — comprendre pour éviter la friction

Looker Studio a un modèle de données qui peut surprendre — il vaut mieux le comprendre avant de créer le 1er rapport pour ne pas re-saisir les credentials 30 fois.

#### 6.8.1 Concepts clés

**Datasource** (« Source de données ») = **1 connexion + 1 requête + 1 cache de schéma**. C'est l'unité atomique. Looker stocke les credentials à l'intérieur du datasource (chiffrés). Un datasource créé est **réutilisable** sur tous les widgets d'un même rapport (et même cross-rapports si tu le sauvegardes au niveau compte).

**Important** : créer un nouveau datasource = re-saisir les credentials. Cliquer sur un datasource existant = **zéro re-saisie**. La friction "credentials demandés à chaque fois" vient de l'utilisateur qui crée un nouveau datasource au lieu de réutiliser.

#### 6.8.2 Pour Facil — 3 datasources, pas 24

Tu n'as pas besoin de créer 1 datasource par widget. Tu en crées **3 au total**, un par dashboard :

| Datasource | SELECT | Réutilisé pour |
|---|---|---|
| `Facil — Recaudación` | `SELECT * FROM vw_treasury_daily_kpis WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'` | Les 8 widgets du dashboard 1 |
| `Facil — Agentes`     | `SELECT * FROM vw_agent_daily_workload WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'` | Les 10 widgets du dashboard 2 |
| `Facil — Services`    | `SELECT * FROM vw_services_translated` | Les 8 widgets du dashboard 3 |

Une fois ces 3 datasources créés (3 saisies de credentials, **une seule fois**), tu ne passes plus jamais par l'écran d'authentification pour eux.

#### 6.8.3 Comment réutiliser un datasource existant (pas de re-saisie)

Quand tu insères un nouveau widget sur la page :
1. Le panneau de droite affiche **« Source de données »** avec le datasource déjà sélectionné par défaut (le dernier utilisé du rapport)
2. Pour changer : clique le menu **Source de données** → **CHANGER LA SOURCE DE DONNÉES** → choisis dans la liste **« Sources de données dans ce rapport »** (les 3 que tu as créés)
3. **Aucun écran de credentials, aucune re-authentication**

Quand tu cliques sur **« + Ajouter des données »** dans la barre du haut, Looker propose 3 onglets — **fais ATTENTION lequel tu choisis** :

| Onglet | Quoi | Re-saisie credentials ? |
|---|---|---|
| **Mes sources de données** | Datasources persistés au niveau de ton compte Google | **NON** — clic direct |
| **Sources de données dans ce rapport** | Les 3 datasources Facil que tu as créés dans CE rapport | **NON** — clic direct |
| **Se connecter aux données** (l'onglet PostgreSQL/JDBC) | Crée un NOUVEAU datasource | OUI (logique : nouveau = nouvelle connexion) |

→ **Erreur fréquente** : utiliser le 3ème onglet par réflexe → re-saisie. Bascule sur **« Sources de données dans ce rapport »** et clique sur le datasource existant.

#### 6.8.4 Gérer les datasources existants

Menu **Ressource** (en haut) → **Gérer les sources de données ajoutées** → liste des 3 datasources Facil. Clic sur un datasource pour éditer la requête SQL ou les paramètres sans toucher aux credentials. Pratique pour ajouter une colonne à la requête après-coup ou changer la fenêtre `INTERVAL '90 days'` → `INTERVAL '180 days'`.

#### 6.8.5 Sauvegarder un datasource au niveau compte (cross-rapport)

À la création du datasource, en haut de l'éditeur, icône **« Sauvegarder dans Mes sources de données »**. Coche-la pour que le datasource apparaisse dans **« Mes sources de données »** sur **tous tes futurs rapports** Looker — pas juste celui-ci. Pratique si tu veux ensuite créer un rapport "Vue exécutive" qui réutilise les 3 mêmes sources.

#### 6.8.6 Quand Looker te re-demande quand même les credentials

Cas légitimes :
- Mot de passe `looker_readonly` rotaté côté Supabase → tous les datasources cassent jusqu'à ré-auth
- Suppression manuelle d'un datasource → re-création requise
- Datasource en mode **"Identifiants du visualisateur"** au lieu de **"Identifiants du propriétaire"** (à régler à la création — voir §6.4)

Cas anormaux (à signaler) :
- Re-demande à chaque ouverture du rapport → bug session Looker, vérifier l'expiration cookie Google
- Re-demande après `Ctrl+S` sauvegarde → ne devrait jamais se produire

---

### 6.9 Requêtes personnalisées (REQUÊTE PERSONNALISÉE) à utiliser

⚠️ **À cause du cap UI sur le picker (§6.7 note)**, **utilise systématiquement l'onglet REQUÊTE PERSONNALISÉE**. Ne clique pas sur les vues dans le picker, même si elles apparaissent. La REQUÊTE PERSONNALISÉE garantit que tu accèdes à n'importe quelle vue, sans dépendre du picker.

#### 6.9.1 Dashboard 1 — 💰 Recaudación Fiscal

```sql
SELECT *
FROM vw_treasury_daily_kpis
WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY report_date DESC
```

Colonnes attendues (vérifier après "AJOUTER" et corriger les types si nécessaire) :
- `report_date` → **Date** (format `YYYY-MM-DD`)
- `entity_code`, `entity_name`, `payment_method`, `workflow_code`, `service_name`, `ministry_name` → **Texte** (Dimension)
- `payment_count`, `completed_count`, `rejected_count`, `sla_breached_count` → **Nombre** (Mesure, agrégation `SUM`)
- `total_amount`, `avg_amount` → **Nombre** avec format **Devise** (XAF si dispo, sinon EUR/USD comme fallback display)
- `avg_processing_minutes` → **Nombre** (Mesure)

#### 6.9.2 Dashboard 2 — 👥 Performance Agentes

```sql
SELECT *
FROM vw_agent_daily_workload
WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY report_date DESC, agent_name
```

Colonnes attendues :
- `report_date` → **Date**
- `agent_name` → **Texte** (Dimension)
- `approved`, `rejected`, `total_actions`, `avg_duration_seconds`, `p50_duration_seconds` → **Nombre** (Mesure)

#### 6.9.3 Dashboard 3 — 📚 Catalogue Services

```sql
SELECT *
FROM vw_services_translated
ORDER BY name_es
```

Colonnes attendues :
- `service_code`, `name_es`, `ministry_name_es`, `category_name_es`, `status`, `calculation_method` → **Texte** (Dimension)
- `view_count`, `calculation_count`, `processing_time_days` → **Nombre** (Mesure)
- `tasa_expedicion`, `tasa_renovacion` → **Nombre** format **Devise XAF**

---

### 6.10 Tutoriel pas-à-pas — créer les 3 rapports

Tu suivras la même séquence pour les 3 dashboards. Compte ~30 minutes pour le dashboard 1 (le 1er prend toujours plus longtemps), ~15 min pour les suivants.

#### 6.10.1 Setup commun (à faire UNE FOIS, valide pour les 3)

1. **Ouvrir Looker Studio** : https://lookerstudio.google.com
2. Connecter avec un compte Google qui aura accès aux dashboards (idéalement un compte de service ou compte admin Facil dédié, pas un compte personnel).
3. **Créer un dossier** "Facil — Dashboards Production" dans Drive (clic droit → Nouveau dossier) — pour grouper les rapports.

#### 6.10.2 Dashboard 1 — Recaudación Fiscal (le plus détaillé)

##### Étape 1 — Créer le rapport vide

1. Looker Studio → bouton **+ Créer** → **Rapport**
2. Au prompt "Ajouter des données au rapport", choisir l'onglet **Se connecter aux données** → **PostgreSQL** (premier tile bleu)

##### Étape 2 — Configurer la connexion

1. Bascule sur **URL JDBC** (onglet à gauche du panneau)
2. URL : `jdbc:postgresql://db.bpdzfkymgydjxxwlctam.supabase.co:6543/postgres?sslmode=require`
3. Nom d'utilisateur : `looker_readonly`
4. Mot de passe : `8wKSPFRjuAKm6569wvZAFqW4cUckCA_cYyvl_81yCAw`
5. **Décocher** "Activer SSL" (le sslmode est dans l'URL, le checkbox Looker veut du mTLS)
6. Clic **AUTHENTIFIER**

##### Étape 3 — Coller la REQUÊTE PERSONNALISÉE

1. Dans le panneau central, bascule sur l'onglet **REQUÊTE PERSONNALISÉE** (à gauche de "TABLEAUX")
2. Coller le SQL §6.9.1 :
   ```sql
   SELECT * FROM vw_treasury_daily_kpis
   WHERE report_date >= CURRENT_DATE - INTERVAL '90 days'
   ORDER BY report_date DESC
   ```
3. **Avant** de cliquer AJOUTER : en haut à gauche du panneau, renomme la datasource **`Facil — Recaudación`** (par défaut Looker met "PostgreSQL — postgres", inutile pour 3 datasources distincts)
4. Optionnel : icône **« Sauvegarder dans Mes sources de données »** en haut → coche pour rendre cross-rapport
5. Clic **AJOUTER** → Looker analyse les colonnes
6. Dialog "You are about to add data to this Report" → clic **AJOUTER AU RAPPORT**

##### Étape 4 — Vérifier les types de champs

Le rapport s'ouvre en mode édition. Avant de construire les widgets :

1. Menu **Ressource** → **Gérer les sources de données ajoutées** → clique sur "Facil — Recaudación"
2. Vérifie que les types correspondent à §6.9.1. Si Looker a deviné `Texte` au lieu de `Date` sur `report_date`, clique sur le type → **Date** → format **AAAA-MM-JJ**
3. Pour `total_amount` : clique le type → **Nombre** → `Devise` → choisis XAF (Franc CFA) si dispo, sinon laisse "Nombre" et formate dans chaque widget individuellement
4. Sauvegarde et reviens au rapport

##### Étape 5 — Insérer les 8 widgets

Pour chaque widget, séquence générique :
1. Barre du haut → **Ajouter un graphique** → choisir le type
2. Cliquer sur la zone vide du canvas pour placer le widget
3. Le panneau de droite affiche la config — vérifier que **Source de données** = `Facil — Recaudación`
4. Configurer dimensions/métriques selon le tableau ci-dessous

| # | Widget | Type Looker | Configuration |
|---|---|---|---|
| 1 | Total recaudado (mois) | **Carte de score** (Scorecard) | Métrique : `SUM(total_amount)`. Filtre : `report_date` ≥ premier jour du mois courant. Style : taille 28pt, devise. |
| 2 | Hoy vs ayer | **Carte de score avec variation** | Métrique : `SUM(total_amount)`. Comparaison : période précédente (1 jour). Onglet Style → afficher delta + flèche. |
| 3 | Recaudación diaria 90j | **Graphique linéaire chronologique** | Dimension X : `report_date`. Métrique Y : `SUM(total_amount)`. Onglet Style → ligne lisse, points visibles. |
| 4 | Par entité × méthode | **Histogramme empilé** (Stacked bar) | Dimension : `entity_code`. Décomposition : `payment_method`. Métrique : `SUM(total_amount)`. Tri : DESC sur métrique. |
| 5 | Répartition par méthode | **Camembert** (Pie) | Dimension : `payment_method`. Métrique : `SUM(total_amount)`. Style : afficher pourcentages. |
| 6 | Top 10 services | **Histogramme horizontal** (Horizontal bar) | Dimension : `workflow_code`. Métrique : `SUM(total_amount)`. Tri : DESC, **limite 10**. |
| 7 | Pivot entité × méthode | **Tableau croisé dynamique** | Lignes : `entity_code`. Colonnes : `payment_method`. Valeur : `SUM(total_amount)`. |
| 8 | % target mensuel | **Carte de score** | Métrique calculée : `SUM(total_amount) / 1000000` (target 1M XAF — ajuster). Onglet Style → format pourcentage, conditional formatting (vert > 90%, ambre 70-90%, rouge < 70%). |

##### Étape 6 — Filtres globaux (filter bar)

1. Barre du haut → **Insérer** → **Contrôle** → **Plage de dates** → placer en haut. Par défaut "30 derniers jours".
2. **Insérer** → **Contrôle** → **Liste déroulante** → champ **`entity_code`** → placer à côté de la plage de dates. Multi-sélection activée.
3. **Insérer** → **Contrôle** → **Liste déroulante** → champ **`payment_method`** → placer à côté.
4. Sélectionner les 3 contrôles (Shift+clic) → menu Style → **Appliquer à tous les graphiques de la page** : les 3 contrôles filtrent automatiquement les 8 widgets.

##### Étape 7 — Style et titre

1. Barre du haut → **Thème et mise en page** → choisir un thème (suggestion "Simple / Clear" pour démo stakeholder)
2. Renommer le rapport : titre en haut à gauche → "Facil — Recaudación Fiscal"
3. Insérer un titre de page (Insérer → **Texte**) : "Recaudación fiscal — Vue 90 jours"

##### Étape 8 — Récupérer le report_id pour la page admin Facil

1. Sauvegarder le rapport (Ctrl+S, ou Fichier → Sauvegarder)
2. Regarder l'URL :
   ```
   https://lookerstudio.google.com/reporting/abc123def456-7890-fghi-jklm-nopqrstuvwxy/page/p_1234567/edit
                                              └────── report_id ─────────────────────┘     └ page_id ┘
   ```
3. Dans Facil : login admin → `/dashboard/admin/dashboards/config` → ligne "recaudacion" → coller :
   - **Looker Report ID** : `abc123def456-7890-fghi-jklm-nopqrstuvwxy`
   - **Looker Page ID** : `p_1234567` (ou laisser vide si pas de page spécifique)
4. Cocher **« Visible pour les administrateurs »** → cliquer **Guardar**
5. Le toast "Configuration guardada — efecto inmediato" apparaît
6. Aller sur `/dashboard/admin/dashboards/recaudacion` → l'iframe affiche ton rapport Looker

##### Étape 9 — Sharing du rapport Looker

1. Dans Looker Studio, bouton **Partager** en haut à droite
2. **Personnes spécifiques** : ajouter les emails admin/treasury du domaine Facil
3. Mode **Lecteur** (pas Éditeur — l'embed Facil n'a pas besoin d'éditer)
4. Désactiver **« Toute personne disposant du lien »** — risque PII si l'iframe leakait
5. Optionnel : domaine Workspace si Facil utilise Google Workspace organisation

#### 6.10.3 Dashboard 2 — Performance Agentes

##### Étape 1 — Créer le rapport (réutiliser la datasource ou en créer un nouveau)

Si tu veux **un rapport séparé pour le dashboard 2** (recommandé pour iframe distinct par dashboard_id Facil) :

1. Looker Studio → **+ Créer** → **Rapport**
2. **+ Ajouter des données** → onglet **Se connecter aux données** → PostgreSQL → JDBC → mêmes credentials que dashboard 1
3. **REQUÊTE PERSONNALISÉE** → coller §6.9.2
4. Renommer : `Facil — Agentes`

##### Étape 2 — 10 widgets recommandés

| # | Widget | Type Looker | Configuration |
|---|---|---|---|
| 1 | Décisions / jour | **Scorecard** | `SUM(total_actions)` — total absolu sur la période |
| 2 | Taux d'approbation | **Scorecard %** | `SUM(approved) / SUM(total_actions) * 100`. Conditional fmt: vert > 80%, ambre 60-80%, rouge < 60%. |
| 3 | Décisions par jour (90j) | **Time-series** | X: `report_date`, Y: `SUM(total_actions)`. Décomposition optionnelle par `agent_name` (top 10). |
| 4 | Top 10 agents | **Histogramme horizontal** | Dimension: `agent_name`, Métrique: `SUM(total_actions)`, tri DESC limite 10 |
| 5 | Durée moyenne (s) | **Scorecard** | `AVG(avg_duration_seconds)` |
| 6 | Durée P50 par agent | **Boxplot** ou **Bar** | Dimension: `agent_name`, Métrique: `AVG(p50_duration_seconds)` |
| 7 | Approuvés vs rejetés (stack) | **Stacked bar par jour** | X: `report_date`, Y empilé: `SUM(approved)`, `SUM(rejected)` |
| 8 | Tableau des agents | **Table** | Colonnes: agent_name, total_actions, approved, rejected, avg_duration_seconds. Tri: total DESC. |
| 9 | Heatmap agent × jour | **Heatmap (Pivot)** | Lignes: `agent_name`, Colonnes: `report_date`, Valeur: `SUM(total_actions)` |
| 10 | Évolution durée P50 | **Time-series** | X: `report_date`, Y: `AVG(p50_duration_seconds)` |

##### Étape 3 — Filtres globaux

- Plage de dates (default 30j)
- Liste déroulante `agent_name`

##### Étapes 4-6 — Style, sharing, coller report_id dans `/admin/dashboards/config` ligne "agentes"

(Identique à §6.10.2 étapes 7-9, en remplaçant `recaudacion` par `agentes`.)

#### 6.10.4 Dashboard 3 — Catalogue Services

##### Étape 1 — Créer le rapport

1. **+ Créer** → **Rapport** → **+ Ajouter des données** → PostgreSQL → JDBC → credentials → **REQUÊTE PERSONNALISÉE** → §6.9.3 → renommer datasource `Facil — Services`

##### Étape 2 — 8 widgets recommandés

| # | Widget | Type Looker | Configuration |
|---|---|---|---|
| 1 | Total services | **Scorecard** | `COUNT(service_code)` — total catalogue |
| 2 | Services actifs vs inactifs | **Pie** | Dimension: `status`, Métrique: `COUNT(service_code)` |
| 3 | Distribution par ministère | **Bar** | Dimension: `ministry_name_es`, Métrique: `COUNT(service_code)`, tri DESC |
| 4 | Distribution par catégorie | **Pie** ou **Bar** | Dimension: `category_name_es`, Métrique: `COUNT(service_code)` |
| 5 | Top 50 services consultés | **Table** | Colonnes: name_es, ministry_name_es, view_count, status. Tri: view_count DESC, limite 50. |
| 6 | Méthodes de calcul | **Bar** | Dimension: `calculation_method`, Métrique: `COUNT(service_code)` |
| 7 | Tarifs moyens par catégorie | **Bar** | Dimension: `category_name_es`, Métrique: `AVG(tasa_expedicion)`. Format devise. |
| 8 | Délais moyens par ministère | **Bar** | Dimension: `ministry_name_es`, Métrique: `AVG(processing_time_days)` |

##### Étape 3 — Filtres globaux

- Liste déroulante `ministry_name_es`
- Liste déroulante `status` (Active / Inactive)
- Liste déroulante `category_name_es`

##### Étapes 4-6 — Style, sharing, coller report_id dans `/admin/dashboards/config` ligne "services"

#### 6.10.5 Validation finale (les 3 dashboards en place)

1. Aller sur `/dashboard/admin/dashboards` (Facil) → les 3 cards doivent montrer l'icône graph (pas "Awaiting setup")
2. Cliquer chaque card → l'iframe charge le rapport Looker correspondant en moins de 5 secondes
3. **Test data accuracy** : sur Recaudación, choisir une journée passée connue → calculer manuellement `SUM(total_amount)` via psql → comparer au scorecard. Tolérance < 1%.
4. **Stakeholder demo** : 1 question concrète par dashboard répondue en < 30s :
   - "Combien MIN_INTERIOR a collecté la semaine dernière ?" → dashboard 1, filtre entity_code, plage 7j
   - "Qui sont les 3 agents les plus actifs ce mois ?" → dashboard 2, top 10 agents, mois courant
   - "Combien de services ont des tarifs > 100 000 XAF ?" → dashboard 3, filtre tarif

#### 6.10.6 Maintenance après déploiement

- **Refresh** : par défaut 15 min cache Looker. Si tu veux plus frais : Fichier → Paramètres du rapport → **Fraîcheur des données → 1 min** (peut coûter en quota Postgres si trop de viewers concurrents).
- **Ajout d'un nouveau dashboard plus tard** : (a) le dev backend ajoute la MV + grant à `looker_readonly` dans une migration ; (b) au prochain deploy, le wrapper `vw_xxx` apparaît auto (cf. §6.7) ; (c) tu crées le rapport Looker avec REQUÊTE PERSONNALISÉE `SELECT * FROM vw_xxx` ; (d) coller le report_id dans `/admin/dashboards/config` (ligne ajoutée au registry backend si nouveau dashboard_id).
- **Rotation password `looker_readonly`** : changer côté Supabase + ALTER ROLE → Looker re-demandera credentials sur les 3 datasources la prochaine fois → re-saisir une fois.

### 6.6 Quand passer au connector custom (Path B)

Déclencheurs concrets :

1. **Premier ministry stakeholder demande accès** → on ne veut pas qu'il voie les autres entités.
2. **Audit compliance** demande qui a vu quoi quand → Path A n'a pas d'audit, Path B journalise dans `audit_logs` (action=`dashboard.read`).
3. **Plus de 3 entités utilisatrices distinctes** → la maintenance "filtered copies" devient pénible (cf. plan community connector §1).

Tant qu'aucun de ces signaux n'est présent, **rester sur Path A**. C'est plus simple et l'effort B.2 (OAUTH2) est mieux investi quand il y a un user concret à servir.

---

## 7. Changelog

- **2026-05-02 v1.0** — rapport synthétique post-Phase 5 + 3 questions ouvertes (auto-config, ministry vs entity, BigQuery rétrospective).
- **2026-05-02 v1.1** — ajout §2.4 ETL (possible mais pas nécessaire ; dbt-core comme porte d'escalade discipline ; Datastream→BigQuery réservé aux signaux scale).
- **2026-05-02 v1.2** — ajout §7 Guide UX : pré-requis, choix Path A vs Path B, configuration PostgreSQL pas-à-pas, requêtes SQL pour les 3 dashboards, récupération report_id, pièges UX, checklist mise en service.
- **2026-05-02 v1.3** — migrations 315+316 appliquées en BD (corrections : 316 utilisait `category` (n'existe pas) → `module_name` ; `granted_at` (n'existe pas) → `granted` ; codes rôles inventés (`supervisor`, `agent_aduana`, `agent_dgi`, `agent_min_*`) supprimés au profit des 21 codes réels en BD). Pwd `looker_readonly` set via ALTER ROLE. §6.0 mis à jour avec credentials concrets et état BD vérifié. Non-régression confirmée (counts: +1 perm, +21 grants, 0 suppression).
- **2026-05-04 v1.4** — E1 automation : pages `/admin/dashboards/config` (modifier report_id sans redeploy), table `dashboard_registrations` (mig 317), permission `dashboards.manage`. Découvertes critiques : (a) `cleanup_obsolete_permissions` au boot wipait toute perm BD non-mirrored in-code → fix `cleanup_obsolete=False` par défaut ; (b) Looker JDBC filtre les MATERIALIZED VIEWS (`relkind='m'`) → §6.7 ajouté avec auto-sync boot des wrappers `vw_*` (zéro migration manuelle pour les futures MVs).
- **2026-05-04 v1.5** — §6.7 enrichi avec note sur le cap UI Looker (~9 entrées dans le picker malgré 20 VIEWs livrées par le driver — vérifié par psql en tant que `looker_readonly`). §6.8 ajouté (datasource model Looker + 3 onglets « Ajouter des données » + comment réutiliser sans re-saisir credentials). §6.9 ajouté (REQUÊTE PERSONNALISÉE — SQL exact pour les 3 dashboards via wrappers `vw_*`). §6.10 ajouté (tutoriel pas-à-pas complet pour créer les 3 rapports Looker, widgets détaillés, sharing, intégration `/admin/dashboards/config`, maintenance).
