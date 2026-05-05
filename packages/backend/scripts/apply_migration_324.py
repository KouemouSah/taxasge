#!/usr/bin/env python3
"""Apply migration 324 — flip recaudacion + agentes to provider=grafana."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env_path = ROOT / ".env.local"
if not env_path.exists():
    env_path = ROOT / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "324_flip_legacy_dashboards_to_grafana.sql"


def main() -> int:
    import psycopg2

    if not MIGRATION.exists():
        logger.error(f"Missing: {MIGRATION}")
        return 1

    logger.info(f"Connecting to {DATABASE_URL.split('@')[-1]}")
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            logger.info(f"Executing {MIGRATION.name}")
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        logger.success(f"{MIGRATION.name} applied.")

        with conn.cursor() as cur:
            cur.execute("""
                SELECT dashboard_id, provider, grafana_dashboard_uid, looker_report_id
                FROM dashboard_registrations
                WHERE dashboard_id IN ('recaudacion', 'agentes', 'services')
                ORDER BY dashboard_id
            """)
            rows = cur.fetchall()
            logger.info("=" * 60)
            for did, prov, uid, lid in rows:
                logger.info(f"  {did:14s} provider={prov:14s} uid={uid or '-':18s} looker_report_id={lid}")
            logger.info("=" * 60)

            # Verify the flip
            cur.execute("""
                SELECT count(*) FROM dashboard_registrations
                WHERE dashboard_id IN ('recaudacion', 'agentes')
                  AND provider = 'grafana'
                  AND grafana_dashboard_uid IS NOT NULL
            """)
            flipped = cur.fetchone()[0]
            assert flipped == 2, f"expected 2 flipped, got {flipped}"
            logger.success(f"[1/2] {flipped}/2 legacy rows flipped to grafana")

            cur.execute("""
                SELECT provider FROM dashboard_registrations WHERE dashboard_id = 'services'
            """)
            services_provider = cur.fetchone()[0]
            assert services_provider == "looker_studio", \
                f"services should stay looker_studio, got {services_provider}"
            logger.success("[2/2] services preserved as looker_studio (catalog connector)")

    finally:
        conn.close()

    logger.success("Migration 324 applied + verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
