# Security Observability Agent

> **Rôle** : agent réutilisable qui guide un LLM (Claude / autre) pour livrer
> une **observabilité sécurité production-grade du trafic HTTP** (IP / device / geo
> + persistance prompt injection) sur n'importe quel projet, à partir de zéro,
> en évitant les 7 pièges classiques découverts pendant le déploiement Facil
> Phase C (2026-05-05).
>
> **Invocation** : `/security-observability` (slash-command projet) — voir
> `.claude/commands/security-observability.md`. Sinon prompt direct : « Lance
> l'agent Security Observability selon `infra/observability/SECURITY_OBSERVABILITY_AGENT.md` ».
>
> **Sortie attendue** : 1 table BD `request_telemetry` + MV rollup, 1 ASGI
> middleware, 1 UA parser, 1 GeoIP wrapper, 1 dashboard Grafana 20+ panels,
> 3+ alertes (IP spike / failed login / bot share), doc HTML 3 langues, mémoire.

---

## 0. Mission de l'agent

Quand l'utilisateur dit « instrumente notre trafic HTTP pour la sécurité »,
**fais ces phases dans l'ordre, sans en sauter aucune** :

| Phase | But | Sortie |
|---|---|---|
| 0 | Prérequis utilisateur (Grafana, MaxMind license, BD) | `.env` rempli |
| 1 | Audit sources existantes (audit_logs, Sentry, OTEL spans Tempo) | Décision : table dédiée nécessaire |
| 2 | Schéma BD `request_telemetry` + MV rollup hourly | Migration appliquée |
| 3 | Pure ASGI middleware + sampling adaptatif | Middleware mounted |
| 4 | UA parser (`user-agents` lib) avec LRU cache | Module + tests |
| 5 | GeoIP MaxMind GeoLite2 offline | Module + boot init + cron mensuel |
| 6 | Dashboard Grafana 20+ panels + alertes | Dashboard live + 3 alertes pushées |
| 7 | (Optionnel) Persistance prompt injection (si AI obs présent) | Colonnes + panels |
| 8 | Doc HTML + i18n + commits | Doc 9 sections × 3 langues |

**Règle d'or** : à chaque phase, **valider explicitement** auprès de l'utilisateur
avant de passer à la suivante.

---

## 1. Phase 0 — Prérequis utilisateur

### 0.1 Grafana Cloud + datasource Postgres

Réutiliser le setup de l'agent Grafana Dashboards (`/grafana-dashboards`).
Phase 0+1 du document `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` est **prérequis**.

### 0.2 MaxMind GeoLite2 license

```
URL : https://www.maxmind.com/en/geolite2/signup (gratuit avec email valide)

1. Crée compte
2. Account → My License Key → Generate new license key
3. Description : "<project> GeoIP"
4. ⚠️ Vérifie que la case "Will this key be used for GeoIP Update?" est cochée
5. Copie la clé (format alphanumérique 16 chars)
```

⚠️ **Piège #1** — La clé n'est pas un secret HIGH-VALUE (pas un token Bearer),
mais elle reste à mettre en `.env` gitignored car elle est rate-limited et
liée à ton compte (DMCA si abusée).

### 0.3 Fichier `.env` (gitignored)

```bash
# MaxMind GeoLite2
MAXMIND_LICENSE_KEY=xxxxxxxxxxxxxxxx
GEOIP_DATABASE_PATH=/tmp/GeoLite2-City.mmdb

# Sampling (overrides — défauts dans le code)
REQUEST_TELEMETRY_SAMPLE_SUCCESS_PCT=10
REQUEST_TELEMETRY_SAMPLE_BOT_PCT=1
REQUEST_TELEMETRY_NEW_IP_TTL_SECONDS=3600
REQUEST_TELEMETRY_NEW_IP_LRU_CAP=10000
```

### 0.4 BD accessible

Comme `/ai-observability` Phase 0.4. DATABASE_URL OU MCP Postgres OU dump schema.

### Gate Phase 0 → 1
- ✅ Grafana Cloud + datasource ok
- ✅ MaxMind license key dans `.env` testée (`curl` du download URL retourne 200)
- ✅ BD accessible

