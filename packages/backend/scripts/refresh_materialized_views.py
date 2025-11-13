#!/usr/bin/env python3
"""
Refresh Materialized Views Script

Refreshes all materialized views used for performance optimization.
Should be run periodically (e.g., every 30 minutes via cron or Cloud Scheduler)

Performance Impact:
- ministries_with_stats: 2-5ms reads (vs 150-500ms with JOINs)
- categories_with_services: 2-5ms reads (vs 150-500ms with JOINs)
- homepage_stats: 2-5ms reads (vs 100-300ms with COUNT queries)
- sectors_with_stats: 2-5ms reads (vs 150-500ms with JOINs)

Usage:
    python scripts/refresh_materialized_views.py [--concurrent] [--view VIEW_NAME]

Examples:
    # Refresh all views (with brief locks)
    python scripts/refresh_materialized_views.py

    # Refresh all views concurrently (no locks, requires unique indexes)
    python scripts/refresh_materialized_views.py --concurrent

    # Refresh only one specific view
    python scripts/refresh_materialized_views.py --view ministries_with_stats

Cloud Scheduler (recommended):
    # Run every 30 minutes
    0,30 * * * * /path/to/python /path/to/refresh_materialized_views.py --concurrent
"""

import asyncio
import asyncpg
import os
import sys
from datetime import datetime
from typing import List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_database_url


MATERIALIZED_VIEWS = [
    "ministries_with_stats",
    "categories_with_services",
    "homepage_stats",
    "sectors_with_stats"
]


async def refresh_view(
    conn: asyncpg.Connection,
    view_name: str,
    concurrent: bool = False
) -> tuple[str, bool, float, Optional[str]]:
    """
    Refresh a single materialized view

    Args:
        conn: Database connection
        view_name: Name of the materialized view
        concurrent: If True, use REFRESH MATERIALIZED VIEW CONCURRENTLY (no locks)

    Returns:
        Tuple of (view_name, success, duration_ms, error_message)
    """
    start_time = datetime.now()

    try:
        # Check if view exists
        check_query = """
            SELECT 1 FROM pg_matviews
            WHERE matviewname = $1
        """
        exists = await conn.fetchval(check_query, view_name)

        if not exists:
            return (view_name, False, 0.0, f"View {view_name} does not exist")

        # Refresh view
        refresh_type = "CONCURRENTLY" if concurrent else ""
        refresh_query = f"REFRESH MATERIALIZED VIEW {refresh_type} {view_name}"

        await conn.execute(refresh_query)

        duration = (datetime.now() - start_time).total_seconds() * 1000
        return (view_name, True, duration, None)

    except asyncpg.UndefinedObjectError as e:
        duration = (datetime.now() - start_time).total_seconds() * 1000
        return (view_name, False, duration, f"View not found: {e}")

    except asyncpg.ObjectInUseError as e:
        duration = (datetime.now() - start_time).total_seconds() * 1000
        return (view_name, False, duration, f"View locked (try --concurrent): {e}")

    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds() * 1000
        return (view_name, False, duration, str(e))


async def refresh_all_views(
    views: List[str],
    concurrent: bool = False
) -> dict:
    """
    Refresh all materialized views

    Args:
        views: List of view names to refresh
        concurrent: If True, use REFRESH MATERIALIZED VIEW CONCURRENTLY

    Returns:
        Dictionary with results
    """
    database_url = get_database_url()

    try:
        conn = await asyncpg.connect(database_url)

        print(f"🔄 Refreshing {len(views)} materialized views...")
        print(f"   Mode: {'CONCURRENT (no locks)' if concurrent else 'STANDARD (brief locks)'}")
        print("")

        results = []
        total_duration = 0.0
        success_count = 0

        for view_name in views:
            view_name, success, duration, error = await refresh_view(
                conn, view_name, concurrent
            )

            results.append({
                "view": view_name,
                "success": success,
                "duration_ms": duration,
                "error": error
            })

            if success:
                print(f"   ✅ {view_name}: {duration:.2f}ms")
                success_count += 1
            else:
                print(f"   ❌ {view_name}: {error}")

            total_duration += duration

        await conn.close()

        print("")
        print(f"✅ Refresh completed: {success_count}/{len(views)} views")
        print(f"   Total time: {total_duration:.2f}ms")

        return {
            "success": success_count == len(views),
            "total_views": len(views),
            "success_count": success_count,
            "total_duration_ms": total_duration,
            "results": results
        }

    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Refresh materialized views for performance optimization"
    )
    parser.add_argument(
        "--concurrent",
        action="store_true",
        help="Use REFRESH MATERIALIZED VIEW CONCURRENTLY (no locks, requires unique indexes)"
    )
    parser.add_argument(
        "--view",
        type=str,
        choices=MATERIALIZED_VIEWS,
        help="Refresh only a specific view (default: all views)"
    )

    args = parser.parse_args()

    # Determine which views to refresh
    views_to_refresh = [args.view] if args.view else MATERIALIZED_VIEWS

    # Run async refresh
    result = asyncio.run(refresh_all_views(views_to_refresh, args.concurrent))

    # Exit with appropriate code
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
