# GRAFANA E1 — Co-existence Looker Studio + Grafana sur `/admin/dashboards`

**Date** : 2026-05-04
**Statut** : 📋 PLANIFIÉ
**Reference** : `.claude/plans/GRAFANA_BUSINESS_POC_PLAN.md` (PoC contexte préexistant)
**Effort estimé** : 3-4h impl + 1h critique

---

## 1. Objectif

Le user a décidé une stratégie d'**évaluation comparative** :
- Construit en parallèle les **3 dashboards Looker Studio** (UI, manuel, §6.10) — humain
- Et les **3 dashboards Grafana JSON-as-code** (programmatique) — agent

Tous deux apparaissent dans la même page `/admin/dashboards` Facil. L'admin choisit par dashboard quel provider charger (toggle dans `/admin/dashboards/config`). Permet de juger Looker vs Grafana **à isofonctionnalité** sur les mêmes KPIs avant de trancher définitivement.

## 2. Contraintes non-négociables

- ✅ **Zéro régression sur Looker** : la phase 1-3 E1 Looker reste opérationnelle sans changement. Le pivot Grafana est **additif**, jamais destructif.
- ✅ **1M+ users** : embed Grafana iframe avec auth anonyme côté Grafana + permission gate côté Facil (réutilise `dashboards.view_business`). Pas de re-build d'auth.
- ✅ **OWASP** : iframe `sandbox="allow-scripts allow-same-origin"`, X-Frame-Options Grafana = `ALLOW-FROM facil-domain`, CSP `frame-src` whitelist.
- ✅ **Zéro hardcoding** : URL Grafana base dans env var, dashboard UID en BD, theme/orgId paramétrés.
- ✅ **Provider switch ne casse jamais** : si un dashboard a `provider='grafana'` mais `grafana_dashboard_uid` NULL, fallback sur Looker config (si présent) ou afficher placeholder "non configuré". Idem sens inverse.
- ✅ **Auto au boot** : pas de migration manuelle pour ajouter un dashboard Grafana — le provisioning Grafana charge les JSON depuis `infra/grafana/dashboards/*.json` au boot du conteneur Grafana.

## 3. Architecture cible

```
                                    ┌──────────────────────────────┐
                                    │ /admin/dashboards/config     │
                                    │  (page admin Facil)          │
                                    │   pour chaque dashboard:     │
                                    │   - provider: looker|grafana │
                                    │   - looker_report_id          │
                                    │   - grafana_dashboard_uid     │
                                    └────────────┬─────────────────┘
                                                 │ PUT
                                                 ▼
                                    ┌──────────────────────────────┐
                                    │ table dashboard_registrations│
                                    │ + colonne provider            │
                                    │ + colonne grafana_dashboard_uid│
                                    └────────────┬─────────────────┘
                                                 │ GET reports-config
                                                 ▼
                                    ┌──────────────────────────────┐
                                    │ /admin/dashboards/[id]       │
                                    │  DashboardEmbed.tsx          │
                                    │  switch(provider) {          │
                                    │    looker → iframe Looker    │
                                    │    grafana → iframe Grafana  │
                                    │  }                            │
                                    └──────────────────────────────┘
                                                 │
                            ┌────────────────────┴─────────────────┐
                            ▼                                       ▼
                    ┌──────────────┐                    ┌──────────────────┐
                    │ Looker       │                    │ Grafana          │
                    │ Studio       │                    │ Cloud Free       │
                    │ embed URL    │                    │ embed /d-solo    │
                    └──────┬───────┘                    └────────┬─────────┘
                           │ JDBC                                │ Postgres
                           ▼                                     ▼
                    ┌──────────────────────────────────────────────────┐
                    │ Supabase Postgres (looker_readonly role)         │
                    │  vw_treasury_daily_kpis, vw_agent_daily_workload, │
                    │  vw_services_translated  (already provisioned)    │
                    └──────────────────────────────────────────────────┘
```

**Note** : les 2 providers consomment la **même source de données** (mêmes vues `vw_*`), même rôle `looker_readonly`. Ça garantit que les KPIs sont identiques à la donnée près. Seule la couche présentation diffère.

## 4. Décomposition en phases (G1 à G7)