---

## 2. Phase 1 — Audit sources existantes

⚠️ **Piège #2 — Ne PAS dupliquer audit_logs**

Pendant Facil, l'agent a vérifié que `audit_logs` couvrait UNIQUEMENT les state
changes (auth + RBAC + dashboard config). Pour TOUS les endpoints, il faut une
table dédiée. **L'agent doit faire ce même audit** sur le nouveau projet.

### Sources à auditer (tableau obligatoire)

| Source | Données dispos | Couverture | Volumétrie | Problème |
|---|---|---|---|---|
| `audit_logs` (BD) | `user_id`, `action`, `ip_address`, `user_agent`, `created_at` | State changes ONLY | Faible | Pas tous endpoints |
| OTEL Tempo (si Phase B AI obs déployée) | `http.client_ip`, `http.user_agent`, `http.method`, `http.route`, `http.status_code` | Tous endpoints | Free tier 14j | Pas SQL queryable |
| Sentry events | IP + UA + browser + OS | Erreurs only | Variable | Pas d'observabilité routine |
| LogRocket sessions (si présent) | Session client full | Web + mobile | Free 1K/mois | UI only, pas Grafana |

**Décision** : si aucune source ne couvre **tous endpoints + queryable SQL +
retention 30j+** → table dédiée `request_telemetry` justifiée.

### Gate Phase 1 → 2
- ✅ Tableau audit complet
- ✅ Décision `request_telemetry` table validée par utilisateur

---

## 3. Phase 2 — Schéma BD `request_telemetry`

### Table principale

```sql
CREATE TABLE IF NOT EXISTS request_telemetry (
    id              bigserial PRIMARY KEY,
    timestamp       timestamptz NOT NULL DEFAULT now(),
    -- Request meta
    trace_id        text,                     -- correlate avec OTEL Tempo
    method          text NOT NULL,            -- GET / POST / PUT / DELETE / PATCH
    path            text NOT NULL,            -- /api/v1/users
    route_template  text,                     -- /api/v1/users/{id}
    status_code     integer NOT NULL,
    latency_ms      integer NOT NULL,
    -- Client
    ip_address      inet,
    user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    user_role       text,
    session_id      text,
    -- User-Agent (parsé)
    user_agent_raw  text,
    device_type     text,                     -- 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown'
    is_bot          boolean DEFAULT false,
    browser_name    text,
    browser_version text,
    os_name         text,
    os_version      text,
    -- Geo (MaxMind)
    country         text,                     -- ISO 3166-1 alpha-2
    country_name    text,
    city            text,
    latitude        numeric(8,5),
    longitude       numeric(8,5),
    -- Sampling
    sampled_pct     integer NOT NULL,          -- 1, 10, 100 — pour reconstituer le total
    -- Sécurité
    is_authenticated  boolean DEFAULT false,
    is_admin_path    boolean DEFAULT false,
    -- Constraints
    CHECK (method IN ('GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS')),
    CHECK (device_type IN ('desktop','mobile','tablet','bot','unknown')),
    CHECK (sampled_pct IN (1, 10, 100)),
    CHECK (status_code BETWEEN 100 AND 599),
    CHECK (latency_ms >= 0),
    CHECK (country IS NULL OR length(country) = 2)
);

-- Indexes
CREATE INDEX idx_rt_timestamp ON request_telemetry(timestamp DESC);
CREATE INDEX idx_rt_status_ts ON request_telemetry(status_code, timestamp DESC) WHERE status_code >= 400;
CREATE INDEX idx_rt_ip_ts ON request_telemetry(ip_address, timestamp DESC);
CREATE INDEX idx_rt_user_ts ON request_telemetry(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rt_country ON request_telemetry(country) WHERE country IS NOT NULL;
CREATE INDEX idx_rt_bot ON request_telemetry(is_bot, timestamp DESC) WHERE is_bot = true;
CREATE INDEX idx_rt_admin ON request_telemetry(timestamp DESC) WHERE is_admin_path = true;
CREATE INDEX idx_rt_route_ts ON request_telemetry(route_template, timestamp DESC) WHERE route_template IS NOT NULL;
CREATE INDEX idx_rt_trace ON request_telemetry(trace_id) WHERE trace_id IS NOT NULL;

GRANT SELECT ON request_telemetry TO <bi_role>;
```

