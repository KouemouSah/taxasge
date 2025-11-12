"""
Database connection utilities
Provides get_db dependency without circular imports
"""

from fastapi import HTTPException, status
from typing import AsyncGenerator
import asyncpg


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    FastAPI dependency to get database connection from pool

    This function is defined here instead of main.py to avoid circular imports
    when modules need to import it.
    """
    # Import db_pool at runtime to avoid circular imports
    from app.main import db_pool

    if db_pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )

    async with db_pool.acquire() as connection:
        yield connection
