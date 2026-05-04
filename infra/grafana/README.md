# Grafana provisioning — Facil business dashboards

This directory holds the **infrastructure-as-code** for the Grafana side of the
dashboard evaluation (see `.claude/plans/GRAFANA_E1_MASTER_PLAN.md`).

## Structure

```
infra/grafana/
├── README.md                              (this file)
├── provisioning/
│   ├── datasources/
│   │   └── postgres-facil.yaml            connection looker_readonly → Supabase
│   └── dashboards/
│       └── facil.yaml                     provider config (path → folder mapping)
└── dashboards/
    ├── recaudacion.json                   Treasury KPIs (8 panels)
    ├── agentes.json                       Agent workload (10 panels)
    └── services.json                      Service catalog (8 panels)
```

## Two ways to consume this

### 1. Grafana Cloud Free Tier (current default)

Grafana Cloud doesn't read provisioning files from disk. To replicate, use
either:
- **Manual upload**: each `dashboards/*.json` is importable via Grafana UI
  → "+ → Import → Upload JSON file" (5 min per dashboard).
- **API push**: `infra/grafana/scripts/push_to_cloud.sh` (TODO) uses
  `POST /api/dashboards/db` with a service account token. Run once after
  any dashboard JSON change to keep Cloud in sync with git.

### 2. Self-hosted Grafana (future)

Mount this directory as `/etc/grafana/provisioning` and as a volume for
`/var/lib/grafana/dashboards`. Grafana auto-loads the YAMLs at startup
and re-loads dashboard JSONs every `updateIntervalSeconds` (default 30s).

Example docker-compose snippet:
```yaml
services:
  grafana:
    image: grafana/grafana-oss:latest
    volumes:
      - ./infra/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_DATABASE_PASSWORD=${LOOKER_READONLY_PASSWORD}  # injected
```

## Datasource credentials

The Postgres datasource uses the same `looker_readonly` role provisioned by
migration 315. **Never commit the password** in YAML — use Grafana env var
substitution `$LOOKER_READONLY_PASSWORD` (handled by the `secureJsonData`
field in the YAML).

For Grafana Cloud, set the password via UI once at workspace creation.
For self-hosted, inject via `GF_*` env var or k8s secret.

## How to add a new dashboard

1. Write/copy a JSON file to `dashboards/<name>.json`. Use existing files as
   template (mind `uid`, `title`, `panels[].datasource.uid='facil-postgres'`).
2. Commit + push. CI redeploys Grafana (or you push to Cloud manually).
3. Grafana picks it up automatically (provisioning) or after API push.
4. Grab the dashboard `uid` from the JSON, paste it in
   `/admin/dashboards/config` → Facil page renders the iframe with the
   right URL.

## Quick reference — Dashboard URL format

```
https://<workspace>.grafana.net/d-solo/<uid>/<slug>?orgId=1&theme=light&kiosk=tv&from=now-90d&to=now
```

- `d-solo` (no nav, clean for iframe)
- `kiosk=tv` (no menu bars)
- `from`/`to` (date range, can be over-ridden by Facil URL params later)

The Facil backend builds this URL via `DashboardConfigService.get_grafana_embed_url()`
when `provider='grafana'`.
