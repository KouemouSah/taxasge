# Grafana — Facil dashboards as-code

> **État (2026-05-04)** : 10 dashboards production-grade live sur
> `https://kouemousah.grafana.net`, peuplés de données réelles via 5 vues
> enrichies dans Supabase. Co-existence avec Looker Studio via toggle dans
> `/admin/dashboards/config`.
>
> **Pour démarrer sur un nouveau projet** : utilise la slash-command
> `/grafana-dashboards` qui exécute `GRAFANA_DASHBOARDS_AGENT.md` (8 phases,
> 10 anti-patterns gérés automatiquement).

## Sommaire

- [Structure du dossier](#structure)
- [Liste des 10 dashboards](#dashboards-livres)
- [Architecture data 4-layer](#architecture-data)
- [Démarrage rapide](#demarrage-rapide)
- [Push API](#push-api)
- [Self-hosted Grafana](#self-hosted)
- [Ajouter un nouveau dashboard](#ajouter-un-dashboard)
- [Format URL embed](#format-url-embed)
- [Agent réutilisable](#agent-reutilisable)
- [Migrations BD associées](#migrations)

## Structure

```
infra/grafana/
├── README.md                                  (ce fichier — index)
├── GRAFANA_DASHBOARDS_AGENT.md                (agent prompt-able 8 phases — réutilisable cross-projets)
├── provisioning/
│   ├── datasources/postgres-facil.yaml        connection looker_readonly → Supabase pooler
│   └── dashboards/facil.yaml                  provider config (path → folder)
└── dashboards/
    ├── 00_overview.json                       KPIs unifiés cross + nav 10 dashboards
    ├── 01_treasury.json                       Recaudación + filtres ministry/entity/workflow/method/site
    ├── 02_agents.json                         Performance agents OMS/non-OMS + site + type
    ├── 03_companies.json                      Empresas + zone + drill ville (JSONB)
    ├── 04_oms.json                            Obligations + bundle + inspections terrain
    ├── 05_payments.json                       Paiements + reconciliation + plans
    ├── 06_service_requests.json               SR actives + bundle + age_bucket SLA
    ├── 07_user_activity.json                  Audit utilisateurs (3342 events) + canal/rôle
    ├── 08_channel_mobile_vs_web.json          Adoption mobile vs web vs inspector
    └── 09_inspections.json                    Inspections terrain + GPS + scellés
```

## Dashboards livrés

| UID | Titre | Source principale | Filtres clés |
|---|---|---|---|
| `facil-overview` | Overview | mv_company_global_stats, mv_treasury, v_user_activity_audit | (synthèse) |
| `facil-treasury` | Recaudación Fiscal | mv_treasury_daily_kpis + v_treasury_payments_by_site | Ministère, Entité, Workflow, Méthode, **Site (multi-source)** |
| `facil-agents` | Performance Agentes | v_agent_workload_enriched | OMS toggle, Entité, Site, Type agent |
| `facil-companies` | Empresas | mv_company_global_stats + by_zone + analytics JSONB | Zone, **Ville (drill JSONB)** |
| `facil-oms` | OMS Modules | mv_obligation_stats_by_ministry | Ministère, Fee_type, Zone, Site |
| `facil-payments` | Payments Operations | v_treasury_payments_by_site | Statut, Entité, Site |
| `facil-service-requests` | Service Requests | v_active_service_requests_enriched | Workflow, Entité, Site |
| `facil-user-activity` | Activité utilisateurs (audit) | v_user_activity_audit | Canal, Rôle, Catégorie |
| `facil-channel` | Mobile vs Web vs Inspector | v_service_requests_channel + v_treasury_payments_by_site | Workflow, Entité |
| `facil-inspections` | Inspections terrain | v_field_inspections_enriched | Entité, Ville, Résultat |

## Architecture data

```
Layer 1 — Aggregations (cron 15 min)
   mv_treasury_daily_kpis, mv_company_*, mv_obligation_stats_by_ministry,
   mv_agent_daily_workload, mv_inspection_zone_analytics

Layer 2 — Vues enrichies (mig 320, 321, 322)
   v_agent_workload_enriched              (workload + agent_type + entity + location + is_oms)
   v_active_service_requests_enriched     (SR + age_bucket + agent + location)
   v_user_activity_audit                  (audit_logs + channel + action_category)
   v_service_requests_channel             (SR + canonical channel mapping)
   v_field_inspections_enriched           (inspections + agent + entity + location + photos_count)
   v_service_payments_enriched            (paiements + workflow + entity)
   v_treasury_payments_by_site            ★ résolution site multi-source 4-step
   v_entity_locations_browse              (catalogue locations pour filtres dropdown)
   v_entities_browse                      (catalogue entités + is_oms calculé)

Layer 3 — Wrappers auto (boot Facil)
   vw_*  créés par sync_looker_view_wrappers.py (rule #38) — pour Looker JDBC
   Grafana utilise les v_* directement, pas besoin du wrapper

Layer 4 — Grafana Cloud (eu-west-3 pooler IPv4)
   datasource facil-postgres → 10 dashboards JSON
```

## Démarrage rapide

### Pré-requis (Phase 0 de l'agent)

Le `.env` (ex `packages/backend/.env.local`) doit contenir :

```bash
# Grafana
GRAFANA_BASE_URL=https://<workspace>.grafana.net
GRAFANA_API_TOKEN=glsa_xxxxxxxxxxxxxxxxxxxx       # service account token, 7d expiry
GRAFANA_ORG_ID=1

# BD pooler IPv4 (Supabase)
DATABASE_URL=postgresql://postgres:...@db.<project>.supabase.co:5432/postgres
LOOKER_READONLY_PASSWORD=...                      # mot de passe rôle BI
```

### Pour Facil (existant)

```bash
# Re-pousser tous les dashboards après modification d'un JSON
python packages/backend/scripts/push_grafana_dashboards.py
```

### Pour un nouveau projet

```
/grafana-dashboards
```

→ L'agent te guide depuis la création du compte Grafana jusqu'aux dashboards
en prod (8 phases, 10 anti-patterns gérés). Voir `GRAFANA_DASHBOARDS_AGENT.md`.

## Push API

Script `packages/backend/scripts/push_grafana_dashboards.py` :
1. Healthcheck Grafana (`/api/health`)
2. UPSERT datasource (idempotent)
3. POST chaque JSON via `/api/dashboards/db` avec `overwrite: true`
4. Verify chaque UID via `/api/dashboards/uid/<uid>`
5. Print les URLs preview pour copier-coller dans `/admin/dashboards/config`

⚠️ **Piège connu** : le pooler Supabase IPv4 est obligatoire pour Grafana Cloud
(le direct host résout uniquement IPv6, AWS ne route pas). Région découverte
pour ce projet : `eu-west-3`. Username pooler : `looker_readonly.bpdzfkymgydjxxwlctam`.

## Self-hosted

Mount ce dossier comme volumes :
```yaml
services:
  grafana:
    image: grafana/grafana-oss:latest
    volumes:
      - ./infra/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - LOOKER_READONLY_PASSWORD=${LOOKER_READONLY_PASSWORD}
```

Grafana auto-load les JSONs (refresh 30s).

## Ajouter un dashboard

1. Identifier la MV / vue source (créer une vue enrichie si besoin via migration)
2. Granter à `looker_readonly` : `GRANT SELECT ON v_xxx TO looker_readonly;`
3. Écrire le JSON dans `dashboards/<NN>_<topic>.json` selon le template Phase 5 de l'agent
4. **TOUJOURS utiliser** :
   - `${var:sqlstring}` pour filtres multi-select
   - `currency:XAF` pour montants (pas `currencyXAF`)
   - `noValue: "0"` sur stat panels
   - Variables chaînées (`refresh: 1`)
   - Source filtres = catalogues complets (`v_entity_locations_browse`), pas tables de faits
5. `python packages/backend/scripts/push_grafana_dashboards.py`
6. Grab le `uid` du JSON, coller dans `/admin/dashboards/config` Facil pour intégration iframe

## Format URL embed

```
https://<workspace>.grafana.net/d-solo/<uid>/<slug>?orgId=1&theme=light&kiosk=tv&from=now-90d&to=now
```

- `d-solo` : pas de nav (clean iframe)
- `kiosk=tv` : pas de menu Grafana
- `from`/`to` : période (override par params Facil)

Le backend Facil construit cette URL via `DashboardConfigService._build_grafana_embed_url()` quand `provider='grafana'`.

## Agent réutilisable

`GRAFANA_DASHBOARDS_AGENT.md` (~600 lignes) — exécutable par n'importe quel LLM via :

| Invocation | Effet |
|---|---|
| `/grafana-dashboards` | Flux complet 0→8 (zéro à dashboards en prod) |
| `/grafana-dashboards setup` | Phase 0+1 (compte, token, datasource healthy) |
| `/grafana-dashboards analyze` | Phase 2+3 (discovery + plan métier) |
| `/grafana-dashboards build` | Phase 4+5+6 (migrations + JSONs + push) |
| `/grafana-dashboards fix <issue>` | Phase 7 ciblé (No data, filtre cassé, etc.) |

L'agent gère **automatiquement** les 10 pièges connus (IPv6, template variables, currency format, wrappers, etc.) — voir §11 du document.

**Reproductible cross-projets** : copier 2 fichiers (`GRAFANA_DASHBOARDS_AGENT.md` + `.claude/commands/grafana-dashboards.md`) dans le repo cible et lancer la slash-command.

## Migrations associées (BD Facil)

| # | Fichier | Objet |
|---|---|---|
| 315 | `315_looker_readonly_role.sql` | Rôle Postgres `looker_readonly` + grants MVs |
| 316 | `316_dashboards_view_permission.sql` | Permission `dashboards.view_business` (RBAC Facil) |
| 317 | `317_dashboard_registrations.sql` | Table `dashboard_registrations` + `dashboards.manage` |
| 318 | (boot sync `looker_wrappers_sync.py`) | Wrappers auto `vw_*` au boot |
| 319 | `319_dashboard_provider_dual.sql` | ENUM `dashboard_provider_enum` + colonnes provider/grafana_uid |
| 320 | `320_looker_enriched_views.sql` | 4 vues enrichies (agent, SR, locations, entities) |
| 321 | `321_audit_inspections_channel_views.sql` | 4 vues (audit, SR-channel, inspections, payments) |
| 322 | `322_treasury_by_site_view.sql` | ★ Résolution site multi-source 4-step (field_inspection → SR → agent collecté → agent validé) |

## Limitations connues

1. **Agents tous à Malabo** dans seed actuel — peupler `agent_profiles.entity_location_id` pour vraie distribution multi-site
2. **field_inspections vide** en prod — dashboard Inspector affiche "No data" légitime tant qu'aucune inspection terrain n'est saisie
3. **Token Grafana à rotater** tous les 7 jours (service account `facil-deployer` sur kouemousah.grafana.net)
4. **Pas de RLS multi-tenant Grafana** — toute personne avec l'URL embed peut voir le dashboard. Pour vrai RLS : Phase B.2 OAUTH2 community connector (cf. `LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md`)

## Liens

- Agent doc : [`GRAFANA_DASHBOARDS_AGENT.md`](./GRAFANA_DASHBOARDS_AGENT.md)
- Slash-command : [`.claude/commands/grafana-dashboards.md`](../../.claude/commands/grafana-dashboards.md)
- Bilan session 2026-05-04 : `memory/session_2026_05_04_grafana_e1.md`
- Plans Looker (parallèle) : `.claude/plans/LOOKER_E1_*`