| # | Phase | Effort | Dépend de | Output |
|---|---|---|---|---|
| G1 | Master plan + plans détaillés (CE FICHIER) | 30 min | — | `.claude/plans/GRAFANA_E1_MASTER_PLAN.md` (this) |
| G2 | Provisioning Grafana (datasource + folder + auth) | 30 min | G1 | `infra/grafana/provisioning/{datasources,dashboards}/*.yaml` |
| G3 | Migration BD : étendre `dashboard_registrations` | 30 min | G1 | Migration 319 + apply script |
| G4 | Backend : Pydantic + service + endpoints dual provider | 45 min | G3 | `dashboard_config.py` + `dashboard_config_service.py` modifs |
| G5 | **7 dashboards Grafana JSON** multi-pages | 3h | G2 | `infra/grafana/dashboards/{00_overview,01_treasury,02_agents,03_companies,04_oms,05_payments,06_declarations}.json` |
| G6 | Frontend : DashboardEmbed switch + config form | 45 min | G4 | `DashboardEmbed.tsx`, `DashboardConfigForm.tsx` modifs + i18n |
| G7 | Critique + commits + push | 1h | G5+G6 | 6-7 commits sémantiques + critique globale + memory update |

## 5. Choix techniques détaillés

### 5.1 Hosting Grafana — Cloud Free Tier vs self-hosted

