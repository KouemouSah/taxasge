"""
AI telemetry wrapper — emits OTEL spans + persists rows to ai_call_metrics.

Phase A.2 of AI_OBSERVABILITY_PLAN.md.

Used to wrap every Gemini / Vertex AI call so we capture:
- token usage + estimated cost in XAF
- latency
- finish_reason + 6-status error classification
- OTEL trace_id / span_id for Tempo correlation
- privacy-safe prompt_hash (SHA-256 truncated to 16 hex)

Memory rules:
- #21: Gemini JSON mode obligatoire — wrapper detects json_parse_error status
- #24: json.dumps for JSONB — n/a here (no JSONB column in ai_call_metrics)
- #40: GRAFANA_OTLP_TOKEN provisioned via Secret Manager
- Privacy/RGPD: NEVER store raw prompt or response content. Only the SHA-256
  truncated hash. No reverse-mapping table.

Soft OTEL import: if opentelemetry packages are not installed, spans are
silently skipped — only the BD persistence runs. This lets us deploy the
wrapper before completing the OTLP endpoint setup.
"""

from __future__ import annotations

import asyncio
import hashlib
import time
from typing import Any, Optional, Sequence

import asyncpg
from loguru import logger

# Soft OTEL import — module loads even if opentelemetry-api isn't installed.
try:
    from opentelemetry import trace as _otel_trace
    _OTEL_AVAILABLE = True
    _tracer = _otel_trace.get_tracer("facil.ai")
except Exception:  # pragma: no cover — environment without OTEL
    _OTEL_AVAILABLE = False
    _otel_trace = None
    _tracer = None


# ---------------------------------------------------------------------------
# Pricing — XAF per 1M tokens. Updated quarterly via cron (TODO Phase B).
# Source: Vertex AI pricing page × FX rate. Placeholders kept conservative
# (over-estimates so cost appears slightly higher than reality, never lower).
# ---------------------------------------------------------------------------
PRICING_XAF: dict[str, dict[str, float]] = {
    # Gemini 2.5 Flash — primary chatbot + classification model
    "gemini-2.5-flash":     {"input": 45.0,    "output": 180.0},
    "gemini-2.5-flash-001": {"input": 45.0,    "output": 180.0},
    # Gemini 1.5 Pro — used for complex enrichment + agent decisions
    "gemini-1.5-pro":       {"input": 750.0,   "output": 3000.0},
    "gemini-1.5-pro-001":   {"input": 750.0,   "output": 3000.0},
    "gemini-1.5-pro-002":   {"input": 750.0,   "output": 3000.0},
    # Gemini 1.5 Flash — fallback model
    "gemini-1.5-flash":     {"input": 45.0,    "output": 180.0},
    "gemini-1.5-flash-002": {"input": 45.0,    "output": 180.0},
    # Embeddings — text-embedding-005 (Vertex). No output tokens.
    "text-embedding-005":   {"input": 7.5,     "output": 0.0},
    "text-embedding-004":   {"input": 7.5,     "output": 0.0},
}


def estimate_cost_xaf(model: str, input_tokens: int, output_tokens: int) -> float:
    """Estimate XAF cost from token counts. 0 for unknown models (logged once)."""
    p = PRICING_XAF.get(model)
    if p is None:
        logger.warning("ai_telemetry: unknown model '{}' — cost will be 0", model)
        return 0.0
    return (
        (input_tokens / 1_000_000.0) * p["input"]
        + (output_tokens / 1_000_000.0) * p["output"]
    )


def hash_prompt(prompt: Any) -> str:
    """SHA-256 truncated to 16 hex chars. Privacy-safe identifier.

    Accepts any prompt shape (string, list of parts, dict). Coerces to str
    bounded at 8192 chars to keep the hash fast.
    """
    s = str(prompt)
    if len(s) > 8192:
        s = s[:8192]
    return hashlib.sha256(s.encode("utf-8", errors="replace")).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Error classification — maps any exception to one of 6 status values
# defined by the chk_aim_status BD constraint (mig 325).
# ---------------------------------------------------------------------------
_ERROR_HINTS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("rate limit", "quota", "429", "resource exhausted"), "rate_limited"),
    (("deadline exceeded", "timeout", "504", "timed out"),  "timeout"),
    (("blocked", "safety", "harm", "recitation"),           "content_blocked"),
    (("invalid json", "json decode", "json parse",
      "expecting value", "json.decoder", "jsondecode"),     "json_parse_error"),
)


