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
