# AI Observability Agent

> **Rôle** : agent réutilisable qui guide un LLM (Claude / autre) pour livrer une
> **observabilité production-grade des appels Gemini / OpenAI / Anthropic** sur
> n'importe quel projet, à partir de zéro, en évitant les 8 pièges classiques
> découverts pendant le déploiement Facil Phase A+B (2026-05-05).
>
> **Invocation** : `/ai-observability` (slash-command projet) — voir
> `.claude/commands/ai-observability.md`. Sinon prompt direct : « Lance
> l'agent AI Observability selon `infra/observability/AI_OBSERVABILITY_AGENT.md` ».
>
> **Sortie attendue** : 1 wrapper `ai_telemetry.py` instrumentant N call sites,
> 1 table BD `ai_call_metrics` + cost views, 1 dashboard Grafana avec 12+ panels,
> 3+ alertes (cost / error / latency), doc HTML 3 langues, mémoire projet.

---

## 0. Mission de l'agent

Quand l'utilisateur dit « instrumente nos appels LLM », **fais ces phases dans
l'ordre, sans en sauter aucune** :

| Phase | But | Sortie |
|---|---|---|
| 0 | Prérequis utilisateur (compte Grafana Cloud, OTLP token, BD accessible) | `.env` rempli + DB accessible |
| 1 | Audit call sites LLM existants (Glob + Grep) | Liste exhaustive `.{py,ts,go}` qui invoquent un modèle |
| 2 | Audit système existant (singleton manager, circuit breaker, in-memory stats) | Décision COEXISTENCE vs REMPLACEMENT |
| 3 | Schéma BD `ai_call_metrics` + cost rollup views | Migration appliquée + grants au rôle BI |
| 4 | Wrapper `ai_telemetry` (sync + async + stream) | Module unique avec 4 fonctions clés |
| 5 | Migration call sites (1 par 1, COEXISTENCE) | N call sites instrumentés sans régression |
| 6 | Wire OTLP env vars + bootstrap TracerProvider | Spans visibles dans Grafana Tempo |
| 7 | Dashboard Grafana 12+ panels + alertes | Dashboard live + 3 alertes pushées |
| 8 | Doc HTML + 3 langues + reuse instructions | Doc + wiki + commits sémantiques |

**Règle d'or** : à chaque phase, **valider explicitement** auprès de l'utilisateur
avant de passer à la suivante. Pas de gros-monolithe-en-une-fois.

---

## 1. Phase 0 — Prérequis utilisateur

À l'invocation, **demander dans cet ordre** (pas Phase 1 tant que 0.1 + 0.3 non
confirmés) :

### 0.1 Compte Grafana Cloud (gratuit)

```
URL : https://grafana.com/products/cloud/
Free tier : Tempo 50GB / 14 jours, Mimir 10K series, Loki 50GB
Note l'URL workspace : https://<nom>.grafana.net
```

### 0.2 OTLP Cloud Access Policy (CAP) Token

```
URL directe : https://<workspace>.grafana.net → Connections → Add new connection → OpenTelemetry

1. "Generate now" sous OTLP endpoint
2. Donne nom + scope ("metrics.write, traces.write, logs.write")
3. Copie le token au format glc_xxxxxxxxxxxx
4. ⚠️ Note l'instance ID (numérique, ex 1618502) visible dans l'URL :
   https://grafana.com/orgs/<org>/stacks/<INSTANCE_ID>/grafana
```

⚠️ **Piège #1 — Ne PAS confondre Access Policy ID (UUID) et instance ID (numérique)**
L'Access Policy ID (`ad1bf3a3-...` UUID) sert à gérer le token, mais
l'**instance ID** (`1618502` numérique) est ce qui va dans `Authorization:
Basic base64(<instance_id>:<glc_token>)` pour OTLP.

### 0.3 Fichier `.env` (gitignored)

```bash
# OTLP / Grafana Cloud
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-eu-west-3.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(instance_id:glc_token)>
OTEL_SERVICE_NAME=<my-backend>
OTEL_RESOURCE_ATTRIBUTES=service.namespace=<myproject>,deployment.environment=production