### MV rollup hourly (sample-corrected)

⚠️ **Piège #3 — Sample correction obligatoire**

Si tu sample 10% des success, les counts dashboards seront 10× sous-estimés.
Toujours **multiplier par `100 / sampled_pct`** dans la MV.

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_request_telemetry_hourly AS
SELECT
    date_trunc('hour', timestamp) AS hour,
    country, device_type, user_role,
    is_authenticated, is_bot,
    -- Sample-corrected counts
    SUM(CASE WHEN sampled_pct = 100 THEN 1 ELSE 100.0 / sampled_pct END)::bigint AS estimated_requests,
    SUM(CASE WHEN status_code >= 400 THEN (CASE WHEN sampled_pct = 100 THEN 1 ELSE 100.0 / sampled_pct END) ELSE 0 END)::bigint AS estimated_errors,
    -- Latency stats (over sample only — accurate)
    AVG(latency_ms) AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
    -- Distinct counts (sampled — under-estimated, document caveat)
    COUNT(DISTINCT ip_address) AS distinct_ips_sampled,
    COUNT(DISTINCT user_id) AS distinct_users_sampled
FROM request_telemetry
WHERE timestamp >= now() - interval '90 days'
GROUP BY 1, 2, 3, 4, 5, 6
WITH DATA;

CREATE UNIQUE INDEX idx_mv_rt_hourly_pk ON mv_request_telemetry_hourly(hour, country, device_type, user_role, is_authenticated, is_bot);

GRANT SELECT ON mv_request_telemetry_hourly TO <bi_role>;
```

### Cron `request-telemetry-cleanup`

```sql
DELETE FROM request_telemetry WHERE timestamp < now() - interval '30 days';
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_request_telemetry_hourly;
```

⚠️ **Piège #4 — Cron registration obligatoire**

L'endpoint `/cron/request-telemetry-cleanup` DOIT être enregistré dans le
scheduler du projet (APScheduler / Cloud Scheduler / k8s CronJob). Sinon il
ne tourne JAMAIS, raw rows s'accumulent à l'infini.

Check final : `grep -E "request-telemetry-cleanup" app/core/scheduler.py`.

### Gate Phase 2 → 3
- ✅ Migration appliquée
- ✅ Grants `<bi_role>` testés (`SELECT count(*) FROM request_telemetry` retourne 0)
- ✅ Cron job DÉCLARÉ dans le scheduler

---

## 4. Phase 3 — Pure ASGI middleware + sampling

### Pourquoi pure ASGI vs `BaseHTTPMiddleware`

⚠️ **Piège #5 — `BaseHTTPMiddleware` consomme le request body**

Pour la télémétrie on n'a besoin que du metadata (path, method, status, IP, UA).
`BaseHTTPMiddleware` lit le body → bloque les autres handlers downstream.

Pure ASGI middleware = ~200ns overhead, body intact.

### Implémentation

```python
# app/core/request_telemetry_middleware.py
import asyncio, time, weakref
from starlette.types import ASGIApp, Receive, Scope, Send

