"""
Admin Monitoring Endpoints — Database performance, locks, pool stats.

Queries pg_stat_statements, pg_stat_activity, pg_locks, and asyncpg pool.
Protected by admin.monitoring permission.
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
import asyncpg
from loguru import logger

from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.database.connection import get_database, db_manager

router = APIRouter(tags=["Admin - Monitoring"])


@router.get("/slow-queries")
async def get_slow_queries(
    limit: int = Query(20, le=50),
    min_calls: int = Query(5, ge=1),
    db: asyncpg.Connection = Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("admin.monitoring")),
):
    """Top N slowest queries by mean execution time from pg_stat_statements."""
    rows = await db.fetch("""
        SELECT
            queryid,
            LEFT(query, 300) AS query_preview,
            calls,
            ROUND(total_exec_time::numeric, 2) AS total_exec_time_ms,
            ROUND(mean_exec_time::numeric, 2) AS mean_exec_time_ms,
            ROUND(max_exec_time::numeric, 2) AS max_exec_time_ms,
            ROUND(stddev_exec_time::numeric, 2) AS stddev_exec_time_ms,
            rows AS total_rows,
            shared_blks_hit,
            shared_blks_read,
            ROUND(
                shared_blks_hit::numeric
                / NULLIF(shared_blks_hit + shared_blks_read, 0) * 100, 2
            ) AS cache_hit_ratio
        FROM pg_stat_statements
        WHERE calls >= $1
          AND query NOT LIKE '%pg_stat%'
        ORDER BY mean_exec_time DESC
        LIMIT $2
    """, min_calls, limit)

    total_tracked = await db.fetchval(
        "SELECT COUNT(*) FROM pg_stat_statements"
    )

    return {
        "queries": [dict(r) for r in rows],
        "total_tracked": total_tracked,
    }


@router.get("/frequent-queries")
async def get_frequent_queries(
    limit: int = Query(20, le=50),
    db: asyncpg.Connection = Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("admin.monitoring")),
):
    """Top N most-called queries from pg_stat_statements."""
    rows = await db.fetch("""
        SELECT
            queryid,
            LEFT(query, 300) AS query_preview,
            calls,
            ROUND(total_exec_time::numeric, 2) AS total_exec_time_ms,
            ROUND(mean_exec_time::numeric, 2) AS mean_exec_time_ms,
            rows AS total_rows,
            ROUND(
                shared_blks_hit::numeric
                / NULLIF(shared_blks_hit + shared_blks_read, 0) * 100, 2
            ) AS cache_hit_ratio
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat%'
        ORDER BY calls DESC
        LIMIT $1
    """, limit)

    return {"queries": [dict(r) for r in rows]}


@router.get("/connection-pool")
async def get_connection_pool_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("admin.monitoring")),
):
    """Asyncpg connection pool metrics."""
    pool = db_manager.pool
    if not pool:
        return {"error": "Pool not initialized"}

    return {
        "min_size": pool.get_min_size(),
        "max_size": pool.get_max_size(),
        "current_size": pool.get_size(),
        "free_connections": pool.get_idle_size(),
        "used_connections": pool.get_size() - pool.get_idle_size(),
    }


@router.get("/database-stats")
async def get_database_stats(
    db: asyncpg.Connection = Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("admin.monitoring")),
):
    """Table sizes, row estimates, and unused indexes."""
    tables = await db.fetch("""
        SELECT c.relname AS table_name,
               pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
               pg_size_pretty(pg_relation_size(c.oid)) AS data_size,
               pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
               s.n_live_tup AS row_estimate
        FROM pg_class c
        JOIN pg_stat_user_tables s ON c.relname = s.relname
        WHERE c.relkind = 'r'
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 30
    """)

    unused_indexes = await db.fetch("""
        SELECT schemaname,
               relname AS table_name,
               indexrelname AS index_name,
               pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
               idx_scan AS scan_count
        FROM pg_stat_user_indexes i
        JOIN pg_index pi ON i.indexrelid = pi.indexrelid
        WHERE idx_scan < 10
          AND NOT pi.indisunique
          AND pg_relation_size(i.indexrelid) > 8192
        ORDER BY pg_relation_size(i.indexrelid) DESC
        LIMIT 20
    """)

    return {
        "tables": [dict(r) for r in tables],
        "unused_indexes": [dict(r) for r in unused_indexes],
    }


@router.get("/lock-status")
async def get_lock_status(
    db: asyncpg.Connection = Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("admin.monitoring")),
):
    """Current PostgreSQL lock status and active connections."""
    active_connections = await db.fetch("""
        SELECT pid, state,
               LEFT(query, 200) AS query,
               ROUND(EXTRACT(EPOCH FROM (NOW() - query_start))::numeric, 1) AS query_seconds,
               wait_event_type,
               wait_event
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND pid != pg_backend_pid()
        ORDER BY query_start ASC
    """)

    lock_counts = await db.fetch("""
        SELECT mode, COUNT(*) AS count, granted
        FROM pg_locks
        WHERE pid != pg_backend_pid()
        GROUP BY mode, granted
        ORDER BY count DESC
    """)

    return {
        "active_connections": [dict(r) for r in active_connections],
        "lock_counts": [dict(r) for r in lock_counts],
    }
