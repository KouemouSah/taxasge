# AI Observability — Phase A — Plan d'implémentation

**Objectif** : instrumenter tous les call sites Gemini de Facil avec des spans OTEL respectant la **convention sémantique GenAI Grafana**, exporter vers Grafana Cloud Tempo (free tier), construire un dashboard "AI Operations" qui répond aux 4 questions critiques actuellement aveugles :

1. **Combien je dépense en tokens par jour, par modèle, par feature ?**
2. **Quelle est la p95/p99 latency par type de call (RAG, OCR, classification, enrichment) ?**
3. **Quel est mon failure rate, et quel type d'erreur (rate limit, JSON mode error, timeout, content blocked) ?**
4. **Quels prompts coûtent le plus (top 10) et y a-t-il un quick-win d'optimisation ?**

**Date** : 2026-05-05
**Branch** : `develop`
**Scope** : backend Python / FastAPI uniquement. Mobile / Frontend Faro = hors scope (deferred per analysis du jour).
**Contexte mémoire** : Règles #21 (Gemini JSON mode), #24 (json.dumps JSONB asyncpg), #37 (boot non-destructif), #40 (Secret Manager pattern).

---

## 0. Audit préalable (résultat 2026-05-05)

### Call sites identifiés (15 fichiers)

| Module | Fichier | Type de call | Volume estimé |
|---|---|---|---|
| chatbot | `chatbot/services/gemini_service.py` | RAG chat (high frequency) | Élevé |
| chatbot | `chatbot/services/chatbot_tools.py` | Tool execution chains | Moyen |
| chatbot | `chatbot/services/embedding_service.py` | text-embedding-005 (pgvector) | Très élevé |
| chatbot | `chatbot/services/chatbot_service_rag.py` | RAG orchestration | Élevé |
| agents | `agents/services/llm_briefing_service.py` | Briefing agent quotidien | Faible |
| agents | `agents/services/admin_assistant_service.py` | Admin assistant | Faible |
| assignment | `assignment/services/llm_routing_service.py` | Auto-assign agents | Moyen |
| batch_requests | `batch_requests/services/document_classifier.py` | Bulk classification | Moyen (sporadique) |
| companies | `companies/services/classification_agent.py` | Company classification | Moyen |
| enrichment | `enrichment/services/enrichment_service.py` | Enrichment v2 (descriptions) | Faible (cron) |
| service_requests | `service_requests/services/gemini_document_processor.py` | **OCR documents** | Très élevé |
| service_requests | `service_requests/services/treasury_analyst_service.py` | Treasury analyst | Faible |
| shared | `shared/services/agent_decision_tools.py` | Decision support | Faible |
| shared | `shared/services/base_analyst_service.py` | Base analyst | Faible |
| shared | `shared/services/llm_agent_mixin.py` | LLM agent mixin | Moyen |
| shared | `shared/services/supervisor_tools.py` | Supervisor tools | Faible |
| funcionario | `funcionario/services/verificacion_service.py` | Verification | Faible |

**Total** : ~17 call sites, instanciation `GenerativeModel(...)` centralisée dans `gemini_service.py` mais chaque module ré-instancie aussi (anti-pattern à corriger en Phase B). Pour Phase A on instrumente **où l'appel sort** (`generate_content_async`).

### Convention GenAI semantic (Grafana / OpenTelemetry)

Span name : `gen_ai.{operation}` (ex: `gen_ai.chat`, `gen_ai.embeddings`, `gen_ai.completion`).

**Attributes obligatoires** :
- `gen_ai.system` — `gemini` (ou `vertex_ai`)
- `gen_ai.request.model` — ex `gemini-2.5-flash`
- `gen_ai.operation.name` — `chat` | `embeddings` | `text_completion`
- `gen_ai.usage.input_tokens` — entier
- `gen_ai.usage.output_tokens` — entier
- `gen_ai.response.finish_reasons` — liste de strings (`STOP`, `MAX_TOKENS`, `SAFETY`, etc.)