class RequestTelemetryMiddleware:
    EXCLUDED_PATHS = {"/healthz", "/static/", "/metrics", "/favicon.ico", "/docs", "/redoc", "/openapi.json"}
    
    def __init__(self, app: ASGIApp):
        self.app = app
        self._pending = weakref.WeakSet()
        self._new_ip_user_seen = {}  # LRU TTL 1h
        self._lru_cap = int(os.environ.get("REQUEST_TELEMETRY_NEW_IP_LRU_CAP", "10000"))
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        path = scope["path"]
        if any(path.startswith(p) for p in self.EXCLUDED_PATHS):
            await self.app(scope, receive, send)
            return
        
        # Capture metadata
        started = time.monotonic()
        method = scope["method"]
        ip = self._extract_client_ip(scope)
        user_agent = self._extract_header(scope, "user-agent")
        
        status_code = 500
        async def wrapped_send(msg):
            nonlocal status_code
            if msg["type"] == "http.response.start":
                status_code = msg["status"]
            await send(msg)
        
        try:
            await self.app(scope, receive, wrapped_send)
        finally:
            latency_ms = int((time.monotonic() - started) * 1000)
            sampled_pct = self._sampling_decision(ip, scope, status_code, user_agent)
            if sampled_pct > 0:
                task = asyncio.create_task(self._persist(
                    method=method, path=path, status_code=status_code,
                    latency_ms=latency_ms, ip=ip, user_agent=user_agent,
                    sampled_pct=sampled_pct, scope=scope,
                ))
                self._pending.add(task)
    
    def _sampling_decision(self, ip, scope, status_code, user_agent):
        if status_code >= 400:
            return 100  # all errors
        if self._is_new_ip_or_user(ip, scope.get("user", {}).get("id")):
            return 100  # all new actors
        if self._is_bot(user_agent):
            return int(os.environ.get("REQUEST_TELEMETRY_SAMPLE_BOT_PCT", "1"))
        return int(os.environ.get("REQUEST_TELEMETRY_SAMPLE_SUCCESS_PCT", "10"))
    
    def _is_new_ip_or_user(self, ip, user_id):
        ttl = int(os.environ.get("REQUEST_TELEMETRY_NEW_IP_TTL_SECONDS", "3600"))
        now = time.time()
        # Evict expired + cap
        if len(self._new_ip_user_seen) > self._lru_cap:
            self._new_ip_user_seen = {k: v for k, v in self._new_ip_user_seen.items() if now - v < ttl}
        key = (ip, user_id)
        if key not in self._new_ip_user_seen:
            self._new_ip_user_seen[key] = now
            return True
        return False
    
    # ... _extract_client_ip, _extract_header, _is_bot, _persist
```

### Wire dans `app/main.py`

```python
from app.core.request_telemetry_middleware import RequestTelemetryMiddleware

app = FastAPI(...)
app.add_middleware(RequestTelemetryMiddleware)
```

### Shutdown handler

```python
async def flush_pending_persists(timeout=5.0):
    tasks = list(middleware._pending)
    if tasks:
        await asyncio.wait(tasks, timeout=timeout)
```

### Gate Phase 3 → 4
- ✅ Middleware mounted
- ✅ Smoke test : 1 GET / → 1 row dans `request_telemetry` après ~1s
- ✅ Excluded paths bypass confirmé : 100 GET /healthz → 0 rows

---

## 5. Phase 4 — UA parser

### Lib + cache

```python
# app/core/user_agent_parser.py
from functools import lru_cache
from typing import TypedDict

try:
    from user_agents import parse as ua_parse
    _HAS_UA = True
except ImportError:
    _HAS_UA = False

class UAInfo(TypedDict):
    device_type: str
    is_bot: bool
    browser_name: str
    browser_version: str
    os_name: str
    os_version: str

@lru_cache(maxsize=4096)
def parse_user_agent(ua_string: str) -> UAInfo:
    if not _HAS_UA or not ua_string:
        return {"device_type": "unknown", "is_bot": False, "browser_name": "", "browser_version": "", "os_name": "", "os_version": ""}
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
        "browser_name": parsed.browser.family or "",
        "browser_version": parsed.browser.version_string or "",
        "os_name": parsed.os.family or "",
        "os_version": parsed.os.version_string or "",
    }
```

### Tests unitaires (CRITIQUE)

```python
def test_parse_chrome_desktop():
    info = parse_user_agent("Mozilla/5.0 ... Chrome/120.0.0.0 Safari/537.36")
    assert info["device_type"] == "desktop"
    assert info["browser_name"] == "Chrome"

def test_parse_googlebot():
    info = parse_user_agent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
    assert info["is_bot"] is True
    assert info["device_type"] == "bot"

def test_parse_iphone():
    info = parse_user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...")
    assert info["device_type"] == "mobile"
    assert info["os_name"] == "iOS"
