#!/usr/bin/env python3
"""Push Facil dashboards to a Grafana Cloud workspace.

Reads Grafana credentials from packages/backend/.env.local:
    GRAFANA_BASE_URL=https://<workspace>.grafana.net
    GRAFANA_API_TOKEN=glsa_xxxxxxxxxxxxxxxxxxxx
    GRAFANA_ORG_ID=1
    LOOKER_READONLY_PASSWORD=...   (used as datasource password)

Reuses the Postgres role looker_readonly already provisioned by mig 315.

What it does (idempotent — safe to re-run after JSON edits):
1. GET /api/health → confirm token + URL valid
2. PUT /api/datasources/uid/facil-postgres → upsert datasource
3. For each infra/grafana/dashboards/*.json:
     POST /api/dashboards/db with {"dashboard": <json>, "overwrite": true}
4. GET each created dashboard to verify
5. Print final embed URLs (for /admin/dashboards/config paste)

Usage:
    cd packages/backend
    python scripts/push_grafana_dashboards.py
"""

import json
import os
import sys
from pathlib import Path
from typing import Any
import urllib.request
import urllib.error

from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

GRAFANA_BASE_URL = (os.getenv("GRAFANA_BASE_URL") or "").rstrip("/")
GRAFANA_API_TOKEN = os.getenv("GRAFANA_API_TOKEN") or ""
GRAFANA_ORG_ID = int(os.getenv("GRAFANA_ORG_ID") or "1")
LOOKER_READONLY_PASSWORD = os.getenv("LOOKER_READONLY_PASSWORD") or ""

# Resolve from DATABASE_URL if not set explicitly (looker password is the
# same as the looker_readonly password set by migration 315 + ALTER ROLE).
if not LOOKER_READONLY_PASSWORD:
    db_url = os.getenv("DATABASE_URL") or ""
    # heuristic: looker_readonly password is in .env separately or via secret manager
    LOOKER_READONLY_PASSWORD = os.getenv("LOOKER_READONLY_DB_PASSWORD", "")

DASHBOARDS_DIR = ROOT.parent.parent / "infra" / "grafana" / "dashboards"
DATASOURCE_UID = "facil-postgres"
DATASOURCE_NAME = "Facil-Postgres"

# Supabase Connection Pooler (transaction mode, IPv4) — required because the
# direct host db.<project>.supabase.co resolves only in IPv6 and AWS-hosted
# Grafana Cloud cannot reach IPv6 outbound. Discovered 2026-05-04 via DNS
# resolution test (find region eu-west-3 for project bpdzfkymgydjxxwlctam).
# The pooler also requires the username suffix .<project_ref> for non-postgres
# roles (per Supabase docs).
POSTGRES_HOST = "aws-0-eu-west-3.pooler.supabase.com:6543"
POSTGRES_DB = "postgres"
POSTGRES_USER = "looker_readonly.bpdzfkymgydjxxwlctam"


def _api(method: str, path: str, body: Any = None) -> tuple[int, Any]:
    url = f"{GRAFANA_BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {GRAFANA_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            return resp.status, (json.loads(text) if text else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(text)
        except json.JSONDecodeError:
            return e.code, text


def check_creds() -> bool:
    if not GRAFANA_BASE_URL:
        logger.error("GRAFANA_BASE_URL missing in .env.local")
        return False
    if not GRAFANA_API_TOKEN:
        logger.error("GRAFANA_API_TOKEN missing in .env.local")
        return False
    if not LOOKER_READONLY_PASSWORD:
        logger.error(
            "Datasource password missing — set LOOKER_READONLY_PASSWORD or "
            "LOOKER_READONLY_DB_PASSWORD in .env.local"
        )
        return False

    logger.info(f"Connecting to {GRAFANA_BASE_URL} (org={GRAFANA_ORG_ID})")
    status, body = _api("GET", "/api/health")
    if status != 200:
        logger.error(f"Grafana health check failed HTTP {status}: {body}")
        return False
    logger.success(f"Grafana health: {body}")
    return True