# Provider clé (déjà présent normalement)
GOOGLE_APPLICATION_CREDENTIALS=...
# OU
OPENAI_API_KEY=...
# OU
ANTHROPIC_API_KEY=...

# Optionnel — pricing (sinon mode statique fallback)
AI_PRICING_CONFIG_REFRESH_SECONDS=600
```

**L'agent doit confirmer** que `.env` est gitignored (`grep -r "OTEL_EXPORTER" .gitignore`).

### 0.4 Accès BD pour l'agent

Phase 3 nécessite d'écrire une migration. Vérifier :
- Cas A : `DATABASE_URL` dans `.env`
- Cas B : MCP Postgres
- Cas C : demande utilisateur de coller `\d <table>`

### Gate Phase 0 → 1
- ✅ Workspace Grafana URL fournie
- ✅ CAP token + instance_id décodé
- ✅ Provider LLM identifié (gemini / openai / anthropic / autre)
- ✅ Au moins un chemin BD validé

---

## 2. Phase 1 — Audit call sites LLM

```bash
# Patterns à détecter selon le provider :
# Gemini / Vertex AI
grep -rE "GenerativeModel|generate_content|generate_content_async|get_embeddings" --include="*.py"

# OpenAI
grep -rE "openai\.|OpenAI\(|chat\.completions\.create|embeddings\.create" --include="*.py"

# Anthropic
grep -rE "anthropic\.|Anthropic\(|messages\.create" --include="*.py"

# LangChain (cross-provider)
grep -rE "from langchain|invoke\(|ainvoke\(" --include="*.py"
```

L'agent **doit produire un tableau** :

| Module | Fichier | Type call (chat/embed/stream) | Volume estimé |
|---|---|---|---|

**Validation utilisateur** : confirmer la liste avant Phase 2 (l'agent NE DOIT PAS
inventer un call site qu'il n'a pas grepped).

### Gate Phase 1 → 2
- ✅ Tableau exhaustif des call sites validé par utilisateur
- ✅ Au moins 1 call site identifié (sinon AI obs = useless, abort)

---

## 3. Phase 2 — Audit système existant (CRITIQUE)

⚠️ **Piège #2 — Ne PAS dupliquer un système existant**

Pendant Facil, l'agent a manqué `app/modules/shared/services/vertex_ai_manager.py`
(singleton in-memory + circuit breaker) en début de session. Correction tardive
forcée par l'utilisateur. **À éviter absolument** sur le prochain projet.

### Audit obligatoire (avant tout code)

```bash
# Singleton / manager / wrapper LLM existants
grep -rE "class.*Manager|class.*Tracker|class.*Wrapper" --include="*.py" -l | xargs grep -l "token\|usage\|llm\|gemini\|openai"

# Circuit breaker
grep -rE "circuit.breaker|consecutive_failures|cooldown" --include="*.py"

# Cost tracking existant
grep -rE "cost|pricing|tokens_used|track_usage" --include="*.py" | head -20

