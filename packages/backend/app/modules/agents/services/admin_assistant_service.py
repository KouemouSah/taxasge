"""
Admin Assistant Service — Gemini function-calling for agent management Q&A.

The LLM NEVER generates SQL. It ROUTES to predefined safe functions and
FORMATS the response. It also ANALYZES data for anomalies and patterns.

Language: Spanish by default (Equatorial Guinea admin context).

Design: Same pattern as LLMRoutingService (lazy init, graceful fallback).
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
    )
    from google.protobuf.struct_pb2 import Struct
    import vertexai

    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("Vertex AI SDK not available - Admin assistant disabled")


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """Eres el asistente IA del administrador del sistema TaxasGE
(plataforma gubernamental de servicios fiscales de Guinea Ecuatorial).

Tu rol: analizar datos REALES de los agentes gubernamentales para ayudar al
administrador a tomar decisiones informadas y detectar problemas.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Cita cifras EXACTAS retornadas por las funciones (NUNCA inventes datos)
- Si los datos son insuficientes, dilo claramente
- Analiza los datos para detectar anomalías y patrones (agentes siempre sobrecargados,
  patrones de inactividad, distribución desigual de carga, SLA recurrentemente en riesgo)
- Propón acciones concretas cuando sea pertinente
- Sé factual y conciso (máximo 400 palabras)
- Si una función retorna datos vacíos, menciónalo
- NO hagas suposiciones sobre datos que no tienes

FORMATO DE RESPUESTA (Markdown):
- Usa encabezados ## y ### para estructurar
- Usa **negrita** para destacar datos importantes
- Cuando presentes datos comparativos o listas de agentes, usa TABLAS markdown:
  | Agente | Capacidad | Estado |
  |--------|-----------|--------|
  | María  | 85%       | ⚠️ Sobrecargado |
- Usa listas con - para acciones recomendadas
- Usa `código` para códigos de entidad o referencias técnicas

