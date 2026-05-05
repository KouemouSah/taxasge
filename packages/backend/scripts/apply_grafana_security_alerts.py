#!/usr/bin/env python3
"""Apply 3 security alerts (Phase C.5).

- facil-security-ip-spike      — > 1000 req / 5min from one IP (CRITICAL)
- facil-security-failed-login  — > 10 failed logins / 5min from one IP (CRITICAL)
- facil-security-bot-share     — bot_share > 50% sustained 30min (WARNING)

Reuses the helper from apply_grafana_ai_alerts.py. Idempotent: GET → PUT or POST.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

GRAFANA_BASE_URL = (os.getenv("GRAFANA_BASE_URL") or "https://kouemousah.grafana.net").rstrip("/")
GRAFANA_SA_TOKEN = os.getenv("GRAFANA_SA_TOKEN")
if not GRAFANA_SA_TOKEN:
    logger.error("GRAFANA_SA_TOKEN missing")
    sys.exit(1)

FOLDER_UID_FALLBACK = "afkp1iudp4kxsf"


def api(method: str, path: str, body: dict | None = None):
    url = f"{GRAFANA_BASE_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GRAFANA_SA_TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
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
    code, body = api("GET", "/api/folders")
    if code == 200 and isinstance(body, list):
        for folder in body:
            if folder.get("title") == "GrafanaCloud":
                return folder["uid"]
    return FOLDER_UID_FALLBACK


def build_rule(folder_uid: str, *, uid: str, title: str, sql: str,
                threshold: float, severity: str, summary: str,
                description: str, runbook: str, for_duration: str = "5m") -> dict:
    return {
        "uid": uid, "title": title, "ruleGroup": "Security Monitoring",
        "folderUID": folder_uid, "condition": "B", "for": for_duration,
        "noDataState": "OK", "execErrState": "Error", "orgID": 1,
        "data": [
            {"refId": "A", "datasourceUid": "facil-postgres", "queryType": "",
             "relativeTimeRange": {"from": 3600, "to": 0},
             "model": {"refId": "A", "format": "table", "rawSql": sql,
                       "datasource": {"type": "postgres", "uid": "facil-postgres"}}},
            {"refId": "B", "datasourceUid": "__expr__", "queryType": "",
             "relativeTimeRange": {"from": 3600, "to": 0},
             "model": {"refId": "B", "type": "threshold", "expression": "A",
                       "conditions": [{"evaluator": {"type": "gt", "params": [threshold]},
                                       "operator": {"type": "and"}, "query": {"params": ["A"]},
                                       "reducer": {"type": "last", "params": []}, "type": "query"}],
                       "datasource": {"type": "__expr__", "uid": "__expr__"}}},
        ],
        "labels": {"severity": severity, "team": "security"},
        "annotations": {"summary": summary, "description": description, "runbook_url": runbook},
    }


def upsert(rule: dict) -> bool:
    uid = rule["uid"]
    code, _ = api("GET", f"/api/v1/provisioning/alert-rules/{uid}")
    if code == 200:
        logger.info(f"[update] {uid}")
        code, body = api("PUT", f"/api/v1/provisioning/alert-rules/{uid}", rule)
    else:
        logger.info(f"[create] {uid}")
        code, body = api("POST", "/api/v1/provisioning/alert-rules", rule)
    if 200 <= code < 300:
        logger.success(f"  {uid} OK")
        return True
    logger.error(f"  {uid} FAIL [{code}] {body}")
    return False


def main() -> int:
    folder_uid = get_folder_uid()
    logger.info(f"Folder UID: {folder_uid}")

    rules = [
        build_rule(
            folder_uid,
            uid="facil-security-ip-spike",
            title="Security — IP request spike (>1000 req/5min)",
            sql=(
                "SELECT COALESCE(MAX(c), 0)::int AS value FROM ("
                "  SELECT ip_address, count(*) AS c FROM request_telemetry "
                "  WHERE \"timestamp\" > now() - interval '5 minutes' "
                "    AND ip_address IS NOT NULL "
                "  GROUP BY ip_address"
                ") s"
            ),
            threshold=1000.0,
            severity="critical",
            summary="One IP exceeded 1000 requests in 5 minutes (DDoS/bot suspicion)",
            description=(
                "Top IP made {{ $values.A.Value }} requests in the last 5 min. "
                "Drill into 'Top 20 IPs by request count' to identify and "
                "consider rate-limiting or blocking via Cloud Armor / WAF."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/security-observability.html#ip-spike",
        ),
        build_rule(
            folder_uid,
            uid="facil-security-failed-login",
            title="Security — Failed login burst (>10 / 5min from one IP)",
            sql=(
                "SELECT COALESCE(MAX(c), 0)::int AS value FROM ("
                "  SELECT ip_address, count(*) AS c FROM request_telemetry "
                "  WHERE \"timestamp\" > now() - interval '5 minutes' "
                "    AND path LIKE '%login%' "
                "    AND status_code IN (401, 403) "
                "    AND ip_address IS NOT NULL "
                "  GROUP BY ip_address"
                ") s"
            ),
            threshold=10.0,
            severity="critical",
            summary="One IP exceeded 10 failed logins in 5 minutes (brute force)",
            description=(
                "{{ $values.A.Value }} failed login attempts from one IP in the "
                "last 5 min. Brute force or credential stuffing — block the IP "
                "and investigate via 'Failed logins by IP' panel."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/security-observability.html#failed-login",
        ),
        build_rule(
            folder_uid,
            uid="facil-security-bot-share",
            title="Security — Bot share >50% sustained 30 min",
            sql=(
                "SELECT CASE WHEN count(*) = 0 THEN 0 "
                "       ELSE (sum(is_bot::int)::numeric / count(*) * 100) "
                "       END AS value "
                "FROM request_telemetry "
                "WHERE \"timestamp\" > now() - interval '30 minutes'"
            ),
            threshold=50.0,
            severity="warning",
            summary="Automated traffic exceeded 50% of total over 30 min",
            description=(
                "Bot share is {{ $values.A.Value }}% over the last 30 min "
                "(threshold 50%). Either we have an automated client misuse "
                "(scraper, vulnerability scanner) or our human-traffic dropped. "
                "Check 'Device type breakdown' panel to identify which UA spike."
            ),
            runbook="https://github.com/KouemouSah/taxasge/blob/develop/docs/documentation/security-observability.html#bot-share",
            for_duration="30m",
        ),
    ]

    failures = sum(1 for r in rules if not upsert(r))
    if failures:
        logger.error(f"{failures} rule(s) failed")
        return 1
    logger.success("3 security alert rules applied OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