**Décision : Grafana Cloud Free** (au moins pour l'évaluation)
- 10K active series / 50GB logs / 3 users / 14d retention
- Auth Google SSO supportée
- URL `https://<workspace>.grafana.net` — embed iframe direct
- Zéro infra à maintenir
- Si l'éval valide Grafana et que les limites deviennent serrées, pivot self-host sur Cloud Run (~$5-10/mo)

Auth iframe :
- Grafana Cloud Free supporte `?orgId=&theme=light&kiosk=tv` URL pour mode embed
- Pour le multi-tenant RBAC : pas indispensable au stade éval (le permission gate Facil filtre déjà), à étudier en phase Production

### 5.2 Provisioning vs Création API

**Décision : Provisioning YAML/JSON file-based**

Pourquoi pas l'API `POST /api/dashboards/db` ? Parce que :
- Provisioning fichier = source de vérité git, déclaratif
- Survit aux redémarrages Grafana (les API-created dashboards survivent aussi mais sont moins audités)
- PR + merge = nouveau dashboard, pas besoin de credentials runtime
- Compatible avec `terraform-grafana` provider plus tard si IaC totale

Layout :
```
infra/grafana/
├── provisioning/
│   ├── datasources/
│   │   └── postgres-facil.yaml      # datasource looker_readonly
│   └── dashboards/
│       └── facil.yaml                # provider config (path → folder)
└── dashboards/
    ├── recaudacion.json              # dashboard 1
    ├── agentes.json                  # dashboard 2
    └── services.json                 # dashboard 3
```

### 5.3 Provider field — enum vs string

**Décision : ENUM Postgres `dashboard_provider_enum`** (`'looker_studio'`, `'grafana'`)

ENUM > string libre :
- BD-level type safety — impossible d'écrire `'grfana'` ou `'GRAFANA'`
- Pydantic literal type matching
- Évolution future propre (ALTER TYPE ADD VALUE)

### 5.4 URL embed Grafana

```
https://<workspace>.grafana.net/d-solo/<dashboard_uid>/<dashboard-slug>?orgId=1&from=now-90d&to=now&theme=light&kiosk=tv&panelId=<panel_id>
```

`d-solo` (sans nav top/sidebar) > `d` (avec). Pour embed propre dans iframe Facil.

`kiosk=tv` cache les bandes Grafana — embed clean.

`panelId=<id>` permet d'embedder UN seul panel ; pour notre cas on charge le dashboard entier donc on omet ce param.

## 6. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Auth anonyme Grafana = embed accessible si URL leakée | Medium | High | X-Frame-Options + CSP frame-src whitelist + Grafana mode "viewer" public désactivé (auth Google requise) |
| Iframe Grafana cassée par CSP Facil | Low | Medium | Vérifier CSP Facil autorise `frame-src https://*.grafana.net` |
| Provisioning JSON pas re-loadé sans restart conteneur | Low | Low | Document : à chaque ajout dashboard JSON, re-build conteneur Grafana (auto via PR) |
| Looker user voit Grafana dashboards dans /admin/dashboards | N/A | N/A | Volontaire : c'est l'objet de l'évaluation comparative |
| `looker_readonly` saturé par doubles requêtes (Looker + Grafana en même temps) | Low | Low | Tests évaluation = 1 user à la fois ; cache Grafana 30s par défaut |

## 7. Critères de succès G1-G7

- [ ] Tous les 3 dashboards Grafana JSON pushed dans `infra/grafana/dashboards/`
- [ ] `/admin/dashboards/config` montre une UI permettant de toggle provider par dashboard
- [ ] Pour un dashboard `provider='grafana'`, `/admin/dashboards/recaudacion` charge l'iframe Grafana
- [ ] Pour un dashboard `provider='looker_studio'`, idem charge l'iframe Looker
- [ ] Switch sans page reload côté admin (mutation React Query → re-render iframe)
- [ ] Aucun régression sur les flux Looker existants
- [ ] Smoke staging post-deploy validé

## 8. Critères d'évaluation à isofonctionnalité (pour décision finale)

Une fois les 6 dashboards en prod (3 Looker + 3 Grafana), évaluer sur :

| Critère | Looker Studio | Grafana | Verdict après éval |
|---|---|---|---|
| Time-to-create-new-dashboard | ~10-15 min UI | ~5 min PR JSON | À mesurer |
| Time-to-modify-existing | UI clic | git push | À mesurer |
| Audit trail des modifs | Looker history limité | git log complet | Grafana théorique |
| UX viewer (admin/agent) | Drag-drop polished | Plus dense, moins polished | À mesurer |
| Performance render | Cache 15min Looker | Cache 30s Grafana | À mesurer |
| Coût | Gratuit | Free tier 10K series | OK les 2 |
| RLS multi-entity | Path B (custom connector OAUTH2) | Variables + ACL Grafana | À mesurer |
| Alerting | Email schedulé | Native multi-canal | Grafana théorique |
| Theme/branding | Limité | Configurable JSON | Grafana théorique |
| Stakeholder demo (non-tech) | + | - | À mesurer |

→ Décision finale après 1-2 semaines d'usage réel.

## 8.bis — Scope révisé 2026-05-04 : 7 dashboards exhaustifs au lieu de 3

User feedback explicite : "ne crée pas que 3 dashboards, créé les véritables dashboards métiers nécessaires avec différentes pages pour rapport complet" + "service catalogue peut être remplacé par les modules OMS qui sont plus important".

### MVs source (vérifiées via `probe_mvs_for_grafana.py` 2026-05-04 — colonnes réelles, pas inventées)

| MV / View | Cols | Rows | Usage prévu |
|---|---|---|---|
| `mv_treasury_daily_kpis` | 21 | 5 | Treasury (Dashboard 01) |
| `mv_agent_daily_workload` | 10 | 3 | Agents (Dashboard 02) |
| `mv_company_global_stats` | 18 | 1 | Overview + Companies |
| `mv_company_analytics` | 8 (JSONB) | 1 | Companies analytics drill |
| `mv_company_stats_by_zone` | 23 | 12 | Companies by zone |
| `mv_obligation_stats_by_ministry` | 15 | 58 | OMS obligations |
| `mv_inspection_zone_analytics` | 17 | 0* | OMS inspections (schema OK, données à venir) |
| `mv_reconciliation_stats` | 11 | 0* | Payments reconciliation (idem) |
| `v_payments_dashboard` | 29 | 0* | Payments operations |
| `v_payment_plans_monitoring` | 23 | — | Payment plans |
| `v_declarations_dashboard` | — | — | Declarations |
| `v_declarations_stats` | — | — | Declarations stats |
| `v_declarations_stats_by_type` | — | — | Declarations by type |
| `homepage_stats` | — | — | Overview homepage |
| `ministries_with_stats` | — | — | Overview by ministry |
| `categories_with_services` | — | — | Reference catalog |

*0 rows = MVs créées mais pas encore alimentées en prod ; les dashboards doivent fonctionner même vides (pas de panel hardcodé qui suppose ≥1 row).

### 7 dashboards livrables (avec rows pour structure)

1. **00_overview.json** — Tableau de bord d'accueil
   - Row "KPIs globaux" : cards homepage_stats + mv_company_global_stats (total companies, active licenses, recovery rate)
   - Row "Dernières 24h" : payments du jour, agents actifs, declarations soumises
   - Row "Liens rapides" : buttons vers les autres dashboards
2. **01_treasury.json** — Recaudación fiscal (équivalent Looker Dashboard 1)
   - Row "Synthèse" : scorecard total mois + variation jour/jour + cards SLA
   - Row "Évolution 90j" : time-series + heatmap par jour de semaine
   - Row "Par entité" : bar empilé entité × méthode + top 10 services
   - Row "Drill" : table pivot entité × méthode
3. **02_agents.json** — Performance Agentes
   - Row "Synthèse" : taux approbation + décisions/jour + durée moyenne
   - Row "Ranking" : top 10 agents (volume), boxplot durée, table complète
   - Row "Évolution" : time-series approuvés/rejetés + heatmap agent × jour
4. **03_companies.json** — Registre commercial
   - Row "KPIs" : total / actives / verified / debt / recovery rate
   - Row "Par zone" : bar par tier (A1, A2, B1, ...), recovery rate par zone
   - Row "Par ville" : table avec dette + recovery + nombre licences
   - Row "Top débiteurs" : top 10 (extrait JSONB top_debtors)
5. **04_oms.json** — OMS Modules (obligations + inspections + licences) ⭐
   - Row "Obligations" : par ministère (total / paid / pending / overdue), recovery rate
   - Row "Inspections terrain" : conformity rate + collections + agents actifs (mv_inspection_zone_analytics)
   - Row "Bundle workflow" : breakdown par zone + statut (filtré workflow_code='BUNDLE_PAYMENT' sur treasury)
   - Row "Pénalités" : total penalties par fee_type
6. **05_payments.json** — Operations paiements
   - Row "Synthèse paiements" : volume + montant + statuts (v_payments_dashboard)
   - Row "Plans de paiement" : actifs / défaut / recouvrement (v_payment_plans_monitoring)
   - Row "Reconciliation bancaire" : taux par banque (mv_reconciliation_stats)
7. **06_declarations.json** — Declarations fiscales
   - Row "Synthèse" : v_declarations_dashboard
   - Row "Par type" : v_declarations_stats_by_type (IVA, IRPF, etc.)
   - Row "Statistiques globales" : v_declarations_stats

### Liens entre dashboards

Chaque dashboard JSON inclut un bloc `links: [...]` au niveau racine listant les 6 autres → menu de navigation top-of-screen Grafana. UX : depuis n'importe quel dashboard, l'utilisateur clique le titre d'un autre → navigation instantanée.

### Naming convention

Préfixe numérique `00_`, `01_`, ... pour ordre alphabétique cohérent dans le folder Grafana "Facil — Business KPIs". UID stable défini dans le JSON (`facil-overview`, `facil-treasury`, `facil-agents`, etc.) pour éviter qu'une re-création accidentelle change les URLs embedées.

## 9. Ordre de travail (parallèle user/agent)

**User (toi)** : §6.10 du rapport Looker → construire les 3 dashboards Looker manuellement.

**Agent (moi)** :
- G2 → Provisioning Grafana (30 min)
- G3 → Migration 319 (30 min)
- G4 → Backend dual provider (45 min)
- G5 → 3 dashboards Grafana JSON (1h30)
- G6 → Frontend switch (45 min)
- G7 → Critique + commits (1h)

**Total agent** : ~5h de travail, en parallèle pendant que tu construis Looker. À la fin, tous les commits poussés (sous validation), tu peux pivoter d'un dashboard à l'autre via la page admin et juger.

## 9.bis Critique honnête (post-impl 2026-05-04)

### Bien réussi
- **BD vérifiée live AVANT** la migration 319 et avant écriture des dashboards (règle #12) — schémas réels via `pg_attribute` (information_schema filtré sur Supabase pooler).
- **Migration 319 idempotente** : ENUM via DO block, ADD COLUMN IF NOT EXISTS, DROP+CREATE CONSTRAINT, default 'looker_studio' préserve la rétro-compat sur la ligne mig 317 existante.
- **CHECK constraint multi-niveaux** (Zod / Pydantic / BD) sur grafana_dashboard_uid format + provider-required-field — défense en profondeur 3 couches.
- **7 dashboards JSON** avec rows pour structure multi-pages, dashboard links pour navigation cross-dashboard.
- **OMS dashboard** (remplace declarations à la demande user) couvre 4 axes : obligations par fee_type / bundle workflow / inspections terrain / pénalités.
- **Service Requests dashboard** (remplace declarations) couvre 4 axes : actives / par workflow / bundle zoom / overdues détaillé.
- **Frontend dual-provider** : DashboardEmbed lit `embed_url` calculé backend en priorité, fallback build local pour Looker — switch transparent sans régression.
- **OWASP** : iframe sandbox restrictif (`allow-scripts allow-same-origin allow-popups` only, pas `allow-forms` ni `allow-top-navigation`), regex strict sur tous les inputs.
- **i18n** complet 3 langues (provider/grafanaUid/grafanaOrgId) avec fallback `defaultValue` pour les nouvelles clés.
- **Auto pour futur ajout MV** : grant `looker_readonly` sur nouvelle MV → wrapper `vw_*` créé au boot (mig 318 logic) → SQL Grafana `SELECT * FROM vw_xxx` immédiat.

### Gaps identifiés
1. **Grafana Cloud non provisionné** (G2 a écrit les YAMLs mais pas créé de workspace Grafana Cloud). C'est par design — le user doit créer le workspace via UI une fois. Ensuite, `GRAFANA_BASE_URL` env var Cloud Run + import des 7 JSONs via UI Grafana ou `POST /api/dashboards/db` script.
2. **Pas de smoke test E2E backend** : le test `smoke_grafana_e1_minimal.py` est resté hangué sur ce poste (problème buffering MSYS bash, déjà connu memory rule). À valider en CI ou local Linux.
3. **Pas d'auto-push des dashboards JSON vers Grafana Cloud** : le workflow attendu = créer un workspace + importer les JSON via UI Grafana, ou écrire un script `scripts/push_to_grafana_cloud.sh` qui POST chaque JSON via API. Hors scope G7, à ajouter si le user adopte Grafana.
4. **Pas de tests Playwright** sur le toggle provider dans `/admin/dashboards/config`. À valider manuellement.
5. **Variable Grafana template `$workflow` / `$entity`** : si l'utilisateur ne sélectionne aucune valeur, le SQL `('$entity' = 'All' OR ...)` peut comportement inattendu selon comment Grafana développe les templates multi-select. À tester en runtime.
6. **Pas de Row Level Security côté Grafana** : les 7 dashboards sont visibles à tout user authentifié sur Grafana. Le permission gate Facil filtre l'accès à la page `/admin/dashboards/[id]`, mais quelqu'un avec l'URL Grafana directe pourrait bypasser. Atténuation : Grafana Cloud avec auth Google + URL Grafana non publique.

### OWASP audit
- ✅ Iframe sandbox restrictif (allow-scripts + same-origin + popups uniquement)
- ✅ Regex strict 3 niveaux sur tous les UIDs/IDs
- ✅ Pydantic `extra="forbid"` bloque mass assignment
- ✅ Permission gate `dashboards.view_business` (lecture) + `dashboards.manage` (écriture)
- ✅ Audit log row par PUT (atomique avec UPSERT)
- ✅ Rate limit 10 PUT/min/user
- ✅ asyncpg parametrized queries
- ⚠️ Iframe Grafana auth = à clarifier en production (Grafana Cloud SSO Google nécessaire pour vraiment vérifier le caller)

### Performance 1M+
- ✅ Cache Redis 5min sur `/reports-config` (single key, payload <3KB pour 7 entries)
- ✅ Index partiel BD sur is_active=true
- ✅ UPSERT atomique (1 round-trip)
- ✅ React Query staleTime 1min admin (3 admins simultanés max)
- ✅ Grafana provisioning charge les JSONs depuis disque, refresh interval 30s — pas de hit BD additionnel

### Hardcoding zero
- ✅ Aucun UUID en dur (JSONs Grafana utilisent uid `facil-postgres` qui matche le YAML provisioning)
- ✅ Aucun report_id ou grafana_uid en dur (BD ou env var)
- ✅ URL Grafana base = env var
- ⚠️ Regex pattern dupliqué (4 endroits désormais : Zod + Pydantic + BD CHECK + commentaire dashboard JSON) — délibéré pour défense en profondeur, commenté

### Verdict global
**G1-G6 PRÊT POUR PUSH**. Code complet, ESLint clean, JSON i18n validés, migration 319 appliquée + verifiée 5/5. Le user pourra :
1. Créer un workspace Grafana Cloud Free Tier
2. Setter `GRAFANA_BASE_URL` env var sur Cloud Run + `LOOKER_READONLY_PASSWORD` côté Grafana
3. Importer les 7 dashboards JSON dans Grafana (UI ou API)
4. Aller sur `/admin/dashboards/config` Facil → toggle provider=Grafana → coller `grafana_dashboard_uid` (ex: `facil-treasury`)
5. Recharger `/admin/dashboards/treasury` Facil → l'iframe affiche maintenant Grafana au lieu de Looker

Évaluation comparative possible immédiate : on switche le provider d'un dashboard, on observe quelle UI/UX/perf est préférable.

## 10. Annexe — pourquoi `infra/grafana/` et pas `packages/backend/grafana/`

Grafana provisioning est une **infrastructure transverse**, pas un module backend. Pattern usuel :
```
infra/
├── grafana/             # provisioning + dashboards JSON
├── terraform/           # IaC GCP (existant)
└── helm/                # k8s charts (futur)
```

Si plus tard on déploie Grafana self-hosted via Cloud Run/k8s, le folder `infra/grafana/` est mountable directement comme volume Grafana.