```

### Gate Phase 4 → 5
- ✅ `pip install user-agents`
- ✅ Tests passent (3 minimum : desktop / mobile / bot)
- ✅ Cache hit ratio > 80% sur smoke test 100 requêtes répétées

---

## 6. Phase 5 — GeoIP MaxMind GeoLite2 offline

### Pourquoi offline (pas ip-api.com / Cloudflare header)

| Option | Rate-limit | Latence | RGPD | Pour 1M users |
|---|---|---|---|---|
| MaxMind GeoLite2 offline | None | ~10µs | ✅ data stays | ✅ |
| ip-api.com | 45 req/min | ~50ms | ⚠️ data leaves | ❌ |
| Cloudflare `CF-IPCountry` header | None | 0 (header) | ✅ | ✅ si CF présent |

**Choix** : MaxMind si Cloudflare absent, sinon `CF-IPCountry` (gratuit + 0 latence).

### Module `geoip.py`

```python
# app/core/geoip.py
import os, ipaddress
from functools import lru_cache
from typing import TypedDict, Optional

try:
    import geoip2.database
    import geoip2.errors
    _HAS_GEOIP = True
except ImportError:
    _HAS_GEOIP = False

_reader: Optional["geoip2.database.Reader"] = None

class GeoInfo(TypedDict):
    country: Optional[str]      # ISO 3166-1 alpha-2
    country_name: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]

EMPTY = {"country": None, "country_name": None, "city": None, "latitude": None, "longitude": None}

def init_geoip(db_path: str = None):
    global _reader
    db_path = db_path or os.environ.get("GEOIP_DATABASE_PATH", "/tmp/GeoLite2-City.mmdb")
    if not _HAS_GEOIP or not os.path.exists(db_path):
        _reader = None
        return
    _reader = geoip2.database.Reader(db_path)

@lru_cache(maxsize=4096)
def lookup_ip(ip_str: str) -> GeoInfo:
    if not ip_str or _reader is None:
        return EMPTY
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast:
            return EMPTY
    except ValueError:
        return EMPTY
    try:
        resp = _reader.city(ip_str)
        return {
            "country": resp.country.iso_code,
            "country_name": resp.country.name,
            "city": resp.city.name,
            "latitude": float(resp.location.latitude) if resp.location.latitude else None,
            "longitude": float(resp.location.longitude) if resp.location.longitude else None,
        }
    except (geoip2.errors.AddressNotFoundError, ValueError):
        return EMPTY
```

### Boot init dans `main.py`

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ... OTEL bootstrap ...
    init_geoip()  # reads GEOIP_DATABASE_PATH from env
    yield
    if _reader:
        _reader.close()
```

### Cron mensuel `download_geolite.py`

⚠️ **Piège #6** — La DB MaxMind est mise à jour ~mensuel. Sans refresh, les
IP cloud récentes (ex: nouveaux ranges AWS) ne seront pas géolocalisées.

```python
# scripts/download_geolite.py
import os, urllib.request, tarfile, shutil
LICENSE_KEY = os.environ["MAXMIND_LICENSE_KEY"]
URL = f"https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key={LICENSE_KEY}&suffix=tar.gz"
TARGET = os.environ.get("GEOIP_DATABASE_PATH", "/tmp/GeoLite2-City.mmdb")

def download():
    with urllib.request.urlopen(URL) as resp:
        with tarfile.open(fileobj=resp, mode="r:gz") as tar:
            for m in tar:
                if m.name.endswith(".mmdb"):
                    f = tar.extractfile(m)
                    with open(TARGET, "wb") as out:
                        shutil.copyfileobj(f, out)
                    return TARGET
    raise RuntimeError("No .mmdb in archive")

if __name__ == "__main__":
    print(f"Downloaded to {download()}")
```

Cron : 1× par mois, exécute le script puis redéploie / signal le service de
recharger via SIGHUP ou redémarrer.

### Gate Phase 5 → 6
- ✅ `.mmdb` présent (`ls -lh /tmp/GeoLite2-City.mmdb` retourne ~70MB)
- ✅ `lookup_ip("8.8.8.8")` retourne `country='US'`
- ✅ `lookup_ip("127.0.0.1")` retourne EMPTY (private IP shortcircuit)
- ✅ Cron `download_geolite` enregistré (1× par mois)