def upsert_datasource() -> bool:
    """Create or update the Postgres datasource so dashboards can resolve facil-postgres."""
    payload = {
        "uid": DATASOURCE_UID,
        "name": DATASOURCE_NAME,
        "type": "postgres",
        "access": "proxy",
        "url": POSTGRES_HOST,
        "database": POSTGRES_DB,
        "user": POSTGRES_USER,
        "isDefault": True,
        "editable": True,
        "jsonData": {
            "sslmode": "require",
            "postgresVersion": 1500,
            "timescaledb": False,
            "maxOpenConns": 5,
            "maxIdleConns": 2,
            "connMaxLifetime": 14400,
            "database": POSTGRES_DB,
        },
        "secureJsonData": {"password": LOOKER_READONLY_PASSWORD},
    }

    # Check if already exists
    status, body = _api("GET", f"/api/datasources/uid/{DATASOURCE_UID}")
    if status == 200:
        logger.info(f"Datasource '{DATASOURCE_UID}' already exists — updating")
        ds_id = body["id"]
        upd_status, upd_body = _api("PUT", f"/api/datasources/{ds_id}", payload)
        if upd_status not in (200, 202):
            logger.error(f"Datasource update failed HTTP {upd_status}: {upd_body}")
            return False
        logger.success(f"Datasource updated: id={ds_id}")
        return True
    if status != 404:
        logger.error(f"GET datasource failed HTTP {status}: {body}")
        return False

    # Create new
    create_status, create_body = _api("POST", "/api/datasources", payload)
    if create_status != 200:
        logger.error(f"Datasource create failed HTTP {create_status}: {create_body}")
        return False
    logger.success(f"Datasource created: {create_body.get('datasource', {}).get('uid')}")
    return True


def push_dashboard(json_path: Path) -> tuple[bool, str | None]:
    """POST one dashboard JSON. Returns (ok, uid)."""
    try:
        dashboard = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.error(f"Failed to parse {json_path.name}: {exc}")
        return False, None

    uid = dashboard.get("uid")
    if not uid:
        logger.error(f"{json_path.name}: missing 'uid' field")
        return False, None

    payload = {
        "dashboard": dashboard,
        "overwrite": True,
        "message": f"Pushed by push_grafana_dashboards.py ({json_path.name})",
        "folderUid": None,    # default General folder; folderUid for facil-business-kpis can be added once folder exists
    }
    status, body = _api("POST", "/api/dashboards/db", payload)
    if status != 200:
        logger.error(f"{json_path.name} (uid={uid}) push failed HTTP {status}: {body}")
        return False, uid
    logger.success(
        f"{json_path.name} pushed: uid={uid} url={GRAFANA_BASE_URL}{body.get('url','')}"
    )
    return True, uid


def main() -> int:
    if not check_creds():
        return 1

    logger.info("=" * 70)
    logger.info("STEP 1 — Datasource")
    logger.info("=" * 70)
    if not upsert_datasource():
        logger.error("Aborting — datasource setup failed")
        return 1

    logger.info("=" * 70)
    logger.info("STEP 2 — Dashboards")
    logger.info("=" * 70)
    json_files = sorted(DASHBOARDS_DIR.glob("*.json"))
    if not json_files:
        logger.error(f"No JSON files found in {DASHBOARDS_DIR}")
        return 1
    logger.info(f"Found {len(json_files)} dashboard JSON file(s)")

    pushed = 0
    failed = []
    uids = []
    for jf in json_files:
        ok, uid = push_dashboard(jf)
        if ok:
            pushed += 1
            if uid:
                uids.append(uid)
        else:
            failed.append(jf.name)

    logger.info("=" * 70)
    logger.info("SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Pushed OK : {pushed}/{len(json_files)}")
    if failed:
        logger.error(f"Failed    : {failed}")

    if uids:
        logger.info("")
        logger.info("Embed URLs to paste in /admin/dashboards/config:")
        for uid in uids:
            logger.info(
                f"  uid={uid:30s}  preview: "
                f"{GRAFANA_BASE_URL}/d/{uid}"
            )
        logger.info("")
        logger.info(
            "Now go to /admin/dashboards/config in Facil, toggle each dashboard "
            "to provider=Grafana, and paste the corresponding UID."
        )

    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