# BD : table existante
psql -c "\dt *ai* *llm* *gemini* *openai*"
```

### Décision : COEXISTENCE vs REMPLACEMENT

| Existing system has... | Action |
|---|---|
| Circuit breaker + in-memory stats | **COEXISTENCE** — préserver, ajouter wrapper OTEL/BD à côté |
| Cost tracking BD-backed similaire | **MERGE** — étendre la table existante, pas en créer une nouvelle |
| Rien | **NEW** — créer ai_call_metrics from scratch |

**Pattern coexistence** (validé Facil) :

```python
response = await traced_generate(model, prompt, feature="X", ...)  # NEW wrapper
ExistingManager().track_usage(response, "ServiceName")   # PRESERVE circuit breaker
ExistingManager().track_success()
```

### Gate Phase 2 → 3
- ✅ Audit système existant complet
- ✅ Décision COEXISTENCE/MERGE/NEW documentée et validée par utilisateur
- ✅ Architecture cible explicite : "wrapper OTEL+BD côte à côte" ou "extension table X"

---

## 4. Phase 3 — Schéma BD `ai_call_metrics`

### Table principale

```sql
CREATE TABLE IF NOT EXISTS ai_call_metrics (
    id              bigserial PRIMARY KEY,
    timestamp       timestamptz NOT NULL DEFAULT now(),
    -- OTEL correlation
    trace_id        text,
    span_id         text,
    -- Modèle
    provider        text NOT NULL,           -- 'gemini' | 'vertex_embedding' | 'openai' | 'anthropic'
    model_name      text NOT NULL,           -- 'gemini-2.5-flash' | 'gpt-4-turbo' | ...
    operation       text NOT NULL,           -- 'chat' | 'embeddings' | 'completion' | 'stream'
    -- Feature business
    feature         text NOT NULL,           -- 'chatbot_rag' | 'ocr' | 'classification' | ...
    user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    user_role       text,
    -- Tokens & cost
    input_tokens    integer NOT NULL DEFAULT 0,
    output_tokens   integer NOT NULL DEFAULT 0,
    cost_xaf        numeric(12,4) NOT NULL DEFAULT 0,    -- ou USD selon devise projet
    -- Latence
    latency_ms      integer NOT NULL DEFAULT 0,
    -- Outcome
    status          text NOT NULL,           -- 'success' | 'rate_limited' | 'timeout' | 'json_error' | 'content_blocked' | 'unknown_error'
    finish_reason   text,                    -- 'STOP' | 'MAX_TOKENS' | 'SAFETY' | ...
    error_message   text,
    -- Privacy
    prompt_hash     text,                    -- SHA-256 truncated 8 hex (dédup, pas PII)
    -- Constraints
    CHECK (provider IN ('gemini','vertex_embedding','openai','anthropic','custom')),
    CHECK (operation IN ('chat','embeddings','completion','stream')),
    CHECK (status IN ('success','rate_limited','timeout','json_error','content_blocked','unknown_error'))
);

