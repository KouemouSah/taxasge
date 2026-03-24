"""Mission Service — Business logic for field mission planning.

Pattern: Static methods, validation, IDOR checks, audit trail.
Uses InspectionService.resolve_inspector_context for auth context.
"""

import logging
from datetime import date, datetime, timezone
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.modules.inspections.repositories.mission_repository import (
    MissionRepository,
)
from app.modules.inspections.services.inspection_service import (
    InspectionService, _log_audit,
)

logger = logging.getLogger(__name__)

# Valid status transitions: from -> set of allowed to
VALID_TRANSITIONS = {
    "planned": {"in_progress", "cancelled"},
    "in_progress": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


class MissionService:
    """Business logic for field mission planning."""

    # ============================================================
    # CREATE
    # ============================================================

    @staticmethod
    async def create_mission(conn, user_id: UUID, data: Dict) -> Dict:
        """Create a new field mission.

        Requires supervisor with manage_missions permission.
        """
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can create missions")

        # Verify manage_missions permission
        has_perm = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM role_permissions rp
                JOIN permissions p ON p.id = rp.permission_id
                JOIN users u ON u.role_id = rp.role_id
                WHERE u.id = $1 AND p.name = 'inspection.manage_missions'
            )
        """, user_id)
        if not has_perm:
            raise ValueError("Missing permission: inspection.manage_missions")

        # Auto-resolve entity_location_id from supervisor profile if not provided
        entity_location_id = data.get("entity_location_id")
        if not entity_location_id:
            entity_location_id = ctx.get("entity_location_id")
            if not entity_location_id:
                raise ValueError(
                    "entity_location_id not provided and could not be resolved from profile"
                )
            data["entity_location_id"] = entity_location_id

        # Validate entity_location_id belongs to supervisor's entity
        location = await conn.fetchrow("""
            SELECT id, entity_id FROM entity_locations
            WHERE id = $1
        """, data["entity_location_id"])

        if not location:
            raise ValueError(
                f"Entity location {data['entity_location_id']} not found"
            )
        if location["entity_id"] != ctx["entity_id"]:
            raise ValueError(
                "Entity location does not belong to your entity"
            )

        # Validate zone_ids exist in commerce_zones if provided
        zone_ids = data.get("zone_ids")
        if zone_ids:
            zone_count = await conn.fetchval("""
                SELECT COUNT(*) FROM commerce_zones
                WHERE id = ANY($1::uuid[])
            """, zone_ids)
            if zone_count != len(zone_ids):
                raise ValueError(
                    f"Some zone_ids are invalid: expected {len(zone_ids)} "
                    f"zones, found {zone_count}"
                )

        # Validate mission_date is today or in the future
        mission_date = data["mission_date"]
        if isinstance(mission_date, str):
            mission_date = date.fromisoformat(mission_date)
        if mission_date < date.today():
            raise ValueError(
                "Mission date cannot be in the past"
            )

        mission = await MissionRepository.create(conn, {
            "entity_id": ctx["entity_id"],
            "entity_location_id": data["entity_location_id"],
            "supervisor_id": user_id,
            "mission_date": mission_date,
            "title": data.get("title"),
            "notes": data.get("notes"),
            "zone_ids": zone_ids,
            "status": "planned",
        })

        await _log_audit(
            conn, user_id, "mission.created", "field_mission",
            str(mission["id"]), {
                "mission_date": str(mission_date),
                "title": data.get("title"),
            },
        )

        # Return enriched mission
        return await MissionRepository.get_by_id(conn, mission["id"])

    # ============================================================
    # READ
    # ============================================================

    @staticmethod
    async def get_mission(
        conn, user_id: UUID, mission_id: UUID,
    ) -> Dict:
        """Get a single mission with agents."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        mission = await MissionRepository.get_by_id(conn, mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")

        # IDOR check
        if mission["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot access missions from another entity")

        agents = await MissionRepository.get_mission_agents(conn, mission_id)
        mission["agents"] = agents

        return mission

    @staticmethod
    async def list_missions(
        conn, user_id: UUID, **filters,
    ) -> Tuple[List[Dict], int]:
        """List missions for the user's entity."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        return await MissionRepository.list_by_entity(
            conn, ctx["entity_id"],
            date_from=filters.get("date_from"),
            date_to=filters.get("date_to"),
            status=filters.get("status"),
            page=filters.get("page", 1),
            page_size=filters.get("page_size", 20),
        )

    # ============================================================
    # UPDATE
    # ============================================================

    @staticmethod
    async def update_mission(
        conn, user_id: UUID, mission_id: UUID, data: Dict,
    ) -> Dict:
        """Update a mission (supervisor only)."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can update missions")

        mission = await MissionRepository.get_by_id(conn, mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")

        # IDOR check
        if mission["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot update missions from another entity")

        # Validate status transitions
        new_status = data.get("status")
        if new_status:
            current_status = mission["status"]
            allowed = VALID_TRANSITIONS.get(current_status, set())
            if new_status not in allowed:
                raise ValueError(
                    f"Invalid status transition: '{current_status}' -> "
                    f"'{new_status}'. Allowed: {allowed or 'none'}"
                )

            # Set started_at when transitioning to in_progress
            if new_status == "in_progress":
                data["started_at"] = datetime.now(timezone.utc)

        updated = await MissionRepository.update(conn, mission_id, data)

        await _log_audit(
            conn, user_id, "mission.updated", "field_mission",
            str(mission_id), {
                "changes": list(data.keys()),
                "new_status": new_status,
            },
        )

        return updated

    # ============================================================
    # AGENTS
    # ============================================================

    @staticmethod
    async def assign_agents(
        conn, user_id: UUID, mission_id: UUID, agents: List[Dict],
    ) -> List[Dict]:
        """Assign agents to a mission."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can assign agents")

        mission = await MissionRepository.get_by_id(conn, mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")

        # IDOR check
        if mission["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot assign agents to another entity's mission")

        # Validate mission is planned or in_progress
        if mission["status"] not in ("planned", "in_progress"):
            raise ValueError(
                f"Cannot assign agents to mission in status "
                f"'{mission['status']}'. Must be 'planned' or 'in_progress'."
            )

        # Validate agents belong to the same entity
        agent_ids = [a["agent_id"] for a in agents]
        entity_check = await conn.fetchval("""
            SELECT COUNT(*) FROM agent_profiles
            WHERE user_id = ANY($1::uuid[])
              AND entity_id = $2
              AND is_active = true
        """, agent_ids, ctx["entity_id"])

        if entity_check != len(agent_ids):
            raise ValueError(
                "Some agents do not belong to this entity or are inactive"
            )

        # Check max agents from system_rules
        max_agents_rule = await conn.fetchval("""
            SELECT rule_value FROM system_rules
            WHERE rule_code = 'FIELD_MISSION_MAX_AGENTS' AND is_active = true
        """)
        max_agents = int(max_agents_rule) if max_agents_rule else 20

        current_count = mission["agents_count"]
        if current_count + len(agents) > max_agents:
            raise ValueError(
                f"Cannot assign {len(agents)} agents: would exceed max "
                f"of {max_agents} (currently {current_count})"
            )

        result = await MissionRepository.add_agents(conn, mission_id, agents)

        await _log_audit(
            conn, user_id, "mission.agents_assigned", "field_mission",
            str(mission_id), {
                "agent_ids": [str(a) for a in agent_ids],
                "count": len(agents),
            },
        )

        return result

    @staticmethod
    async def remove_agent(
        conn, user_id: UUID, mission_id: UUID, agent_id: UUID,
    ) -> bool:
        """Remove an agent from a planned mission."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can remove agents")

        mission = await MissionRepository.get_by_id(conn, mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")

        # IDOR check
        if mission["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot modify another entity's mission")

        # Can only remove from planned missions
        if mission["status"] != "planned":
            raise ValueError(
                f"Cannot remove agents from mission in status "
                f"'{mission['status']}'. Must be 'planned'."
            )

        success = await MissionRepository.remove_agent(
            conn, mission_id, agent_id,
        )

        if success:
            await _log_audit(
                conn, user_id, "mission.agent_removed", "field_mission",
                str(mission_id), {"removed_agent_id": str(agent_id)},
            )

        return success

    # ============================================================
    # PLANNING HELPERS
    # ============================================================

    @staticmethod
    async def suggest_zones(conn, user_id: UUID) -> List[Dict]:
        """Suggest zones for mission planning based on coverage gaps."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)
        return await MissionRepository.suggest_zones(conn, ctx["entity_id"])

    @staticmethod
    async def get_agents_availability(
        conn, user_id: UUID, mission_date: date,
    ) -> List[Dict]:
        """Get agent availability for a specific date."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)
        return await MissionRepository.get_agents_availability(
            conn, ctx["entity_id"], mission_date,
        )

    # ============================================================
    # COMPLETE
    # ============================================================

    @staticmethod
    async def complete_mission(
        conn, user_id: UUID, mission_id: UUID,
        notes: Optional[str] = None,
    ) -> Dict:
        """Complete a mission (supervisor only, must be in_progress)."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can complete missions")

        mission = await MissionRepository.get_by_id(conn, mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")

        # IDOR check
        if mission["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot complete another entity's mission")

        if mission["status"] != "in_progress":
            raise ValueError(
                f"Cannot complete mission in status '{mission['status']}'. "
                f"Must be 'in_progress'."
            )

        # Sync actual inspection counts before completing
        await MissionRepository.update_agent_actual_inspections(
            conn, mission_id,
        )

        # Append notes if provided
        if notes:
            existing_notes = (mission.get("notes") or "").strip()
            combined = (
                f"{existing_notes}\n[Completion] {notes}".strip()
                if existing_notes
                else f"[Completion] {notes}"
            )
            await MissionRepository.update(conn, mission_id, {
                "notes": combined[:2000],
            })

        completed = await MissionRepository.complete_mission(conn, mission_id)
        if not completed:
            raise ValueError(
                "Failed to complete mission: status may have changed"
            )

        await _log_audit(
            conn, user_id, "mission.completed", "field_mission",
            str(mission_id), {
                "agents_count": mission["agents_count"],
                "notes": notes,
            },
        )

        return completed