---

## 7. Phase 6 — Dashboard + alertes

### Dashboard `<project>-security-monitoring` — minimum 20 panels

**Row 1 — Overview**
- Stat : Total requests / 24h (sample-corrected)
- Stat : Error rate / 24h (%)
- Stat : Bot share / 24h (%)
- Stat : Distinct IPs / 24h (sampled)
- Stat : Distinct users / 24h (sampled)

**Row 2 — Geographic**
- Worldmap : Requests by country
- Bar gauge : Top 10 countries by requests
- Time series : Requests per country trend (7d)

**Row 3 — Device & browser**
- Pie : Device type breakdown
- Bar gauge : Top browser × OS combinations
- Time series : Mobile vs Desktop trend

**Row 4 — IPs & users**
- Table : Top 20 IPs by request count (last 24h)
- Table : Top 20 users by request count (last 24h)
- Time series : Request rate by user_role (7d)

**Row 5 — Errors & security**
- Table : Top 10 4xx paths
- Table : Top 10 5xx paths
- Time series : Failed logins by IP (15min granularity)
- Heat map : Error rate × hour-of-day

### 3 alertes obligatoires

1. **IP request spike** : `count(*) GROUP BY ip_address HAVING count > 1000 over 5min` → severity critical
2. **Failed login burst** : `count(WHERE path = '/api/v1/auth/login' AND status_code = 401) GROUP BY ip HAVING count > 10 over 5min` → severity critical
3. **Bot share** : `count(WHERE is_bot=true) / count(*) > 50%` over 30min → severity warning

⚠️ **Piège #7** — Comme l'agent AI obs : `relativeTimeRange.from > 0`.

### Variables dashboard

`country`, `device_type`, `user_role`, `is_authenticated`, time range.

### Gate Phase 6 → 7 (ou 8 si pas de Phase 7)
- ✅ Dashboard live
- ✅ Alertes pushées
- ✅ Test fire d'au moins 1 alerte

---

## 8. Phase 7 — Persistance prompt injection (optionnel — si AI obs présent)

Si le projet a déjà déployé `/ai-observability` (table `ai_call_metrics`),
ajouter 3 colonnes pour persister les détections injection :

```sql
ALTER TABLE ai_call_metrics
    ADD COLUMN IF NOT EXISTS injection_risk text CHECK (injection_risk IN ('none','low','medium','high')),
    ADD COLUMN IF NOT EXISTS injection_score integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS injection_rules text[];

CREATE INDEX IF NOT EXISTS idx_aim_high_risk ON ai_call_metrics(timestamp DESC) WHERE injection_risk = 'high';
```

Module `ai_security.py` (regex-based, EN/FR/ES) — voir `app/core/ai_security.py` Facil pour pattern complet.

⚠️ **Piège #7** — Quand tu écris des regex multi-langues (EN/FR/ES), pondère
chaque langue **identiquement**. Pendant Facil les patterns ES/FR scoraient 55
alors que les EN équivalents scoraient 60 → certains tests `_high` faillaient.
Bumped 55 → 60.

3 panels supplémentaires sur le dashboard AI obs :
- Stat : High-risk attempts / 24h
- Time series : Injection trend by risk level
- Bar chart : Top matched rules (7d)

1 alerte : `count(WHERE injection_risk='high') > 5 over 1h` → severity critical.

### Optionnel — auto-block

Env var `AI_SECURITY_BLOCK_HIGH_RISK=true` (false par défaut) pour refuser les
prompts high-risk avant d'appeler le modèle. **Activer après 7j baseline** pour
mesurer le false positive rate.

---

## 9. Phase 8 — Doc + i18n + commits

### Documents à produire

1. **HTML doc** dans `docs/documentation/security-observability.html` (9 sections)
   - §1 Why (gap audit_logs / Sentry / OTEL)
   - §2 Architecture (table dédiée + ASGI middleware + sampling)
   - §3 Schéma BD
   - §4 Middleware
   - §5 UA parser
   - §6 GeoIP
   - §7 Dashboard description
   - §8 Alertes + runbook on-call
   - §9 Reuse instructions (5 fichiers)

