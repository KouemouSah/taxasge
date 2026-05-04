# Grafana Dashboards Agent

> **Rôle** : agent réutilisable qui guide un LLM (Claude / autre) pour livrer
> des dashboards Grafana **production-grade** sur n'importe quel projet,
> à partir de zéro, en évitant les 10 pièges classiques découverts pendant
> le déploiement Facil (2026-05-04).
>
> **Invocation** : `/grafana-dashboards` (slash-command projet) — voir
> `.claude/commands/grafana-dashboards.md`. Sinon prompt direct : « Lance
> l'agent Grafana selon `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` ».
>
> **Audience** : LLM exécutant + utilisateur humain (pour les actions UI Grafana).
> **Sortie attendue** : N dashboards JSON dans `infra/grafana/dashboards/`,
> 1+ migration SQL avec vues enrichies grantées à un rôle BI read-only,
> 1 push API Grafana réussi, validation utilisateur.

---

## 1. Mission de l'agent

Quand l'utilisateur dit « crée-moi des dashboards Grafana pour ce projet »,
ou invoque la slash-command, **fais ces phases dans l'ordre, sans en sauter
aucune** :

| Phase | But | Sortie |
|---|---|---|
| 0 | Prérequis utilisateur (compte, token, accès BD) | `.env` rempli + DB accessible |
| 1 | Diagnostic connexion (IPv4/IPv6, region pooler) | Datasource Grafana opérationnelle |
| 2 | Discovery schéma BD (vues, MVs, grants existants) | Catalogue tables/MVs/colonnes en main |
| 3 | Analyse métier (personas, questions, dimensions) | Plan de N dashboards validé par user |
| 4 | Migration SQL — vues enrichies + grants | Vues grantées au rôle BI |
| 5 | Génération dashboards JSON | N fichiers JSON dans `infra/grafana/dashboards/` |
| 6 | Push API + verify | Tous les dashboards en prod, datasource healthy |
| 7 | Critique + fix bugs | KPIs valides, pas de "No data" parasite |
| 8 | Documentation + commits | README à jour, commits sémantiques, demande push |

**Règle d'or** : à chaque phase, **valider explicitement** auprès de l'utilisateur
avant de passer à la suivante. Pas de gros-monolithe-en-une-fois.

---

## 2. Phase 0 — Prérequis utilisateur

À l'invocation, **demander dans cet ordre** (ne pas commencer Phase 1 tant
qu'au moins 0.1 et 0.3 ne sont pas confirmés) :

### 0.1 Compte Grafana Cloud (gratuit)

Si l'utilisateur n'a pas encore de compte Grafana :

> « Crée-toi un workspace Grafana Cloud Free Tier sur
> https://grafana.com/products/cloud/ . Connexion par compte Google ou GitHub
> recommandée. Note l'URL du workspace : `https://<nom>.grafana.net` ».

S'il a déjà un compte : confirme l'URL.

### 0.2 Service account token

Guide l'utilisateur pour créer un token (5 min) :

```
URL directe : https://<workspace>.grafana.net/org/serviceaccounts

1. Click "+ Add service account"
2. Display name : <project>-deployer
3. Role : Admin (pour pouvoir créer datasource + dashboards)
4. Click "Create"
5. Click "+ Add service account token"
6. Token name : <project>-deployer-token
7. Expiration : 7 days (préférable, à rotater post-déploiement)
8. Click "Generate token" → copie immédiatement le token (format `glsa_...`)
```

⚠️ **Ne JAMAIS demander le token en clair dans la conversation**.
Demande à l'utilisateur de le mettre dans un fichier `.env` non-commité.

### 0.3 Fichier `.env` à fournir

Demander à l'utilisateur de **créer ou compléter** un `.env` au chemin de son
choix (souvent `packages/backend/.env.local` ou racine `.env`) avec **au minimum** :

```bash
# Grafana
GRAFANA_BASE_URL=https://<workspace>.grafana.net
GRAFANA_API_TOKEN=glsa_xxxxxxxxxxxxxxxxxxxx
GRAFANA_ORG_ID=1                              # 1 par défaut sur Cloud Free

# Base de données (au choix selon ce que l'agent peut atteindre)
DATABASE_URL=postgresql://user:pass@host:port/db
# OU
BI_READONLY_PASSWORD=...                      # mot de passe rôle BI read-only
BI_READONLY_USER=looker_readonly              # nom du rôle BI
```

**L'agent doit confirmer** que le `.env` est **gitignored** avant tout push
(`grep -r "GRAFANA_API_TOKEN" .gitignore` ou équivalent).

### 0.4 Accès BD pour l'agent

L'agent a besoin d'interroger la BD pour Phase 2 (discovery). Trois cas :

**Cas A — Le `.env` contient `DATABASE_URL`** : l'agent l'utilise via
psycopg2/asyncpg directement. C'est le plus simple.

**Cas B — MCP Postgres configuré** : si un MCP server Postgres est exposé
(via `~/.claude/mcp.json`), l'agent peut l'utiliser via les tools MCP.
Vérifier sa disponibilité avant Phase 2.

**Cas C — Aucun accès direct** : l'agent demande explicitement à l'utilisateur :

> « Je n'ai pas d'accès direct à votre base de données. Préfèrez-vous :
> (a) ajouter `DATABASE_URL` au `.env` (lecture seule recommandée),
> (b) configurer un MCP server Postgres,
> (c) coller manuellement les schémas ici (option dégradée — `\d table` × N) ?
> Réponds avec a/b/c. »

### Gate Phase 0 → Phase 1

