#!/usr/bin/env python3
"""Probe MV/view schemas for Grafana dashboard design.

Goal: list real columns + row counts of every MV/view granted to
looker_readonly, so dashboard JSON SQL queries reference real columns
(memory rules #11/#12: never invent columns).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

import psycopg2

EXPECTED = [
    "mv_treasury_daily_kpis",
    "mv_agent_daily_workload",
    "mv_services_translated",
    "mv_fiscal_services_catalog",
    "mv_company_global_stats",
    "mv_company_analytics",
    "mv_company_stats_by_zone",
    "mv_inspection_zone_analytics",
    "mv_obligation_stats_by_ministry",
    "mv_reconciliation_stats",
    "v_payments_dashboard",
    "v_payment_plans_monitoring",
    "v_declarations_dashboard",
    "v_declarations_stats",
    "v_declarations_stats_by_type",
    "homepage_stats",
    "ministries_with_stats",
    "categories_with_services",
]

conn = psycopg2.connect(os.getenv("DATABASE_URL"), connect_timeout=15)
try:
    with conn.cursor() as cur:
        for rel in EXPECTED:
            print(f"\n{'='*70}")
            print(f"  {rel}")
            print(f"{'='*70}")
            try:
                # Use pg_attribute directly — information_schema is privilege-filtered
                # and on Supabase pooler it returns 0 rows even for postgres user.
                cur.execute(
                    """
                    SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
                    FROM pg_attribute a
                    JOIN pg_class c ON c.oid = a.attrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public'
                      AND c.relname = %s
                      AND a.attnum > 0
                      AND NOT a.attisdropped
                    ORDER BY a.attnum
                    """,
                    (rel,),
                )
                cols = cur.fetchall()
                if not cols:
                    print(f"  (relation does not exist or no columns)")
                    continue
                print(f"  Columns ({len(cols)}):")
                for cname, ctype in cols:
                    print(f"    {cname:35s} {ctype}")

                cur.execute(f"SELECT count(*) FROM public.{rel}")
                n = cur.fetchone()[0]
                print(f"  Rows: {n}")

                if n > 0 and n <= 50:
                    cur.execute(f"SELECT * FROM public.{rel} LIMIT 1")
                    row = cur.fetchone()
                    print(f"  Sample row 1: {dict(zip([c[0] for c in cols], row))}")
            except Exception as e:
                print(f"  ERROR: {e}")
                conn.rollback()
                continue

        # Also check if any MV related to OMS / bundle / inspection / license
        # exists that we missed
        print(f"\n{'='*70}")
        print(f"  Search: MVs/views containing 'oms', 'bundle', 'license', 'inspection', 'obligation'")
        print(f"{'='*70}")
        cur.execute(
            """
            SELECT relname, relkind FROM pg_class c
            JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('v','m')
              AND (
                relname LIKE '%oms%' OR relname LIKE '%bundle%'
                OR relname LIKE '%license%' OR relname LIKE '%inspection%'
                OR relname LIKE '%obligation%' OR relname LIKE '%commercial%'
              )
            ORDER BY relname
            """
        )
        rels = cur.fetchall()
        for rname, kind in rels:
            kindstr = "MV" if kind == "m" else "VIEW"
            cur.execute(
                "SELECT has_table_privilege('looker_readonly', %s, 'SELECT')",
                (f"public.{rname}",),
            )
            has = cur.fetchone()[0]
            print(f"  [{kindstr:5s}] {rname:50s} looker_readonly={has}")
finally:
    conn.close()
