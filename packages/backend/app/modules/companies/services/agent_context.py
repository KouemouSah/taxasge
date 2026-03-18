"""Agent Context Helpers — Resolve agent's ministry, zone, entity from profile.

Shared between dashboard, ministry, and other company routes.
Single source of truth for agent → ministry/zone resolution.
"""

from typing import Optional

import asyncpg


async def get_agent_ministry_id(db: asyncpg.Connection, user_id: str) -> Optional[int]:
    """Resolve agent's ministry_id from agent_profiles → entities.

    Returns ministry_id (int) or None if no active profile found.
    """
    return await db.fetchval(
        """SELECT e.ministry_id
           FROM agent_profiles ap
           JOIN entities e ON ap.entity_id = e.id
           WHERE ap.user_id = $1 AND ap.is_active = true
           LIMIT 1""",
        user_id,
    )


async def get_agent_zone_id(db: asyncpg.Connection, user_id: str) -> Optional[str]:
    """Resolve supervisor's zone_id from agent_profiles → entity_locations → cities.

    Returns zone UUID string or None.
    """
    row = await db.fetchrow(
        """SELECT DISTINCT c.zone_id
           FROM agent_profiles ap
           JOIN entity_locations el ON ap.entity_id = el.entity_id
           JOIN cities c ON el.city_id = c.id
           WHERE ap.user_id = $1 AND ap.is_active = true
             AND c.zone_id IS NOT NULL
           LIMIT 1""",
        user_id,
    )
    return str(row["zone_id"]) if row and row["zone_id"] else None


async def get_agent_entity_id(db: asyncpg.Connection, user_id: str) -> Optional[str]:
    """Resolve agent's entity_id from agent_profiles.

    Returns entity UUID string or None.
    """
    row = await db.fetchrow(
        "SELECT entity_id FROM agent_profiles WHERE user_id = $1 AND is_active = true",
        user_id,
    )
    return str(row["entity_id"]) if row and row["entity_id"] else None