L'agent ne procède à Phase 1 que si :
- ✅ URL Grafana fournie
- ✅ Token Grafana dans `.env` (vérifié par l'agent via test API `/api/health`)
- ✅ Au moins un chemin d'accès BD validé (a/b/c)

---

## 3. Phase 1 — Diagnostic connexion BD ↔ Grafana

### 1.1 Test direct Grafana → API

```python
GET https://<workspace>.grafana.net/api/health
Authorization: Bearer glsa_xxx
→ Doit retourner 200 + JSON {"database":"ok","version":"..."}
```

Si **403** : token mauvais ou expiré.
Si **404** : URL workspace incorrecte.

### 1.2 Configurer la datasource Postgres

Tester la connexion **avant de pousser des dashboards** :

```python
POST https://<workspace>.grafana.net/api/datasources
{
    "uid": "<project>-postgres",
    "name": "<project>-postgres",
    "type": "postgres",
    "access": "proxy",
    "url": "<host>:<port>",
    "database": "<dbname>",
    "user": "<bi_user>",
    "secureJsonData": {"password": "<bi_password>"},
    "jsonData": {"sslmode": "require", "postgresVersion": 1500}
}

# Test
GET /api/datasources/uid/<project>-postgres/health
```

### 1.3 ⚠️ Piège #1 — IPv6 vs IPv4 (Supabase trap)

**Symptôme** : healthcheck retourne :
```
"failed to connect to ... dial tcp [2a05:...]:6543: connect: network is unreachable"
```

**Cause** : Supabase direct host `db.<project>.supabase.co` résout
**uniquement en IPv6**. Grafana Cloud (AWS) ne route pas IPv6 outbound.

**Solution** : utiliser le **Connection Pooler IPv4** :
1. Lancer un script de découverte de région : tester `aws-0-{us-east-1,eu-west-1,eu-west-3,...}.pooler.supabase.com:6543` jusqu'à ce qu'un accepte la connexion
2. Format username sur le pooler : `<role>.<project_ref>` (suffixe `.<project_ref>` requis pour les rôles non-postgres)
3. Mettre à jour datasource avec ce host + ce username

Exemple Python (référence : `packages/backend/scripts/test_grafana_datasource.py`) :

```python
import psycopg2
regions = ['us-east-1', 'eu-west-1', 'eu-west-3', 'eu-central-1', 'ap-southeast-1']
for region in regions:
    host = f'aws-0-{region}.pooler.supabase.com'
    for user_format in [bi_user, f'{bi_user}.{project_ref}']:
        try:
            conn = psycopg2.connect(host=host, port=6543, user=user_format, ...)
            print(f'OK {host} user={user_format}')
            return host, user_format
        except: continue
```

### 1.4 Autres pièges connexion

- **`access: "proxy"`** est obligatoire (pas `"direct"`) sinon le browser tente
  d'atteindre la BD côté client.
- **`sslmode=require`** dans `jsonData` (pas dans l'URL pour Grafana).
- **maxOpenConns ≤ rolconnlimit du rôle BI** (sinon Postgres refuse).
- **Cocher "Activer SSL" dans l'UI** = mTLS attendu (cert client) ; à ne PAS
  cocher si on utilise `sslmode=require` natif.

### Gate Phase 1 → Phase 2

L'agent ne procède à Phase 2 que si :
- ✅ Datasource créée + UID stable connu
- ✅ Health endpoint retourne `"status":"OK"`
- ✅ Une query `SELECT 1` via `/api/ds/query` retourne 1

---

## 4. Phase 2 — Discovery schéma BD

L'objectif est de **lister toutes les tables/vues/MVs accessibles au rôle BI**
sans inventer.

### 2.1 ⚠️ Piège #2 — Schema discovery par moteur

**Symptôme (Postgres / Supabase)** :
`SELECT … FROM information_schema.columns WHERE table_name='X'` retourne
0 rows même quand la table existe.

**Cause** : sur Supabase pooler (et certains autres setups managed),
`information_schema` est privilege-filtered et ne montre rien pour certains
contextes.

**Solution par moteur** (référence : §14 Annexe D — DB Adapter) :

```sql
-- Postgres : utiliser pg_attribute (contournement du filter information_schema)
SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = '<table>'
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attnum;

-- MySQL / MariaDB : information_schema.COLUMNS (non filtré)
SELECT COLUMN_NAME, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '<table>'
ORDER BY ORDINAL_POSITION;

-- BigQuery : INFORMATION_SCHEMA dataset-scoped
SELECT column_name, data_type
FROM `<project>.<dataset>`.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = '<table>'
ORDER BY ordinal_position;

-- Snowflake : information_schema avec UPPER (case-sensitive en Snowflake)
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = UPPER('<table>')
ORDER BY ORDINAL_POSITION;

-- SQL Server : sys.columns (préféré à information_schema pour types exacts)
SELECT c.name, t.name AS data_type
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('<schema>.<table>')
ORDER BY c.column_id;
```

**L'agent doit choisir la bonne requête en fonction du moteur détecté en
Phase 0.5** (cf. Faiblesse 1).

### 2.2 Inventaire des relations grantées au rôle BI

```sql
SELECT n.nspname, c.relname,
       CASE c.relkind WHEN 'r' THEN 'TABLE' WHEN 'v' THEN 'VIEW'
                       WHEN 'm' THEN 'MV' END AS kind,
       has_table_privilege('<bi_role>', c.oid, 'SELECT') AS has_select,
       (SELECT count(*) FROM <relname>) AS rows  -- exécuté après filter
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm')
ORDER BY kind, relname;
```

L'agent **doit** sauvegarder cet inventaire (au minimum les relations
`has_select=true`) pour design des dashboards.

### 2.3 Probe colonnes des relations clés

Pour chaque table/MV/vue identifiée comme "candidate métier" (cf. Phase 3),
récupérer le schéma exact via la requête `pg_attribute` ci-dessus.

Référence : `packages/backend/scripts/probe_mvs_for_grafana.py` du projet Facil.

### 2.4 ⚠️ Piège #3 — Wrappers auto-générés (Looker MV invisibility)

Si le projet utilise **un mécanisme d'auto-wrapper** comme Facil (les MVs
`relkind='m'` sont rendues visibles aux drivers JDBC via des vues `vw_*`
créées au boot), il faut :

1. **Soit attendre que le wrapper soit créé** au prochain reboot du backend
2. **Soit utiliser la vue source `v_*` directement** dans les dashboards

Pour Grafana, le driver Postgres natif voit déjà les MVs (pas de wrapper
nécessaire). Donc **toujours utiliser le nom direct** (`v_*` ou `mv_*`) plutôt
que le wrapper `vw_*` qui peut ne pas exister encore.

### Gate Phase 2 → Phase 3

L'agent doit avoir :
- ✅ Liste exhaustive des MVs/vues grantées au rôle BI
- ✅ Schéma colonne par colonne pour chaque relation candidate
- ✅ Compteur de rows pour évaluer la donnée disponible

---

## 5. Phase 3 — Analyse métier (le pas-à-pas critique)

C'est ici que l'agent doit **ralentir et poser des questions**. Le piège
classique : générer 5 dashboards génériques qui ne servent à rien.

### 3.1 Questions à poser à l'utilisateur

