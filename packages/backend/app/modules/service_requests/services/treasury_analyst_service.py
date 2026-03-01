"""
Treasury Analyst Service — Gemini function-calling for treasury financial Q&A.

The LLM NEVER generates SQL. It ROUTES to predefined safe functions and
FORMATS the response with financial analysis.

Language: Spanish by default (Equatorial Guinea treasury context).
Pattern: Same as admin_assistant_service.py (lazy init, graceful fallback).
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional

from loguru import logger

from app.config import get_settings

try:
    from vertexai.generative_models import (
        GenerativeModel,
        GenerationConfig,
        Tool,
        FunctionDeclaration,
        Part,
        Content,
    )
    import vertexai

    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("Vertex AI SDK not available - Treasury analyst disabled")

_GEMINI_TIMEOUT_FIRST_CALL = 25.0
_GEMINI_TIMEOUT_SECOND_CALL = 30.0
_MAX_INIT_RETRIES = 3
_INIT_RETRY_DELAY = 2.0

# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """Eres el Analista Financiero IA del Tesoro Público de Guinea Ecuatorial
en la plataforma TaxasGE.

Tu rol: analizar datos REALES de pagos, ingresos, agentes de tesorería y SLA
para ayudar al supervisor del tesoro a tomar decisiones financieras informadas.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Cita cifras EXACTAS retornadas por las funciones (NUNCA inventes datos)
- Si los datos son insuficientes, dilo claramente
- Analiza los datos para detectar tendencias de ingresos, anomalías de pagos,
  problemas SLA, y rendimiento de agentes
- Propón acciones concretas cuando sea pertinente
- Sé factual y conciso (máximo 500 palabras)
- Los montos están en XAF (Franco CFA de África Central)
- NO hagas suposiciones sobre datos que no tienes

ESTRATEGIA DE FUNCIONES:
- Para preguntas AMPLIAS ("resumen de ingresos", "estado financiero"),
  llama MÚLTIPLES funciones simultáneamente
- Para preguntas ESPECÍFICAS, llama solo la función relevante
- SIEMPRE llama al menos una función. NUNCA respondas sin datos.

FORMATO DE RESPUESTA (Markdown):
- Usa encabezados ## y ### para estructurar
- Usa **negrita** para destacar datos importantes
- Usa tablas markdown para datos comparativos
- Al final, incluye "### Recomendaciones" con acciones concretas

