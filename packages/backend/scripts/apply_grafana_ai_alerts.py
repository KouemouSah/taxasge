#!/usr/bin/env python3
"""Apply 3 AI Observability alert rules to Grafana Cloud (Phase A.6).

Reads the source-of-truth YAML at infra/grafana/alerts/ai_observability.yaml
and POSTs each rule via the provisioning API. Idempotent: re-running upserts
existing rules by UID without duplicating.

Authentication: GRAFANA_SA_TOKEN (workspace SAT, same one used by /admin/grafana/discover).

Usage:
  cd packages/backend
  GRAFANA_SA_TOKEN=glsa_xxx python scripts/apply_grafana_ai_alerts.py
"""

import json
import os
import sys
from pathlib import Path
import urllib.request
import urllib.error

from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

GRAFANA_BASE_URL = (os.getenv("GRAFANA_BASE_URL") or "https://kouemousah.grafana.net").rstrip("/")
GRAFANA_SA_TOKEN = os.getenv("GRAFANA_SA_TOKEN")
if not GRAFANA_SA_TOKEN:
    logger.error("GRAFANA_SA_TOKEN env var missing")
    sys.exit(1)

ALERTS_YAML = ROOT.parent.parent / "infra" / "grafana" / "alerts" / "ai_observability.yaml"

# In Grafana Cloud, the existing folder UID for the default "GrafanaCloud" folder
# (verified via GET /api/folders).
FOLDER_UID_FALLBACK = "afkp1iudp4kxsf"


def api_request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | str]:
    url = f"{GRAFANA_BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GRAFANA_SA_TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    # Required for provisioning API to bypass file-provenance protection
    req.add_header("X-Disable-Provenance", "true")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = resp.read().decode("utf-8")
            return resp.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, body_text


def get_folder_uid() -> str:
    """Resolve the GrafanaCloud folder UID dynamically; fallback to constant."""
    code, body = api_request("GET", "/api/folders")
    if code == 200 and isinstance(body, list):
        for folder in body:
            if folder.get("title") == "GrafanaCloud":
                return folder["uid"]
    logger.warning("Could not resolve GrafanaCloud folder, using fallback {}", FOLDER_UID_FALLBACK)
    return FOLDER_UID_FALLBACK


def build_rule(folder_uid: str, *, uid: str, title: str, condition: str,
                for_duration: str, sql: str, threshold: float,
                severity: str, summary: str, description: str,
                runbook: str) -> dict:
    """Build the JSON payload for /api/v1/provisioning/alert-rules."""
    return {
        "uid": uid,
        "title": title,
        "ruleGroup": "AI Observability",
        "folderUID": folder_uid,
        "condition": condition,
        "for": for_duration,
        "noDataState": "OK",
        "execErrState": "Error",
        "orgID": 1,
        "data": [
            {
                "refId": "A",
                "datasourceUid": "facil-postgres",
                "queryType": "",
                # SQL embeds its own time filter (now() - interval ...);
                # this range is just a hint to the Grafana evaluator and
                # must be non-zero — use 1h as a safe wrapper.
                "relativeTimeRange": {"from": 3600, "to": 0},
                "model": {
                    "refId": "A",
                    "format": "table",
                    "rawSql": sql,
                    "datasource": {"type": "postgres", "uid": "facil-postgres"},
                },
            },
            {
                "refId": "B",
                "datasourceUid": "__expr__",
                "queryType": "",
                "relativeTimeRange": {"from": 3600, "to": 0},
                "model": {
                    "refId": "B",
                    "type": "threshold",
                    "expression": "A",
                    "conditions": [
                        {
                            "evaluator": {"type": "gt", "params": [threshold]},
                            "operator": {"type": "and"},
                            "query": {"params": ["A"]},
                            "reducer": {"type": "last", "params": []},
                            "type": "query",
                        }
                    ],
                    "datasource": {"type": "__expr__", "uid": "__expr__"},
                },
            },
        ],
        "labels": {"severity": severity, "team": "ai"},
        "annotations": {
            "summary": summary,
            "description": description,
            "runbook_url": runbook,
        },
    }


def upsert_rule(rule: dict) -> bool:
    uid = rule["uid"]
    code, _ = api_request("GET", f"/api/v1/provisioning/alert-rules/{uid}")
    if code == 200:
        logger.info("[update] rule {} already exists, PUT", uid)
        code, body = api_request("PUT", f"/api/v1/provisioning/alert-rules/{uid}", rule)
    else:
        logger.info("[create] rule {} does not exist yet, POST", uid)
        code, body = api_request("POST", "/api/v1/provisioning/alert-rules", rule)

    if 200 <= code < 300:
        logger.success("Rule {} {} OK", uid, "updated" if code in (200, 202) else "created")
        return True
    logger.error("Rule {} failed [{}] {}", uid, code, body)
    return False