**Attributes Facil-spécifiques** (custom) :
- `facil.feature` — `chatbot_rag` | `ocr` | `classification` | `enrichment` | `routing` | `briefing` | `verification`
- `facil.user_role` — `citizen` | `agent` | `admin` (anonymisé via hash si besoin RGPD)
- `facil.cost_xaf` — coût estimé converti en XAF (basé sur pricing Gemini × FX)

**Attributes interdits** (PII risk) :
- ❌ contenu du prompt brut
- ❌ contenu de la réponse brut
- ✅ hash SHA-256 tronqué (8 hex chars) du prompt si tracking nécessaire pour dédup

---

## 1. Architecture

### Décision : COEXISTENCE avec `VertexAIManager` existant (audit 2026-05-05)

Le code possède déjà `app/modules/shared/services/vertex_ai_manager.py` (singleton in-memory) qui track les tokens cumulés + circuit breaker (10 failures consécutives → 60s cooldown). Mes investigations initiales l'avaient ignoré — correction.

**Décision** : NE PAS supprimer ni remplacer `VertexAIManager`. Les deux systèmes sont **complémentaires** :

| Concern | VertexAIManager (existant) | ai_call_metrics (nouveau) |
|---|---|---|
| Circuit breaker (10 fail/60s) | ✅ | ❌ |
| Stats in-memory sub-μs read | ✅ | ❌ |
| BD persistence (cross-worker) | ❌ | ✅ |
| Cost en XAF | ❌ | ✅ |
| Per-feature/model/user tags | ❌ | ✅ |
| OTEL trace correlation | ❌ | ✅ |
| Time series + drill-down | ❌ | ✅ |
| Survit redémarrage Cloud Run | ❌ | ✅ |
| Status enum (6 valeurs : rate_limited/timeout/...) | ❌ | ✅ |

**Pattern call site final** :
```python
response = await traced_generate_sync(model, prompt, feature="X", ...)
VertexAIManager().track_usage(response, "ServiceName")   # circuit breaker
VertexAIManager().track_success()                        # reset consecutive
# except: VertexAIManager().track_failure(); raise
```

Les deux systèmes tournent indépendamment. Le wrapper ne touche pas à `VertexAIManager` (pas de couplage inverse). Migration est **purement additive** : zéro régression sur le système existant.

**Phase B future** (séparée) : refactor optionnel pour migrer les compteurs flat de `VertexAIManager.get_stats()` vers une query BD `SELECT count(*), sum(...) FROM ai_call_metrics`. Garde uniquement le circuit breaker côté singleton. Allège la duplication mais pas critique.

### Décision : SDK OTEL Python natif, PAS OpenLLMetry

**Pourquoi pas OpenLLMetry ?**
- Instrumente langchain / openai / anthropic mais **PAS Vertex AI / Gemini natif** (notre stack)
- Ajout d'une dep de plus pour zéro coverage de notre code
- On a 17 call sites contrôlés → wrapper custom = 50 lignes vs 1 dep externe + monkey-patching

**Pourquoi pas instrumentation Vertex AI native (`google-cloud-aiplatform` instr) ?**
- Trop large : trace toutes les API calls (deployModel, etc.) qu'on n'utilise pas
- Pas d'attributes GenAI standards → dashboard plus difficile à construire

**Décision** : module unique `app/core/ai_telemetry.py` exposant :
1. Un wrapper `traced_generate(model, prompt, *, feature, user_role)` à appeler à la place de `model.generate_content_async(...)`
2. Une fonction `traced_embed(embedding_model, texts, *, feature)` pour les embeddings
3. Un context manager `@trace_ai_op(feature)` decorator pour blocs custom (non-call mais work LLM-related)

### Décision : Double-écriture span + ligne BD

Chaque call émet :
1. **Span OTEL** → exporté à Grafana Tempo (visualisation, traces, drill-down)
2. **INSERT INTO `ai_call_metrics`** (table dédiée, mig 325) → pour agrégation rapide en SQL et persistance long-terme (Tempo retention free tier = 14 jours seulement)