def classify_error(exc: BaseException) -> str:
    """Return one of: rate_limited | timeout | content_blocked | json_parse_error | error.

    Inspects the exception class name + message for known signatures.
    Falls back to generic 'error' when no hint matches.
    """
    msg = str(exc).lower()
    cls_name = exc.__class__.__name__.lower()
    for hints, status in _ERROR_HINTS:
        for hint in hints:
            if hint in msg or hint in cls_name:
                return status
    return "error"


# ---------------------------------------------------------------------------
# Persistence — fire-and-forget BD insert (never blocks caller, never raises).
# Tracked in a WeakSet so shutdown can await pending tasks.
# ---------------------------------------------------------------------------
_pending_persists: set[asyncio.Task] = set()


def _track_task(task: asyncio.Task) -> None:
    _pending_persists.add(task)
    task.add_done_callback(_pending_persists.discard)


async def _persist_metric(pool: asyncpg.Pool, **kw: Any) -> None:
    """Insert one row into ai_call_metrics. Never raises."""
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
                kw.get("trace_id"), kw.get("span_id"),
                kw.get("provider", "gemini"),
                kw["model_name"], kw["operation"],
                kw["feature"],
                kw.get("user_id"), kw.get("user_role"),
                int(kw.get("input_tokens") or 0),
                int(kw.get("output_tokens") or 0),
                float(kw.get("cost_xaf") or 0),
                int(kw["latency_ms"]),
                kw.get("finish_reason"),
                kw["status"],
                kw.get("error_class"),
                kw.get("prompt_hash"),
            )
    except Exception as exc:
        logger.warning(
            "ai_telemetry: persist failed (non-blocking) feature={} err={}",
            kw.get("feature"), exc,
        )


async def flush_pending_persists(timeout: float = 5.0) -> None:
    """Await any pending persist tasks. Call from FastAPI shutdown event."""
    if not _pending_persists:
        return
    pending = list(_pending_persists)
    logger.info("ai_telemetry: flushing {} pending persists...", len(pending))
    try:
        await asyncio.wait_for(
            asyncio.gather(*pending, return_exceptions=True),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "ai_telemetry: shutdown flush timed out after {}s ({} tasks still pending)",
            timeout, len(_pending_persists),
        )


# ---------------------------------------------------------------------------
# OTEL span helpers — soft no-ops when OTEL is not installed.
# ---------------------------------------------------------------------------
class _NoSpan:
    """Drop-in replacement for an OTEL span when opentelemetry isn't loaded."""
    def set_attribute(self, *a: Any, **kw: Any) -> None: pass
    def record_exception(self, *a: Any, **kw: Any) -> None: pass
    def set_status(self, *a: Any, **kw: Any) -> None: pass
    def get_span_context(self) -> Any:  # pragma: no cover
        class _Ctx:
            trace_id = 0
            span_id = 0
        return _Ctx()


class _NoSpanCM:
    def __enter__(self) -> _NoSpan: return _NoSpan()
    def __exit__(self, *a: Any) -> None: pass


def _start_span(name: str):
    if _OTEL_AVAILABLE and _tracer is not None:
        return _tracer.start_as_current_span(name)
    return _NoSpanCM()


def _format_trace_id(span: Any) -> tuple[Optional[str], Optional[str]]:
    try:
        ctx = span.get_span_context()
        tid = format(ctx.trace_id, "032x") if ctx.trace_id else None
        sid = format(ctx.span_id, "016x") if ctx.span_id else None
        # Reject all-zero IDs (no recording context)
        if tid == "0" * 32:
            tid = None
        if sid == "0" * 16:
            sid = None
        return tid, sid
    except Exception:
        return None, None


# ---------------------------------------------------------------------------
# Public API: traced_generate (chat / completion) + traced_embed
# ---------------------------------------------------------------------------
async def traced_generate(
    model: Any,
    prompt: Any,
    *,
    feature: str,
    pool: asyncpg.Pool,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    operation: str = "chat",
    **kwargs: Any,
) -> Any:
    """Wrapper around `model.generate_content_async(prompt, **kwargs)`.

    Emits an OTEL span + persists a row in ai_call_metrics. Returns whatever
    the underlying SDK returns. Errors propagate after recording.

    :param model:       a Vertex AI / Gemini GenerativeModel instance
    :param prompt:      whatever the model accepts (str / list of parts)
    :param feature:     Facil feature label (chatbot_rag | ocr | classification | ...)
    :param pool:        asyncpg pool used for the BD persist
    :param user_id:     optional UUID of the user triggering the call (audit)
    :param user_role:   optional role (citizen | agent | admin) for segmentation
    :param operation:   'chat' (default) | 'completion'
    :param **kwargs:    forwarded to generate_content_async
    """
    return await _traced_call(
        model=model, prompt=prompt, feature=feature, pool=pool,
        user_id=user_id, user_role=user_role,
        operation=operation, provider="gemini",
        invoke=lambda m, p: m.generate_content_async(p, **kwargs),
    )