2. **i18n × 3 langues** dans `docs/documentation/i18n/messages/{en,fr,es}.js`

3. **Wiki page** `Security-Observability.md`
   - Quick reference
   - Sampling table
   - Runbook 4 scénarios (IP spike / failed login / bot share / injection spike)
   - Reuse instructions

4. **Mémoire projet** `memory/project_security_observability_<date>.md`

### Commits sémantiques

| Phase | Commit message |
|---|---|
| 2 | `feat(security-observability): mig N — request_telemetry + MV rollup (Phase C.1)` |
| 3 | `feat(security-observability): pure ASGI middleware + adaptive sampling (Phase C.2)` |
| 4 | `feat(security-observability): User-Agent parser with LRU cache (Phase C.3)` |
| 5 | `feat(security-observability): GeoIP enrichment via MaxMind GeoLite2 (Phase C.4)` |
| 6 | `feat(security-observability): Security Monitoring dashboard + 3 alerts (Phase C.5)` |
| 8 | `docs(security-observability): full HTML doc + sidebar propagation + i18n (Phase C.6)` |

### Gate Phase 8 → fin
- ✅ Doc HTML 3 langues testée
- ✅ Wiki page committée
- ✅ Mémoire projet sauvegardée
- ✅ Demande explicite : « OK pour `git push origin <branch>` ? »

---

## 10. Pièges classiques (récapitulatif)

| # | Piège | Symptôme | Garde-fou |
|---|---|---|---|
| 1 | License MaxMind hardcodée | Leak DMCA | Phase 0.2 — `.env` gitignored |
| 2 | Duplication audit_logs | Sémantique brouillée + 10× volume | Phase 1 — audit obligatoire avant table dédiée |
| 3 | MV sans sample correction | Counts dashboard 10× sous-estimés | Phase 2 — multiplier par `100/sampled_pct` |
| 4 | Cron jamais enregistré dans scheduler | Raw rows accumulent à l'infini | Phase 2 — vérif `grep` post-impl |
| 5 | `BaseHTTPMiddleware` consomme body | Handlers downstream cassent | Phase 3 — pure ASGI uniquement |
| 6 | `.mmdb` jamais refresh | Géo data stale | Phase 5 — cron mensuel obligatoire |
| 7 | Regex injection FR/ES sous-pondérés | False low-medium au lieu de high | Phase 7 — bumper poids 55 → 60 |

---

## 11. Reuse instructions (depuis Facil 2026-05-05)

5+1 fichiers à copier :

| Fichier source (Facil) | Destination |
|---|---|
| `packages/backend/database/migrations/329_request_telemetry.sql` | `database/migrations/N_request_telemetry.sql` |
| `packages/backend/app/core/request_telemetry_middleware.py` | `app/core/request_telemetry_middleware.py` |
| `packages/backend/app/core/user_agent_parser.py` | `app/core/user_agent_parser.py` |
| `packages/backend/app/core/geoip.py` | `app/core/geoip.py` |
| `infra/grafana/dashboards/11_security_monitoring.json` | `infra/grafana/dashboards/N_security_monitoring.json` |
| (Optionnel — si AI obs présent) `packages/backend/database/migrations/328_ai_call_metrics_injection.sql` | `database/migrations/N+1_ai_call_metrics_injection.sql` |

Après copie :
1. `pip install user-agents geoip2`
2. Apply migration `request_telemetry`
3. Wire `RequestTelemetryMiddleware` dans `app.add_middleware(...)`
4. Boot hook `init_geoip()`
5. Register cron `request-telemetry-cleanup` dans scheduler
6. Cron mensuel `download_geolite` + provisioning license
7. Push dashboard via Grafana API
8. Run apply script alertes

---

**Validation Facil** : 6 sub-phases C.1-C.6 livrées en une session, 20 panels,
3 alertes, doc 3 langues. Voir `.claude/plans/SESSION_BILAN_2026_05_05.md`.
