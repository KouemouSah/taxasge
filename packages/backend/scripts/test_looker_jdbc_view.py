#!/usr/bin/env python3
"""Connect as looker_readonly (not postgres) and run the SAME catalog
query the JDBC driver uses for getTables(types={"TABLE","VIEW"}).

Goal: confirm whether the cap-at-9 the user sees in Looker Studio is
- a BD-level grant gap (then we'd see 9 here too), OR
- a Looker UI-level cap (then we'd see 20 here, confirming workaround
  via REQUÊTE PERSONNALISÉE is the right answer).

Tests both ports (5432 direct + 6543 pooler).
"""

import sys
import psycopg2

LOOKER_PASSWORD = "8wKSPFRjuAKm6569wvZAFqW4cUckCA_cYyvl_81yCAw"
HOST = "db.bpdzfkymgydjxxwlctam.supabase.co"
USER = "looker_readonly"
DB = "postgres"

# Same query as JDBC DatabaseMetaData.getTables(types={"TABLE","VIEW"}).
# pg JDBC driver translates that to a SELECT on information_schema.tables
# filtered by table_type IN ('BASE TABLE','VIEW') (Materialized Views are
# NOT in information_schema.tables — that's the root of the bug).
JDBC_LIKE_QUERY = """
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY table_name
"""

# Catalog-level alternative (what we used in our diagnose script). MVs
# DO appear here with relkind='m' (but JDBC doesn't use this query).
CATALOG_QUERY = """
    SELECT c.relname,
           CASE c.relkind
               WHEN 'r' THEN 'TABLE'
               WHEN 'v' THEN 'VIEW'
               WHEN 'm' THEN 'MATERIALIZED VIEW'
               ELSE c.relkind::text
           END AS kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'v', 'm')
    ORDER BY c.relkind, c.relname
"""


def run(port: int) -> None:
    print(f"\n{'=' * 60}")
    print(f"Port {port} — connecting as {USER}@{HOST}:{port}/{DB}")
    print(f"{'=' * 60}")
    try:
        conn = psycopg2.connect(
            host=HOST,
            port=port,
            user=USER,
            password=LOOKER_PASSWORD,
            dbname=DB,
            sslmode="require",
            connect_timeout=15,
        )
    except Exception as e:
        print(f"  CONNECTION FAILED: {e}")
        return

    try:
        with conn.cursor() as cur:
            print(f"\n[A] JDBC-like query (information_schema.tables, "
                  f"table_type IN BASE TABLE,VIEW):")
            cur.execute(JDBC_LIKE_QUERY)
            jdbc_rows = cur.fetchall()
            print(f"    Rows: {len(jdbc_rows)} (this is what Looker Studio sees)")
            for schema, name, kind in jdbc_rows:
                print(f"      [{kind:6s}] {name}")

            print(f"\n[B] Catalog query (pg_class, including MVs):")
            cur.execute(CATALOG_QUERY)
            cat_rows = cur.fetchall()
            views = [r for r in cat_rows if r[1] == "VIEW"]
            mvs = [r for r in cat_rows if r[1] == "MATERIALIZED VIEW"]
            tables = [r for r in cat_rows if r[1] == "TABLE"]
            print(f"    Tables: {len(tables)}, Views: {len(views)}, MVs: {len(mvs)}")

            # Cross-check: does looker_readonly really see 20 VIEWs via pg_class?
            print(f"\n[C] How many VIEWs does looker_readonly have SELECT on?")
            cur.execute("""
                SELECT count(*) FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND c.relkind = 'v'
                  AND has_table_privilege(current_user, c.oid, 'SELECT')
            """)
            count = cur.fetchone()[0]
            print(f"    looker_readonly can SELECT on {count} VIEWs")
    finally:
        conn.close()


def main() -> int:
    for port in (5432, 6543):
        try:
            run(port)
        except Exception as e:
            print(f"\nport {port}: unexpected error {e}")

    print(f"\n{'=' * 60}")
    print(f"INTERPRETATION")
    print(f"{'=' * 60}")
    print(f"If [A] shows 20 rows → BD is fine, Looker Studio UI caps the "
          f"picker at 9. Workaround = REQUÊTE PERSONNALISÉE.")
    print(f"If [A] shows 9 rows → there's a grant gap; investigate further.")
    print(f"If [A] differs between 5432 and 6543 → pooler cache issue, "
          f"prefer 5432 direct in Looker.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