> « Avant de coder, j'ai besoin de comprendre ton métier. Réponds-moi sur ces
> 6 points (1-2 phrases chacun) :
>
> 1. **Qui sont les utilisateurs des dashboards** ? (admin, ops, métier, exec, partenaires)
> 2. **Quelles sont les 3-5 questions métier critiques** auxquelles ces utilisateurs doivent pouvoir répondre en < 30 secondes ?
> 3. **Quelles sont les dimensions clés** ? (entité, site, agent, workflow, période, etc.)
> 4. **Quels sont les cycles métier** ? (paiement → validation → encaissement, ou similaire)
> 5. **Y a-t-il des classifications métier** dérivées (OMS vs non-OMS dans Facil ; B2B vs B2C ailleurs ; etc.) ? Comment se calculent-elles ?
> 6. **Quels sont les canaux d'origine** ? (web, mobile, inspector, agent_dashboard…) Peuvent-ils être détectés en BD ? »

L'agent **doit attendre** les réponses avant de proposer un plan.

### 3.2 Synthèse en plan dashboards

À partir des réponses + Phase 2, l'agent propose un plan structuré :

```
Plan dashboards proposé :
1. <Nom> — KPI métier #1 (questions Q1, Q3) — sources : <table_a>, <table_b>
2. <Nom> — KPI ops #2 (questions Q2) — sources : <table_c>
3. <Nom> — Adoption multi-canal (question Q6) — sources : <table_a> + audit_logs
...

Filtres communs : entité, site, période, [classification métier]
Vues enrichies à créer (Phase 4) :
- v_<x>_enriched : JOIN <a> + <b> + <c> avec <classifier>
...
```

L'agent **demande validation** : « Est-ce que ce plan correspond à ton besoin ?
Modifie/retire/ajoute des éléments avant qu'on génère le code. »

### Gate Phase 3 → Phase 4

L'agent ne procède à Phase 4 que si l'utilisateur a explicitement validé
le plan ou demandé des ajustements (qui sont alors intégrés).

---

## 6. Phase 4 — Migration SQL : vues enrichies

### 4.1 Patterns de vues enrichies réutilisables

**Pattern A — Aggregation enrichie** :
```sql
CREATE OR REPLACE VIEW v_<x>_enriched AS
SELECT
    base.*,
    classifier.is_<class>,                -- ex: is_oms via workflow_codes ? 'TAG'
    location.city, location.region,
    agent.agent_type, agent.is_supervisor
FROM <base_mv> base
LEFT JOIN <entities> ON ...
LEFT JOIN <locations> ON ...
LEFT JOIN <agent_profiles> ON ...;
GRANT SELECT ON v_<x>_enriched TO <bi_role>;
```

**Pattern B — Multi-source resolution (le pattern site-effectif Facil)** :
```sql
-- Quand une dimension peut être dérivée de N sources avec priorité
SELECT
    payment.*,
    COALESCE(
        source1.location_id,    -- le plus précis
        source2.location_id,
        source3.location_id,    -- fallback
        source4.location_id     -- last resort
    ) AS effective_location_id,
    CASE
        WHEN source1.location_id IS NOT NULL THEN 'source1'
        WHEN source2.location_id IS NOT NULL THEN 'source2'
        ...
        ELSE 'unassigned'
    END AS location_source       -- audit trail
FROM <base> payment
LEFT JOIN <source1> ON ...
LEFT JOIN <source2> ON ...
...
```

Le `location_source` permet à l'utilisateur de voir **quelle source a résolu
chaque ligne** (donut chart) — précieux pour debug et confiance dans la donnée.

**Pattern C — JSONB drill-down** (quand des analytics pré-agrégées existent
en JSONB) :
```sql
SELECT (j->>'city_name') AS city, (j->>'companies')::int AS n
FROM <mv_analytics>, jsonb_array_elements(by_city_jsonb) AS j
WHERE (j->>'zone_code') IN (${zone:sqlstring})
ORDER BY (j->>'debt')::numeric DESC;
```

### 4.2 ⚠️ Piège #4 — Classifier métier sur array/JSON par moteur

Pour détecter une classification métier basée sur un array/JSON
(ex: `entities.workflow_codes` contient ou pas `'BUNDLE_PAYMENT'`),
utiliser l'opérateur **du moteur détecté** :

```sql
-- Postgres (JSONB ? operator)
(e.workflow_codes ? 'BUNDLE_PAYMENT') AS is_oms

-- MySQL 8+ (JSON_CONTAINS)
JSON_CONTAINS(e.workflow_codes, '"BUNDLE_PAYMENT"') AS is_oms

-- BigQuery (UNNEST + EXISTS)
EXISTS(SELECT 1 FROM UNNEST(e.workflow_codes) v WHERE v = 'BUNDLE_PAYMENT') AS is_oms

-- Snowflake (ARRAY_CONTAINS)
ARRAY_CONTAINS('BUNDLE_PAYMENT'::variant, e.workflow_codes) AS is_oms

-- SQL Server (OPENJSON sur colonne NVARCHAR(MAX) JSON)
(SELECT COUNT(*) FROM OPENJSON(e.workflow_codes) WHERE value = 'BUNDLE_PAYMENT') > 0 AS is_oms
```

**Ne pas** utiliser de cast `LIKE '%TAG%'` sur le texte JSON (fragile,
sensible aux espaces / encoding).
**Ne pas** hardcoder une liste enum côté code (drift admin/code).
**Toujours** consulter §14 Annexe D pour la primitive `json_array_contains` du moteur.

### 4.3 Naming convention obligatoire

- Vue source : `v_<domain>_<purpose>` ou `v_<domain>_enriched`
- MV source : `mv_<domain>_<aggregation>`
- Wrapper auto (si applicable au projet) : `vw_<domain>_<purpose>`
- Migration file : `<NN>_<description>.sql`

### 4.4 Application de la migration