def main() -> int:
    folder_uid = get_folder_uid()
    logger.info("Folder UID: {}", folder_uid)

    rules = [
        build_rule(
            folder_uid,
            uid="facil-ai-cost-spike",
            title="AI Observability — Daily cost spike (>5000 XAF)",
            condition="B",
            for_duration="5m",
            sql=(
                "SELECT COALESCE(SUM(cost_xaf), 0) AS value "
                "FROM ai_call_metrics "
                "WHERE \"timestamp\" >= date_trunc('day', now())"
            ),
            threshold=5000.0,
            severity="warning",
            summary="AI daily cost exceeded 5000 XAF",
            description=(
                "Total Gemini cost today is {{ $values.A.Value }} XAF "
                "(threshold 5000). Investigate top-cost features in the AI "
                "Observability dashboard."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/ai-observability.html#cost-spike",
        ),
        build_rule(
            folder_uid,
            uid="facil-ai-error-rate",
            title="AI Observability — Error rate >10% over 5 min",
            condition="B",
            for_duration="5m",
            sql=(
                "SELECT "
                "  CASE WHEN COUNT(*) = 0 THEN 0 "
                "       ELSE (SUM((status != 'success')::int)::numeric / COUNT(*) * 100) "
                "  END AS value "
                "FROM ai_call_metrics "
                "WHERE \"timestamp\" > now() - interval '5 minutes'"
            ),
            threshold=10.0,
            severity="critical",
            summary="AI error rate >10% over the last 5 minutes",
            description=(
                "Gemini error rate is {{ $values.A.Value }}%. Drill into "
                "'Errors by status type' to identify the failure pattern."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/ai-observability.html#error-spike",
        ),
        build_rule(
            folder_uid,
            uid="facil-ai-p95-latency",
            title="AI Observability — p95 latency >8s over 15 min",
            condition="B",
            for_duration="10m",
            sql=(
                "SELECT "
                "  COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS value "
                "FROM ai_call_metrics "
                "WHERE \"timestamp\" > now() - interval '15 minutes' "
                "  AND status = 'success'"
            ),
            threshold=8000.0,
            severity="warning",
            summary="AI p95 latency exceeded 8s over the last 15 minutes",
            description=(
                "Gemini p95 latency is {{ $values.A.Value }}ms (baseline "
                "2-3s). Check 'p95 latency by feature' to identify the "
                "degrading workload."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/ai-observability.html#latency-degradation",
        ),
        # Phase C.1 — Prompt injection spike alert (CRITICAL).
        # Triggers when ≥5 high-risk injection attempts in the last hour.
        # High volume indicates an active attack — auto-block via env var
        # AI_SECURITY_BLOCK_HIGH_RISK=true is recommended at this point.
        build_rule(
            folder_uid,
            uid="facil-ai-injection-spike",
            title="AI Observability — Prompt injection spike (≥5 high-risk / 1h)",
            condition="B",
            for_duration="5m",
            sql=(
                "SELECT count(*) AS value "
                "FROM ai_call_metrics "
                "WHERE \"timestamp\" > now() - interval '1 hour' "
                "  AND injection_risk = 'high'"
            ),
            threshold=5.0,
            severity="critical",
            summary="≥5 high-risk prompt injection attempts in the last hour",
            description=(
                "{{ $values.A.Value }} high-risk prompt injection attempts "
                "in the last hour. Drill into the dashboard 'Top matched rules' "
                "panel to identify the attack vector. Consider enabling "
                "AI_SECURITY_BLOCK_HIGH_RISK=true env var to auto-refuse "
                "high-risk prompts."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/security-observability.html#injection-spike",
        ),
        # Phase B.6 — Tempo ingestion quota alert.
        # Free tier: 50 GB/month traces. With 100% sampling on FastAPI, we
        # could burn the budget in days at 1M users target. Monitor cumulative
        # usage from the ai_call_metrics fallback proxy (rough estimate: each
        # row ≈ 0.5 KB of associated span data).
        # Real Tempo billing metric `grafanacloud_traces_total_received_bytes`
        # requires the org admin Prometheus datasource — fallback uses BD count
        # × heuristic to give an early warning. Refine via Grafana dashboards
        # built-in usage panel later.
        build_rule(
            folder_uid,
            uid="facil-ai-tempo-quota",
            title="AI Observability — Tempo ingestion approaching quota",
            condition="B",
            for_duration="15m",
            sql=(
                "SELECT "
                "  -- Rough proxy: each ai_call_metrics row ≈ 1 corresponding "
                "  -- gen_ai span ~0.5KB. With Phase B (FastAPI/asyncpg/httpx) "
                "  -- the actual Tempo volume is ~10x this. We alert when the "
                "  -- BD count itself exceeds 5M/month (= ~25GB raw at 5KB/trace). "
                "  COALESCE(count(*), 0)::bigint AS value "
                "FROM ai_call_metrics "
                "WHERE \"timestamp\" >= date_trunc('month', now())"
            ),
            threshold=5_000_000.0,
            severity="warning",
            summary="AI calls ≥5M/month — Tempo quota at risk",
            description=(
                "AI call volume MTD: {{ $values.A.Value }} rows. With Phase B "
                "100% sampling on FastAPI/asyncpg/httpx/redis, total Tempo "
                "ingestion is ~10× this in spans. Free tier limit: 50 GB/mo. "
                "Action: enable head sampling (TraceIdRatioBased(0.25)) in "
                "main.py OTEL setup, or upgrade to Cloud Pro."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/ai-observability.html#phaseb",
        ),
    ]

    failures = 0
    for rule in rules:
        if not upsert_rule(rule):
            failures += 1

    if failures:
        logger.error("{} alert rule(s) failed", failures)
        return 1
    logger.success("All 3 alert rules applied OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