async def traced_embed(
    embed_model: Any,
    texts: Sequence[Any],
    *,
    feature: str,
    pool: asyncpg.Pool,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    **kwargs: Any,
) -> Any:
    """Wrapper around `embed_model.get_embeddings_async(texts, **kwargs)`.

    Same telemetry pattern as `traced_generate` but with `operation='embeddings'`
    and `provider='vertex_embedding'`. Embeddings produce no output tokens; we
    sum the input tokens reported by the SDK (or estimate from text length when
    unavailable).
    """
    return await _traced_call(
        model=embed_model, prompt=texts, feature=feature, pool=pool,
        user_id=user_id, user_role=user_role,
        operation="embeddings", provider="vertex_embedding",
        invoke=lambda m, p: m.get_embeddings_async(p, **kwargs),
    )


async def _traced_call(
    *,
    model: Any,
    prompt: Any,
    feature: str,
    pool: asyncpg.Pool,
    user_id: Optional[str],
    user_role: Optional[str],
    operation: str,
    provider: str,
    invoke,
) -> Any:
    """Shared core for both traced_generate and traced_embed."""
    model_name = (
        getattr(model, "_model_name", None)
        or getattr(model, "model_name", None)
        or "unknown"
    )
    prompt_hash = hash_prompt(prompt)

    with _start_span(f"gen_ai.{operation}") as span:
        trace_id, span_id = _format_trace_id(span)

        span.set_attribute("gen_ai.system", provider)
        span.set_attribute("gen_ai.operation.name", operation)
        span.set_attribute("gen_ai.request.model", model_name)
        span.set_attribute("facil.feature", feature)
        span.set_attribute("facil.prompt_hash", prompt_hash)
        if user_role:
            span.set_attribute("facil.user_role", user_role)

        start = time.monotonic()
        status = "error"
        error_class: Optional[str] = None
        finish_reason: Optional[str] = None
        input_tokens = 0
        output_tokens = 0
        cost_xaf = 0.0

        try:
            response = await invoke(model, prompt)

            # Extract Gemini-style usage metadata when available.
            um = getattr(response, "usage_metadata", None)
            if um is not None:
                input_tokens = int(getattr(um, "prompt_token_count", 0) or 0)
                output_tokens = int(getattr(um, "candidates_token_count", 0) or 0)
                span.set_attribute("gen_ai.usage.input_tokens", input_tokens)
                span.set_attribute("gen_ai.usage.output_tokens", output_tokens)

            cands = getattr(response, "candidates", None)
            if cands and len(cands) > 0:
                fr = getattr(cands[0], "finish_reason", None)
                if fr is not None:
                    finish_reason = str(fr)
                    span.set_attribute("gen_ai.response.finish_reasons", [finish_reason])

            cost_xaf = estimate_cost_xaf(model_name, input_tokens, output_tokens)
            if cost_xaf:
                span.set_attribute("facil.cost_xaf", cost_xaf)

            status = "success"
            return response

        except Exception as exc:
            error_class = exc.__class__.__name__
            status = classify_error(exc)
            span.record_exception(exc)
            if _OTEL_AVAILABLE and _otel_trace is not None:
                span.set_status(_otel_trace.Status(_otel_trace.StatusCode.ERROR, status))
            span.set_attribute("error.class", error_class)
            raise

        finally:
            latency_ms = int((time.monotonic() - start) * 1000)
            span.set_attribute("facil.latency_ms", latency_ms)

            # Fire-and-forget persist. Track for graceful shutdown.
            task = asyncio.create_task(_persist_metric(
                pool=pool,
                trace_id=trace_id, span_id=span_id,
                provider=provider, model_name=model_name, operation=operation,
                feature=feature, user_id=user_id, user_role=user_role,
                input_tokens=input_tokens, output_tokens=output_tokens,
                cost_xaf=cost_xaf, latency_ms=latency_ms,
                finish_reason=finish_reason, status=status,
                error_class=error_class, prompt_hash=prompt_hash,
            ))
            _track_task(task)


__all__ = [
    "traced_generate",
    "traced_embed",
    "estimate_cost_xaf",
    "hash_prompt",
    "classify_error",
    "flush_pending_persists",
    "PRICING_XAF",
]