CAPACIDADES:
- Consultar resumen de alertas activas
- Consultar estadísticas individuales de agentes
- Comparar agentes de una entidad (con ranking y análisis de desequilibrios)
- Analizar distribución de carga entre entidades
- Detectar agentes inactivos
- Generar reportes SLA
- Analizar rendimiento y tendencias (tasa de éxito, rechazo, cumplimiento SLA)
- Detectar anomalías estadísticas (desviaciones significativas de la media)"""


# ============================================================================
# FUNCTION DECLARATIONS (predefined safe SQL functions)
# ============================================================================

TOOL_FUNCTIONS = [
    FunctionDeclaration(
        name="get_alerts_summary",
        description="Obtener resumen de alertas activas: agentes inactivos, sobrecargados, bloqueos obsoletos y SLA en riesgo.",
        parameters={
            "type": "object",
            "properties": {},
        },
    ),
    FunctionDeclaration(
        name="get_agent_summary",
        description="Obtener estadísticas completas de un agente específico: rendimiento mensual, carga de trabajo, calidad.",
        parameters={
            "type": "object",
            "properties": {
                "agent_name": {
                    "type": "string",
                    "description": "Nombre completo o parcial del agente a consultar",
                },
            },
            "required": ["agent_name"],
        },
    ),
    FunctionDeclaration(
        name="compare_entity_agents",
        description="Comparar todos los agentes de una entidad: carga, rendimiento, actividad.",
        parameters={
            "type": "object",
            "properties": {
                "entity_code": {
                    "type": "string",
                    "description": "Código de la entidad (ej: TESORO, CNEDOGE, DGT, ITVE)",
                },
            },
            "required": ["entity_code"],
        },
    ),
    FunctionDeclaration(
        name="get_workload_distribution",
        description="Ver distribución de carga de trabajo entre todas las entidades.",
        parameters={
            "type": "object",
            "properties": {},
        },
    ),
    FunctionDeclaration(
        name="get_inactive_agents",
        description="Listar agentes sin actividad durante un período determinado.",
        parameters={
            "type": "object",
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Número de días de inactividad (por defecto 2)",
                },
            },
        },
    ),
    FunctionDeclaration(
        name="get_sla_report",
        description="Obtener reporte de cumplimiento SLA: pagos pendientes, tiempos promedio, violaciones.",
        parameters={
            "type": "object",
            "properties": {},
        },
    ),
    FunctionDeclaration(
        name="analyze_performance_ranking",
        description="Análisis de rendimiento: ranking de todos los agentes por tasa de éxito, calidad, cumplimiento SLA. Detecta los mejores y peores performers con estadísticas detalladas.",
        parameters={
            "type": "object",
            "properties": {
                "metric": {
                    "type": "string",
                    "description": "Métrica de ranking: 'success_rate' (tasa de éxito), 'quality' (calidad), 'sla_compliance' (cumplimiento SLA), 'productivity' (expedientes procesados). Por defecto: success_rate",
                },
            },
        },
    ),
    FunctionDeclaration(
        name="detect_anomalies",
        description="Detección de anomalías estadísticas: identifica agentes con métricas que se desvían significativamente de la media del grupo (>1.5 desviaciones estándar). Detecta patrones de rendimiento inusuales.",
        parameters={
            "type": "object",
            "properties": {},
        },
    ),
    FunctionDeclaration(
        name="analyze_entity_balance",
        description="Análisis de equilibrio de carga entre entidades: detecta desequilibrios en la distribución de trabajo, identifica entidades sobrecargadas vs infrautilizadas, calcula ratio agente/expediente.",
        parameters={
            "type": "object",
            "properties": {},
        },
    ),
    FunctionDeclaration(
        name="get_processing_trends",
        description="Tendencias de procesamiento: volumen de expedientes procesados, aprobados, rechazados y escalados por período. Detecta cambios de tendencia.",
        parameters={
            "type": "object",
            "properties": {
                "period_days": {
                    "type": "integer",
                    "description": "Período de análisis en días (7, 14, 30). Por defecto: 30",
                },
            },
        },
    ),
]


# ============================================================================
# DATA FUNCTIONS (safe, parameterized SQL)
# ============================================================================

async def _exec_get_alerts_summary(db) -> Dict[str, Any]:
    """Reuse alerts dashboard query."""
    from app.modules.agents.repositories.workload_repository import WorkloadRepository
    repo = WorkloadRepository()
    return await repo.get_admin_alerts_dashboard(db) or {}


async def _exec_get_agent_summary(db, agent_name: str) -> Dict[str, Any]:
    """Get single agent stats by name search."""
    row = await db.fetchrow("""
        SELECT ap.id, u.full_name, u.email, e.code as entity_code, e.name as entity_name,
               aw.current_assignments, aw.max_concurrent_assignments,
               aw.capacity_percentage, aw.workload_status, aw.availability,
               aw.quality_score_avg, aw.success_rate, aw.deadline_compliance_rate,
               aw.last_assignment_at, aw.last_completion_at
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        WHERE ap.is_active = true
        AND u.full_name ILIKE $1
        LIMIT 1
    """, f"%{agent_name}%")

    if not row:
        return {"error": f"No se encontró agente con nombre '{agent_name}'"}

    profile_id = str(row["id"])

    # Get performance stats
    from app.modules.agents.repositories.workload_repository import WorkloadRepository
    repo = WorkloadRepository()
    perf = await repo.get_performance_by_profile_id(db, profile_id) or {}

    return {
        "agent_name": row["full_name"],
        "email": row["email"],
        "entity": row["entity_code"] or "N/A",
        "entity_name": row["entity_name"] or "N/A",
        "current_assignments": row["current_assignments"] or 0,
        "max_assignments": row["max_concurrent_assignments"] or 20,
        "capacity_pct": float(row["capacity_percentage"] or 0),
        "status": row["workload_status"] or "unknown",
        "availability": row["availability"] or "unknown",
        "quality_score": float(row["quality_score_avg"] or 0),
        "success_rate": float(row["success_rate"] or 0),
        "deadline_compliance": float(row["deadline_compliance_rate"] or 0),
        "last_assignment": str(row["last_assignment_at"]) if row["last_assignment_at"] else None,
        "last_completion": str(row["last_completion_at"]) if row["last_completion_at"] else None,
        "month_processed": perf.get("current_month_processed", 0),
        "month_approved": perf.get("current_month_approved", 0),
        "month_rejected": perf.get("current_month_rejected", 0),
        "month_escalated": perf.get("current_month_escalated", 0),
        "sla_respected": perf.get("sla_respected_count", 0),
        "sla_missed": perf.get("sla_missed_count", 0),
    }


async def _exec_compare_entity_agents(db, entity_code: str) -> Dict[str, Any]:
    """Compare all agents in an entity."""
    rows = await db.fetch("""
        SELECT u.full_name, aw.current_assignments, aw.capacity_percentage,
               aw.workload_status, aw.availability, aw.quality_score_avg,
               aw.success_rate, aw.last_assignment_at, aw.last_completion_at
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        WHERE ap.is_active = true AND e.code = $1
        ORDER BY aw.capacity_percentage DESC NULLS LAST
    """, entity_code)

    if not rows:
        return {"error": f"No se encontraron agentes para entidad '{entity_code}'"}

    agents = []
    for r in rows:
        agents.append({
            "name": r["full_name"],
            "assignments": r["current_assignments"] or 0,
            "capacity_pct": float(r["capacity_percentage"] or 0),
            "status": r["workload_status"] or "unknown",
            "availability": r["availability"] or "unknown",
            "quality": float(r["quality_score_avg"] or 0),
            "success_rate": float(r["success_rate"] or 0),
            "last_activity": str(r["last_assignment_at"] or r["last_completion_at"] or "N/A"),
        })

    return {"entity": entity_code, "agent_count": len(agents), "agents": agents}


async def _exec_get_workload_distribution(db) -> Dict[str, Any]:
    """Workload distribution across entities."""
    rows = await db.fetch("""
        SELECT e.code, e.name,
               COUNT(ap.id) as agent_count,
               COUNT(*) FILTER (WHERE aw.capacity_percentage > 80) as overloaded,
               COALESCE(AVG(aw.capacity_percentage), 0)::int as avg_capacity,
               COALESCE(SUM(aw.current_assignments), 0) as total_assignments
        FROM agent_profiles ap
        JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        WHERE ap.is_active = true
        GROUP BY e.code, e.name
        ORDER BY avg_capacity DESC
    """)

    entities = []
    for r in rows:
        entities.append({
            "code": r["code"],
            "name": r["name"],
            "agents": r["agent_count"],
            "overloaded": r["overloaded"],
            "avg_capacity": r["avg_capacity"],
            "assignments": r["total_assignments"],
        })

    return {"entity_count": len(entities), "entities": entities}


async def _exec_get_inactive_agents(db, days: int = 2) -> Dict[str, Any]:
    """Find agents inactive for N days."""
    rows = await db.fetch("""
        SELECT u.full_name, e.code as entity_code,
               aw.last_assignment_at, aw.last_completion_at,
               aw.availability, aw.availability_reason
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        WHERE ap.is_active = true
        AND (
            GREATEST(aw.last_assignment_at, aw.last_completion_at)
            < NOW() - make_interval(days => $1)
            OR (aw.last_assignment_at IS NULL AND aw.last_completion_at IS NULL)
        )
        ORDER BY GREATEST(aw.last_assignment_at, aw.last_completion_at) ASC NULLS FIRST
    """, days)

    agents = []
    for r in rows:
        last = r["last_assignment_at"] or r["last_completion_at"]
        agents.append({
            "name": r["full_name"],
            "entity": r["entity_code"] or "N/A",
            "last_activity": str(last) if last else "Nunca",
            "availability": r["availability"] or "unknown",
            "reason": r["availability_reason"],
        })

    return {"days_threshold": days, "inactive_count": len(agents), "agents": agents}


async def _exec_get_sla_report(db) -> Dict[str, Any]:
    """SLA compliance report."""
    row = await db.fetchrow("""
        SELECT
            COUNT(*) FILTER (WHERE workflow_status = 'pending_agent_review') as pending_review,
            COUNT(*) FILTER (WHERE workflow_status IN ('locked_by_agent', 'agent_reviewing')) as in_review,
            COUNT(*) FILTER (WHERE sla_target_date < NOW() AND workflow_status NOT IN ('completed', 'cancelled', 'rejected')) as sla_expired,
            COUNT(*) FILTER (WHERE sla_target_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
                AND workflow_status NOT IN ('completed', 'cancelled', 'rejected')) as sla_at_risk,
            AVG(EXTRACT(EPOCH FROM (COALESCE(validated_at, NOW()) - created_at)) / 3600)
                FILTER (WHERE workflow_status IN ('approved', 'rejected', 'completed')) as avg_processing_hours
        FROM service_payments
        WHERE created_at > NOW() - INTERVAL '30 days'
    """)

    return {
        "period": "Últimos 30 días",
        "pending_review": row["pending_review"] or 0,
        "in_review": row["in_review"] or 0,
        "sla_expired": row["sla_expired"] or 0,
        "sla_at_risk_24h": row["sla_at_risk"] or 0,
        "avg_processing_hours": round(float(row["avg_processing_hours"] or 0), 1),
    }


async def _exec_analyze_performance_ranking(db, metric: str = "success_rate") -> Dict[str, Any]:
    """Rank all agents by a performance metric with statistical analysis."""
    rows = await db.fetch("""
        SELECT u.full_name, e.code as entity_code,
               aw.capacity_percentage,
               aw.current_assignments,
               aw.quality_score_avg,
               aw.success_rate,
               aw.deadline_compliance_rate,
               aps.total_processed,
               aps.total_approved,
               aps.total_rejected,
               aps.total_escalated,
               aps.avg_processing_time_hours
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        LEFT JOIN agent_performance_stats aps ON aps.agent_profile_id = ap.id
            AND aps.period_start = date_trunc('month', CURRENT_DATE)
        WHERE ap.is_active = true
        ORDER BY CASE $1
            WHEN 'success_rate' THEN COALESCE(aw.success_rate, 0)
            WHEN 'quality' THEN COALESCE(aw.quality_score_avg, 0)
            WHEN 'sla_compliance' THEN COALESCE(aw.deadline_compliance_rate, 0)
            WHEN 'productivity' THEN COALESCE(aps.total_processed, 0)
            ELSE COALESCE(aw.success_rate, 0)
        END DESC NULLS LAST
    """, metric)

    if not rows:
        return {"error": "No hay agentes activos con datos de rendimiento"}

    agents = []
    metric_values = []
    for rank, r in enumerate(rows, 1):
        val = float(r[{
            "success_rate": "success_rate",
            "quality": "quality_score_avg",
            "sla_compliance": "deadline_compliance_rate",
            "productivity": "total_processed",
        }.get(metric, "success_rate")] or 0)
        metric_values.append(val)
        agents.append({
            "rank": rank,
            "name": r["full_name"],
            "entity": r["entity_code"] or "N/A",
            "success_rate": float(r["success_rate"] or 0),
            "quality_score": float(r["quality_score_avg"] or 0),
            "sla_compliance": float(r["deadline_compliance_rate"] or 0),
            "month_processed": r["total_processed"] or 0,
            "month_approved": r["total_approved"] or 0,
            "month_rejected": r["total_rejected"] or 0,
            "month_escalated": r["total_escalated"] or 0,
            "avg_processing_hours": round(float(r["avg_processing_time_hours"] or 0), 1),
            "capacity_pct": float(r["capacity_percentage"] or 0),
        })

    # Statistical summary
    n = len(metric_values)
    avg_val = sum(metric_values) / n if n > 0 else 0
    variance = sum((v - avg_val) ** 2 for v in metric_values) / n if n > 0 else 0
    std_dev = variance ** 0.5

    return {
        "metric": metric,
        "agent_count": n,
        "agents": agents,
        "statistics": {
            "mean": round(avg_val, 1),
            "std_dev": round(std_dev, 1),
            "min": round(min(metric_values), 1) if metric_values else 0,
            "max": round(max(metric_values), 1) if metric_values else 0,
        },
        "top_performers": [a["name"] for a in agents[:3]],
        "bottom_performers": [a["name"] for a in agents[-3:]] if n > 3 else [],
    }


async def _exec_detect_anomalies(db) -> Dict[str, Any]:
    """Detect statistical anomalies across all agent metrics."""
    rows = await db.fetch("""
        SELECT u.full_name, e.code as entity_code,
               aw.capacity_percentage,
               aw.success_rate,
               aw.quality_score_avg,
               aw.deadline_compliance_rate,
               aw.current_assignments,
               aps.total_processed,
               aps.total_rejected,
               aps.total_escalated,
               aps.avg_processing_time_hours,
               aw.last_assignment_at,
               aw.last_completion_at
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        LEFT JOIN agent_performance_stats aps ON aps.agent_profile_id = ap.id
            AND aps.period_start = date_trunc('month', CURRENT_DATE)
        WHERE ap.is_active = true
    """)

    if not rows:
        return {"anomalies": [], "message": "No hay datos suficientes para análisis"}

    # Collect metrics per agent
    agents_data = []
    for r in rows:
        agents_data.append({
            "name": r["full_name"],
            "entity": r["entity_code"] or "N/A",
            "capacity": float(r["capacity_percentage"] or 0),
            "success_rate": float(r["success_rate"] or 0),
            "quality": float(r["quality_score_avg"] or 0),
            "sla_compliance": float(r["deadline_compliance_rate"] or 0),
            "processed": r["total_processed"] or 0,
            "rejected": r["total_rejected"] or 0,
            "escalated": r["total_escalated"] or 0,
            "avg_hours": float(r["avg_processing_time_hours"] or 0),
            "last_activity": str(r["last_assignment_at"] or r["last_completion_at"] or "N/A"),
        })

    n = len(agents_data)
    if n < 3:
        return {"anomalies": [], "agents": agents_data, "message": "Pocos agentes para detectar anomalías estadísticas (mínimo 3)"}

    # Compute mean and std for key metrics, flag outliers (>1.5 std)
    metrics_to_check = ["capacity", "success_rate", "quality", "sla_compliance", "avg_hours"]
    anomalies = []

    for metric_name in metrics_to_check:
        values = [a[metric_name] for a in agents_data]
        avg_val = sum(values) / n
        variance = sum((v - avg_val) ** 2 for v in values) / n
        std_dev = variance ** 0.5

        if std_dev < 0.01:  # No variance = no anomalies
            continue

        threshold = 1.5
        for agent in agents_data:
            val = agent[metric_name]
            z_score = (val - avg_val) / std_dev
            if abs(z_score) > threshold:
                direction = "alto" if z_score > 0 else "bajo"
                severity = "critico" if abs(z_score) > 2.5 else "moderado" if abs(z_score) > 2.0 else "leve"
                anomalies.append({
                    "agent": agent["name"],
                    "entity": agent["entity"],
                    "metric": metric_name,
                    "value": round(val, 1),
                    "mean": round(avg_val, 1),
                    "std_dev": round(std_dev, 1),
                    "z_score": round(z_score, 2),
                    "direction": direction,
                    "severity": severity,
                    "description": f"{agent['name']} tiene {metric_name}={round(val,1)} ({direction}), media={round(avg_val,1)}, desviación={round(z_score,2)}σ",
                })

    # Check for rejection rate anomalies
    for agent in agents_data:
        if agent["processed"] > 0:
            rejection_rate = agent["rejected"] / agent["processed"] * 100
            if rejection_rate > 30:
                anomalies.append({
                    "agent": agent["name"],
                    "entity": agent["entity"],
                    "metric": "rejection_rate",
                    "value": round(rejection_rate, 1),
                    "severity": "critico" if rejection_rate > 50 else "moderado",
                    "description": f"{agent['name']} tiene tasa de rechazo {round(rejection_rate,1)}% ({agent['rejected']}/{agent['processed']} expedientes)",
                })

    return {
        "agent_count": n,
        "anomaly_count": len(anomalies),
        "anomalies": sorted(anomalies, key=lambda a: a.get("severity", "leve") == "critico", reverse=True),
        "agents_summary": agents_data,
    }


async def _exec_analyze_entity_balance(db) -> Dict[str, Any]:
    """Analyze workload balance across entities with ratio analysis."""
    rows = await db.fetch("""
        SELECT e.code, e.name,
               COUNT(ap.id) as agent_count,
               COALESCE(SUM(aw.current_assignments), 0) as total_assignments,
               COALESCE(AVG(aw.capacity_percentage), 0)::int as avg_capacity,
               COALESCE(MAX(aw.capacity_percentage), 0)::int as max_capacity,
               COALESCE(MIN(aw.capacity_percentage), 0)::int as min_capacity,
               COUNT(*) FILTER (WHERE aw.capacity_percentage > 80) as overloaded_count,
               COUNT(*) FILTER (WHERE aw.capacity_percentage < 20) as underutilized_count,
               COALESCE(AVG(aw.success_rate), 0) as avg_success_rate,
               COALESCE(AVG(aw.quality_score_avg), 0) as avg_quality
        FROM agent_profiles ap
        JOIN entities e ON e.id = ap.entity_id
        LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
        WHERE ap.is_active = true
        GROUP BY e.code, e.name
        ORDER BY avg_capacity DESC
    """)

    if not rows:
        return {"error": "No hay datos de entidades disponibles"}

    entities = []
    total_agents = 0
    total_assignments = 0
    capacities = []
    for r in rows:
        agent_count = r["agent_count"]
        assignments = r["total_assignments"]
        total_agents += agent_count
        total_assignments += assignments
        avg_cap = r["avg_capacity"]
        capacities.append(avg_cap)
        ratio = round(assignments / agent_count, 1) if agent_count > 0 else 0
        entities.append({
            "code": r["code"],
            "name": r["name"],
            "agents": agent_count,
            "assignments": assignments,
            "ratio_assignments_per_agent": ratio,
            "avg_capacity": avg_cap,
            "max_capacity": r["max_capacity"],
            "min_capacity": r["min_capacity"],
            "capacity_spread": r["max_capacity"] - r["min_capacity"],
            "overloaded": r["overloaded_count"],
            "underutilized": r["underutilized_count"],
            "avg_success_rate": round(float(r["avg_success_rate"]), 1),
            "avg_quality": round(float(r["avg_quality"]), 1),
        })

    # Balance analysis
    n = len(capacities)
    avg_capacity = sum(capacities) / n if n > 0 else 0
    variance = sum((c - avg_capacity) ** 2 for c in capacities) / n if n > 0 else 0
    balance_score = max(0, 100 - variance ** 0.5)  # 100 = perfectly balanced

    most_loaded = max(entities, key=lambda e: e["avg_capacity"]) if entities else None
    least_loaded = min(entities, key=lambda e: e["avg_capacity"]) if entities else None

    imbalances = []
    if most_loaded and least_loaded:
        gap = most_loaded["avg_capacity"] - least_loaded["avg_capacity"]
        if gap > 30:
            imbalances.append(f"Desequilibrio significativo: {most_loaded['code']} ({most_loaded['avg_capacity']}%) vs {least_loaded['code']} ({least_loaded['avg_capacity']}%), diferencia={gap}%")
    for e in entities:
        if e["capacity_spread"] > 40:
            imbalances.append(f"Carga interna desigual en {e['code']}: min={e['min_capacity']}% max={e['max_capacity']}% (spread={e['capacity_spread']}%)")

    return {
        "entity_count": n,
        "total_agents": total_agents,
        "total_assignments": total_assignments,
        "global_avg_capacity": round(avg_capacity, 1),
        "balance_score": round(balance_score, 1),
        "entities": entities,
        "imbalances": imbalances,
        "most_loaded_entity": most_loaded["code"] if most_loaded else None,
        "least_loaded_entity": least_loaded["code"] if least_loaded else None,
    }


async def _exec_get_processing_trends(db, period_days: int = 30) -> Dict[str, Any]:
    """Analyze processing volume trends over time."""
    period_days = min(max(period_days, 7), 90)  # Clamp 7-90 days

    rows = await db.fetch("""
        SELECT date_trunc('day', pva.validated_at)::date as day,
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE pva.action = 'approve') as approved,
               COUNT(*) FILTER (WHERE pva.action = 'reject') as rejected,
               COUNT(*) FILTER (WHERE pva.action = 'escalate') as escalated,
               AVG(EXTRACT(EPOCH FROM (pva.validated_at - sp.created_at)) / 3600) as avg_hours
        FROM payment_validation_audit pva
        JOIN service_payments sp ON sp.id = pva.service_payment_id
        WHERE pva.validated_at > NOW() - make_interval(days => $1)
        GROUP BY date_trunc('day', pva.validated_at)::date
        ORDER BY day
    """, period_days)

    if not rows:
        return {"error": "No hay datos de procesamiento para el período seleccionado", "period_days": period_days}

    daily = []
    totals = {"processed": 0, "approved": 0, "rejected": 0, "escalated": 0}
    for r in rows:
        day_data = {
            "date": str(r["day"]),
            "total": r["total"],
            "approved": r["approved"],
            "rejected": r["rejected"],
            "escalated": r["escalated"],
            "avg_processing_hours": round(float(r["avg_hours"] or 0), 1),
        }
        daily.append(day_data)
        totals["processed"] += r["total"]
        totals["approved"] += r["approved"]
        totals["rejected"] += r["rejected"]
        totals["escalated"] += r["escalated"]

    # Trend detection: compare first half vs second half
    mid = len(daily) // 2
    first_half = daily[:mid] if mid > 0 else daily
    second_half = daily[mid:] if mid > 0 else daily

    avg_first = sum(d["total"] for d in first_half) / len(first_half) if first_half else 0
    avg_second = sum(d["total"] for d in second_half) / len(second_half) if second_half else 0

    trend = "estable"
    if avg_first > 0:
        change_pct = ((avg_second - avg_first) / avg_first) * 100
        if change_pct > 20:
            trend = "creciente"
        elif change_pct < -20:
            trend = "decreciente"
    else:
        change_pct = 0.0

    rejection_rate = round(totals["rejected"] / totals["processed"] * 100, 1) if totals["processed"] > 0 else 0
    escalation_rate = round(totals["escalated"] / totals["processed"] * 100, 1) if totals["processed"] > 0 else 0

    return {
        "period_days": period_days,
        "days_with_data": len(daily),
        "daily_breakdown": daily,
        "totals": totals,
        "rates": {
            "approval_rate": round(totals["approved"] / totals["processed"] * 100, 1) if totals["processed"] > 0 else 0,
            "rejection_rate": rejection_rate,
            "escalation_rate": escalation_rate,
        },
        "trend": {
            "direction": trend,
            "change_pct": round(change_pct, 1),
            "avg_daily_first_half": round(avg_first, 1),
            "avg_daily_second_half": round(avg_second, 1),
        },
    }


# Function dispatcher
FUNCTION_MAP = {
    "get_alerts_summary": lambda db, **_: _exec_get_alerts_summary(db),
    "get_agent_summary": lambda db, **kw: _exec_get_agent_summary(db, kw.get("agent_name", "")),
    "compare_entity_agents": lambda db, **kw: _exec_compare_entity_agents(db, kw.get("entity_code", "")),
    "get_workload_distribution": lambda db, **_: _exec_get_workload_distribution(db),
    "get_inactive_agents": lambda db, **kw: _exec_get_inactive_agents(db, kw.get("days", 2)),
    "get_sla_report": lambda db, **_: _exec_get_sla_report(db),
    "analyze_performance_ranking": lambda db, **kw: _exec_analyze_performance_ranking(db, kw.get("metric", "success_rate")),
    "detect_anomalies": lambda db, **_: _exec_detect_anomalies(db),
    "analyze_entity_balance": lambda db, **_: _exec_analyze_entity_balance(db),
    "get_processing_trends": lambda db, **kw: _exec_get_processing_trends(db, kw.get("period_days", 30)),
}


# ============================================================================
# SERVICE CLASS
# ============================================================================

class AdminAssistantService:
    """Gemini function-calling admin assistant."""

    def __init__(self):
        self._model: Optional[GenerativeModel] = None
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy initialization."""
        if self._initialized:
            return

        if not VERTEX_AI_AVAILABLE:
            self._initialized = True
            return

        try:
            settings = get_settings()
            vertexai.init(
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION,
            )
            tools = [Tool(function_declarations=TOOL_FUNCTIONS)]
            model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
            self._model = GenerativeModel(
                model_name,
                system_instruction=SYSTEM_PROMPT,
                tools=tools,
            )
            self._initialized = True
            logger.info("Admin Assistant Service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Admin Assistant: {e}")
            self._initialized = True

    async def process_question(
        self, db, question: str
    ) -> Dict[str, Any]:
        """
        Process an admin question using Gemini function calling.

        Flow: question → Gemini → picks tool(s) → safe SQL → data → Gemini → answer

        Args:
            db: Database connection
            question: Admin's question in natural language

        Returns:
            {"answer": str, "tools_used": list, "data": dict}
        """
        self._ensure_initialized()
        start_time = time.monotonic()

        if not self._model:
            return {
                "answer": "Servicio IA no disponible temporalmente. Los datos están accesibles desde los paneles de control.",
                "tools_used": [],
                "data": {},
            }

        tools_used: List[str] = []
        tool_results: Dict[str, Any] = {}

        try:
            loop = asyncio.get_running_loop()

            # Step 1: Send question to Gemini, get function call(s)
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        question,
                        generation_config=GenerationConfig(
                            temperature=0.2,
                            max_output_tokens=1024,
                        ),
                    ),
                ),
                timeout=15.0,
            )

            # Safely handle empty response
            if not response.candidates:
                return {
                    "answer": "No se obtuvo respuesta del modelo. Intenta de nuevo.",
                    "tools_used": [],
                    "data": {},
                }

            # Step 2: Execute function calls
            function_calls = []
            for candidate in response.candidates:
                if not hasattr(candidate, 'content') or not candidate.content:
                    continue
                for part in candidate.content.parts:
                    if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                        function_calls.append(part.function_call)

            if not function_calls:
                # No function call — direct text response
                try:
                    text = (response.text or "").strip()
                except (ValueError, AttributeError):
                    text = ""
                latency = int((time.monotonic() - start_time) * 1000)
                logger.info(f"Admin assistant (direct): latency={latency}ms")
                return {
                    "answer": text or "No puedo responder a esta pregunta con los datos disponibles.",
                    "tools_used": [],
                    "data": {},
                }

            # Execute function calls in parallel
            async def _exec_fn(fn_name: str, fn_args: dict):
                if fn_name not in FUNCTION_MAP:
                    return fn_name, {"error": f"Función desconocida: {fn_name}"}
                try:
                    result = await FUNCTION_MAP[fn_name](db, **fn_args)
                    return fn_name, result
                except Exception as e:
                    logger.error(f"Function {fn_name} failed: {e}")
                    return fn_name, {"error": str(e)}

            tasks = []
            for fc in function_calls:
                fn_name = fc.name
                # Safely convert protobuf MapComposite to plain dict
                try:
                    fn_args = {k: v for k, v in fc.args.items()} if fc.args else {}
                except (TypeError, AttributeError):
                    fn_args = {}
                tools_used.append(fn_name)
                tasks.append(_exec_fn(fn_name, fn_args))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    logger.error(f"Function execution error: {r}")
                    continue
                fn_name, fn_result = r
                tool_results[fn_name] = fn_result

            # Step 3: Send function results back to Gemini for natural language answer
            from vertexai.generative_models import Part, Content

            # Build the function response parts
            function_response_parts = []
            for fn_name, fn_result in tool_results.items():
                function_response_parts.append(
                    Part.from_function_response(
                        name=fn_name,
                        response={"result": json.dumps(fn_result, default=str, ensure_ascii=False)},
                    )
                )

            # Multi-turn: [user question, model function calls, function responses + format instruction]
            format_hint = Part.from_text(
                "Analiza estos datos y responde en Markdown. "
                "Usa tablas cuando presentes datos comparativos de múltiples agentes o entidades. "
                "Usa **negrita** para datos clave y listas - para acciones recomendadas."
            )
            chat_history = [
                Content(role="user", parts=[Part.from_text(question)]),
                response.candidates[0].content,
                Content(role="user", parts=function_response_parts + [format_hint]),
            ]

            final_response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(
                        chat_history,
                        generation_config=GenerationConfig(
                            temperature=0.2,
                            max_output_tokens=1024,
                        ),
                    ),
                ),
                timeout=15.0,
            )

            try:
                answer = (final_response.text or "").strip()
            except (ValueError, AttributeError):
                answer = ""
            if not answer:
                answer = "No se pudo generar una respuesta. Los datos están disponibles en los paneles."
            latency = int((time.monotonic() - start_time) * 1000)

            logger.info(
                f"Admin assistant: tools={tools_used} latency={latency}ms"
            )

            return {
                "answer": answer,
                "tools_used": tools_used,
                "data": {k: v for k, v in tool_results.items() if "error" not in v},
            }

        except asyncio.TimeoutError:
            logger.warning("Admin assistant timed out")
            return {
                "answer": "La consulta tardó demasiado. Intenta con una pregunta más específica.",
                "tools_used": tools_used,
                "data": {},
            }
        except Exception as e:
            logger.error(f"Admin assistant error: {e}")
            return {
                "answer": f"Error procesando la consulta. Intenta de nuevo.",
                "tools_used": tools_used,
                "data": {},
            }


# Singleton
admin_assistant_service = AdminAssistantService()
