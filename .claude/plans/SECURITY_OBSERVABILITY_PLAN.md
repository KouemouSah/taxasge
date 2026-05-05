# SECURITY OBSERVABILITY — Phase C — Plan d'implémentation

**Objectif** : compléter le gap B.5 (prompt injection logs invisibles) + ajouter une vue opérationnelle complète sur le trafic HTTP : IPs, devices, géolocalisation, patterns anormaux, audit. Réponse aux 2 questions utilisateur 2026-05-05 :
1. *"prompt injection detection est-ce un dashboard ou une métriques?"* → réponse : aucun des deux actuellement (logs + Tempo 14j only). Phase C.1 corrige.
2. *"controler les différentes adresses ip qui se connecte et leur requetes avec filtré par type de devices"* → réponse : phase C.2-C.5 implemente cela.

**Date** : 2026-05-05
**Branch** : `develop`
**Scope** : backend Python / FastAPI + 1 nouveau dashboard Grafana + 1 nouvelle table BD + 5 alertes.
**Préreqs** : Phase A (`ai_call_metrics`) + Phase B (FastAPI/asyncpg/httpx/redis OTEL instrumentation) déjà déployés.
**Mémoire** : Règles #13 (push après validation), #14 + #32 (commit auto fin de phase), #24 (json.dumps JSONB asyncpg), #37 (boot non-destructif), #38 (Looker MV→VIEW wrapper auto au boot), #40 (Secret Manager pour secrets).

---

## 0. Audit préalable (fait 2026-05-05)

### Sources de données existantes

| Source | Données dispos | Couverture | Problème |
|---|---|---|---|
| `audit_logs` (BD) | `user_id`, `entity_type`, `entity_id`, `action`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at` | Auth + RBAC + dashboard config + permissions only | Pas tous les endpoints (limité aux state changes) |
| OTEL spans Phase B (Tempo) | `http.client_ip`, `http.user_agent`, `http.method`, `http.route`, `http.status_code` | Tous les endpoints | Rétention 14j Free tier ; pas de SQL queryable |
| Sentry events | IP + UA + browser + OS | Erreurs only ; `send_default_pii=False` chez nous → IP partiellement obscurcie | Pas un outil d'observabilité de routine |
| LogRocket | Session-level full client info | Web + mobile + inspector | UI LogRocket only, pas dans Grafana |

**Conclusion** : aucune source ne couvre **tous les endpoints + queryable SQL + retention longue**. D'où la nouvelle table `request_telemetry`.

### Audit `ai_call_metrics` (mig 325)

Manque 3 colonnes pour C.1 :
- `injection_risk` (text, enum CHECK)
- `injection_score` (int, 0..100+)
- `injection_rules` (text[], top 5 matched rules)

Quick fix mig 328 (ALTER TABLE ADD COLUMN — idempotent, IF NOT EXISTS).

---

## 1. Architecture

### Décision A : nouvelle table `request_telemetry` (vs extension `audit_logs`)

`audit_logs` est conçu pour les **state changes** avec `old_values`/`new_values` JSONB. L'utiliser pour TOUTES les requêtes HTTP polluerait sa sémantique et exploserait son volume (10x). Mieux : table dédiée focused.

### Décision B : GeoIP via MaxMind GeoLite2 offline

| Option | Coût | Latence | RGPD | Maintenance |
|---|---|---|---|---|
| **MaxMind GeoLite2** | Free + signup | ~10µs (in-memory MMDB) | ✅ data stays | DB update ~mensuel |
| ip-api.com | Free 45 req/min | ~50ms (HTTP call) | ⚠️ data leaves | Aucune |
| Cloudflare `CF-IPCountry` | Free si on passe par Cloudflare | 0 (header) | ✅ | Aucune |

**Choix** : **MaxMind GeoLite2** car (a) pas de rate-limit, (b) latence minimale, (c) compatible 1M users target, (d) Cloudflare pas encore configuré chez nous.

Implémentation : lib Python `geoip2` (officielle) + DB `GeoLite2-City.mmdb` téléchargée au boot via cron mensuel.

### Décision C : User-Agent parsing via `user-agents` lib

Lib Python pure, populaire (8M downloads/mois), maintenue. Sortie : `device_type`, `browser_name/version`, `os_name/version`, `is_bot`. Cache LRU 1024 entries pour réduire CPU (UA strings = très répétitifs).

### Décision D : Sampling & rétention

À 1M users target, log 100% = 100M+ rows/jour = explosion BD. Stratégie :
- **Errors (status >= 400)** : 100% sampling
- **Successes (status < 400)** : sampling adaptatif :
  - 100% si IP nouvelle dans la dernière heure
  - 100% si user_id nouveau
  - 10% sinon (régime de croisière)
- **Bots détectés** (UA → is_bot=true) : 1% sampling (volume noise)
- **Rétention raw rows** : 30 jours (cron `DELETE WHERE timestamp < now() - 30d`)
- **Aggregation** : mig 329 ajoute MV `mv_request_telemetry_hourly` (rétention illimitée)

### Décision E : middleware FastAPI ASGI raw (vs `BaseHTTPMiddleware`)

`BaseHTTPMiddleware` consomme le request body — trop lourd. Pour la télémétrie on a juste besoin du metadata (path, method, status, IP, UA). Pure ASGI middleware = ~200ns overhead par requête (acceptable au volume cible).

---

## Phase C.1 — Persistance injection risk en BD + panels dashboard

**Effort** : 30-45 min
**Bloque** : C.2 (les panels security dashboard agrègent injection_risk)

### C.1.1 — Mig 328 : extend `ai_call_metrics`

```sql
ALTER TABLE ai_call_metrics
    ADD COLUMN IF NOT EXISTS injection_risk text,
    ADD COLUMN IF NOT EXISTS injection_score int DEFAULT 0,
    ADD COLUMN IF NOT EXISTS injection_rules text[];