L'agent **doit** :
1. Écrire la migration SQL
2. La tester en BD live (transaction explicite, rollback en cas d'erreur)
3. Vérifier que chaque vue retourne au moins quelque chose pour les rows existantes
4. Si vue retourne 0 row alors que la table source a des rows → bug JOIN, à fixer
5. Sauvegarder la migration dans le dossier de migrations habituel du projet

### Gate Phase 4 → Phase 5

- ✅ Migration appliquée sans erreur
- ✅ Toutes les vues grantées (vérification `has_table_privilege`)
- ✅ Au moins 1 vue retourne des rows réelles

---

## 7. Phase 5 — Génération dashboards JSON

### 5.1 Squelette JSON Grafana minimal

```json
{
  "uid": "<project>-<topic>",
  "title": "<Project> — <Topic>",
  "tags": ["<project>", "<topic>"],
  "timezone": "browser",
  "schemaVersion": 38,
  "version": 1,
  "refresh": "5m",
  "time": { "from": "now-90d", "to": "now" },
  "graphTooltip": 1,
  "links": [
    { "type": "dashboards", "tags": ["<project>"], "title": "<Project> dashboards", "asDropdown": true, "icon": "external link" }
  ],
  "templating": { "list": [...] },
  "panels": [...]
}
```

### 5.2 ⚠️ Piège #5 — Template variables `${var:sqlstring}`

**INCORRECT** (ne marchera pas en multi-select avec "All") :
```sql
WHERE ('$entity' = 'All' OR entity_code IN ($entity))
```

**CORRECT** :
```sql
WHERE entity_code IN (${entity:sqlstring})
```

Le formatter `:sqlstring` Grafana expand `${entity}` en `'a','b','c'`
(quoted, comma-separated, valid SQL `IN (...)`).

Pour les variables custom (toggle 3 valeurs), utiliser :
```json
{
  "name": "is_oms", "type": "custom",
  "options": [
    { "text": "All",          "value": "*",     "selected": true },
    { "text": "OMS only",      "value": "true"             },
    { "text": "non-OMS only",  "value": "false"            }
  ]
}
```
SQL : `('${is_oms}' = '*' OR is_oms::text = '${is_oms}')`

### 5.3 ⚠️ Piège #6 — Currency format

**INCORRECT** : `"unit": "currencyXAF"` → affiche "currencyXAF" comme suffix.

**CORRECT** : `"unit": "currency:XAF"` → affiche "XAF" propre.

Le préfixe `currency:` indique custom ISO code. Marche pour XAF, XOF, etc.

### 5.4 ⚠️ Piège #7 — `noValue` sur stat panels

Stat avec `count(*)` sur une période/filtre vide → null en sortie → Grafana
affiche "No data" au lieu de "0".

**Fix** :
```json
"fieldConfig": {
    "defaults": { "noValue": "0" }
}
```

### 5.5 ⚠️ Piège #8 — Variables chaînées

Pour permettre drill-down : variable B dépend de A.

```json
{ "name": "entity",  "query": "SELECT entity_code FROM tbl WHERE ministry IN (${ministry:sqlstring}) ORDER BY entity_code", "refresh": 1 },
{ "name": "site",    "query": "SELECT city FROM locations WHERE entity_code IN (${entity:sqlstring}) ORDER BY city",         "refresh": 1 }
```

**Important** : la source de population du filtre Site doit être la **table de
référence** (toutes les villes des entités), pas la table de faits (qui ne
montre que les villes où il y a déjà des données). Sinon le filtre est
inutilisable pour les sites sans données.

### 5.6 Color thresholds + cell options sur tables

Pour visibility des KPIs :
```json
"overrides": [
    { "matcher": { "id": "byName", "options": "Recovery %" },
      "properties": [
        { "id": "unit", "value": "percent" },
        { "id": "custom.cellOptions", "value": { "type": "color-background", "mode": "basic" } },
        { "id": "thresholds", "value": { "mode": "absolute", "steps": [
            { "color": "red",    "value": null },
            { "color": "yellow", "value": 30 },
            { "color": "green",  "value": 70 } ] } }
      ]
    }
]
```

### 5.7 Structure dashboard recommandée

```
Row 1 : KPIs synthèse (4-7 stat cards) — la valeur en chiffre, threshold colors
Row 2 : Tendances (1-2 timeseries) — évolution, période vs période précédente
Row 3 : Cross-axes (2-3 bar/pie) — distribution par dimension principale
Row 4 : Top N tables (1-2 tables paginées) — drill-down détaillé
Row 5 (collapsed) : Détails / brut (1 table 50-100 lignes)
```

### 5.8 Lien navigation cross-dashboards

Tous les dashboards d'un même projet portent le même tag (`<project>`) et
incluent dans leur racine :
```json
"links": [{ "type": "dashboards", "tags": ["<project>"], "title": "..." }]
```

→ menu déroulant en haut pour naviguer entre dashboards.

### Gate Phase 5 → Phase 6

- ✅ N JSON files créés dans `infra/grafana/dashboards/`
- ✅ Chaque JSON valide (loadable en `json.loads`)
- ✅ Schema version 38+ (Grafana 11+)

---

## 8. Phase 6 — Push API + verify

### 6.1 Script de push (template)

Référence : `packages/backend/scripts/push_grafana_dashboards.py` (Facil).

Fonctionnalités obligatoires :
1. `check_creds()` — vérifie env + healthcheck Grafana
2. `upsert_datasource()` — créer / mettre à jour la datasource (idempotent)
3. `push_dashboard(json_path)` — `POST /api/dashboards/db` avec `overwrite: true`
4. Verification `GET /api/dashboards/uid/<uid>` après chaque push
5. Print final des UIDs + URLs preview pour copier-coller

### 6.2 ⚠️ Piège #9 — Push qui écrase la datasource

Si le script `upsert_datasource()` a des constantes hardcodées et qu'un
correctif manuel a été fait via UI, **un re-run du script écrase le correctif**.

**Solution** : centraliser TOUTES les valeurs critiques (host, user, password)
en variables d'env lues à chaque exécution. Idempotent par design.

### 6.3 Diagnostic post-push

Après le push, l'agent **doit** lancer une query de validation :
```python
GET /api/datasources/uid/<ds_uid>/health  → "OK"
POST /api/ds/query {SELECT 1 from <main_view>} → 1 row, status 200
```

Si l'un échoue → diagnostiquer (probablement Phase 1 défaut).

### Gate Phase 6 → Phase 7

- ✅ Tous les dashboards `pushed: 7/7` (ou N/N)
- ✅ Datasource health = OK
- ✅ Au moins 1 query test sur 1 dashboard retourne des rows

---

## 9. Phase 7 — Critique + fix bugs

### 9.1 Vérifications à demander à l'utilisateur

> « Va sur chaque dashboard et dis-moi pour chacun :
> 1. Tous les KPI cards affichent une valeur (pas "No data") ?
> 2. Les filtres marchent (clic sur valeur → résultats changent cohéremment) ?
> 3. Les variables chaînées s'enchaînent correctement ?
> 4. Les currencies affichent "XAF" / "USD" / etc. (pas "currencyXAF") ?
> 5. Au moins une donnée réelle visible (pas tout vide) ? »

### 9.2 Anti-patterns courants à fixer

| Symptôme | Cause | Fix |
|---|---|---|
| "No data" sur stat avec count(*) | null dans sortie | `noValue: "0"` |
| Aucun panel ne marche | datasource mal configurée | Phase 1 — IPv4 pooler |
| Panels avec variables = "No data" | Pattern `'$var' = 'All'` | `${var:sqlstring}` |
| Currency moche | `currencyXAF` | `currency:XAF` |
| Filtre Site limité aux villes avec données | Source = table de faits | Source = table de référence |
| Wrapper VIEW non trouvée | `vw_*` pas créé | Utiliser `v_*` direct |
| Templating dropdowns vides | Query refresh = 0 | `refresh: 1` (on dashboard load) |
| Drill par JSONB cassé | Cast manquant | `(j->>'col')::int / ::numeric` |

### 9.3 Workflow critique

L'agent **doit s'auto-critiquer** avant de déclarer fini :
- Y a-t-il des panels qui restent No data alors que la donnée existe ?
- Les SLA/thresholds colorés sont-ils calibrés métier (pas générique 50/80) ?
- Les filtres sont-ils chainés là où ça aide (ministère → entité → site) ?
- Y a-t-il une dashboard "Overview" avec navigation cross ?

### Gate Phase 7 → Phase 8

- ✅ Validation utilisateur sur chaque dashboard
- ✅ Aucun "No data" parasite (seulement légitime — table vide)
- ✅ Filtres testés et fonctionnels

---

## 10. Phase 8 — Documentation + commits

### 10.1 README projet

Créer/mettre à jour `infra/grafana/README.md` avec :
- Liste des N dashboards (titre, UID, source principale, filtres)
- Comment ajouter un dashboard (guide pas à pas)
- Comment rotater le token Grafana
- Limitations connues

### 10.2 Commits sémantiques

Format suggéré :
```
feat(observability/grafana): N dashboards production-grade

- Migration <NN> : N vues enrichies (with grants)
- N JSONs in infra/grafana/dashboards/
- Push script + datasource provisioning
- README updated

Filters: <list>
Sources: <list>
Verified: each dashboard renders real data via API + UI walkthrough.
```

### 10.3 ⚠️ Piège #10 — Push git automatique

**Ne JAMAIS push automatiquement vers le remote**. Demander explicitement :

> « Tous les commits sont locaux. Veux-tu que je `git push origin <branch>` maintenant ?
> (réponse OUI/NON requise) »

(Cf. règle #13 du projet — confirmation explicite requise.)

---

## 11. Faiblesses connues — gérées comme garde-fous actifs

> **Principe** : chaque faiblesse listée ci-dessous correspond à une **action
> obligatoire que l'agent exécute pendant le flux** pour la neutraliser.
> Aucune faiblesse n'est juste « documentée et oubliée ».

### Forces
- Couvre les **10 pièges concrets** rencontrés sur Facil 2026-05-04
- **Gates explicites** entre phases → empêche l'agent de bâcler
- **Patterns réutilisables** (multi-source resolution, JSONB drill, chained variables)
- **Refs aux fichiers** Facil pour exemples concrets

### Faiblesse 1 — DB engine multi-source (postgres / mysql / bigquery / snowflake / sqlserver)
**Risque** : les requêtes SQL spécifiques (schema discovery, JSON ops, `format_type`,
syntaxe regex, GRANT/REVOKE, ROLLBACK) diffèrent par moteur. Sans adaptation,
l'agent génère du SQL non exécutable hors Postgres.
**Garde-fou actif (Phase 0.5 — détection moteur + chargement adapter)** :
> L'agent **doit, avant Phase 1**, exécuter ces 2 étapes :
>
> **Étape A — Détection automatique** : si l'utilisateur a fourni `DATABASE_URL`
> ou un host, l'agent détecte le moteur via :
> - `postgresql://` ou port 5432/6543 → `postgres`
> - `mysql://` ou `mysql+pymysql` ou port 3306 → `mysql`
> - host `*.bigquery.googleapis.com` ou projet GCP `bq://` → `bigquery`
> - host `*.snowflakecomputing.com` → `snowflake`
> - port 1433 ou `mssql://` → `sqlserver`
> - sinon → demander explicitement.
>
> **Étape B — Chargement de l'adapter** : ouvrir l'**Annexe D — DB Adapter
> Multi-Engine** (§14) et **lire les colonnes correspondant au moteur détecté**.
> Toutes les requêtes générées (Phases 2, 4, 5) **doivent** utiliser les
> primitives de cette colonne, pas celles Postgres par défaut.
>
> **Cas non couvert** : si le moteur n'est pas dans l'adapter (Oracle, DB2,
> CockroachDB, ClickHouse, etc.), l'agent **demande à l'utilisateur** de
> confirmer le mapping de 5 primitives clés (column_query, json_array_contains,
> json_field_extract, regex_op, grant_select_syntax) **avant Phase 2**, et
> **propose d'étendre §14** à la fin du flux pour les futurs projets.

### Faiblesse 2 — Grafana Enterprise / self-hosted vs Cloud Free
**Risque** : provisioning YAML, anonymous embed, OAUTH proxy diffèrent.
**Garde-fou actif (Phase 0.6)** :
> L'agent **doit demander** : « Grafana Cloud Free ou self-hosted / Enterprise ? »
> Si self-hosted → l'agent vérifie l'URL `/api/health` ne contient pas
> `grafana.net` et active le mode YAML provisioning + skip de l'API token-based push.

### Faiblesse 3 — Pas de test E2E automatisé
**Risque** : un dashboard cassé silencieusement (No data) passe inaperçu.
**Garde-fou actif (Phase 6.4 — smoke tests obligatoires)** :
> Après le push de chaque dashboard, l'agent **exécute** :
> 1. `GET /api/dashboards/uid/<uid>` → confirme JSON valide
> 2. Pour chaque panel : reproduit le rawSql via `POST /api/ds/query` → vérifie status 200 + rows > 0 (sauf si table source légitimement vide, à confirmer Phase 2)
> 3. Si > 20% des panels d'un dashboard renvoient 0 row alors que la source a des rows, **alerter l'utilisateur** et bloquer Gate 6.

### Faiblesse 4 — Classifier métier projet-spécifique
**Risque** : l'agent invente un classifier (ex: `is_oms`) ou hardcode des codes.
**Garde-fou actif (Phase 3.2 — interview classifier)** :
> Si la réponse à Q5 (classification dérivée) est **non triviale**, l'agent
> **doit** demander explicitement :
> « Quel est le critère exact en BD pour cette classification ? Donne une
> requête SQL ou une règle métier (ex: `entities.workflow_codes ? 'TAG'`,
> ou `companies.regime IN ('A','B')`). Je ne dois RIEN inventer. »
> Et **noter le classifier dans le commentaire SQL** de la vue Phase 4.

### Faiblesse 5 — Pas de sécurité multi-tenant native
**Risque** : URL embed Grafana leak = tout visible.
**Garde-fou actif (Phase 8.2 — disclaimer obligatoire)** :
> À la fin du flux, l'agent **doit ajouter** dans le README :
> « ⚠️ Aucun RLS Grafana actif. Toute personne avec l'URL `/d-solo/<uid>` peut
> voir le dashboard. Mitigation actuelle : permission gate côté wrapper
> applicatif. Pour vrai RLS, voir Phase B.2 OAUTH2. »
> Et le **logger en sortie console** au push final.

### Faiblesse 6 — Token Grafana sans rotation auto
**Risque** : token long-lived qui leak.
**Garde-fou actif (Phase 0.2 — limite expiry)** :
> L'agent **suggère explicitement** une expiry **≤ 30 jours** lors de la
> création du token. Si l'utilisateur insiste pour `No expiration`, l'agent
> **enregistre un TODO de rotation** dans le bilan session.

### Faiblesse 7 — Migrations non-réversibles
**Risque** : impossible de rollback proprement en cas d'erreur post-prod.
**Garde-fou actif (Phase 4.5 — rollback inline)** :
> Chaque migration générée par l'agent **doit** inclure en commentaire de
> bas-de-fichier un bloc `-- ROLLBACK` testé :
> ```sql
> -- ROLLBACK (manuel) :
> -- BEGIN;
> --   DROP VIEW IF EXISTS v_xxx;
> --   ...
> -- COMMIT;
> ```
> L'agent **vérifie** la présence de ce bloc dans toute migration avant
> Gate 4.

### Faiblesse 8 — Pas de pinning de version Grafana
**Risque** : un upgrade Grafana Cloud casse la `schemaVersion` de mes JSONs.
**Garde-fou actif (Phase 5.1 — version-aware schema)** :
> L'agent **interroge** l'API `/api/health` au début de Phase 5 pour récupérer
> la version Grafana, et **adapte** `schemaVersion` du JSON en conséquence
> (38 pour Grafana 11.x, 41 pour 12.x). Si la version Grafana est inconnue,
> utilise le minimum garanti : 36.

### Faiblesse 9 — Cache navigateur Grafana / iframe-cached schema
**Risque** : utilisateur ne voit pas les changements après push (cache).
**Garde-fou actif (Phase 7.0 — instructions de hard-refresh)** :
> Après chaque push, l'agent **affiche** les instructions concrètes :
> « Pour voir les changements : Ctrl+F5 sur le dashboard. Si filtres
> bizarres : Settings → Variables → Refresh. Si datasource UID changé :
> recréer la datasource côté Looker/iframe consumer. »

### Faiblesse 10 — Token leak dans logs
**Risque** : token apparaît dans logs / shell history / commits.
**Garde-fou actif (Phase 0.7 — masking obligatoire)** :
> L'agent **interdit** :
> - D'écrire le token dans la conversation (utilise toujours `glsa_***[REDACTED]`)
> - De faire `git add .env` (vérifie que `.env*` est dans `.gitignore`)
> - De `print(token)` dans les scripts (toujours `print(token[:8] + '...')`)
> - De passer le token en argument CLI sans `read -s` ou env var

### Ce que l'agent NE doit PAS faire (anti-patterns)
- Inventer des colonnes (toujours vérifier via `pg_attribute`)
- Push git sans demander
- Hardcoder des UUIDs / role_ids / passwords
- Créer des dashboards génériques sans Phase 3 (analyse métier)
- Sauter les gates entre phases
- Logger / commiter le token en clair
- Faire un push API sans avoir vérifié le datasource health en amont
- Procéder en non-postgres sans avoir averti l'utilisateur

### Ce que l'agent NE doit PAS faire
- Inventer des colonnes (toujours vérifier via `pg_attribute`)
- Push git sans demander
- Hardcoder des UUIDs / role_ids / passwords
- Créer des dashboards génériques sans Phase 3 (analyse métier)
- Sauter les gates entre phases
- Logger / commiter le token en clair

---

## 12. Invocation

### Slash command (recommandé)

`.claude/commands/grafana-dashboards.md` :
```markdown
Lis et exécute `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md`.

Si arguments fournis ($ARGUMENTS) :
- "setup" → Phase 0-1 uniquement
- "analyze" → Phase 2-3
- "build" → Phase 4-6
- "fix <issue>" → Phase 7 ciblé
- (vide) → flux complet 0→8
```

### Prompt direct

> « Lance l'agent Grafana selon
> `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` pour ce projet. Suis les
> phases dans l'ordre, ne saute pas les gates. »

---

## 13. Annexes

### A. Fichiers de référence Facil (à cloner pour autre projet)

```
infra/grafana/
├── GRAFANA_DASHBOARDS_AGENT.md            (ce fichier)
├── README.md                              (datasource + dashboards index)
├── provisioning/
│   ├── datasources/postgres-facil.yaml
│   └── dashboards/facil.yaml
└── dashboards/
    └── *.json (10 dashboards)

packages/backend/scripts/
├── push_grafana_dashboards.py             (push API)
├── probe_mvs_for_grafana.py               (discovery schema)
├── test_grafana_datasource.py             (diagnostic IPv4/IPv6)
├── fix_grafana_template_vars.py           (regex sqlstring)
├── fix_dashboards_filters_v2.py           (variables chaînées)
└── fix_dashboards_site_sql.py             (injection filtre site)

packages/backend/database/migrations/
├── 320_looker_enriched_views.sql          (vues enrichies — patterns A/B/C)
├── 321_audit_inspections_channel_views.sql
└── 322_treasury_by_site_view.sql          (multi-source resolution)
```

### B. Snippets fréquents

**Multi-source resolution** :
```sql
COALESCE(s1.x, s2.x, s3.x, s4.x) AS effective_x,
CASE WHEN s1.x IS NOT NULL THEN 's1' WHEN s2.x IS NOT NULL THEN 's2' ... END AS x_source
```

**Channel detection** :
```sql
CASE
    WHEN user_agent ILIKE '%expo%' OR ILIKE '%android%' OR ILIKE '%iphone%' THEN 'mobile'
    WHEN user_agent ILIKE '%mozilla%' OR ILIKE '%chrome%' THEN 'web'
    WHEN user_agent ILIKE '%inspector%' THEN 'inspector'
    ELSE 'other'
END AS channel
```

**JSONB array drill** :
```sql
SELECT (j->>'name')::text, (j->>'amount')::numeric
FROM <mv>, jsonb_array_elements(<jsonb_col>) AS j
WHERE (j->>'filter_field') IN (${var:sqlstring})
```

**Aging buckets** :
```sql
CASE
    WHEN hours_since < 24 THEN '0-24h'
    WHEN hours_since < 72 THEN '24-72h'
    WHEN hours_since < 168 THEN '3-7d'
    ELSE '7d+'
END AS age_bucket
```

### C. Checklist de revue avant validation finale

- [ ] Phase 0 : token + DB access prêts
- [ ] Phase 1 : datasource health OK + IPv4 si Supabase
- [ ] Phase 2 : schema discovery via pg_attribute (pas information_schema)
- [ ] Phase 3 : plan validé par utilisateur
- [ ] Phase 4 : migrations appliquées + grants vérifiés
- [ ] Phase 5 : N JSONs avec template `${var:sqlstring}` + `currency:XAF` + `noValue: "0"` + variables chaînées
- [ ] Phase 6 : push réussi + health check
- [ ] Phase 7 : aucun "No data" parasite + filtres testés
- [ ] Phase 8 : README + commits sémantiques + push git pending validation user

---

**Version** : 1.1 (2026-05-04) — multi-engine adapter
**Auteur** : Distillé de la session Facil Grafana E1 (10 dashboards en production)
**Maintenance** : à mettre à jour à chaque nouveau piège rencontré sur futur projet

---

## 14. Annexe D — DB Adapter Multi-Engine

> **But** : permettre à l'agent de générer du SQL exécutable sur **n'importe
> quel moteur** supporté par Grafana, en remplaçant les primitives Postgres
> par les équivalents du moteur détecté en Phase 0.5.
>
> **Convention** : chaque ligne du tableau définit une **primitive abstraite**
> (ex: `json_array_contains`). L'agent **ne génère jamais** la primitive
> Postgres directement — il **résout** la primitive abstraite en lisant la
> colonne du moteur cible.
>
> **Sections engine-agnostic** (pas dans l'adapter — utiliser tel quel partout) :
> - Templating Grafana `${var:sqlstring}` (formatter Grafana, pas SQL)
> - `unit: "currency:XAF"` / `currency:USD` / etc. (format Grafana)
> - `noValue: "0"` sur stat panels (config panel Grafana)
> - `COALESCE(s1, s2, s3)` (standard SQL — disponible partout)
> - `CASE WHEN … END` (standard SQL)
> - Aging buckets via `CASE` sur durée (standard SQL — adapter juste la fonction `now() - col`)

### 14.1 Adapter table — primitives par moteur

| Primitive | Postgres | MySQL 8+ | BigQuery | Snowflake | SQL Server |
|---|---|---|---|---|---|
| **datasource type Grafana** | `postgres` | `mysql` | `grafana-bigquery-datasource` | `grafana-snowflake-datasource` | `mssql` |
| **column_query** (cf §4.1) | `pg_attribute + pg_class + pg_namespace` | `INFORMATION_SCHEMA.COLUMNS` | `<dataset>.INFORMATION_SCHEMA.COLUMNS` | `INFORMATION_SCHEMA.COLUMNS` (UPPER) | `sys.columns + sys.types` |
| **schema_default** | `public` | `DATABASE()` | `<project>.<dataset>` | current_schema | `dbo` |
| **list_relations** | `SELECT relname, relkind FROM pg_class JOIN pg_namespace …` | `SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES` | `SELECT table_name, table_type FROM <dataset>.INFORMATION_SCHEMA.TABLES` | `SHOW TABLES IN SCHEMA …` | `SELECT name, type FROM sys.objects WHERE type IN ('U','V')` |
| **has_select_privilege** | `has_table_privilege(role, oid, 'SELECT')` | `INFORMATION_SCHEMA.TABLE_PRIVILEGES` | IAM check (pas de fct SQL native) | `SHOW GRANTS TO ROLE <role>` | `HAS_PERMS_BY_NAME('<table>','OBJECT','SELECT')` |
| **json_array_contains** | `col ? 'TAG'` | `JSON_CONTAINS(col, '"TAG"')` | `EXISTS(SELECT 1 FROM UNNEST(col) v WHERE v='TAG')` | `ARRAY_CONTAINS('TAG'::variant, col)` | `EXISTS(SELECT 1 FROM OPENJSON(col) WHERE value='TAG')` |
| **json_field_extract** (text) | `col->>'field'` | `JSON_UNQUOTE(JSON_EXTRACT(col,'$.field'))` ou `col->>'$.field'` | `JSON_VALUE(col,'$.field')` | `col:field::string` | `JSON_VALUE(col,'$.field')` |
| **json_field_extract** (numeric) | `(col->>'field')::numeric` | `CAST(col->>'$.field' AS DECIMAL)` | `CAST(JSON_VALUE(col,'$.field') AS NUMERIC)` | `col:field::number` | `CAST(JSON_VALUE(col,'$.field') AS DECIMAL)` |
| **json_array_unnest** (drill) | `, jsonb_array_elements(col) AS j` | `, JSON_TABLE(col,'$[*]' COLUMNS(...)) AS j` | `, UNNEST(col) AS j` | `, LATERAL FLATTEN(input => col) AS j` | `, OPENJSON(col) AS j` |
| **regex_match** | `col ~ 'pat'` | `col REGEXP 'pat'` | `REGEXP_CONTAINS(col,'pat')` | `REGEXP_LIKE(col,'pat')` | `col LIKE 'pat'` (limited) ou CLR |
| **case-insensitive LIKE** | `ILIKE 'pat'` | `LIKE 'pat'` (default CI sur utf8_general_ci) | `LOWER(col) LIKE LOWER('pat')` | `ILIKE 'pat'` | `LIKE 'pat' COLLATE Latin1_General_CI_AS` |
| **string_agg** | `string_agg(col,',')` | `GROUP_CONCAT(col SEPARATOR ',')` | `STRING_AGG(col,',')` | `LISTAGG(col,',')` | `STRING_AGG(col,',')` (2017+) |
| **now()** | `NOW()` ou `CURRENT_TIMESTAMP` | `NOW()` | `CURRENT_TIMESTAMP()` | `CURRENT_TIMESTAMP()` | `SYSUTCDATETIME()` |
| **interval subtraction** | `now() - interval '24 hours'` | `DATE_SUB(NOW(), INTERVAL 24 HOUR)` | `TIMESTAMP_SUB(CURRENT_TIMESTAMP(),INTERVAL 24 HOUR)` | `DATEADD(HOUR,-24,CURRENT_TIMESTAMP())` | `DATEADD(HOUR,-24,SYSUTCDATETIME())` |
| **hours_since (epoch diff)** | `EXTRACT(EPOCH FROM (now()-col))/3600` | `TIMESTAMPDIFF(HOUR, col, NOW())` | `TIMESTAMP_DIFF(CURRENT_TIMESTAMP(),col,HOUR)` | `DATEDIFF(HOUR, col, CURRENT_TIMESTAMP())` | `DATEDIFF(HOUR, col, SYSUTCDATETIME())` |
| **CREATE OR REPLACE VIEW** | `CREATE OR REPLACE VIEW v AS …` | `CREATE OR REPLACE VIEW v AS …` (8.0.13+) | `CREATE OR REPLACE VIEW v AS …` | `CREATE OR REPLACE VIEW v AS …` | `IF OBJECT_ID(...) IS NOT NULL DROP; CREATE VIEW …` |
| **GRANT SELECT** | `GRANT SELECT ON v TO <role>` | `GRANT SELECT ON db.v TO '<user>'@'%'` | (IAM) `bq add-iam-policy-binding` | `GRANT SELECT ON VIEW v TO ROLE <role>` | `GRANT SELECT ON v TO <user>` |
| **ROLLBACK pattern** | `BEGIN; DROP VIEW IF EXISTS v; COMMIT;` | `DROP VIEW IF EXISTS v;` (DDL auto-commit) | `DROP VIEW IF EXISTS <project>.<dataset>.v;` | `DROP VIEW IF EXISTS v;` | `IF OBJECT_ID('v') IS NOT NULL DROP VIEW v;` |
| **schema discovery script ref** | `probe_mvs_for_grafana.py` (Facil) | adapter à écrire | adapter à écrire | adapter à écrire | adapter à écrire |

### 14.2 Pattern Postgres → patterns équivalents (snippets)

**Pattern A — Aggregation enrichie (engine-agnostic, vrai standard SQL)** :
inchangé partout — `LEFT JOIN` + `COALESCE` sont standard.

**Pattern B — Multi-source resolution** :
inchangé partout — `COALESCE` standard.

**Pattern C — JSONB drill-down (engine-specific — voir §14.1)** :

```sql
-- Postgres
SELECT (j->>'city') AS city, (j->>'amount')::numeric AS amount
FROM mv_x, jsonb_array_elements(by_city) AS j
WHERE (j->>'zone') IN (${zone:sqlstring});

-- MySQL 8+
SELECT j.city, j.amount
FROM mv_x, JSON_TABLE(by_city, '$[*]'
    COLUMNS(city VARCHAR(100) PATH '$.city', amount DECIMAL PATH '$.amount', zone VARCHAR(50) PATH '$.zone')
) j
WHERE j.zone IN (${zone:sqlstring});

-- BigQuery
SELECT JSON_VALUE(j,'$.city') AS city, CAST(JSON_VALUE(j,'$.amount') AS NUMERIC) AS amount
FROM mv_x, UNNEST(JSON_QUERY_ARRAY(by_city,'$')) AS j
WHERE JSON_VALUE(j,'$.zone') IN (${zone:sqlstring});

-- Snowflake
SELECT j.value:city::string AS city, j.value:amount::number AS amount
FROM mv_x, LATERAL FLATTEN(input => by_city) j
WHERE j.value:zone::string IN (${zone:sqlstring});

-- SQL Server
SELECT j.city, j.amount
FROM mv_x CROSS APPLY OPENJSON(by_city)
    WITH (city NVARCHAR(100) '$.city', amount DECIMAL '$.amount', zone NVARCHAR(50) '$.zone') j
WHERE j.zone IN (${zone:sqlstring});
```

### 14.3 Caveats par moteur (à mentionner à l'utilisateur en Phase 3)

| Moteur | Caveat principal | Mitigation |
|---|---|---|
| **Postgres** | `information_schema` filtré sur Supabase pooler | Utiliser `pg_attribute` (cf §4.1) |
| **MySQL** | Pas de MV native avant 8.x ; pas d'`ARRAY` natif | Utiliser tables résumé + cron, JSON arrays dans colonne |
| **BigQuery** | Pas de GRANT SQL — IAM only ; `${var:sqlstring}` doit utiliser quoting BQ | Configurer rôle BI via `bq add-iam-policy-binding` ; tester `${var:sqlstring}` rendering en Phase 1 |
| **Snowflake** | Identifiers UPPERCASE par défaut ; warehouse coût query | Toujours `WHERE TABLE_NAME = UPPER(...)` ; configurer warehouse `XSMALL` pour BI |
| **SQL Server** | Pas de `CREATE OR REPLACE VIEW` natif (avant 2022) ; OPENJSON requis 2016+ | Wrapper en transaction `IF OBJECT_ID … DROP THEN CREATE` ; check version `@@VERSION` en Phase 1 |
| **Oracle / DB2 / autres** | Non couvert v1.1 | Cf. Faiblesse 1 — l'agent demande mapping interactif |

### 14.4 Procédure d'extension de l'adapter (futur projet)

Si l'agent rencontre un moteur non listé en §14.1 :

1. **Ne pas inventer** — demander à l'utilisateur les 5 primitives clés
   (column_query, json_array_contains, json_field_extract, regex_match, grant_syntax).
2. **Tester chacune** via la datasource Grafana (`POST /api/ds/query`) avant
   de générer la moindre vue.
3. **À la fin du flux**, proposer un PR sur `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md`
   ajoutant la colonne du nouveau moteur dans §14.1 + le caveat dans §14.3.
4. Mentionner dans le bilan session : « Adapter étendu au moteur X — primitives
   validées : col1=…, col2=…, etc. ».
