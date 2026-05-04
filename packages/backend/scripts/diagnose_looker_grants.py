#!/usr/bin/env python3
"""Diagnose why Looker Studio JDBC connection only shows 2 tables.

Migration 315 was supposed to GRANT SELECT on ~16 MVs/views to looker_readonly.
The user reports only `v_active_assignments` and `v_active_service_request_assignments`
visible in the JDBC connector — meaning most grants are missing.

Checks:
1. Confirm looker_readonly role still exists.
2. List ALL relations (tables, views, MVs) where looker_readonly has SELECT.
3. List the 16+ relations that migration 315 SHOULD have granted.
4. Compare expected vs actual → identify missing grants.
5. Check schema search_path of the role.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

import psycopg2

EXPECTED_RELATIONS = [
    "mv_treasury_daily_kpis",
    "mv_agent_daily_workload",
    "mv_services_translated",
    "mv_fiscal_services_catalog",
    "mv_company_global_stats",
]

conn = psycopg2.connect(os.getenv("DATABASE_URL"), connect_timeout=15)
try:
    with conn.cursor() as cur:
        print("=" * 70)
        print("LOOKER GRANTS DIAGNOSIS")
        print("=" * 70)

        # 1. Role exists?
        cur.execute("SELECT rolname, rolcanlogin, rolconnlimit, rolconfig FROM pg_roles WHERE rolname='looker_readonly'")
        row = cur.fetchone()
        if not row:
            print("\n[CRITICAL] looker_readonly role does NOT exist")
            sys.exit(1)
        print(f"\n[1] Role exists: login={row[1]} conn_limit={row[2]} config={row[3]}")

        # 2. ALL relations looker_readonly can SELECT
        print("\n[2] Relations with SELECT for looker_readonly:")
        cur.execute("""
            SELECT n.nspname, c.relname, c.relkind
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname IN ('public')
              AND c.relkind IN ('r','v','m')
              AND has_table_privilege('looker_readonly', c.oid, 'SELECT')
            ORDER BY c.relkind, c.relname
        """)
        relations = cur.fetchall()
        kinds = {'r': 'TABLE', 'v': 'VIEW', 'm': 'MATERIALIZED VIEW'}
        for nsp, name, kind in relations:
            print(f"   {kinds[kind]:20s} {nsp}.{name}")
        print(f"   TOTAL: {len(relations)} relations")

        # 3. Check expected relations one by one
        print("\n[3] Expected relations from migration 315:")
        for rel in EXPECTED_RELATIONS:
            cur.execute("""
                SELECT
                    EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                            WHERE n.nspname='public' AND c.relname=%s) AS rel_exists,
                    has_table_privilege('looker_readonly', 'public.'||%s, 'SELECT') AS has_select
            """, (rel, rel))
            r = cur.fetchone()
            exists = r[0] if r else False
            has_select = r[1] if r else False
            tag = "[OK]" if exists and has_select else ("[MISSING_GRANT]" if exists else "[REL_MISSING]")
            print(f"   {tag:18s} {rel}  exists={exists} grant={has_select}")

        # 4. Read migration 315 SQL
        print("\n[4] Migration 315 grants (parsing migration file):")
        mig315 = ROOT / "database" / "migrations" / "315_looker_readonly_role.sql"
        if mig315.exists():
            content = mig315.read_text(encoding="utf-8")
            # Parse GRANT lines
            for line in content.split("\n"):
                line_stripped = line.strip()
                if line_stripped.upper().startswith("GRANT") and "looker_readonly" in line_stripped:
                    print(f"   {line_stripped[:120]}")

        # 5. ALL MVs/views in DB (so we can compare)
        print("\n[5] ALL public schema views/MVs (regardless of grants):")
        cur.execute("""
            SELECT c.relname, c.relkind
            FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('v','m')
            ORDER BY c.relkind, c.relname
        """)
        all_views = cur.fetchall()
        for name, kind in all_views:
            cur.execute("SELECT has_table_privilege('looker_readonly', 'public.'||%s, 'SELECT')", (name,))
            has = cur.fetchone()[0]
            tag = "[OK ]" if has else "[NO ]"
            print(f"   {tag} {kinds[kind]:20s} {name}")

        # 6. Default privileges (so future MVs are auto-granted)
        print("\n[6] Default privileges on schema public:")
        cur.execute("""
            SELECT
                d.defaclrole::regrole AS owner,
                d.defaclnamespace::regnamespace AS schema,
                d.defaclobjtype,
                d.defaclacl
            FROM pg_default_acl d
            WHERE d.defaclnamespace = 'public'::regnamespace
        """)
        defaults = cur.fetchall()
        if not defaults:
            print("   (none) — NEW MVs/views are NOT auto-granted to looker_readonly")
        for d in defaults:
            print(f"   owner={d[0]} schema={d[1]} objtype={d[2]} acl={d[3]}")

        # 7. Owner of MVs (might affect default privilege strategy)
        print("\n[7] Owners of expected MVs:")
        cur.execute("""
            SELECT c.relname, pg_get_userbyid(c.relowner) AS owner
            FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('v','m')
              AND c.relname = ANY(%s)
        """, (EXPECTED_RELATIONS,))
        for name, owner in cur.fetchall():
            print(f"   {name:35s} owner={owner}")

        print("\n" + "=" * 70)
        print("DIAGNOSIS DONE")
        print("=" * 70)
finally:
    conn.close()