ALTER TABLE ai_call_metrics
    DROP CONSTRAINT IF EXISTS chk_aim_injection_risk;
ALTER TABLE ai_call_metrics
    ADD CONSTRAINT chk_aim_injection_risk
    CHECK (injection_risk IS NULL OR injection_risk IN ('none', 'low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_aim_high_risk
    ON ai_call_metrics ("timestamp" DESC, feature)
    WHERE injection_risk IN ('medium', 'high');
```

### C.1.2 — Update `ai_telemetry.py` `_persist_metric`

Ajouter `injection_risk`, `injection_score`, `injection_rules` au dict + INSERT statement. Toujours fire-and-forget.

### C.1.3 — 3 nouveaux panels dans `10_ai_observability.json`

Insérer une 6ème row "🛡️ Security" avec :
- **Panel 51** : *Stat* "High-risk attempts (24h)" avec thresholds (yellow > 1, red > 5)
- **Panel 52** : *Time series* "Injection attempts by risk level (per hour)" stacked area
- **Panel 53** : *Bar chart* "Top matched rules (7d)" top-10 patterns triggered

### C.1.4 — Alerte `facil-ai-injection-spike`

```sql
SELECT count(*) AS value
FROM ai_call_metrics
WHERE "timestamp" > now() - interval '1 hour'
  AND injection_risk = 'high'
```
Threshold > 5 in 1h, severity **critical**, runbook → ai-observability.html#injection-spike.

### Checklist C.1
- [ ] Mig 328 idempotent + apply script
- [ ] `_persist_metric` ajoute les 3 colonnes
- [ ] 3 panels dashboard JSON + push
- [ ] 1 alerte rule + push via existing apply_grafana_ai_alerts.py
- [ ] Tests : 1 prompt high-risk → row avec injection_risk='high' en BD
- [ ] Smoke `smoke_phase_b_full.py` étendu pour vérifier les 3 nouvelles colonnes

---

## Phase C.2 — Table `request_telemetry` + middleware capture

**Effort** : 1-1.5h

### C.2.1 — Mig 329 : nouvelle table + indexes + MV agrégat

```sql
CREATE TABLE request_telemetry (
    id              bigserial PRIMARY KEY,
    "timestamp"     timestamptz NOT NULL DEFAULT now(),
    trace_id        text,
    -- Identity
    user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    user_role       text,
    session_id      text,           -- frontend session token (truncated, hashed if PII)
    -- Request
    method          text NOT NULL,
    path            text NOT NULL,  -- truncated to 256 chars
    status_code     int,
    latency_ms      int,
    request_bytes   int DEFAULT 0,
    response_bytes  int DEFAULT 0,
    -- Network
    ip_address      inet,
    -- UA parsed (filled by middleware via user-agents lib)
    device_type     text,           -- mobile | desktop | tablet | bot | unknown
    browser_name    text,
    browser_version text,
    os_name         text,
    os_version      text,
    is_bot          boolean DEFAULT false,
    -- GeoIP (filled by middleware via geoip2 + GeoLite2)
    geo_country     text,           -- ISO alpha-2 (e.g. GQ, FR, ES)
    geo_country_name text,
    geo_city        text,
    geo_lat         numeric(8,5),
    geo_lon         numeric(8,5),
    geo_subdivision text,           -- region/state
    -- Raw bounded
    user_agent      text,           -- truncated 512 chars
    referer         text,           -- truncated 256 chars
    sampled_pct     numeric(5,2) DEFAULT 100.0,  -- if not 100, multiply count for accurate metrics
    -- Security flags
    is_suspicious   boolean DEFAULT false,
    suspicious_reasons text[],      -- ['failed_auth', 'rapid_fire', 'unknown_ua', ...]
    -- Audit
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_rt_method CHECK (method IN ('GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD')),
    CONSTRAINT chk_rt_status CHECK (status_code IS NULL OR (status_code >= 100 AND status_code < 600)),
    CONSTRAINT chk_rt_latency CHECK (latency_ms IS NULL OR latency_ms >= 0),
    CONSTRAINT chk_rt_device CHECK (device_type IS NULL OR device_type IN ('mobile','desktop','tablet','bot','unknown'))
);

-- Indexes (designed for security dashboard panels)
CREATE INDEX idx_rt_timestamp        ON request_telemetry ("timestamp" DESC);
CREATE INDEX idx_rt_ip_time          ON request_telemetry (ip_address, "timestamp" DESC);
CREATE INDEX idx_rt_user_time        ON request_telemetry (user_id, "timestamp" DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rt_status_errors    ON request_telemetry (status_code, "timestamp" DESC) WHERE status_code >= 400;
CREATE INDEX idx_rt_device_time      ON request_telemetry (device_type, "timestamp" DESC);
CREATE INDEX idx_rt_geo_time         ON request_telemetry (geo_country, "timestamp" DESC) WHERE geo_country IS NOT NULL;
CREATE INDEX idx_rt_suspicious       ON request_telemetry ("timestamp" DESC) WHERE is_suspicious = true;
CREATE INDEX idx_rt_trace            ON request_telemetry (trace_id) WHERE trace_id IS NOT NULL;

-- Hourly rollup MV (auto-refreshed by cron)
CREATE MATERIALIZED VIEW mv_request_telemetry_hourly AS
SELECT
    date_trunc('hour', "timestamp") AS hour,
    geo_country,
    device_type,
    user_role,
    method,
    -- Aggregates
    count(*)                                                 AS request_count,
    count(DISTINCT ip_address)                              AS unique_ips,
    count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users,
    sum((status_code >= 400)::int)                          AS error_count,
    sum((status_code >= 500)::int)                          AS server_error_count,
    sum(is_bot::int)                                        AS bot_count,
    sum(is_suspicious::int)                                 AS suspicious_count,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50_latency_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_latency_ms,
    sum(response_bytes)                                      AS total_response_bytes
FROM request_telemetry
WHERE "timestamp" > now() - interval '90 days'
GROUP BY 1,2,3,4,5;

CREATE UNIQUE INDEX idx_mv_rth_pk ON mv_request_telemetry_hourly (hour, geo_country, device_type, user_role, method);

GRANT SELECT ON request_telemetry, mv_request_telemetry_hourly TO looker_readonly;
```

### C.2.2 — Cron de rétention `cleanup_request_telemetry`

```python
# app/modules/system/services/request_telemetry_cleanup.py
async def cleanup_request_telemetry():
    async with conn:
        # Drop raw rows > 30 days (keep MV for trends)
        await conn.execute(
            "DELETE FROM request_telemetry WHERE \"timestamp\" < now() - interval '30 days'"
        )
        # Refresh MV
        await conn.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_request_telemetry_hourly")
```
Hooké dans `app/core/scheduler.py` (mémoire règle #23 : tout cron doit être dans scheduler), cadence 1× par 6h.

### C.2.3 — Middleware `RequestTelemetryMiddleware` (pure ASGI)

`app/core/request_telemetry_middleware.py` — capture :
- `method`, `path`, `status_code`, `latency_ms`, `request_bytes`, `response_bytes`
- `ip_address` (X-Forwarded-For first hop, fallback to `request.client.host`)
- `user_agent` (truncated 512)
- `referer` (truncated 256)
- `trace_id` (depuis OTEL span actif)
- `user_id`, `user_role` (depuis `request.state.user` si auth middleware déjà passé)

Sampling appliqué au moment de l'INSERT :
- Si status >= 400 → toujours INSERT
- Sinon → INSERT si IP|user_id pas vu dans dernière heure (Redis SET avec TTL 1h) OU random.random() < 0.1

Persist via `asyncio.create_task` (fire-forget, jamais bloquant — pattern ai_telemetry).

### C.2.4 — UA parsing + GeoIP enrichment (différé en C.3 + C.4)

C.2 stocke `user_agent` raw + `ip_address` raw. C.3 et C.4 enrichissent les colonnes parsées **dans le même middleware** (pour éviter UPDATE après-coup).

### Checklist C.2
- [ ] Mig 329 idempotent + apply script
- [ ] Cron retention enregistré dans scheduler (mémoire #23)
- [ ] Middleware ASGI minimal (sans UA parse / GeoIP encore — placeholders NULL)
- [ ] Wired dans `main.py` après `OtelUserAttributeMiddleware` (B.3)
- [ ] Tests unitaires : 5 cases (success/error/auth-required/anonymous/sampled-out)
- [ ] Smoke : 1 GET /healthz → 0 row (excluded), 1 GET /api/v1/users/me → 1 row

---

## Phase C.3 — User-Agent parsing

**Effort** : 30-45 min
**Dépend** : C.2 (middleware existe)

### C.3.1 — Dep + helper

`requirements.txt` += `user-agents>=2.2.0` (pure Python, no native deps).

```python
# app/core/user_agent_parser.py
from functools import lru_cache
from user_agents import parse as ua_parse

@lru_cache(maxsize=1024)
def parse_ua(ua_string: str) -> dict:
    """Cached parse. UA strings are extremely repetitive — LRU saves CPU."""
    if not ua_string:
        return {"device_type": "unknown", "is_bot": False, ...}
    parsed = ua_parse(ua_string)
    if parsed.is_bot:
        device_type = "bot"
    elif parsed.is_mobile:
        device_type = "mobile"
    elif parsed.is_tablet:
        device_type = "tablet"
    elif parsed.is_pc:
        device_type = "desktop"
    else:
        device_type = "unknown"
    return {
        "device_type": device_type,
        "is_bot": parsed.is_bot,
        "browser_name": parsed.browser.family,
        "browser_version": parsed.browser.version_string,
        "os_name": parsed.os.family,
        "os_version": parsed.os.version_string,
    }
```

### C.3.2 — Hook dans le middleware C.2

Le middleware appelle `parse_ua(request.headers.get('user-agent', ''))` et persiste les 5 champs.

### C.3.3 — Backfill rows existantes (optionnel)

Pas de backfill : C.2 vient de créer la table, elle est vide. Mais après quelques semaines, si on voulait rétro-fix, un script `backfill_ua.py` peut tourner via curseur SQL.

### Checklist C.3
- [ ] Lib `user-agents` ajoutée
- [ ] Module `user_agent_parser.py` + tests (10 cas : Chrome desktop, Firefox mobile, Safari iPad, Googlebot, curl, Edge, etc.)
- [ ] Middleware C.2 utilise `parse_ua` + persiste
- [ ] Cache LRU 1024 entries vérifié (test hit/miss)

---

## Phase C.4 — GeoIP enrichment via MaxMind GeoLite2

**Effort** : 1h
**Dépend** : C.2

### C.4.1 — Setup license + DB download

1. Signup gratuit sur https://www.maxmind.com/en/geolite2/signup
2. Récup `LICENSE_KEY` → stocker dans Secret Manager (`maxmind-license-key`)
3. Cron mensuel : `geoipupdate -f /etc/GeoIP.conf` OU script Python qui télécharge `GeoLite2-City.mmdb` (~80 MB)
4. Stocker dans `/tmp/GeoLite2-City.mmdb` au boot Cloud Run (read-only filesystem) ou mount via volume

**Alternative pragmatique pour l'environnement Cloud Run** : commit le `.mmdb` dans le repo (~80 MB git LFS) — pas idéal. Mieux : télécharger au boot via Secret Manager license + cache dans `/tmp`.

### C.4.2 — Dep + helper

`requirements.txt` += `geoip2>=4.7.0` (avec `maxminddb` natif).

```python
# app/core/geoip.py
import geoip2.database
from functools import lru_cache

_reader = None

def init_geoip(db_path: str):
    global _reader
    _reader = geoip2.database.Reader(db_path)

@lru_cache(maxsize=4096)
def lookup_ip(ip: str) -> dict:
    if not _reader or not ip:
        return {"geo_country": None, ...}
    try:
        r = _reader.city(ip)
        return {
            "geo_country": r.country.iso_code,
            "geo_country_name": r.country.name,
            "geo_city": r.city.name,
            "geo_lat": float(r.location.latitude) if r.location.latitude else None,
            "geo_lon": float(r.location.longitude) if r.location.longitude else None,
            "geo_subdivision": r.subdivisions.most_specific.name if r.subdivisions else None,
        }
    except (geoip2.errors.AddressNotFoundError, ValueError):
        return {"geo_country": None, ...}
```

### C.4.3 — Boot hook download

Dans `main.py` lifespan, télécharge la DB si absente :
```python
import urllib.request, os
DB_PATH = "/tmp/GeoLite2-City.mmdb"
if not os.path.exists(DB_PATH) and os.environ.get("MAXMIND_LICENSE_KEY"):
    url = f"https://download.maxmind.com/.../GeoLite2-City.tar.gz?license_key={key}"
    # download + untar + extract .mmdb to DB_PATH
init_geoip(DB_PATH)
```

### C.4.4 — Hook dans middleware C.2

Le middleware appelle `lookup_ip(client_ip)` → persiste les 6 colonnes geo.

### Checklist C.4
- [ ] License MaxMind créée + secret GCP `maxmind-license-key`
- [ ] Lib `geoip2` ajoutée
- [ ] Module `geoip.py` + tests (8 cas : IP française, IP GQ, IP US, IP cachée, IP invalide, IP locale, IPv6, etc.)
- [ ] Boot hook download (idempotent — skip si fichier existe + < 30j)
- [ ] Middleware C.2 utilise `lookup_ip` + persiste
- [ ] Privacy: documenté que la DB est offline + lib RGPD-compliant

---

## Phase C.5 — Dashboard `Security Monitoring` + 5 alertes

**Effort** : 1-1.5h
**Dépend** : C.2 (table populée), C.3 + C.4 (enrichissements UA + geo)

### C.5.1 — Mig 330 : register dashboard

Comme mig 326 pour AI Observability mais avec :
- `dashboard_id`: `security-monitoring`
- `provider`: `grafana`, `uid`: `facil-security-monitoring`
- `rls_mode`: `admin_only`
- `category`: `security`
- `display_order`: 90 (avant ai-observability=100)

### C.5.2 — Dashboard JSON `infra/grafana/dashboards/11_security_monitoring.json`

UID `facil-security-monitoring`. Variables :
- `time_range` (default 24h)
- `device_type` (multi-select : all / mobile / desktop / tablet / bot)
- `country` (multi-select)
- `user_role` (multi-select)
- `status_class` (2xx / 3xx / 4xx / 5xx)

**Panels** (4 row sections × ~12 data panels) :

**🌍 Geographic activity**
- *Geomap* : requests by country (color scale)
- *Stat* : unique countries (24h)
- *Bar* : top 10 countries by request count (24h)
- *Time series* : request rate per country (top 5)

**📱 Device & browser**
- *Pie* : device_type breakdown (mobile/desktop/tablet/bot)
- *Bar* : top 10 browser_name × os_name combos
- *Stat* : bot share % (24h)
- *Time series* : device_type rate over time

**🚦 IPs & users**
- *Table* : top 20 IPs by request count (24h) — drill-down to TraceQL by trace_id
- *Stat* : unique IPs (1h / 24h / 7d)
- *Time series* : new IPs per hour (anomaly indicator)
- *Table* : suspicious IPs (is_suspicious=true rows grouped) with reasons

**🔥 Errors & security**
- *Stat* : 4xx rate %, 5xx rate % (24h, color thresholds)
- *Bar* : top 10 paths returning 4xx
- *Table* : failed_auth events grouped by IP (action='login.failed' from audit_logs JOIN)
- *Time series* : injection_risk='high' AI calls per hour (from ai_call_metrics)

### C.5.3 — 5 alert rules (apply via existing script pattern)

`packages/backend/scripts/apply_grafana_security_alerts.py` (extended from `apply_grafana_ai_alerts.py`) :

1. **`facil-security-ip-spike`** — 1 IP > 1000 req / 5min → `critical` (DDoS / bot)
2. **`facil-security-failed-login-burst`** — > 10 failed logins / 5min from one IP → `critical` (brute force)
3. **`facil-security-injection-spike`** (depends C.1) — > 5 high-risk AI calls / hour → `critical`
4. **`facil-security-geo-anomaly`** — login from country never seen for that user — `warning` (advanced, needs `user_login_history` table — DEFERRED to Phase C.6 if scope allows)
5. **`facil-security-bot-share-high`** — bot_count / total > 50% sustained 30min → `warning` (auto-bot wave)

Si #4 trop complexe pour ce scope, deferred ; on livre 4 alertes au lieu de 5.

### C.5.4 — Doc admin `/admin/security` page (frontend)

OUT OF SCOPE C.5 — décision : pas de page admin dédiée pour cette phase. Le dashboard Grafana suffit (admin a accès direct). Si demande utilisateur ultérieure → Phase D.

### Checklist C.5
- [ ] Mig 330 register dashboard idempotent
- [ ] JSON dashboard 11_security_monitoring.json (12+ panels)
- [ ] Push via `push_grafana_dashboards.py` ou curl direct
- [ ] 4 alertes appliquées via apply_grafana_security_alerts.py
- [ ] Variables fonctionnelles (multi-select all)
- [ ] Smoke : provoque 1 echec login + 5 requêtes → vérifier panels populent

---

## Phase C.6 — Documentation enrichissement

**Effort** : 1h
**Dépend** : C.1-C.5 done

### C.6.1 — Page HTML `docs/documentation/security-observability.html`

Structure 9 sections (~300 lignes) :
1. Why & gap analysis (questions utilisateur 2026-05-05)
2. Stack architecture (table BD + middleware + GeoLite2 + UA parser)
3. BD schema mig 328 (injection columns) + mig 329 (request_telemetry) + MV
4. Middleware capture flow (sampling decision tree)
5. UA parsing & device classification
6. GeoIP enrichment & RGPD compliance
7. Dashboard panels overview (12 panels × 4 sections)
8. Alerts & runbooks (5 rules)
9. Privacy & retention (30j raw, ∞ MV agrégat, no PII)

### C.6.2 — i18n × 3 langues

~50 nouvelles clés `secobs.*` × 3 = 150 entries dans `i18n/messages/{en,fr,es}.js`.

### C.6.3 — Sidebar propagation 14 pages

Ajout du lien "🛡 Security Monitoring" dans la section Observability de toutes les pages HTML (sed mécanique comme pour ai-observability).

### C.6.4 — Wiki page `taxasge.wiki/Security-Observability.md`

Style operational-runbook (comme AI-Observability.md) :
- Quick reference (panels + alertes + variables)
- 5 runbooks (1 par alerte)
- Reuse instructions (4 fichiers à copier)
- Sampling policy + retention
- RGPD considerations

### C.6.5 — Update `MEMORY.md`

- Nouvelle entrée session 2026-05-05 PM Phase C
- Règle #41 : "Sampling adaptatif Postgres" (errors 100% + new IPs/users 100% + 10% baseline)
- Règle #42 : "GeoIP via MaxMind offline boot-cached" pattern
- Règle #43 : "Pure ASGI middleware pour télémétrie HTTP" (pas BaseHTTPMiddleware)

### Checklist C.6
- [ ] HTML page créée (3 langs via i18n)
- [ ] Sidebar propagé sur les 14 pages existantes (test grep `security-observability.html`)
- [ ] Wiki page committée localement (master branch wiki repo)
- [ ] MEMORY.md updated avec nouvelle entrée session + 3 règles
- [ ] index.html docs map référence la nouvelle page

---

## Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| BD `request_telemetry` saturée à 1M users (3B rows/mois) | Backups lents, query timeouts | Sampling adaptatif §1.D + DELETE 30j cron + MV agrégat conservé long-terme |
| MaxMind license key fuit | Attaquant peut télécharger gratis (low value) | Secret Manager + rotation 12 mois |
| MaxMind API down → boot fail | Backend down si on bloque | Boot soft : si DB absente après timeout, init_geoip skip, lookup retourne tous NULL |
| user-agents lib parse latency en pic trafic | p95 +50ms | LRU 1024 + benchmark : 30µs/parse (négligeable) |
| Pure ASGI middleware buggué → 500 partout | Catastrophique | Try/except total avec fallback "next(scope)" + tests E2E avant deploy |
| Dashboard variable `country` 200+ valeurs | UI lente | Limit `WHERE timestamp > now() - 24h` dans la query variable |
| Privacy: IP stockage = data sensible RGPD | Risque légal | (a) base légale "intérêt légitime sécurité", (b) rétention 30j max, (c) hash IP option si demande utilisateur |

---

## Effort estimé

| Phase | Tâche | Heures |
|---|---|---|
| C.1 | Mig 328 + persist + 3 panels + 1 alerte | 0.5-0.75 |
| C.2 | Mig 329 + middleware ASGI + cron retention | 1-1.5 |
| C.3 | UA parser lib + helper + tests | 0.5-0.75 |
| C.4 | GeoIP MaxMind + boot download + helper | 1 |
| C.5 | Dashboard JSON 12 panels + 4 alertes | 1-1.5 |
| C.6 | Doc HTML + i18n + sidebar + wiki + MEMORY | 1 |
| **Total** | | **5-6.5h (~1 journée)** |

---

## Validation finale (avant push global)

- [ ] 4 migrations appliquées live BD : 328, 329, 330 (+ register dashboard) — idempotentes
- [ ] `pytest tests/core/` PASS sur les nouveaux modules (UA parser, GeoIP)
- [ ] `python scripts/smoke_phase_b_full.py` étendu : 8 → 12 checks (incluant request_telemetry rows + dashboard register)
- [ ] Dashboard `facil-security-monitoring` push à Grafana (status: success)
- [ ] 4 alertes apply_grafana_security_alerts.py PASS
- [ ] Smoke E2E : génère 5 requests (mix success/error/bot UA) → vérifier rows BD + panels populent
- [ ] HTML doc 3 langues parse OK (en/fr/es)
- [ ] Wiki page committée localement
- [ ] MEMORY.md mis à jour
- [ ] **AUCUN PUSH** sans accord utilisateur explicite (Règle #13 réaffirmée)

---

## Out of scope (Phase D ou ultérieur)

- **Page admin frontend `/admin/security`** : décision = laisser le dashboard Grafana suffire
- **Anomaly detection ML** (login depuis pays inhabituel) : nécessite `user_login_history` + clustering — Phase D
- **WAF intégration** (Cloudflare Pro / GCP Cloud Armor) : décisions infra, séparé
- **CAPTCHA on suspicious patterns** : feature flow utilisateur, séparé
- **Mobile telemetry** : couvert par LogRocket déjà, pas d'overlap
- **2FA enforcement adaptatif** (force 2FA si login depuis IP nouvelle) : Phase E sécurité avancée

---

**Plan validé. Validation utilisateur requise avant Phase C.1.**