FUNCIONES DISPONIBLES:
- get_revenue_summary: ingresos por estado/método/período
- get_revenue_by_service: ingresos por tipo de servicio (workflow_code)
- get_agent_performance: validaciones/rechazos/tiempo por agente
- get_sla_status: pagos pendientes con estado SLA
- get_anomaly_summary: anomalías por tipo/severidad/estado
- get_payment_trends: tendencia diaria de montantes y volúmenes
- get_reconciliation_status: métricas de rapprochement bancaire
- get_top_payers: principales contribuyentes (empresas/usuarios)"""


# ============================================================================
# FUNCTION DECLARATIONS
# ============================================================================

_FUNC_DECLS = []
if VERTEX_AI_AVAILABLE:
    _FUNC_DECLS = [
        FunctionDeclaration(
            name="get_revenue_summary",
            description="Resumen de ingresos: montante total, transacciones, promedio, desglose por estado y método de pago.",
            parameters={
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Período en días (default 30)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_revenue_by_service",
            description="Ingresos desglosados por tipo de servicio (workflow_code). Top servicios por montante.",
            parameters={
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Período en días (default 30)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_agent_performance",
            description="Rendimiento de agentes de tesorería: validaciones, rechazos, tiempo promedio, tasa SLA.",
            parameters={
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Período en días (default 30)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_sla_status",
            description="Estado actual SLA: pagos pendientes con clasificación breached/critical/warning/ok.",
            parameters={
                "type": "object",
                "properties": {},
            },
        ),
        FunctionDeclaration(
            name="get_anomaly_summary",
            description="Resumen de anomalías detectadas: por tipo, severidad, estado (open/resolved).",
            parameters={
                "type": "object",
                "properties": {},
            },
        ),
        FunctionDeclaration(
            name="get_payment_trends",
            description="Tendencia diaria de pagos: volúmenes y montantes por día. Útil para detectar patrones.",
            parameters={
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Período en días (default 30)"},
                },
            },
        ),
        FunctionDeclaration(
            name="get_reconciliation_status",
            description="Estado del rapprochement bancaire: transacciones reconciliadas vs no reconciliadas.",
            parameters={
                "type": "object",
                "properties": {},
            },
        ),
        FunctionDeclaration(
            name="get_top_payers",
            description="Principales contribuyentes (empresas o usuarios) por montante pagado.",
            parameters={
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Período en días (default 30)"},
                    "limit": {"type": "integer", "description": "Número de resultados (default 10)"},
                },
            },
        ),
    ]


# ============================================================================
# SAFE SQL FUNCTIONS (predefined queries — LLM never generates SQL)
# ============================================================================

async def _get_revenue_summary(db, days: int = 30) -> Dict[str, Any]:
    row = await db.fetchrow("""
        SELECT
            COALESCE(SUM(total_amount) FILTER (WHERE workflow_status = 'completed'), 0) AS completed_amount,
            COUNT(*) FILTER (WHERE workflow_status = 'completed') AS completed_count,
            COALESCE(AVG(total_amount) FILTER (WHERE workflow_status = 'completed'), 0) AS avg_amount,
            COALESCE(SUM(total_amount) FILTER (WHERE workflow_status IN ('pending_agent_review', 'agent_reviewing')), 0) AS pending_amount,
            COUNT(*) FILTER (WHERE workflow_status IN ('pending_agent_review', 'agent_reviewing')) AS pending_count,
            COUNT(*) FILTER (WHERE workflow_status = 'rejected_by_agent') AS rejected_count
        FROM service_payments
        WHERE created_at >= NOW() - make_interval(days => $1)
    """, days)
    methods = await db.fetch("""
        SELECT payment_method::text AS method, COUNT(*) AS count,
               COALESCE(SUM(total_amount), 0) AS amount
        FROM service_payments
        WHERE workflow_status = 'completed' AND validated_at >= NOW() - make_interval(days => $1)
        GROUP BY payment_method ORDER BY amount DESC
    """, days)
    by_entity = await db.fetch("""
        SELECT sp.entity_code, e.name AS entity_name,
               COUNT(*) AS count, COALESCE(SUM(sp.total_amount), 0) AS amount
        FROM service_payments sp
        LEFT JOIN entities e ON e.code = sp.entity_code
        WHERE sp.workflow_status = 'completed' AND sp.validated_at >= NOW() - make_interval(days => $1)
        GROUP BY sp.entity_code, e.name ORDER BY amount DESC
    """, days)
    return {
        "period_days": days,
        "completed": {"amount": float(row["completed_amount"]), "count": row["completed_count"], "avg": float(row["avg_amount"])},
        "pending": {"amount": float(row["pending_amount"]), "count": row["pending_count"]},
        "rejected_count": row["rejected_count"],
        "by_method": [{"method": m["method"], "count": m["count"], "amount": float(m["amount"])} for m in methods],
        "by_entity": [{"entity_code": r["entity_code"], "entity_name": r["entity_name"], "count": r["count"], "amount": float(r["amount"])} for r in by_entity],
    }


async def _get_revenue_by_service(db, days: int = 30) -> Dict[str, Any]:
    rows = await db.fetch("""
        SELECT sr.workflow_code, COALESCE(fs.name_es, sr.workflow_code) AS service_name,
               COUNT(*) AS count, COALESCE(SUM(sp.total_amount), 0) AS amount
        FROM service_payments sp
        JOIN service_requests sr ON sr.id = sp.service_request_id
        LEFT JOIN fiscal_services fs ON fs.id = sr.fiscal_service_id
        WHERE sp.workflow_status = 'completed' AND sp.validated_at >= NOW() - make_interval(days => $1)
        GROUP BY sr.workflow_code, fs.name_es ORDER BY amount DESC LIMIT 10
    """, days)
    by_entity = await db.fetch("""
        SELECT sp.entity_code, e.name AS entity_name,
               COUNT(*) AS count, COALESCE(SUM(sp.total_amount), 0) AS amount
        FROM service_payments sp
        LEFT JOIN entities e ON e.code = sp.entity_code
        WHERE sp.workflow_status = 'completed' AND sp.validated_at >= NOW() - make_interval(days => $1)
        GROUP BY sp.entity_code, e.name ORDER BY amount DESC LIMIT 10
    """, days)
    return {
        "period_days": days,
        "services": [{"code": r["workflow_code"], "name": r["service_name"], "count": r["count"], "amount": float(r["amount"])} for r in rows],
        "by_entity": [{"entity_code": r["entity_code"], "entity_name": r["entity_name"], "count": r["count"], "amount": float(r["amount"])} for r in by_entity],
    }


async def _get_agent_performance(db, days: int = 30) -> Dict[str, Any]:
    rows = await db.fetch("""
        SELECT u.full_name AS agent_name,
               COUNT(*) FILTER (WHERE pva.action = 'approve') AS validations,
               COUNT(*) FILTER (WHERE pva.action = 'reject') AS rejections,
               COALESCE(AVG(pva.action_duration_seconds) / 60.0, 0) AS avg_minutes,
               COUNT(*) FILTER (WHERE sp.sla_escalated = false OR sp.sla_escalated IS NULL)::float /
                   NULLIF(COUNT(*), 0) * 100 AS sla_rate
        FROM payment_validation_audit pva
        JOIN users u ON u.id = pva.agent_user_id
        JOIN service_payments sp ON sp.id = pva.payment_id
        WHERE pva.created_at >= NOW() - make_interval(days => $1) AND pva.agent_user_id IS NOT NULL
        GROUP BY u.full_name ORDER BY (COUNT(*) FILTER (WHERE pva.action = 'approve') + COUNT(*) FILTER (WHERE pva.action = 'reject')) DESC
    """, days)
    return {
        "period_days": days,
        "agents": [{"name": r["agent_name"], "validations": r["validations"], "rejections": r["rejections"],
                     "avg_minutes": round(float(r["avg_minutes"]), 1), "sla_rate": round(float(r["sla_rate"]) if r["sla_rate"] else 100, 1)} for r in rows],
    }


async def _get_sla_status(db) -> Dict[str, Any]:
    row = await db.fetchrow("""
        SELECT
            COUNT(*) AS total_pending,
            COUNT(*) FILTER (WHERE sla_target_date IS NOT NULL AND sla_target_date < NOW()) AS breached,
            COUNT(*) FILTER (WHERE sla_target_date IS NOT NULL AND sla_target_date BETWEEN NOW() AND NOW() + INTERVAL '2 hours') AS critical,
            COUNT(*) FILTER (WHERE sla_target_date IS NOT NULL AND sla_target_date BETWEEN NOW() + INTERVAL '2 hours' AND NOW() + INTERVAL '6 hours') AS warning,
            COUNT(*) FILTER (WHERE sla_target_date IS NULL OR sla_target_date > NOW() + INTERVAL '6 hours') AS on_time
        FROM service_payments
        WHERE workflow_status IN ('pending_agent_review', 'agent_reviewing')
          AND requires_agent_validation = true
    """)
    total = row["total_pending"] or 0
    return {
        "total_pending": total,
        "breached": row["breached"],
        "critical": row["critical"],
        "warning": row["warning"],
        "on_time": row["on_time"],
        "sla_respect_rate": round((total - row["breached"]) / max(total, 1) * 100, 1),
    }


async def _get_anomaly_summary(db) -> Dict[str, Any]:
    rows = await db.fetch("""
        SELECT anomaly_type, severity, status, COUNT(*) AS count
        FROM payment_anomalies
        GROUP BY anomaly_type, severity, status
        ORDER BY count DESC
    """)
    total = await db.fetchval("SELECT COUNT(*) FROM payment_anomalies")
    open_count = await db.fetchval("SELECT COUNT(*) FROM payment_anomalies WHERE status NOT IN ('resolved', 'false_positive')")
    return {
        "total": total or 0,
        "open": open_count or 0,
        "by_type": [{"type": r["anomaly_type"], "severity": r["severity"], "status": r["status"], "count": r["count"]} for r in rows],
    }


async def _get_payment_trends(db, days: int = 30) -> Dict[str, Any]:
    rows = await db.fetch("""
        SELECT DATE(validated_at) AS date, COUNT(*) AS count,
               COALESCE(SUM(total_amount), 0) AS amount
        FROM service_payments
        WHERE workflow_status = 'completed' AND validated_at >= NOW() - make_interval(days => $1)
        GROUP BY DATE(validated_at) ORDER BY date
    """, days)
    return {
        "period_days": days,
        "daily": [{"date": str(r["date"]), "count": r["count"], "amount": float(r["amount"])} for r in rows],
    }


async def _get_reconciliation_status(db) -> Dict[str, Any]:
    row = await db.fetchrow("""
        SELECT
            (SELECT COUNT(*) FROM bank_transactions WHERE payment_id IS NULL) AS unreconciled,
            (SELECT COUNT(*) FROM bank_transactions WHERE payment_id IS NOT NULL) AS reconciled,
            (SELECT COALESCE(SUM(amount), 0) FROM bank_transactions WHERE payment_id IS NULL) AS unreconciled_amount,
            (SELECT COALESCE(SUM(amount), 0) FROM bank_transactions WHERE payment_id IS NOT NULL) AS reconciled_amount
    """)
    return {
        "unreconciled_count": row["unreconciled"],
        "reconciled_count": row["reconciled"],
        "unreconciled_amount": float(row["unreconciled_amount"]),
        "reconciled_amount": float(row["reconciled_amount"]),
    }


async def _get_top_payers(db, days: int = 30, limit: int = 10) -> Dict[str, Any]:
    rows = await db.fetch("""
        SELECT u.full_name AS payer_name, u.email,
               COUNT(*) AS payment_count,
               COALESCE(SUM(sp.total_amount), 0) AS total_paid
        FROM service_payments sp
        JOIN users u ON u.id = sp.user_id
        WHERE sp.workflow_status = 'completed' AND sp.validated_at >= NOW() - make_interval(days => $1)
        GROUP BY u.id, u.full_name, u.email
        ORDER BY total_paid DESC LIMIT $2
    """, days, limit)
    return {
        "period_days": days,
        "payers": [{"name": r["payer_name"], "email": r["email"], "payments": r["payment_count"],
                     "total": float(r["total_paid"])} for r in rows],
    }


# Function map (str → async callable)
FUNCTION_MAP = {
    "get_revenue_summary": _get_revenue_summary,
    "get_revenue_by_service": _get_revenue_by_service,
    "get_agent_performance": _get_agent_performance,
    "get_sla_status": _get_sla_status,
    "get_anomaly_summary": _get_anomaly_summary,
    "get_payment_trends": _get_payment_trends,
    "get_reconciliation_status": _get_reconciliation_status,
    "get_top_payers": _get_top_payers,
}


# ============================================================================
# SERVICE CLASS
# ============================================================================

class TreasuryAnalystService:
    """Gemini function-calling service for treasury financial Q&A."""

    def __init__(self):
        self._model = None
        self._initialized = False
        self._init_attempts = 0

    def _ensure_initialized(self):
        if self._initialized:
            return
        if not VERTEX_AI_AVAILABLE:
            self._initialized = True
            return
        if self._init_attempts >= _MAX_INIT_RETRIES:
            return

        self._init_attempts += 1
        try:
            settings = get_settings()
            project_id = getattr(settings, "VERTEX_AI_PROJECT_ID", None) or getattr(settings, "GCP_PROJECT_ID", None)
            location = getattr(settings, "VERTEX_AI_LOCATION", "us-central1")

            if project_id:
                vertexai.init(project=project_id, location=location)

            tools = [Tool(function_declarations=_FUNC_DECLS)] if _FUNC_DECLS else None

            self._model = GenerativeModel(
                "gemini-2.0-flash",
                system_instruction=SYSTEM_PROMPT,
                tools=tools,
            )
            self._initialized = True
            logger.info("Treasury analyst service initialized")
        except Exception as e:
            logger.error(f"Treasury analyst init failed (attempt {self._init_attempts}): {e}")
            if self._init_attempts < _MAX_INIT_RETRIES:
                time.sleep(_INIT_RETRY_DELAY)
                self._ensure_initialized()

    async def process_question(self, db, question: str) -> Dict[str, Any]:
        """
        Process a treasury question using Gemini function calling.
        Flow: question → Gemini → picks tool(s) → safe SQL → data → Gemini → answer
        """
        self._ensure_initialized()
        start_time = time.monotonic()

        if not self._model:
            return {
                "answer": "Servicio IA no disponible temporalmente. Consulta los paneles de control.",
                "tools_used": [],
                "data": {},
            }

        tools_used: List[str] = []
        tool_results: Dict[str, Any] = {}

        try:
            loop = asyncio.get_running_loop()

            # Step 1: Send question → Gemini → function call(s)
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        question,
                        generation_config=GenerationConfig(temperature=0.2, max_output_tokens=512),
                    ),
                ),
                timeout=_GEMINI_TIMEOUT_FIRST_CALL,
            )

            if not response.candidates:
                return {"answer": "No se obtuvo respuesta. Reformula tu pregunta.", "tools_used": [], "data": {}}

            # Step 2: Extract function calls
            function_calls = []
            for candidate in response.candidates:
                if not hasattr(candidate, 'content') or not candidate.content:
                    continue
                for part in candidate.content.parts:
                    if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                        function_calls.append(part.function_call)

            if not function_calls:
                try:
                    text = (response.text or "").strip()
                except (ValueError, AttributeError):
                    text = ""
                return {"answer": text or "No puedo responder sin datos. Sé más específico.", "tools_used": [], "data": {}}

            # Step 3: Execute function calls in parallel
            async def _exec_fn(fn_name: str, fn_args: dict):
                if fn_name not in FUNCTION_MAP:
                    return fn_name, {"error": f"Función desconocida: {fn_name}"}
                try:
                    result = await FUNCTION_MAP[fn_name](db, **fn_args)
                    return fn_name, result
                except Exception as e:
                    logger.error(f"Treasury analyst function {fn_name} failed: {e}")
                    return fn_name, {"error": str(e)}

            tasks = []
            for fc in function_calls:
                fn_name = fc.name
                try:
                    fn_args = {k: v for k, v in fc.args.items()} if fc.args else {}
                    fn_args = {k: (int(v) if isinstance(v, float) and v == int(v) else v) for k, v in fn_args.items()}
                except (TypeError, AttributeError):
                    fn_args = {}
                tools_used.append(fn_name)
                tasks.append(_exec_fn(fn_name, fn_args))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    continue
                fn_name, fn_result = r
                tool_results[fn_name] = fn_result

            if not tool_results:
                return {"answer": "Error ejecutando las funciones de datos.", "tools_used": tools_used, "data": {}}

            # Step 4: Send function results back to Gemini
            function_response_parts = []
            for fn_name, fn_result in tool_results.items():
                function_response_parts.append(
                    Part.from_function_response(
                        name=fn_name,
                        response={"result": json.dumps(fn_result, default=str, ensure_ascii=False)},
                    )
                )

            chat_history = [
                Content(role="user", parts=[Part.from_text(question)]),
                response.candidates[0].content,
                Content(role="user", parts=function_response_parts),
            ]

            final_response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        chat_history,
                        generation_config=GenerationConfig(temperature=0.2, max_output_tokens=2048),
                    ),
                ),
                timeout=_GEMINI_TIMEOUT_SECOND_CALL,
            )

            try:
                answer = (final_response.text or "").strip()
            except (ValueError, AttributeError):
                answer = ""
            if not answer:
                answer = "No se pudo generar el análisis. Consulta los paneles."

            latency = int((time.monotonic() - start_time) * 1000)
            logger.info(f"Treasury analyst: tools={tools_used} latency={latency}ms q={question[:50]}")

            return {"answer": answer, "tools_used": tools_used, "data": tool_results}

        except asyncio.TimeoutError:
            if tool_results:
                return {"answer": "El análisis tardó demasiado. Datos parciales obtenidos.", "tools_used": tools_used, "data": tool_results}
            return {"answer": "Consulta demasiado lenta. Intenta con una pregunta más específica.", "tools_used": tools_used, "data": {}}
        except Exception as e:
            logger.error(f"Treasury analyst error: {type(e).__name__}: {e}")
            return {"answer": "Error procesando la consulta.", "tools_used": tools_used, "data": {}}

    async def generate_briefing(self, db) -> Dict[str, Any]:
        """Generate automated briefing from pre-computed data."""
        self._ensure_initialized()

        # Gather key metrics in parallel
        revenue, sla, anomalies, trends = await asyncio.gather(
            _get_revenue_summary(db, days=7),
            _get_sla_status(db),
            _get_anomaly_summary(db),
            _get_payment_trends(db, days=7),
        )

        # Determine priority
        priority = "normal"
        if sla["breached"] > 0 or anomalies["open"] > 3:
            priority = "urgent"
        elif sla["critical"] > 0 or sla["warning"] > 0 or anomalies["open"] > 0:
            priority = "attention"

        if not self._model:
            # Fallback without LLM
            return {
                "briefing": f"**Ingresos 7 días**: {revenue['completed']['amount']:,.0f} XAF ({revenue['completed']['count']} transacciones). "
                            f"**Pendientes**: {revenue['pending']['count']}. "
                            f"**SLA**: {sla['sla_respect_rate']}% respeto ({sla['breached']} vencidos). "
                            f"**Anomalías**: {anomalies['open']} abiertas.",
                "priority": priority,
                "recommendations": [],
            }

        # Use LLM for natural language briefing
        data_summary = json.dumps(
            {"revenue_7d": revenue, "sla": sla, "anomalies": anomalies, "trends_7d": trends},
            default=str, ensure_ascii=False,
        )

        briefing_prompt = (
            f"Genera un resumen ejecutivo BREVE (máximo 150 palabras) de la situación financiera actual del Tesoro. "
            f"Incluye: ingresos recientes, estado SLA, anomalías si hay. "
            f"Termina con 2-3 recomendaciones concretas.\n\n"
            f"DATOS:\n{data_summary}"
        )

        try:
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        briefing_prompt,
                        generation_config=GenerationConfig(temperature=0.3, max_output_tokens=512),
                    ),
                ),
                timeout=_GEMINI_TIMEOUT_SECOND_CALL,
            )
            try:
                briefing_text = (response.text or "").strip()
            except (ValueError, AttributeError):
                briefing_text = ""
        except Exception as e:
            logger.error(f"Treasury briefing LLM failed: {e}")
            briefing_text = ""

        if not briefing_text:
            briefing_text = (
                f"**Ingresos 7 días**: {revenue['completed']['amount']:,.0f} XAF "
                f"({revenue['completed']['count']} transacciones). "
                f"**Pendientes**: {revenue['pending']['count']}. "
                f"**SLA**: {sla['sla_respect_rate']}% respeto."
            )

        return {
            "briefing": briefing_text,
            "priority": priority,
            "recommendations": [],
            "data": {"revenue": revenue, "sla": sla, "anomalies_open": anomalies["open"]},
        }


# Singleton
treasury_analyst_service = TreasuryAnalystService()