CREATE INDEX idx_aim_timestamp ON ai_call_metrics(timestamp DESC);
CREATE INDEX idx_aim_feature_ts ON ai_call_metrics(feature, timestamp DESC);
CREATE INDEX idx_aim_model_ts ON ai_call_metrics(model_name, timestamp DESC);
CREATE INDEX idx_aim_user_ts ON ai_call_metrics(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_aim_status_ts ON ai_call_metrics(status, timestamp DESC) WHERE status != 'success';
CREATE INDEX idx_aim_trace ON ai_call_metrics(trace_id) WHERE trace_id IS NOT NULL;
```

### Cost rollup views

```sql
CREATE OR REPLACE VIEW v_ai_cost_daily AS
SELECT
    date_trunc('day', timestamp) AS day,
    provider, model_name, feature,
    COUNT(*) AS calls,
    SUM(input_tokens) AS input_tokens,
    SUM(output_tokens) AS output_tokens,
    SUM(cost_xaf) AS cost_xaf,
    AVG(latency_ms) AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM ai_call_metrics
WHERE timestamp >= now() - interval '90 days'
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW v_ai_cost_hourly AS
SELECT
    date_trunc('hour', timestamp) AS hour,
    provider, model_name, feature,
    COUNT(*) AS calls,
    SUM(cost_xaf) AS cost_xaf
FROM ai_call_metrics
WHERE timestamp >= now() - interval '14 days'
GROUP BY 1, 2, 3, 4;

GRANT SELECT ON ai_call_metrics, v_ai_cost_daily, v_ai_cost_hourly TO <bi_role>;
```

### Optional — pricing config table

```sql
CREATE TABLE IF NOT EXISTS ai_pricing_config (
    provider        text NOT NULL,
    model_name      text NOT NULL,
    operation       text NOT NULL,
    price_per_1k_input_tokens   numeric(12,6) NOT NULL,
    price_per_1k_output_tokens  numeric(12,6) NOT NULL,
    currency        text NOT NULL DEFAULT 'XAF',
    fx_rate_to_xaf  numeric(12,4),
    effective_from  timestamptz NOT NULL DEFAULT now(),
    effective_until timestamptz,
    PRIMARY KEY (provider, model_name, operation, effective_from)
);
-- seed initial : gemini-2.5-flash, gpt-4-turbo, claude-3.5-sonnet, etc.
```

### Gate Phase 3 → 4
- ✅ Migration appliquée + idempotente (CREATE IF NOT EXISTS)
- ✅ Grants au rôle BI vérifiés
- ✅ Pricing seedé (au minimum les 2-3 modèles utilisés par le projet)

---

## 5. Phase 4 — Wrapper `ai_telemetry.py`

Module unique exposant 4 fonctions :

### 4.1 `traced_generate_sync(model, prompt, *, feature, user_role=None, user_id=None) -> Response`

Wrapper sync pour les appels chat/completion. Retourne directement la response du provider.

```python
def traced_generate_sync(model, prompt, *, feature, user_role=None, user_id=None, **kwargs):
    span = tracer.start_span("gen_ai.chat", attributes={
        "gen_ai.system": _detect_provider(model),
        "gen_ai.request.model": normalize_model_name(model),
        "gen_ai.operation.name": "chat",
        "facil.feature": feature,  # ⚠️ namespace personnalisé selon projet
        "facil.user_role": user_role or "anonymous",
    })
    started = time.monotonic()
    status = "success"
    try:
        response = model.generate_content(prompt, **kwargs)
        usage = _extract_usage(response)
        span.set_attribute("gen_ai.usage.input_tokens", usage.input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", usage.output_tokens)
        return response
    except Exception as e:
        status = classify_error(e)
        span.record_exception(e)
        raise
    finally:
        latency_ms = int((time.monotonic() - started) * 1000)
        span.end()
        # Fire-and-forget INSERT BD
        asyncio.create_task(_persist(
            trace_id=span.context.trace_id, span_id=span.context.span_id,
            feature=feature, user_id=user_id, user_role=user_role,
            input_tokens=usage.input_tokens, output_tokens=usage.output_tokens,
            cost_xaf=estimate_cost_xaf(model, usage),
            latency_ms=latency_ms, status=status,
            prompt_hash=hash_prompt(prompt),
        ))
```

### 4.2 `traced_embed_sync(embedding_model, texts, *, feature) -> List[Vector]`

Identique pour les embeddings. Utiliser `gen_ai.embeddings` comme operation name.

### 4.3 `traced_generate_stream(model, prompt, *, feature, ...) -> AsyncIterator`

⚠️ **Piège #3** — Le streaming ne renvoie pas de `usage_metadata` complet sur chaque chunk. Il faut **agréger** au fil des chunks et émettre le span à la fin.

```python
async def traced_generate_stream(model, prompt, *, feature, user_role=None, user_id=None):
    span = tracer.start_span("gen_ai.chat.stream", attributes={...})
    aggregated_text = []
    input_tokens = output_tokens = 0
    finish_reason = None
    try:
        async for chunk in model.generate_content_async(prompt, stream=True):
            aggregated_text.append(chunk.text)
            if hasattr(chunk, "usage_metadata"):
                input_tokens = chunk.usage_metadata.prompt_token_count
                output_tokens += chunk.usage_metadata.candidates_token_count
            if hasattr(chunk, "candidates") and chunk.candidates[0].finish_reason:
                finish_reason = str(chunk.candidates[0].finish_reason)
            yield chunk
        # ... persist + span.set_attribute(...)
    finally:
        span.end()
```

### 4.4 Helpers

- `normalize_model_name(model_name)` — strip `publishers/google/models/` prefix (Vertex AI), `models/` prefix (Gemini API direct), `chat-` prefix (legacy OpenAI). **Piège #4** sinon cost = 0.
- `classify_error(exc)` — mappe ResourceExhausted → 'rate_limited', TimeoutError → 'timeout', JSONDecodeError → 'json_error', BlockedPromptException → 'content_blocked'.
- `estimate_cost_xaf(model, usage)` — query `ai_pricing_config` (cache 10min) ou fallback PRICING_XAF statique.
- `hash_prompt(prompt)` — SHA-256 truncated 8 hex chars (dédup, RGPD-safe).

### Gate Phase 4 → 5
- ✅ 4 fonctions implémentées + tests unitaires
- ✅ `normalize_model_name()` testée sur les 3 formats (Vertex AI prefix / Gemini direct / OpenAI legacy)
- ✅ `classify_error()` testée sur les 6 statuts

---

## 6. Phase 5 — Migration call sites (1 par 1, COEXISTENCE)

⚠️ **Piège #5** — Migrer en bulk = risque de régression. Faire **1 fichier par 1 fichier** + smoke test après chaque.

### Pattern à respecter (chaque call site)

```python
# AVANT
response = await model.generate_content_async(prompt)
manager.track_usage(response, "MyService")
manager.track_success()

# APRÈS
from app.core.ai_telemetry import traced_generate_sync
response = traced_generate_sync(
    model, prompt,
    feature="my_service_feature",
    user_role=current_user.role,
    user_id=current_user.id,
)
manager.track_usage(response, "MyService")  # PRESERVE circuit breaker
manager.track_success()
```

**Validation après chaque fichier** : run unit tests + smoke run du module.

### Streaming call sites (à part)

Marquer les call sites streaming comme "Phase B+" si le wrapper stream n'est pas
dispo en Phase 5. Documenter dans un fichier `_REMAINING_INSTRUMENTATION.md`.

### Gate Phase 5 → 6
- ✅ Tous les call sites non-stream migrés
- ✅ Tests existants tous PASS
- ✅ Streaming call sites listés dans `_REMAINING_INSTRUMENTATION.md`

---

## 7. Phase 6 — Wire OTLP env vars + bootstrap TracerProvider

### `app/main.py` (ou équivalent) — lifespan

```python
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # OTEL bootstrap
    resource = Resource.create({
        "service.name": os.environ.get("OTEL_SERVICE_NAME", "my-backend"),
        "service.version": os.environ.get("APP_VERSION", "dev"),
        "deployment.environment": os.environ.get("ENV", "production"),
    })
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)
    
    # Auto-instrumentation
    FastAPIInstrumentor.instrument_app(app)
    AsyncPGInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()
    RedisInstrumentor().instrument()
    
    yield
    
    # Shutdown
    provider.shutdown()
```

### `requirements.txt`

```
opentelemetry-api
opentelemetry-sdk
opentelemetry-exporter-otlp-proto-http
opentelemetry-instrumentation-fastapi
opentelemetry-instrumentation-asyncpg
opentelemetry-instrumentation-httpx
opentelemetry-instrumentation-redis
```

### Gate Phase 6 → 7
- ✅ Service redémarré
- ✅ Spans visibles dans Grafana Cloud → Explore → Tempo (filtre `service.name="<my-backend>"`)
- ✅ Service auto-discovered dans Observability → Application → Services

---

## 8. Phase 7 — Dashboard Grafana + alertes

### Dashboard `<project>-ai-observability` — minimum 12 panels

**Row 1 — Overview**
- Stat : Total calls / 24h
- Stat : Total cost / 24h (XAF or USD)
- Stat : Error rate / 24h (%)
- Stat : p95 latency / 24h (ms)

**Row 2 — Cost breakdown**
- Bar gauge : Cost by feature (last 7d)
- Pie : Cost by model_name (last 7d)
- Time series : Daily cost trend (30 days)

**Row 3 — Performance**
- Time series : p50/p95/p99 latency by feature
- Heat map : Latency distribution by hour-of-day

**Row 4 — Errors**
- Table : Top 10 error_messages (last 24h)
- Bar chart : Error count by status (rate_limited / timeout / json_error / content_blocked)

**Row 5 — Top consumers**
- Table : Top 10 features by cost (last 30d)
- Table : Top 10 user_roles by call count

**Variables** : `feature`, `model_name`, `provider`, time range.

### 3 alertes obligatoires

1. **Cost spike** : `sum(cost_xaf) over 1h > 2× average(cost_xaf) over previous 24h` → severity warning
2. **Error rate** : `count(WHERE status != 'success') / count(*) > 5%` over 15min → severity critical
3. **p95 latency** : `percentile_cont(0.95) WITHIN GROUP latency_ms > 10000ms` over 30min → severity warning

⚠️ **Piège #6 — `relativeTimeRange.from > 0`** : alert rule queries doivent avoir `from > 0`. Mettre `{"from": 3600, "to": 0}` (1h lookback) sinon Grafana refuse `Invalid alert rule query A: invalid relative time range [From: 0s, To: 0s]`.

### Optionnel — alerte 4 : Tempo quota

Pour Free tier (5GB/jour Tempo) : `sum(rate(tempo_ingester_bytes_received_total[1h])) > 4.5e9` → severity warning.

### Optionnel — alerte 5 : injection spike (si Phase B.5 implémentée)

`count(WHERE injection_risk='high') over 1h >= 5` → severity critical.

### Gate Phase 7 → 8
- ✅ Dashboard live (push API `/api/dashboards/db`)
- ✅ Alertes pushées (push API `/api/v1/provisioning/alert-rules`)
- ✅ Test fire d'au moins 1 alerte (curl synthétique)

---

## 9. Phase 8 — Doc + i18n + commits

### Documents à produire

1. **HTML doc** dans `docs/documentation/ai-observability.html` (9 sections)
   - §1 Why (4 questions critiques)
   - §2 Architecture (wrapper + double-write + COEXISTENCE)
   - §3 Schéma BD
   - §4 Wrapper API
   - §5 Call sites instrumentés
   - §6 Dashboard description
   - §7 Alertes
   - §8 Reuse instructions (5 fichiers à copier)
   - §9 Limitations connues

2. **i18n × 3 langues** dans `docs/documentation/i18n/messages/{en,fr,es}.js` (~80 clés)

3. **Wiki page** `AI-Observability.md` dans le wiki Github
   - Quick reference
   - Runbook on-call (4 scénarios : cost spike, error rate spike, p95 spike, injection spike)
   - Reuse instructions

4. **Mémoire projet** `memory/project_ai_observability_<date>.md` avec patterns + bugs résolus

### Commits à produire

| Phase | Commit message pattern |
|---|---|
| 3 | `feat(ai-observability): mig N — ai_call_metrics + cost rollup views (Phase A.1)` |
| 4 | `feat(ai-observability): wrapper module + OTEL bootstrap (Phase A.2)` |
| 5 | `feat(ai-observability): wrapper sync variants + migrate N call sites (Phase A.3)` |
| 6 | `feat(ai-observability): wire OTEL_EXPORTER_OTLP_* env vars (Phase A.4)` |
| 7 | `feat(ai-observability): Grafana dashboard + mig N+1 registration (Phase A.5)` |
| 7 | `feat(ai-observability): 3 Grafana alert rules + apply script (Phase A.6)` |
| 8 | `docs(ai-observability): full HTML doc + 3-lang i18n + sidebar propagation (Phase A.7)` |
| 8 | `test(ai-observability): post-deploy smoke validation script (Phase A.8)` |

### Gate Phase 8 → fin
- ✅ Doc HTML 3 langues testée localement (parse JSON + rendu key fallback)
- ✅ Wiki page committée
- ✅ Mémoire projet sauvegardée
- ✅ Demande explicite à l'utilisateur : « OK pour `git push origin <branch>` ? »

---

## 10. Pièges classiques (récapitulatif)

| # | Piège | Symptôme | Garde-fou |
|---|---|---|---|
| 1 | Confusion CAP token UUID vs instance ID | OTLP 401 silently dropped | Phase 0.2 — décode token + croise avec URL UI |
| 2 | Système existant ignoré | Duplication tracking | Phase 2 — audit obligatoire `Glob/Grep` |
| 3 | Streaming usage_metadata partiel | Cost = 0 sur calls stream | Phase 4.3 — agrégation au fil des chunks |
| 4 | `model_name` not normalized | `cost_xaf = 0` partout | Phase 4.4 — `normalize_model_name()` strip prefixes |
| 5 | Migration call sites en bulk | Régression silencieuse | Phase 5 — 1 fichier / 1 fichier + smoke |
| 6 | Alert `relativeTimeRange.from = 0` | API rejette avec 400 | Phase 7 — `{"from": 3600, "to": 0}` |
| 7 | False positives prompt injection FR/ES | High alert spam | Bumped weight 55→60 sur EN-equivalents |
| 8 | Plan committé après impl | Atypique, perte traçabilité | Toujours plan AVANT, pas après |

---

## 11. Faiblesses de l'agent (à corriger avant prochain projet)

| # | Faiblesse | Mitigation actuelle | Mitigation cible |
|---|---|---|---|
| 1 | Provider non-Gemini non testé | Pattern documenté mais non validé sur OpenAI/Anthropic | Phase 0 → tester sur OpenAI projet réel |
| 2 | Pas de support multi-tenant RLS | Single-tenant assumption | Ajouter `tenant_id` dans `ai_call_metrics` schema |
| 3 | Pas de redaction PII automatique sur prompts | hash_prompt() seulement | Ajouter `redact_pii(prompt)` avant hash |
| 4 | Sampling spans 100% en prod | OK volume LLM faible mais explosion possible | Ajouter `TraceIdRatioBased(0.25)` sampler conditionnel |
| 5 | Pas de pré-vérification budget mensuel | Cost spike alerté seulement après dépassement | Ajouter check pré-call si `monthly_cost > BUDGET × 0.8` |

---

## 12. Reuse instructions (depuis Facil 2026-05-05)

5 fichiers à copier sur le nouveau projet :

| Fichier source (Facil) | Destination |
|---|---|
| `packages/backend/database/migrations/325_ai_call_metrics.sql` | `database/migrations/N_ai_call_metrics.sql` |
| `packages/backend/database/migrations/327_ai_pricing_config.sql` | `database/migrations/N+1_ai_pricing_config.sql` |
| `packages/backend/app/core/ai_telemetry.py` | `app/core/ai_telemetry.py` |
| `infra/grafana/dashboards/10_ai_observability.json` | `infra/grafana/dashboards/N_ai_observability.json` |
| `packages/backend/scripts/apply_grafana_ai_alerts.py` | `scripts/apply_grafana_ai_alerts.py` |

Après copie :
1. `pip install opentelemetry-{api,sdk,exporter-otlp-proto-http,instrumentation-{fastapi,asyncpg,httpx,redis}}`
2. Apply migrations
3. Wire env vars (Phase 6)
4. Push dashboard via Grafana API
5. Run apply script alertes
6. Migrer call sites (Phase 5)

---

**Validation Facil** : 17 call sites (12 instrumentés en Phase A.3 + 5 différés en Phase B+), 12 panels, 3 alertes, doc 3 langues. Voir `.claude/plans/SESSION_BILAN_2026_05_05.md`.