**Pourquoi double ?**
- Tempo free tier = 14 jours de rétention. Insuffisant pour rapport mensuel coût Gemini.
- BD = source of truth pour facturation interne / dashboards business mig 323
- Tempo = drill-down debug (voir le span d'un appel précis avec ses attributes)

### Décision : Sampling

- **Spans Tempo** : 100% sampling pour l'instant (volume LLM faible vs HTTP). Si quota Tempo dépasse → réduire à 25% via `TraceIdRatioBased` sampler.
- **Lignes BD** : 100% (toutes les calls). Volume ~100k/jour max à 1M users → BD-friendly.

---

## Phase A.1 — Schéma BD (mig 325)

**Fichier** : `packages/backend/database/migrations/325_ai_call_metrics.sql`

```sql
CREATE TABLE IF NOT EXISTS ai_call_metrics (
    id              bigserial PRIMARY KEY,
    timestamp       timestamptz NOT NULL DEFAULT now(),
    -- Identité du call
    trace_id        text,                            -- OTEL trace_id (correlate avec Tempo)
    span_id         text,                            -- OTEL span_id
    -- Modèle
    provider        text NOT NULL DEFAULT 'gemini',  -- 'gemini' | 'vertex_embedding'
    model_name      text NOT NULL,                   -- 'gemini-2.5-flash' | 'text-embedding-005'
    operation       text NOT NULL,                   -- 'chat' | 'embeddings' | 'completion'
    -- Feature Facil
    feature         text NOT NULL,                   -- 'chatbot_rag' | 'ocr' | 'classification' | ...
    user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    user_role       text,                            -- copie role au moment du call
    -- Tokens & coût
    input_tokens    int NOT NULL DEFAULT 0,
    output_tokens   int NOT NULL DEFAULT 0,
    total_tokens   int GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    cost_xaf        numeric(12, 4) NOT NULL DEFAULT 0,  -- coût estimé en FCFA
    -- Latence & status
    latency_ms      int NOT NULL,                       -- end - start
    finish_reason   text,                               -- STOP | MAX_TOKENS | SAFETY | RECITATION | OTHER
    status          text NOT NULL,                      -- 'success' | 'error' | 'rate_limited' | 'json_parse_error'
    error_class     text,                               -- nom de la classe d'exception si error
    -- Hashes (pas le contenu)
    prompt_hash     text,                               -- SHA-256 tronqué 16 chars du prompt
    -- Audit
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_provider CHECK (provider IN ('gemini', 'vertex_embedding')),
    CONSTRAINT chk_operation CHECK (operation IN ('chat', 'embeddings', 'completion')),
    CONSTRAINT chk_status CHECK (status IN ('success', 'error', 'rate_limited', 'json_parse_error', 'timeout', 'content_blocked'))
);

-- Indexes pour les requêtes de dashboard (volumes attendus 100k+ rows/jour)
CREATE INDEX IF NOT EXISTS idx_ai_metrics_timestamp     ON ai_call_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_feature_time  ON ai_call_metrics(feature, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_model_time    ON ai_call_metrics(model_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_status        ON ai_call_metrics(status, timestamp DESC) WHERE status != 'success';
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user          ON ai_call_metrics(user_id, timestamp DESC) WHERE user_id IS NOT NULL;

-- Vue agrégée pour Grafana panel "Cost per day per feature"
CREATE OR REPLACE VIEW v_ai_cost_daily AS
SELECT
    date_trunc('day', timestamp)::date AS day,
    feature,
    model_name,
    count(*)                          AS call_count,
    sum(input_tokens)                 AS input_tokens,
    sum(output_tokens)                AS output_tokens,
    sum(cost_xaf)                     AS cost_xaf,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
    sum((status='error')::int)        AS error_count
FROM ai_call_metrics
WHERE timestamp > now() - interval '90 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 6 DESC;

-- Grant pour Grafana
GRANT SELECT ON ai_call_metrics, v_ai_cost_daily TO looker_readonly;
```

### Checklist Phase A.1
- [ ] Migration créée et idempotente
- [ ] Vue `v_ai_cost_daily` testée avec données de seed
- [ ] Grant looker_readonly verifié (mémoire règle #38)
- [ ] Apply via `apply_migration_325.py` + 5 vérifs (table, indexes, vue, CHECKs, grants)
- [ ] Wrapper VIEW auto au boot (mémoire règle #38) crée `vw_ai_cost_daily` côté Grafana JDBC

---

## Phase A.2 — Module wrapper `app/core/ai_telemetry.py`

```python
"""
AI telemetry wrapper — emits OTEL spans + persists rows to ai_call_metrics.

Memory rules:
- #21: Gemini JSON mode obligatoire — wrapper detect json_parse_error
- #24: json.dumps for JSONB (n/a here — no JSONB column)
- #40: GRAFANA_OTLP_TOKEN via Secret Manager
"""

from __future__ import annotations

import asyncio
import hashlib
import time
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

import asyncpg
from loguru import logger
from opentelemetry import trace

# Pricing par modèle (XAF / 1M tokens) — à mettre à jour quarterly via cron
PRICING_XAF = {
    "gemini-2.5-flash": {"input": 45, "output": 180},  # placeholder — verify
    "gemini-1.5-pro": {"input": 750, "output": 3000},
    "text-embedding-005": {"input": 7.5, "output": 0},
}

tracer = trace.get_tracer("facil.ai")


def _hash_prompt(prompt: str) -> str:
    return hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]


def _estimate_cost_xaf(model: str, input_tok: int, output_tok: int) -> float:
    p = PRICING_XAF.get(model, {"input": 0, "output": 0})
    return (input_tok / 1_000_000.0 * p["input"]) + (output_tok / 1_000_000.0 * p["output"])


async def _persist_metric(pool: asyncpg.Pool, **kwargs):
    """Best-effort BD insert — never raise into the caller."""
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO ai_call_metrics (
                    trace_id, span_id, provider, model_name, operation,
                    feature, user_id, user_role,
                    input_tokens, output_tokens, cost_xaf,
                    latency_ms, finish_reason, status, error_class, prompt_hash
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7::uuid, $8,
                    $9, $10, $11,
                    $12, $13, $14, $15, $16
                )
                """,
                kwargs.get("trace_id"), kwargs.get("span_id"),
                kwargs.get("provider", "gemini"), kwargs["model_name"], kwargs["operation"],
                kwargs["feature"], kwargs.get("user_id"), kwargs.get("user_role"),
                kwargs.get("input_tokens", 0), kwargs.get("output_tokens", 0),
                kwargs.get("cost_xaf", 0),
                kwargs["latency_ms"], kwargs.get("finish_reason"),
                kwargs["status"], kwargs.get("error_class"),
                kwargs.get("prompt_hash"),
            )
    except Exception as exc:
        logger.warning("ai_telemetry: persist failed (non-blocking) — {}", exc)


async def traced_generate(
    model,
    prompt,
    *,
    feature: str,
    pool: asyncpg.Pool,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    operation: str = "chat",
    **kwargs,
):
    """Wrapper around `model.generate_content_async()` with full telemetry.

    Returns whatever the underlying SDK returns. Errors propagate after
    being recorded.
    """
    model_name = getattr(model, "_model_name", None) or getattr(model, "model_name", "unknown")
    prompt_str = str(prompt)[:8192]  # bound for hash perf
    prompt_hash = _hash_prompt(prompt_str)

    with tracer.start_as_current_span(f"gen_ai.{operation}") as span:
        ctx = span.get_span_context()
        trace_id = format(ctx.trace_id, "032x") if ctx.trace_id else None
        span_id = format(ctx.span_id, "016x") if ctx.span_id else None

        span.set_attribute("gen_ai.system", "gemini")
        span.set_attribute("gen_ai.operation.name", operation)
        span.set_attribute("gen_ai.request.model", model_name)
        span.set_attribute("facil.feature", feature)
        if user_role:
            span.set_attribute("facil.user_role", user_role)
        span.set_attribute("facil.prompt_hash", prompt_hash)

        start = time.monotonic()
        status = "error"
        error_class = None
        finish_reason = None
        input_tokens = 0
        output_tokens = 0
        cost_xaf = 0.0

        try:
            response = await model.generate_content_async(prompt, **kwargs)

            # Extract usage metadata (Gemini convention)
            um = getattr(response, "usage_metadata", None)
            if um:
                input_tokens = getattr(um, "prompt_token_count", 0) or 0
                output_tokens = getattr(um, "candidates_token_count", 0) or 0
                span.set_attribute("gen_ai.usage.input_tokens", input_tokens)
                span.set_attribute("gen_ai.usage.output_tokens", output_tokens)

            cands = getattr(response, "candidates", None)
            if cands and len(cands) > 0:
                fr = getattr(cands[0], "finish_reason", None)
                finish_reason = str(fr) if fr is not None else None
                if finish_reason:
                    span.set_attribute("gen_ai.response.finish_reasons", [finish_reason])

            cost_xaf = _estimate_cost_xaf(model_name, input_tokens, output_tokens)
            span.set_attribute("facil.cost_xaf", cost_xaf)

            status = "success"
            return response

        except Exception as exc:
            error_class = exc.__class__.__name__
            # Classify common error types for the dashboard
            msg_low = str(exc).lower()
            if "rate limit" in msg_low or "quota" in msg_low or "429" in msg_low:
                status = "rate_limited"
            elif "timeout" in msg_low or "deadline exceeded" in msg_low:
                status = "timeout"
            elif "blocked" in msg_low or "safety" in msg_low:
                status = "content_blocked"
            elif "json" in msg_low or "parse" in msg_low:
                status = "json_parse_error"
            else:
                status = "error"

            span.record_exception(exc)
            span.set_status(trace.Status(trace.StatusCode.ERROR, status))
            span.set_attribute("error.class", error_class)
            raise

        finally:
            latency_ms = int((time.monotonic() - start) * 1000)
            span.set_attribute("facil.latency_ms", latency_ms)

            # Fire-and-forget persist (never blocks caller)
            asyncio.create_task(_persist_metric(
                pool=pool,
                trace_id=trace_id, span_id=span_id,
                provider="gemini", model_name=model_name, operation=operation,
                feature=feature, user_id=user_id, user_role=user_role,
                input_tokens=input_tokens, output_tokens=output_tokens, cost_xaf=cost_xaf,
                latency_ms=latency_ms, finish_reason=finish_reason,
                status=status, error_class=error_class, prompt_hash=prompt_hash,
            ))


# Embeddings variant
async def traced_embed(
    embed_model, texts: list[str], *, feature: str, pool: asyncpg.Pool, **kwargs,
):
    # Similar wrapper for embedding_model.get_embeddings_async()
    # Uses operation='embeddings', model_name='text-embedding-005'
    ...
```

### Checklist Phase A.2
- [ ] Module créé avec types stricts (Pydantic v2)
- [ ] Tests unitaires (mock GenerativeModel) couvrant les 6 status (success / error / rate_limited / timeout / content_blocked / json_parse_error)
- [ ] Vérifier que `asyncio.create_task` n'orphan pas en cas de shutdown (utiliser un BackgroundTasks pool si besoin)
- [ ] Configuration OTLP exporter dans `app/core/telemetry_config.py` (endpoint Grafana Cloud, headers Authorization)
- [ ] `mypy app/core/ai_telemetry.py --strict` PASS

---

## Phase A.3 — Migration des call sites (15 fichiers)

Pour chaque fichier identifié à §0, remplacer :

```python
# AVANT
response = await self.chat_model.generate_content_async(prompt)
```

par :

```python
# APRÈS
from app.core.ai_telemetry import traced_generate
from app.database.connection import get_db_pool

pool = await get_db_pool()
response = await traced_generate(
    self.chat_model, prompt,
    feature="chatbot_rag",      # ← key feature label
    pool=pool,
    user_id=user_id,            # ← contexte utilisateur quand dispo
    user_role=user_role,
    operation="chat",
    generation_config=self.generation_config,
)
```

**Mapping feature label par module** :
| Module | feature label |
|---|---|
| `chatbot/services/gemini_service.py` | `chatbot_rag` |
| `chatbot/services/embedding_service.py` | `embeddings_rag` |
| `chatbot/services/chatbot_tools.py` | `chatbot_tools` |
| `service_requests/services/gemini_document_processor.py` | `ocr` |
| `enrichment/services/enrichment_service.py` | `enrichment` |
| `assignment/services/llm_routing_service.py` | `routing` |
| `agents/services/llm_briefing_service.py` | `briefing` |
| `agents/services/admin_assistant_service.py` | `admin_assistant` |
| `companies/services/classification_agent.py` | `classification_companies` |
| `batch_requests/services/document_classifier.py` | `classification_batch` |
| `funcionario/services/verificacion_service.py` | `verification_funcionario` |
| `service_requests/services/treasury_analyst_service.py` | `analyst_treasury` |
| `shared/services/agent_decision_tools.py` | `agent_decision` |
| `shared/services/base_analyst_service.py` | `analyst_base` |
| `shared/services/llm_agent_mixin.py` | `agent_mixin` |
| `shared/services/supervisor_tools.py` | `supervisor_tools` |

### Checklist Phase A.3
- [ ] 15 call sites migrés
- [ ] Aucun appel direct résiduel à `generate_content_async` hors du wrapper (grep -r `generate_content_async` ne montre que `ai_telemetry.py`)
- [ ] Tests existants des 15 modules toujours au vert (no regression)
- [ ] Smoke test live : envoyer 1 message au chatbot → vérifier 1 ligne dans `ai_call_metrics` avec `feature='chatbot_rag', status='success'`

---

## Phase A.4 — OTLP exporter setup

### A.4.1 Secret Manager — token Grafana OTLP

```bash
# Récupérer le token depuis Grafana Cloud > Connections > Add new connection > OTLP
# Format: Basic <user_id:api_token base64>

gcloud secrets create grafana-otlp-token --replication-policy=automatic
echo -n "Basic xxx..." | gcloud secrets versions add grafana-otlp-token --data-file=-

gcloud secrets add-iam-policy-binding grafana-otlp-token \
  --member="serviceAccount:392159428433-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### A.4.2 Workflow update

```yaml
# .github/workflows/deploy-backend-staging.yml
--set-env-vars="OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-eu-west-2.grafana.net/otlp" \
--set-env-vars="OTEL_SERVICE_NAME=facil-backend" \
--set-env-vars="OTEL_RESOURCE_ATTRIBUTES=service.name=facil-backend,deployment.environment=staging" \
--set-secrets="OTEL_EXPORTER_OTLP_HEADERS=grafana-otlp-token:latest" \
```

### A.4.3 Bootstrap dans `main.py`

```python
# app/main.py — startup hook
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

if os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
    resource = Resource.create({
        "service.name": os.environ.get("OTEL_SERVICE_NAME", "facil-backend"),
        "deployment.environment": os.environ.get("ENVIRONMENT", "dev"),
    })
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter()  # picks up env vars
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    logger.info("✅ OTEL tracing enabled — exporting to Grafana Cloud")
else:
    logger.info("⚠️ OTEL endpoint not configured — tracing disabled (BD-only metrics)")
```

### Checklist Phase A.4
- [ ] Token Grafana OTLP créé + Secret Manager + IAM
- [ ] Workflow .yml mis à jour avec 4 env/secret vars
- [ ] Bootstrap conditionnel (no crash si OTEL_EXPORTER_OTLP_ENDPOINT absent)
- [ ] Test : déploiement → vérifier dans Grafana > Explore > Tempo qu'un span `gen_ai.chat` apparaît

---

## Phase A.5 — Dashboard Grafana JSON

**Fichier** : `infra/grafana/dashboards/10_ai_observability.json`

UID : `facil-ai-observability`. Provisionnement via le pattern existant (mig 323 / agent `/grafana-dashboards`).

### Panels (8 panels)

| # | Type | Titre | Source | Query |
|---|---|---|---|---|
| 1 | Stat | **Cost today (XAF)** | BD | `SUM(cost_xaf) WHERE timestamp >= today` |
| 2 | Stat | **Cost MTD (XAF)** | BD | `SUM(cost_xaf) WHERE timestamp >= start_of_month` |
| 3 | Time series | **Cost by feature (last 30d)** | `vw_ai_cost_daily` | `SUM(cost_xaf) GROUP BY day, feature` |
| 4 | Time series | **p95 latency by feature** | BD | `percentile_cont(0.95) GROUP BY feature, time_bucket` |
| 5 | Stat (red) | **Error rate (24h)** | BD | `SUM(status != 'success') / COUNT(*)` |
| 6 | Bar chart | **Errors by status type** | BD | `COUNT(*) WHERE status != 'success' GROUP BY status` |
| 7 | Table | **Top 10 features by cost (7d)** | BD | `GROUP BY feature ORDER BY SUM(cost_xaf) DESC LIMIT 10` |
| 8 | Table | **Top 10 prompt_hash by cost (7d)** | BD | `GROUP BY prompt_hash ORDER BY SUM(cost_xaf) DESC LIMIT 10` |

Variables : `time_range` (default 7d), `feature` (multi-select), `model_name` (multi-select).

Annotations : alertes liées (panel 5 si error_rate > 5%).

### Checklist Phase A.5
- [ ] JSON dashboard créé avec UID stable `facil-ai-observability`
- [ ] Tags `["facil","ai","gemini","cost"]` pour filtre Grafana
- [ ] Push via le push agent (`infra/grafana/push_grafana_dashboards.py` existant)
- [ ] Mig 326 (auto-create) : ajouter ligne dans `dashboard_registrations` avec `provider='grafana', uid='facil-ai-observability', category='operations', rls_mode='admin_only'` (intégration mig 323)

---

## Phase A.6 — Alerting

**Fichier** : `infra/grafana/alerts/ai_observability.yml`

3 alertes :

```yaml
- name: AI cost spike (daily)
  query: SUM(cost_xaf) over 1d
  threshold: > 5000 XAF (~ $9 USD) per day
  notification: Sentry breadcrumb + Slack #ops-ai

- name: AI error rate spike
  query: SUM(status != 'success') / COUNT(*) over 5m
  threshold: > 10%
  notification: PagerDuty (critical)

- name: AI p95 latency degradation
  query: percentile_cont(0.95) over 15m
  threshold: > 8000 ms (vs baseline 2000-3000ms)
  notification: Slack #ops-ai
```

### Checklist Phase A.6
- [ ] 3 alert rules créées dans Grafana
- [ ] Notification channels configurés (Slack webhook + PagerDuty integration key dans Secret Manager)
- [ ] Test de chaque alerte (forcer une condition de déclenchement avec un INSERT manuel)

---

## Phase A.7 — Documentation + i18n

### A.7.1 Doc HTML

Nouvelle page `docs/documentation/ai-observability.html` (suit le pattern grafana-dashboards.html), avec :

- §1 Why : zéro visibilité actuelle sur Gemini, exemples d'incidents potentiels
- §2 Stack : OTEL + Tempo + Postgres double-écriture
- §3 Schéma BD `ai_call_metrics`
- §4 Wrapper `traced_generate` (signature + exemple)
- §5 Convention `feature` labels (table des 16)
- §6 Dashboard Grafana (capture d'écran des 8 panels)
- §7 Alerting (3 règles)
- §8 PII / sécurité (hash, no prompt content stored)
- §9 Coûts estimés / extrapolation 1M users

### A.7.2 i18n 3 langues

- `docs/documentation/i18n/messages/{en,fr,es}.js` — nouvelle namespace `aio.*` (~30 clés × 3)
- TOC entry dans `docs/documentation/index.html`

### A.7.3 Wiki

- `taxasge.wiki/AI-Observability.md` — guide opérationnel court (5-10 min read) avec : "comment ajouter un nouveau call site", "comment lire le dashboard", "comment réagir à une alerte"

### Checklist Phase A.7
- [ ] Page HTML créée (3 langues)
- [ ] i18n parsé OK (3 fichiers)
- [ ] Wiki page créée + commit dans le repo wiki
- [ ] Lien depuis `index.html` documentation map

---

## Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Tempo free tier saturé (50 GB/mois) | Plus de traces visibles | Sampling 25% si volume > 35 GB/mois ; alerte ingestion à 80% |
| BD `ai_call_metrics` énorme à scale 1M users | Backups lents, query timeouts | Partition par mois (`PARTITION BY RANGE (timestamp)`) + DELETE rows > 6 mois via cron |
| `asyncio.create_task` orphan à shutdown | Dernières metrics perdues | Tracking via WeakSet + await à `shutdown` event |
| Token Grafana OTLP fuit | Quelqu'un peut polluer notre tenant Tempo | Secret Manager + rotation 90j (mémoire règle #40) |
| Pricing Gemini change | Coûts mal estimés | Pricing en config BD (table `ai_pricing_config`) + cron quarterly de refresh |
| Latence wrapper > latence appel | Wrapper ralentit le système | `asyncio.create_task` (fire-forget) pour persist BD ; span overhead < 1ms |
| PII dans prompt_hash | Risque RGPD via lookup table | Hash SHA-256 tronqué 16 chars + jamais stocker reverse mapping |
| Echec persist BD bloque le call | Chatbot KO si BD down | `try/except` autour du `_persist_metric`, log warning, jamais de raise |

---

## Effort estimé

| Phase | Tâche | Effort |
|---|---|---|
| A.1 | Mig 325 + apply script + tests | 2h |
| A.2 | Module wrapper + tests unitaires | 4-6h |
| A.3 | Migration 15-17 call sites | 4-6h (mécanique mais risque regression) |
| A.4 | OTLP setup + workflow + bootstrap | 2h |
| A.5 | Dashboard Grafana JSON 8 panels | 3-4h |
| A.6 | 3 alertes + notification channels | 2h |
| A.7 | Doc HTML + i18n + wiki | 3-4h |
| **Total** | | **20-27h (~3 jours)** |

---

## Validation finale (avant push global)

- [ ] Migration 325 appliquée live BD + 5 vérifs OK
- [ ] `mypy app/core/ai_telemetry.py --strict` PASS
- [ ] `pytest tests/core/test_ai_telemetry.py -v` 6/6 status couverts PASS
- [ ] 15 call sites migrés, no regression sur les 32 tests dashboards existants
- [ ] Smoke test live : 1 chat message → 1 ligne BD avec status='success' + 1 span dans Grafana Tempo
- [ ] Smoke test erreur : forcer un timeout → 1 ligne avec status='timeout' + alerte ne déclenche pas (volume trop bas)
- [ ] Dashboard Grafana 8 panels affichent des données après 1h d'usage staging
- [ ] Doc HTML 3 langues parsée OK + lien depuis index.html
- [ ] Critique honnête écrite avec gaps + risques résiduels
- [ ] Push uniquement après validation utilisateur (Règle #13)

---

## Out of scope (Phase B+ — futures itérations)

- **Frontend Faro** : RUM web — overlap Sentry+LogRocket, ROI marginal, defer
- **Mobile OTEL** : nécessite Expo dev client custom → casse Expo Go (mémoire règle #34)
- **Distributed tracing complet** (Phase B propre) : auto-instrumentation FastAPI + asyncpg + httpx, service map. Different scope que AI obs.
- **Vertex AI native logging** : pourrait remplacer la double-écriture mais lock-in GCP et requiert Cloud Logging → BigQuery export
- **Prompt injection detection** : analyse anti-attaques sur prompts entrants (sécurité, séparé)

---

**Validation utilisateur requise avant Phase A.1.**
